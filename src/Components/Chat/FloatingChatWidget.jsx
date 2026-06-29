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
  FiArrowDown,
  FiCheckCircle,
} from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import EmojiPicker from "emoji-picker-react";
import FixTextBox from "./FixTextBox";
import AudioMessagePlayer from "./AudioMessagePlayer";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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

function formatSec(sec) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function pickRecorderMime() {
  const cands = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mpeg",
  ];
  for (const m of cands) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported?.(m)) return m;
  }
  return "";
}

function isNearBottom(el, threshold = 120) {
  if (!el) return true;
  return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
}

function mergeUniqueMessages(prev, incoming) {
  const next = Array.isArray(prev) ? [...prev] : [];
  const idx = next.findIndex((m) => String(m._id) === String(incoming._id));
  if (idx >= 0) {
    next[idx] = { ...next[idx], ...incoming };
    return next;
  }
  next.push(incoming);
  return next;
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
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  const socketRef = useRef(null);
  const bodyRef = useRef(null);

  const imgInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const composerRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const recTimerRef = useRef(null);
  const recModeRef = useRef("send");

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
    const el = bodyRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setShowJumpToBottom(false);
  }

  useEffect(() => {
    const el = bodyRef.current;
    if (!el || !open) return;

    const onScroll = () => {
      setShowJumpToBottom(!isNearBottom(el));
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => el.removeEventListener("scroll", onScroll);
  }, [open]);

  useEffect(() => {
    function onDocDown(e) {
      if (!emojiOpen) return;
      const el = composerRef.current;
      if (!el) return;
      if (!el.contains(e.target)) setEmojiOpen(false);
    }

    function onEsc(e) {
      if (e.key === "Escape") {
        setEmojiOpen(false);
        if (openRef.current) setOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocDown);
    window.addEventListener("keydown", onEsc);

    return () => {
      document.removeEventListener("mousedown", onDocDown);
      window.removeEventListener("keydown", onEsc);
    };
  }, [emojiOpen]);

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

      requestAnimationFrame(() => scrollToBottom("auto"));
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
      if (!cid || cid !== String(convIdRef.current)) return;

      const normalized = {
        ...message,
        _id: String(message._id || ""),
        conversationId: cid,
      };

      const fromMe =
        String(normalized.senderId || "") === String(meIdRef.current);
      const shouldAuto = fromMe || isNearBottom(bodyRef.current);

      setMessages((prev) => mergeUniqueMessages(prev, normalized));

      if (!openRef.current && !fromMe) {
        setUnread((n) => n + 1);
      }

      requestAnimationFrame(() => {
        if (shouldAuto) scrollToBottom("smooth");
        else setShowJumpToBottom(true);
      });
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
      clearInterval(recTimerRef.current);
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
      requestAnimationFrame(() => scrollToBottom("auto"));
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
    requestAnimationFrame(() => scrollToBottom("smooth"));
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

    requestAnimationFrame(() => scrollToBottom("smooth"));
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
      const mimeType = pickRecorderMime();
      const mr = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];
      recModeRef.current = "send";

      mr.ondataavailable = (e) => {
        if (e.data?.size) audioChunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());

        clearInterval(recTimerRef.current);
        recTimerRef.current = null;

        const mode = recModeRef.current;
        const blob = new Blob(audioChunksRef.current, {
          type: mr.mimeType || "audio/webm",
        });
        audioChunksRef.current = [];

        setRecording(false);

        if (mode === "cancel") {
          setRecordSec(0);
          mediaRecorderRef.current = null;
          return;
        }

        try {
          const ext = (mr.mimeType || "audio/webm").includes("mp4")
            ? "mp4"
            : "webm";
          const file = new File([blob], `voice_${Date.now()}.${ext}`, {
            type: mr.mimeType || "audio/webm",
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
            duration: recordSec,
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
              duration: recordSec,
              tempId,
            },
            (ack) => finalizeOptimistic(tempId, ack),
          );
        } catch (err) {
          console.error(err);
          alert(err?.message || "Voice upload failed");
        } finally {
          setRecordSec(0);
          mediaRecorderRef.current = null;
        }
      };

      mediaRecorderRef.current = mr;
      mr.start(200);
      setRecording(true);
      setRecordSec(0);

      recTimerRef.current = setInterval(() => {
        setRecordSec((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      alert("Microphone permission denied or unavailable.");
    }
  }

  function stopRecording(mode = "send") {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    recModeRef.current = mode;
    if (mr.state !== "inactive") mr.stop();
  }

  const Panel = (
    <div
      className={[
        "relative",
        // mobile
        // "sm:w-[400px]",
        "max-sm:fixed max-sm:inset-2 max-sm:w-auto max-sm:h-[calc(100vh-1rem)]",
        // medium
        "sm:w-[340px] md:w-[360px]",
        "sm:h-[68vh] md:h-[70vh]",
        "sm:max-h-[640px] md:max-h-[680px]",
        // large
        "lg:w-[390px] lg:h-[74vh] lg:max-h-[760px]",
        // general
        "max-w-[calc(100vw-1rem)]",
        "rounded-[28px] max-sm:rounded-[24px] overflow-hidden",
        "border border-white/10",
        "bg-base-100/55 backdrop-blur-2xl",
        "shadow-[0_24px_80px_rgba(0,0,0,0.45)]",
        "ring-1 ring-black/5",
        "origin-bottom-right transform-gpu",
        "animate-[chatIn_.16s_ease-out]",
      ].join(" ")}
    >
      <style>{`
        @keyframes chatIn {
          0% { opacity: 0; transform: translateY(10px) scale(.985); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .floating-chat-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(148,163,184,.35) transparent;
        }
        .floating-chat-scroll::-webkit-scrollbar {
          width: 10px;
        }
        .floating-chat-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .floating-chat-scroll::-webkit-scrollbar-thumb {
          background: rgba(148,163,184,.28);
          border: 2px solid transparent;
          background-clip: padding-box;
          border-radius: 999px;
        }
        .floating-chat-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(148,163,184,.42);
          border: 2px solid transparent;
          background-clip: padding-box;
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-16 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-16 left-6 h-40 w-40 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute inset-0 bg-white/[0.03]" />
      </div>

      <div className="relative flex h-full max-sm:min-h-[calc(100vh-1rem)] flex-col">
        {/* Header */}
        <div className="px-3.5 md:px-4 py-2.5 md:py-3 border-b border-white/10 bg-base-100/35 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold",
                    "border border-white/10 bg-base-100/40 backdrop-blur",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-flex h-2 w-2 rounded-full",
                      canChat ? "bg-emerald-500" : "bg-amber-500",
                    ].join(" ")}
                  />
                  {title}
                </span>
              </div>
              <div className="text-[11px] opacity-70 mt-1 truncate">
                {canChat
                  ? "Typically replies in a few minutes"
                  : "Login required"}
              </div>
            </div>

            <button
              className="btn btn-ghost btn-sm rounded-full hover:bg-base-200/40"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              type="button"
            >
              <FiX className="text-lg" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="relative flex-1 min-h-0">
          <div
            ref={bodyRef}
            className="floating-chat-scroll h-full overflow-y-auto p-3 md:p-3.5 lg:p-4 bg-base-100/10"
          >
            {!canChat ? (
              <div className="rounded-2xl border border-white/10 bg-base-100/40 backdrop-blur p-4 text-sm opacity-80">
                You must be logged in to chat with support.
              </div>
            ) : booting ? (
              <div className="rounded-2xl border border-white/10 bg-base-100/40 backdrop-blur p-4 text-sm opacity-80">
                Opening chat…
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-base-100/40 backdrop-blur p-4 text-sm opacity-80">
                Say hi 👋 — we’re here to help.
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m) => {
                  const mine =
                    String(m.senderId) === String(meId) || m.optimistic;

                  return (
                    <div
                      key={m._id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] ${
                          mine ? "items-end" : "items-start"
                        } flex flex-col gap-1`}
                      >
                        <div
                          className={[
                            "px-3.5 py-2.5 text-sm leading-relaxed border",
                            mine
                              ? "rounded-[18px] rounded-br-[8px] bg-primary/90 text-primary-content border-primary/30 shadow-sm"
                              : "rounded-[18px] rounded-bl-[8px] bg-base-100/55 backdrop-blur border-white/10 shadow-[0_12px_35px_rgba(0,0,0,0.20)]",
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
                                className="max-h-64 w-full rounded-xl object-cover border border-white/10"
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
                                mine ? "bg-white/15" : "bg-base-200/30",
                                "border border-white/10",
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
                            <AudioMessagePlayer
                              src={m.fileUrl}
                              duration={m.duration}
                              fileName={m.fileName}
                              mine={mine}
                              compact
                            />
                          ) : null}
                        </div>

                        <div
                          className={`text-[11px] opacity-60 flex items-center gap-2 ${
                            mine ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span>{formatTime(m.createdAt)}</span>
                          {m.failed ? (
                            <span className="text-error font-semibold">
                              Failed
                            </span>
                          ) : null}
                          {m.optimistic && !m.failed ? (
                            <span>Sending…</span>
                          ) : null}
                          {mine && !m.failed && !m.optimistic ? (
                            <FiCheckCircle className="opacity-70" />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {showJumpToBottom && (
            <button
              type="button"
              onClick={() => scrollToBottom("smooth")}
              className="absolute bottom-3 right-3 btn btn-sm rounded-full shadow-lg bg-base-100/85 backdrop-blur border border-white/10"
              title="Latest"
            >
              <FiArrowDown />
              Latest
            </button>
          )}
        </div>

        {/* Footer / Composer */}
        <div
          ref={composerRef}
          className="p-2.5 md:p-3 border-t border-white/10 bg-base-100/35 backdrop-blur-2xl relative"
        >
          <input
            ref={imgInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickImage}
          />

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={onPickFile}
          />

          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                className="btn btn-ghost btn-sm rounded-full hover:bg-base-200/40"
                onClick={() => imgInputRef.current?.click()}
                title="Send image"
                type="button"
                disabled={!canChat || recording}
              >
                <FiImage />
              </button>

              <button
                className="btn btn-ghost btn-sm rounded-full hover:bg-base-200/40"
                onClick={() => fileInputRef.current?.click()}
                title="Attach file"
                type="button"
                disabled={!canChat || recording}
              >
                <FiPaperclip />
              </button>

              {!recording ? (
                <button
                  className="btn btn-ghost btn-sm rounded-full hover:bg-base-200/40"
                  onClick={startRecording}
                  title="Record voice note"
                  type="button"
                  disabled={!canChat}
                >
                  <FiMic />
                </button>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-white/10 bg-base-100/60 backdrop-blur-xl shadow-sm flex-wrap">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-50 animate-ping" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>

                  <span className="text-sm font-semibold">Recording</span>

                  <span className="text-sm opacity-80 min-w-[48px]">
                    {formatSec(recordSec)}
                  </span>

                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      className="btn btn-ghost btn-xs rounded-full"
                      onClick={() => stopRecording("cancel")}
                      title="Cancel"
                      type="button"
                    >
                      <FiX />
                    </button>

                    <button
                      className="btn btn-primary btn-xs rounded-full gap-1"
                      onClick={() => stopRecording("send")}
                      title="Send"
                      type="button"
                    >
                      <FiStopCircle />
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                className="btn btn-ghost btn-sm rounded-full hover:bg-base-200/40"
                onClick={() => setEmojiOpen((v) => !v)}
                title="Emoji"
                type="button"
                disabled={!canChat || recording}
              >
                😊
              </button>

              <FixTextBox
                value={text}
                onChange={setText}
                disabled={!canChat || !text.trim() || recording}
              />
            </div>
          </div>

          {emojiOpen ? (
            <div className="absolute bottom-[92px] right-3 z-[60]">
              <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-base-100/85 backdrop-blur">
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
                "min-h-[42px] md:min-h-[44px] max-h-24 md:max-h-28 leading-snug",
                "text-sm md:text-sm",
                "bg-base-100/60 backdrop-blur",
                "border-white/10",
                "focus:outline-none focus:border-base-300",
              ].join(" ")}
              placeholder={canChat ? "Type a message…" : "Login required"}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!canChat || recording}
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
              disabled={!canChat || !text.trim() || recording}
              onClick={sendText}
              title="Send"
              type="button"
            >
              <FiSend />
            </button>
          </div>

          <div className="text-[11px] opacity-60 mt-1">
            Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-[999940] bg-black/35 backdrop-blur-[2px] sm:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close chat backdrop"
        />
      ) : null}

      <div className="fixed z-[999950] bottom-3 right-3 sm:bottom-4 sm:right-4 lg:bottom-5 lg:right-5">
        {open ? Panel : null}

        <button
          onClick={() => setOpen(true)}
          className={[
            "relative",
            "h-12 px-4 rounded-full",
            "inline-flex items-center gap-2",
            "border border-white/10",
            "bg-base-100/55 backdrop-blur-2xl",
            "shadow-[0_16px_55px_rgba(0,0,0,0.35)]",
            "hover:bg-base-100/70 transition",
            "transform-gpu active:scale-[0.98]",
            open ? "opacity-0 pointer-events-none" : "",
          ].join(" ")}
          aria-label="Open chat"
          type="button"
        >
          <span className="pointer-events-none absolute -inset-1 rounded-full opacity-30 blur-md bg-white/10" />

          <FiMessageSquare className="text-lg" />
          <span className="hidden sm:inline font-semibold">Chat</span>

          {unread ? (
            <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2">
              <span className="badge badge-error badge-sm">{unread}</span>
            </span>
          ) : null}
        </button>
      </div>
    </>
  );
}
