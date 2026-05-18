import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { apiGet } from "../../services/api";
import {
  FiMessageSquare,
  FiSend,
  FiX,
  FiImage,
  FiPaperclip,
  FiMic,
  FiStopCircle,
} from "react-icons/fi";
import { useAuth } from "../../Provider/AuthProvider";
import EmojiPicker from "emoji-picker-react";
import FixTextBox from "./FixTextBox";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/** ✅ emit with ACK timeout */
function sendMessageSocket(socket, payload, onAck) {
  if (!socket) return onAck?.({ ok: false, error: "NO_SOCKET" });
  if (!socket.connected)
    return onAck?.({ ok: false, error: "SOCKET_DISCONNECTED" });

  socket.timeout(8000).emit("message:send", payload, (err, ack) => {
    if (err) return onAck?.({ ok: false, error: "ACK_TIMEOUT" });
    return onAck?.(ack || { ok: false, error: "NO_ACK_PAYLOAD" });
  });
}

async function uploadAsset({ endpoint, file }) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || "Upload failed");

  return json?.data; // { url, fileName, mime, size }
}

function formatTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function FloatingChatWidget() {
  const { user, sessionReady } = useAuth();

  const [open, setOpen] = useState(false);
  const [booting, setBooting] = useState(false);

  const [conversationId, setConversationId] = useState("");
  const [meId, setMeId] = useState("");

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [unread, setUnread] = useState(0);

  const [emojiOpen, setEmojiOpen] = useState(false);

  const socketRef = useRef(null);
  const endRef = useRef(null);

  const imgInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // audio recording
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [recording, setRecording] = useState(false);

  // refs
  const convIdRef = useRef("");
  const meIdRef = useRef("");
  const openRef = useRef(false);
  const bootedRef = useRef(false);

  useEffect(() => {
    convIdRef.current = conversationId;
  }, [conversationId]);
  useEffect(() => {
    meIdRef.current = meId;
  }, [meId]);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const canChat = !!user && !!sessionReady;

  const title = useMemo(
    () => (canChat ? "Support chat" : "Login to chat"),
    [canChat],
  );

  function scrollToBottom(behavior = "smooth") {
    endRef.current?.scrollIntoView({ behavior });
  }

  async function bootstrap() {
    if (!canChat) return;
    if (booting) return;

    setBooting(true);
    try {
      const res = await apiGet("/api/chat/bootstrap");
      const cid = String(res?.data?.conversationId || "");
      const me = res?.data?.me;

      setConversationId(cid);
      setMeId(String(me?.id || ""));

      const msgs = Array.isArray(res?.data?.messages) ? res.data.messages : [];
      setMessages(
        msgs.map((m) => ({
          ...m,
          _id: String(m._id || ""),
          conversationId: String(m.conversationId || cid),
        })),
      );
      setTimeout(() => scrollToBottom("auto"), 50);
    } finally {
      setBooting(false);
    }
  }

  useEffect(() => {
    if (!canChat) return;

    if (bootedRef.current) return;
    bootedRef.current = true;

    if (!convIdRef.current) bootstrap();

    const s = io(API_BASE, {
      transports: ["polling", "websocket"],
      withCredentials: true,
    });

    socketRef.current = s;

    s.on("connect", () => {
      const cid = convIdRef.current;
      if (cid) s.emit("conversation:join", { conversationId: cid });
    });

    s.on("message:new", ({ message }) => {
      const cid = String(message?.conversationId || "");
      if (!cid) return;
      if (cid !== String(convIdRef.current)) return;

      const normalized = {
        ...message,
        _id: String(message._id || ""),
        conversationId: cid,
      };

      setMessages((prev) => [...prev, normalized]);

      const fromMe =
        String(normalized.senderId || "") === String(meIdRef.current);
      if (!openRef.current && !fromMe) setUnread((n) => n + 1);

      setTimeout(() => scrollToBottom("smooth"), 20);
    });

    s.on("connect_error", (e) =>
      console.log("socket connect_error:", e?.message || e),
    );

    return () => {
      try {
        s.disconnect();
      } catch (err) {
        console.warn("Failed to disconnect socket", err);
      }
      socketRef.current = null;
      bootedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canChat]);

  useEffect(() => {
    const s = socketRef.current;
    if (!s || !conversationId) return;

    const join = () => s.emit("conversation:join", { conversationId });

    if (s.connected) join();
    else s.once("connect", join);

    return () => {
      try {
        s.off("connect", join);
      } catch (err) {
        console.warn("Failed to detach socket connect listener", err);
      }
    };
  }, [conversationId]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setEmojiOpen(false);
      if (canChat && !conversationId) bootstrap();
      setTimeout(() => scrollToBottom("auto"), 20);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function addOptimistic({
    type,
    text,
    fileUrl,
    fileName,
    mime,
    size,
    duration,
  }) {
    const cid = String(conversationId || "");
    const tempId = `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const optimistic = {
      _id: tempId,
      conversationId: cid,
      senderId: meId || "me",
      type,
      text: text || "",
      fileUrl: fileUrl || "",
      fileName: fileName || "",
      mime: mime || "",
      size: size || 0,
      duration: duration || 0,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };

    setMessages((prev) => [...prev, optimistic]);
    setTimeout(() => scrollToBottom("smooth"), 20);

    return tempId;
  }

  function finalizeOptimistic(tempId, ack) {
    if (!ack?.ok || !ack?.message) {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === tempId
            ? { ...m, failed: true, optimistic: false, error: ack?.error }
            : m,
        ),
      );
      return;
    }
    setMessages((prev) =>
      prev.map((m) => (m._id === tempId ? ack.message : m)),
    );
  }

  function sendText() {
    const s = socketRef.current;
    if (!canChat) return;

    const cid = String(conversationId || "");
    if (!cid) return setOpen(true);
    if (!s || !s.connected) return;

    const clean = String(text || "").trim();
    if (!clean) return;

    setText("");
    const tempId = addOptimistic({ type: "text", text: clean });

    sendMessageSocket(
      s,
      { conversationId: cid, type: "text", text: clean, tempId },
      (ack) => finalizeOptimistic(tempId, ack),
    );
  }

  async function onPickImage(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const cid = String(conversationId || "");
      const s = socketRef.current;
      if (!cid || !s?.connected) return;

      const up = await uploadAsset({
        endpoint: "/api/uploads/chat-image",
        file,
      });

      const tempId = addOptimistic({
        type: "image",
        fileUrl: up.url,
        fileName: up.fileName,
        mime: up.mime,
        size: up.size,
      });

      sendMessageSocket(
        s,
        {
          conversationId: cid,
          type: "image",
          fileUrl: up.url,
          fileName: up.fileName,
          mime: up.mime,
          size: up.size,
          tempId,
        },
        (ack) => finalizeOptimistic(tempId, ack),
      );
    } catch (err) {
      console.error(err);
      alert(err?.message || "Image upload failed");
    }
  }

  async function onPickFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const cid = String(conversationId || "");
      const s = socketRef.current;
      if (!cid || !s?.connected) return;

      const up = await uploadAsset({
        endpoint: "/api/uploads/chat-file",
        file,
      });

      const tempId = addOptimistic({
        type: "file",
        fileUrl: up.url,
        fileName: up.fileName,
        mime: up.mime,
        size: up.size,
      });

      sendMessageSocket(
        s,
        {
          conversationId: cid,
          type: "file",
          fileUrl: up.url,
          fileName: up.fileName,
          mime: up.mime,
          size: up.size,
          tempId,
        },
        (ack) => finalizeOptimistic(tempId, ack),
      );
    } catch (err) {
      console.error(err);
      alert(err?.message || "File upload failed");
    }
  }

  async function startRecording() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert("Audio recording not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });

      audioChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data?.size) audioChunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];

        try {
          const file = new File([blob], `voice_${Date.now()}.webm`, {
            type: "audio/webm",
          });

          const cid = String(conversationId || "");
          const s = socketRef.current;
          if (!cid || !s?.connected) return;

          const up = await uploadAsset({
            endpoint: "/api/uploads/chat-audio",
            file,
          });

          const tempId = addOptimistic({
            type: "audio",
            fileUrl: up.url,
            fileName: up.fileName,
            mime: up.mime,
            size: up.size,
          });

          sendMessageSocket(
            s,
            {
              conversationId: cid,
              type: "audio",
              fileUrl: up.url,
              fileName: up.fileName,
              mime: up.mime,
              size: up.size,
              tempId,
            },
            (ack) => finalizeOptimistic(tempId, ack),
          );
        } catch (err) {
          console.error(err);
          alert(err?.message || "Voice upload failed");
        }
      };

      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (err) {
      console.error(err);
      alert("Microphone permission denied or unavailable.");
    }
  }

  function stopRecording() {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    if (mr.state !== "inactive") mr.stop();
    setRecording(false);
    mediaRecorderRef.current = null;
  }

  // ===== premium styles (fast, simple) =====
  const Panel = (
    <div
      className={[
        "w-[390px] max-w-[92vw]",
        "rounded-[26px] overflow-hidden",
        "border border-base-200 bg-base-100",
        "shadow-[0_22px_70px_-38px_rgba(0,0,0,0.55)]",
        "origin-bottom-right transform-gpu",
        "animate-[chatIn_.16s_ease-out]",
      ].join(" ")}
    >
      <style>{`
        @keyframes chatIn {
          0% { opacity: 0; transform: translateY(8px) scale(.985); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Header */}
      <div className="px-4 py-3 border-b border-base-200 bg-gradient-to-r from-base-100 via-base-100 to-base-200/40">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={[
                  "inline-flex h-2 w-2 rounded-full",
                  canChat ? "bg-emerald-500" : "bg-amber-500",
                ].join(" ")}
              />
              <div className="font-black truncate">{title}</div>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {canChat
                ? "Typically replies in a few minutes"
                : "Please login first"}
            </div>
          </div>

          <button
            className="btn btn-ghost btn-sm rounded-full hover:bg-base-200/60"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            type="button"
          >
            <FiX />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="h-[380px] overflow-auto p-4 bg-[linear-gradient(180deg,rgba(148,163,184,0.10),rgba(148,163,184,0.02))]">
        {!canChat ? (
          <div className="rounded-2xl border border-base-200 bg-base-100 p-4 text-sm text-slate-600">
            You must be logged in to chat with support.
          </div>
        ) : booting ? (
          <div className="rounded-2xl border border-base-200 bg-base-100 p-4 text-sm text-slate-600">
            Opening chat…
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-2xl border border-base-200 bg-base-100 p-4 text-sm text-slate-600">
            Say hi 👋 — we’re here to help.
          </div>
        ) : (
          <div className="space-y-2.5">
            {messages.map((m) => {
              const mine = String(m.senderId) === String(meId) || m.optimistic;

              return (
                <div
                  key={m._id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[82%] ${mine ? "items-end" : "items-start"} flex flex-col gap-1`}
                  >
                    {/* Bubble */}
                    <div
                      className={[
                        "rounded-2xl px-3.5 py-2.5 border text-sm leading-relaxed",
                        mine
                          ? "bg-primary text-primary-content border-primary/30 shadow-sm"
                          : "bg-base-100 border-base-200 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.35)]",
                        "break-words",
                      ].join(" ")}
                    >
                      {m.type === "text" ? (
                        <div className="whitespace-pre-wrap">{m.text}</div>
                      ) : null}

                      {m.type === "image" ? (
                        <a
                          href={m.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                          title="Open image"
                        >
                          <img
                            src={m.fileUrl}
                            alt={m.fileName || "image"}
                            className="max-h-64 w-full rounded-xl object-cover border border-base-200/60"
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                          />
                        </a>
                      ) : null}

                      {m.type === "file" ? (
                        <a
                          className={[
                            "inline-flex items-center gap-2",
                            "rounded-xl px-3 py-2",
                            mine ? "bg-white/15" : "bg-base-200/40",
                            "border border-base-200/60",
                            "hover:opacity-90 transition",
                            "break-all",
                          ].join(" ")}
                          href={m.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span>📎</span>
                          <span className="font-semibold">
                            {m.fileName || "Download file"}
                          </span>
                        </a>
                      ) : null}

                      {m.type === "audio" ? (
                        <div className="rounded-xl border border-base-200/60 bg-base-200/30 p-2">
                          <audio controls className="w-full">
                            <source src={m.fileUrl} />
                          </audio>
                        </div>
                      ) : null}
                    </div>

                    {/* Meta */}
                    <div
                      className={`text-[11px] opacity-70 flex items-center gap-2 ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <span>{formatTime(m.createdAt)}</span>
                      {m.failed ? (
                        <span className="text-red-500 font-semibold">
                          Failed
                        </span>
                      ) : null}
                      {m.optimistic && !m.failed ? <span>Sending…</span> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-base-200 bg-base-100 relative">
        {/* action bar */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <button
              className="btn btn-ghost btn-sm rounded-full hover:bg-base-200/60"
              onClick={() => imgInputRef.current?.click()}
              title="Send image"
              type="button"
              disabled={!canChat}
            >
              <FiImage />
            </button>
            <input
              ref={imgInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickImage}
            />

            <button
              className="btn btn-ghost btn-sm rounded-full hover:bg-base-200/60"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
              type="button"
              disabled={!canChat}
            >
              <FiPaperclip />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={onPickFile}
            />

            {!recording ? (
              <button
                className="btn btn-ghost btn-sm rounded-full hover:bg-base-200/60"
                onClick={startRecording}
                title="Record voice note"
                type="button"
                disabled={!canChat}
              >
                <FiMic />
              </button>
            ) : (
              <button
                className="btn btn-error btn-sm rounded-full"
                onClick={stopRecording}
                title="Stop recording"
                type="button"
              >
                <FiStopCircle />
              </button>
            )}
          </div>

          <button
            className="btn btn-ghost btn-sm rounded-full hover:bg-base-200/60"
            onClick={() => setEmojiOpen((v) => !v)}
            title="Emoji"
            type="button"
            disabled={!canChat}
          >
            😊
          </button>
          <FixTextBox
            value={text}
            onChange={setText}
            disabled={!canChat || !text.trim()}
          />
        </div>

        {/* Emoji picker (anchored inside footer, no layout shift) */}
        {emojiOpen ? (
          <div className="absolute bottom-[78px] right-3 z-50">
            <div className="rounded-2xl overflow-hidden border border-base-200 shadow-xl bg-base-100">
              <EmojiPicker
                onEmojiClick={(e) => {
                  setText((t) => (t || "") + e.emoji);
                  setEmojiOpen(false);
                }}
              />
            </div>
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <textarea
            className={[
              "textarea textarea-bordered rounded-2xl flex-1",
              "min-h-[46px] max-h-28 leading-snug",
              "focus:outline-none focus:border-base-300",
            ].join(" ")}
            placeholder={canChat ? "Type a message…" : "Login required"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!canChat}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendText();
              }
            }}
          />

          <button
            className={[
              "btn btn-primary rounded-2xl",
              "shadow-sm hover:shadow-md transition",
            ].join(" ")}
            disabled={!canChat || !text.trim()}
            onClick={sendText}
            title="Send"
            type="button"
          >
            <FiSend />
          </button>
        </div>

        <div className="text-[11px] text-slate-500 mt-1">
          Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed bottom-5 right-5 z-[999999]">
      {open ? Panel : null}

      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className={[
          "btn btn-primary rounded-full shadow-xl gap-2",
          "relative overflow-hidden",
        ].join(" ")}
        aria-label="Open chat"
        type="button"
      >
        {/* subtle ring */}
        <span className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-white/10" />

        <FiMessageSquare className="text-lg" />
        <span className="hidden sm:inline font-semibold">Chat</span>

        {unread ? (
          <span className="badge badge-secondary border-0">{unread}</span>
        ) : null}
      </button>
    </div>
  );
}
