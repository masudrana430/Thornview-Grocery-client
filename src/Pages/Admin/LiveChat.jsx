// src/Pages/Admin/LiveChat.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { apiGet } from "../../services/api";
import { useAuth } from "../../Provider/AuthProvider";
import {
  FiSearch,
  FiSend,
  FiImage,
  FiVolume2,
  FiVolumeX,
  FiPaperclip,
  FiMic,
  FiSquare,
  FiX,
} from "react-icons/fi";
import EmojiPicker from "emoji-picker-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const SOUND_KEY = "thomview_chat_sound_enabled";

function playPing() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.03;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, 90);
  } catch {}
}

function safeDate(v) {
  const d = v ? new Date(v) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function pickTitle(conv) {
  const u = conv?.otherUser;
  const name = (u?.name || "").trim();
  const email = (u?.email || "").trim();
  return name || email || "Customer";
}

function pickAvatar(conv) {
  const u = conv?.otherUser;
  return (
    u?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      pickTitle(conv)
    )}&background=EEF2FF&color=111827`
  );
}

// ✅ emit with ACK + timeout so “Sending…” never hangs forever
function emitWithAck(socket, event, payload, timeoutMs = 8000) {
  return new Promise((resolve) => {
    let done = false;

    const t = setTimeout(() => {
      if (done) return;
      done = true;
      resolve({ ok: false, error: "ACK_TIMEOUT" });
    }, timeoutMs);

    socket.emit(event, payload, (ack) => {
      if (done) return;
      done = true;
      clearTimeout(t);
      resolve(ack || { ok: false, error: "NO_ACK_PAYLOAD" });
    });
  });
}

// Voice note helpers
function pickRecorderMime() {
  const cands = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mpeg",
  ];
  for (const m of cands) {
    // eslint-disable-next-line no-undef
    if (window.MediaRecorder && MediaRecorder.isTypeSupported?.(m)) return m;
  }
  return "";
}

function formatSec(sec) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function LiveChat() {
  const { sessionReady, loading: authLoading } = useAuth();

  const [soundOn, setSoundOn] = useState(() => {
    const v = localStorage.getItem(SOUND_KEY);
    return v == null ? true : v === "1";
  });

  const [meId, setMeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [q, setQ] = useState("");

  const [activeId, setActiveId] = useState("");
  const active = useMemo(
    () => conversations.find((c) => String(c._id) === String(activeId)),
    [conversations, activeId]
  );

  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);

  const [typing, setTyping] = useState(false);
  const [presence, setPresence] = useState(() => new Map());

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const [emojiOpen, setEmojiOpen] = useState(false);

  // Recording UI state
  const [recording, setRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);

  const socketRef = useRef(null);
  const endRef = useRef(null);
  const typingTimer = useRef(null);

  // file inputs
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // emoji click outside
  const composerRef = useRef(null);

  // recorder refs
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recTimerRef = useRef(null);
  const recModeRef = useRef("send"); // "send" | "cancel"

  // refs to avoid stale closures
  const activeIdRef = useRef("");
  const soundOnRef = useRef(true);
  const meIdRef = useRef("");

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  useEffect(() => {
    meIdRef.current = meId;
  }, [meId]);

  function scrollToBottom(behavior = "smooth") {
    endRef.current?.scrollIntoView({ behavior });
  }

  const list = useMemo(() => {
    const term = String(q || "").trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter(
      (c) =>
        pickTitle(c).toLowerCase().includes(term) ||
        String(c?.otherUser?.email || "").toLowerCase().includes(term)
    );
  }, [conversations, q]);

  async function loadMe() {
    const res = await apiGet("/api/users/me");
    const id = res?.data?.user?.id;
    if (id) setMeId(String(id));
  }

  async function loadConversations() {
    setLoading(true);
    try {
      const res = await apiGet("/api/admin/chat/conversations");
      const items =
        res?.data?.conversations ||
        res?.data?.data?.conversations ||
        res?.conversations ||
        [];
      setConversations(
        items.map((c) => ({ ...c, _id: String(c._id), unread: c.unread || 0 }))
      );
      if (!activeIdRef.current && items.length) setActiveId(String(items[0]._id));
    } catch (e) {
      console.error(e);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(conversationId) {
    if (!conversationId) return;
    setMsgLoading(true);
    try {
      const res = await apiGet(`/api/admin/chat/messages/${conversationId}?limit=80`);
      const items =
        res?.data?.messages || res?.data?.data?.messages || res?.messages || [];
      setMessages(items);
      setConversations((prev) =>
        prev.map((c) =>
          String(c._id) === String(conversationId) ? { ...c, unread: 0 } : c
        )
      );
      setTimeout(() => scrollToBottom("auto"), 10);
    } catch (e) {
      console.error(e);
      setMessages([]);
    } finally {
      setMsgLoading(false);
    }
  }

  function emitTyping() {
    const s = socketRef.current;
    const cid = activeIdRef.current;
    if (!s || !cid) return;

    s.emit("typing:start", { conversationId: cid });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      s.emit("typing:stop", { conversationId: cid });
    }, 900);
  }

  // ✅ upload helper (image/file/audio all use chat-asset)
  async function uploadChatAsset(file) {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(`${API_BASE}/api/admin/uploads/chat-asset`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error?.message || "Upload failed");
    return json?.data?.url;
  }

  // ✅ one sendMessage for all types
  async function sendMessage({
    type = "text",
    text: t = "",
    fileUrl = "",
    fileName = "",
    mime = "",
    size = 0,
    duration = 0,
  }) {
    const s = socketRef.current;
    const cid = activeIdRef.current;

    if (!s || !cid) return;

    const clean = String(t || "").trim();
    if (type === "text" && !clean) return;
    if (type !== "text" && !fileUrl) return;

    const tempId = `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const optimistic = {
      _id: tempId,
      conversationId: cid,
      senderId: meIdRef.current || "me",
      type,
      text: type === "text" ? clean : "",
      fileUrl: type === "text" ? "" : fileUrl,
      imageUrl: type === "image" ? fileUrl : null, // backward compat
      fileName,
      mime,
      size,
      duration,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };

    setMessages((prev) => [...prev, optimistic]);
    setText("");
    setEmojiOpen(false);
    setTimeout(() => scrollToBottom("smooth"), 10);

    setSending(true);

    const ack = await emitWithAck(
      s,
      "message:send",
      {
        conversationId: cid,
        tempId,
        type,
        text: clean,
        fileUrl,
        imageUrl: type === "image" ? fileUrl : "",
        fileName,
        mime,
        size,
        duration,
      },
      8000
    );

    setSending(false);

    if (!ack?.ok || !ack?.message) {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === tempId ? { ...m, failed: true, optimistic: false, error: ack?.error } : m
        )
      );
      return;
    }

    setMessages((prev) => prev.map((m) => (m._id === tempId ? ack.message : m)));

    setConversations((prev) =>
      prev.map((c) =>
        String(c._id) === String(cid)
          ? {
              ...c,
              lastMessage:
                ack.message.type === "image"
                  ? "[image]"
                  : ack.message.type === "audio"
                  ? "[voice]"
                  : ack.message.type === "file"
                  ? "[file]"
                  : (ack.message.text || "").slice(0, 120),
              lastMessageAt: ack.message.createdAt,
              updatedAt: ack.message.createdAt,
            }
          : c
      )
    );
  }

  // IMAGE PICK
  async function onPickImage(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;

    try {
      setSending(true);
      const url = await uploadChatAsset(f);
      await sendMessage({
        type: "image",
        fileUrl: url,
        fileName: f.name,
        mime: f.type,
        size: f.size,
      });
    } catch (err) {
      console.error(err);
      alert(err?.message || "Upload failed");
    } finally {
      setSending(false);
    }
  }

  // FILE PICK (auto-detect audio)
  async function onPickFile(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;

    const isAudio = String(f.type || "").startsWith("audio/");
    const isImage = String(f.type || "").startsWith("image/");

    const type = isAudio ? "audio" : isImage ? "image" : "file";

    try {
      setSending(true);
      const url = await uploadChatAsset(f);
      await sendMessage({
        type,
        fileUrl: url,
        fileName: f.name,
        mime: f.type,
        size: f.size,
        duration: 0,
      });
    } catch (err) {
      console.error(err);
      alert(err?.message || "Upload failed");
    } finally {
      setSending(false);
    }
  }

  // VOICE NOTE
  async function startRecording() {
    try {
      if (recording) return;

      // must be localhost/https
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = pickRecorderMime();
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      recorderRef.current = mr;
      chunksRef.current = [];
      recModeRef.current = "send";

      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      mr.onstop = async () => {
        // stop tracks
        stream.getTracks().forEach((t) => t.stop());

        clearInterval(recTimerRef.current);
        recTimerRef.current = null;

        const sendIt = recModeRef.current === "send";
        setRecording(false);

        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        chunksRef.current = [];

        if (!sendIt) {
          setRecSec(0);
          return;
        }

        // upload
        try {
          setSending(true);
          const ext = (mr.mimeType || "audio/webm").includes("mp4") ? "mp4" : "webm";
          const file = new File([blob], `voice_${Date.now()}.${ext}`, { type: mr.mimeType || "audio/webm" });

          const url = await uploadChatAsset(file);

          await sendMessage({
            type: "audio",
            fileUrl: url,
            fileName: file.name,
            mime: file.type,
            size: file.size,
            duration: recSec,
          });
        } catch (e) {
          console.error(e);
          alert(e?.message || "Voice upload failed");
        } finally {
          setSending(false);
          setRecSec(0);
        }
      };

      // start + timer
      mr.start(250);
      setRecording(true);
      setRecSec(0);

      recTimerRef.current = setInterval(() => {
        setRecSec((s) => s + 1);
      }, 1000);
    } catch (e) {
      console.error("mic error:", e);
      alert("Microphone permission denied (or not available).");
    }
  }

  function stopRecordingSend() {
    if (!recorderRef.current) return;
    recModeRef.current = "send";
    try {
      recorderRef.current.stop();
    } catch {}
  }

  function cancelRecording() {
    if (!recorderRef.current) return;
    recModeRef.current = "cancel";
    try {
      recorderRef.current.stop();
    } catch {}
  }

  const activeOnline = useMemo(() => {
    const otherId = active?.otherUser?._id ? String(active.otherUser._id) : "";
    return otherId ? !!presence.get(otherId) : false;
  }, [active, presence]);

  // Close emoji on outside click
  useEffect(() => {
    function onDocDown(e) {
      if (!emojiOpen) return;
      const el = composerRef.current;
      if (!el) return;
      if (!el.contains(e.target)) setEmojiOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [emojiOpen]);

  // Boot after sessionReady
  useEffect(() => {
    if (authLoading) return;
    if (!sessionReady) return;

    let mounted = true;

    (async () => {
      try {
        await loadMe();
        await loadConversations();
        if (!mounted) return;

        const s = io(API_BASE, {
          withCredentials: true,
          transports: ["polling", "websocket"],
        });

        s.on("connect", () => {
          const cid = activeIdRef.current;
          if (cid) s.emit("conversation:join", { conversationId: cid });
        });

        s.on("connect_error", (e) => console.log("socket connect_error:", e.message));

        socketRef.current = s;

        s.on("presence:update", ({ userId, online }) => {
          setPresence((prev) => {
            const next = new Map(prev);
            next.set(String(userId), !!online);
            return next;
          });
        });

        s.on("typing:update", ({ conversationId, typing: isTyping }) => {
          if (String(conversationId) !== String(activeIdRef.current)) return;
          setTyping(!!isTyping);
        });

        s.on("message:new", ({ message }) => {
          if (!message?.conversationId) return;
          const cid = String(message.conversationId);

          setConversations((prev) =>
            prev
              .map((c) =>
                String(c._id) !== cid
                  ? c
                  : {
                      ...c,
                      lastMessage:
                        message.type === "image"
                          ? "[image]"
                          : message.type === "audio"
                          ? "[voice]"
                          : message.type === "file"
                          ? "[file]"
                          : message.text || "",
                      lastMessageAt: message.createdAt,
                      updatedAt: message.createdAt,
                    }
              )
              .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
          );

          if (cid === String(activeIdRef.current)) {
            setMessages((prev) => [...prev, message]);
            setTyping(false);
            setTimeout(() => scrollToBottom("smooth"), 10);
          } else {
            setConversations((prev) =>
              prev.map((c) =>
                String(c._id) === cid ? { ...c, unread: Number(c.unread || 0) + 1 } : c
              )
            );
          }

          if (soundOnRef.current) playPing();
        });
      } catch (e) {
        console.error("Chat boot failed:", e);
      }
    })();

    return () => {
      mounted = false;
      clearTimeout(typingTimer.current);
      clearInterval(recTimerRef.current);
      try {
        socketRef.current?.disconnect();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, sessionReady]);

  useEffect(() => {
    if (!activeId) return;
    socketRef.current?.emit("conversation:join", { conversationId: activeId });
    loadMessages(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* LEFT */}
      <div className="lg:col-span-4 rounded-2xl border border-base-200 bg-base-100 overflow-hidden">
        <div className="p-4 border-b border-base-200 flex items-center justify-between gap-3">
          <div className="font-black text-lg">Live Chat</div>

          <button
            type="button"
            className="btn btn-ghost btn-sm rounded-full gap-2"
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              localStorage.setItem(SOUND_KEY, next ? "1" : "0");
            }}
          >
            {soundOn ? <FiVolume2 /> : <FiVolumeX />}
            <span className="hidden sm:inline">{soundOn ? "Sound on" : "Sound off"}</span>
          </button>
        </div>

        <div className="p-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input input-bordered w-full pl-10 rounded-xl"
              placeholder="Search customer…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="max-h-[65vh] overflow-auto">
          {!sessionReady ? (
            <div className="p-4 text-sm text-slate-500">Session not ready…</div>
          ) : loading ? (
            <div className="p-4 text-sm text-slate-500">Loading conversations…</div>
          ) : list.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">No conversations yet.</div>
          ) : (
            list.map((c) => {
              const id = String(c._id);
              const selected = id === String(activeId);
              const title = pickTitle(c);
              const avatar = pickAvatar(c);
              const lastAt = c.lastMessageAt || c.updatedAt || c.createdAt;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveId(id)}
                  className={[
                    "w-full text-left px-4 py-3 border-t border-base-200 hover:bg-base-200/40 transition-colors",
                    selected ? "bg-base-200/60" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <img src={avatar} alt={title} className="h-10 w-10 rounded-full object-cover border" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold truncate">{title}</div>
                        {c.unread ? <span className="badge badge-primary badge-sm">{c.unread}</span> : null}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center justify-between gap-2 mt-0.5">
                        <span className="truncate">{c.lastMessage || "—"}</span>
                        <span className="shrink-0">{lastAt ? new Date(lastAt).toLocaleTimeString() : ""}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT */}
      <div className="lg:col-span-8 rounded-2xl border border-base-200 bg-base-100 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-base-200 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-black text-lg truncate">{active ? pickTitle(active) : "Select a conversation"}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              {active ? (activeOnline ? "Online" : "Offline") : "—"}
              {active?.otherUser?.email ? ` • ${active.otherUser.email}` : ""}
            </div>
          </div>
          <div className="text-xs text-slate-500">{active?.createdAt ? `Created: ${safeDate(active.createdAt)}` : ""}</div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-3 bg-base-200/20">
          {!activeId ? (
            <div className="text-sm text-slate-500">Pick a chat from the left.</div>
          ) : msgLoading ? (
            <div className="text-sm text-slate-500">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="text-sm text-slate-500">No messages yet. Say hi 👋</div>
          ) : (
            messages.map((m) => {
              const isMine = meId && String(m.senderId) === String(meId);
              const type = m.type || (m.imageUrl ? "image" : "text");
              const url = m.fileUrl || m.imageUrl || "";

              return (
                <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={[
                      "max-w-[78%] rounded-2xl px-4 py-3 border",
                      isMine ? "bg-primary text-primary-content border-primary/30" : "bg-base-100 border-base-200",
                    ].join(" ")}
                  >
                    {type === "image" && url ? (
                      <img src={url} alt="chat" className="max-h-60 rounded-xl mb-2" />
                    ) : null}

                    {type === "audio" && url ? (
                      <div className="mb-1">
                        <audio controls src={url} className="w-full" />
                        {m.duration ? <div className="text-[11px] opacity-70 mt-1">Duration: {formatSec(m.duration)}</div> : null}
                      </div>
                    ) : null}

                    {type === "file" && url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl border border-base-200 px-3 py-2 bg-base-100/60 hover:bg-base-100 transition"
                      >
                        <div className="font-semibold text-sm truncate">{m.fileName || "Download file"}</div>
                        <div className="text-[11px] opacity-70 truncate">{m.mime || url}</div>
                      </a>
                    ) : null}

                    {m.text ? <div className="text-sm whitespace-pre-wrap mt-1">{m.text}</div> : null}

                    <div className="mt-2 text-[11px] opacity-80 flex items-center justify-between gap-3">
                      <span>{m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ""}</span>
                      {m.failed ? <span className="text-red-200 font-semibold">Failed</span> : null}
                      {m.optimistic && !m.failed ? <span className="opacity-80">Sending…</span> : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {typing ? <div className="text-xs text-slate-500">Typing…</div> : null}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        <div ref={composerRef} className="p-3 border-t border-base-200 bg-base-100 relative">
          {/* hidden inputs */}
          <input
            ref={imageInputRef}
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

          <div className="flex items-end gap-2">
            {/* Image */}
            <button
              type="button"
              className="btn btn-ghost rounded-xl"
              onClick={() => imageInputRef.current?.click()}
              disabled={!activeId || sending || recording}
              title="Send image"
            >
              <FiImage />
            </button>

            {/* File */}
            <button
              type="button"
              className="btn btn-ghost rounded-xl"
              onClick={() => fileInputRef.current?.click()}
              disabled={!activeId || sending || recording}
              title="Attach file"
            >
              <FiPaperclip />
            </button>

            {/* Voice */}
            {!recording ? (
              <button
                type="button"
                className="btn btn-ghost rounded-xl"
                onClick={startRecording}
                disabled={!activeId || sending}
                title="Record voice note"
              >
                <FiMic />
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-base-200 bg-base-200/30">
                <span className="text-sm font-semibold">Recording</span>
                <span className="text-sm opacity-80">{formatSec(recSec)}</span>
                <button type="button" className="btn btn-ghost btn-xs" onClick={cancelRecording} title="Cancel">
                  <FiX />
                </button>
                <button type="button" className="btn btn-primary btn-xs" onClick={stopRecordingSend} title="Send">
                  <FiSquare />
                </button>
              </div>
            )}

            {/* Text */}
            <textarea
              className="textarea textarea-bordered rounded-2xl flex-1 min-h-[44px] max-h-32"
              placeholder={activeId ? "Type a message…" : "Select a conversation first"}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                emitTyping();
              }}
              disabled={!activeId || sending || recording}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage({ type: "text", text });
                }
              }}
            />

            {/* Send */}
            <button
              type="button"
              className="btn btn-primary rounded-2xl gap-2"
              disabled={!activeId || sending || recording || !text.trim()}
              onClick={() => sendMessage({ type: "text", text })}
              title="Send"
            >
              <FiSend />
              <span className="hidden sm:inline">{sending ? "Sending" : "Send"}</span>
            </button>

            {/* Emoji */}
            <button
              type="button"
              className="btn btn-ghost rounded-xl"
              onClick={() => setEmojiOpen((v) => !v)}
              disabled={!activeId || recording}
              title="Emoji"
            >
              😊
            </button>
          </div>

          {/* Emoji picker */}
          {emojiOpen ? (
            <div className="absolute bottom-16 right-4 z-50">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-base-200">
                <EmojiPicker
                  onEmojiClick={(emojiData /*, event */) => {
                    // ✅ correct API: emojiData.emoji
                    setText((t) => (t || "") + emojiData.emoji);
                    setEmojiOpen(false);
                  }}
                />
              </div>
            </div>
          ) : null}

          <div className="text-[11px] text-slate-500 mt-2">
            Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}
