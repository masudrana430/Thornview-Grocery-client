// src/Pages/Admin/LiveChat.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { apiGet } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
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
  FiArrowDown,
  FiCheckCircle,
} from "react-icons/fi";
import EmojiPicker from "emoji-picker-react";
import AudioMessagePlayer from "../../Components/Chat/AudioMessagePlayer";

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
  } catch (error) {
  console.error("Failed to play ping sound:", error);
}
}

function safeDate(v) {
  const d = v ? new Date(v) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function timeOnly(v) {
  const d = v ? new Date(v) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
      pickTitle(conv),
    )}&background=EEF2FF&color=111827`
  );
}

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

function formatSec(sec) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function isNearBottom(el, threshold = 120) {
  if (!el) return true;
  return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
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
    [conversations, activeId],
  );

  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);

  const [typing, setTyping] = useState(false);
  const [presence, setPresence] = useState(() => new Map());

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const [emojiOpen, setEmojiOpen] = useState(false);

  const [recording, setRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);

  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  const socketRef = useRef(null);
  const typingTimer = useRef(null);

  const convoScrollRef = useRef(null);
  const messagesScrollRef = useRef(null);
  const composerRef = useRef(null);

  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recTimerRef = useRef(null);
  const recModeRef = useRef("send");

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

  const list = useMemo(() => {
    const term = String(q || "")
      .trim()
      .toLowerCase();
    if (!term) return conversations;
    return conversations.filter(
      (c) =>
        pickTitle(c).toLowerCase().includes(term) ||
        String(c?.otherUser?.email || "")
          .toLowerCase()
          .includes(term),
    );
  }, [conversations, q]);

  const activeOnline = useMemo(() => {
    const otherId = active?.otherUser?._id ? String(active.otherUser._id) : "";
    return otherId ? !!presence.get(otherId) : false;
  }, [active, presence]);

  function scrollMessagesToBottom(behavior = "smooth") {
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setShowJumpToBottom(false);
  }

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;

    const onScroll = () => {
      setShowJumpToBottom(!isNearBottom(el));
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => el.removeEventListener("scroll", onScroll);
  }, [activeId]);

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

      const normalized = items.map((c) => ({
        ...c,
        _id: String(c._id),
        unread: c.unread || 0,
      }));

      setConversations(normalized);

      if (!activeIdRef.current && normalized.length) {
        setActiveId(String(normalized[0]._id));
      }
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
      const res = await apiGet(
        `/api/admin/chat/messages/${conversationId}?limit=80`,
      );
      const items =
        res?.data?.messages || res?.data?.data?.messages || res?.messages || [];
      setMessages(items);
      setConversations((prev) =>
        prev.map((c) =>
          String(c._id) === String(conversationId) ? { ...c, unread: 0 } : c,
        ),
      );
      requestAnimationFrame(() => scrollMessagesToBottom("auto"));
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
      imageUrl: type === "image" ? fileUrl : null,
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
    requestAnimationFrame(() => scrollMessagesToBottom("smooth"));

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
      8000,
    );

    setSending(false);

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
          : c,
      ),
    );
  }

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

  async function startRecording() {
    try {
      if (recording) return;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickRecorderMime();
      const mr = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorderRef.current = mr;
      chunksRef.current = [];
      recModeRef.current = "send";

      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());

        clearInterval(recTimerRef.current);
        recTimerRef.current = null;

        const sendIt = recModeRef.current === "send";
        setRecording(false);

        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || "audio/webm",
        });
        chunksRef.current = [];

        if (!sendIt) {
          setRecSec(0);
          return;
        }

        try {
          setSending(true);
          const ext = (mr.mimeType || "audio/webm").includes("mp4")
            ? "mp4"
            : "webm";
          const file = new File([blob], `voice_${Date.now()}.${ext}`, {
            type: mr.mimeType || "audio/webm",
          });

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
    } catch (error) {
  console.error("Failed to stop recording:", error);
}
  }

  function cancelRecording() {
    if (!recorderRef.current) return;
    recModeRef.current = "cancel";
    try {
      recorderRef.current.stop();
    } catch (error) {
  console.error("Failed to cancel recording:", error);
}
  }

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

        socketRef.current = s;

        s.on("connect", () => {
          const cid = activeIdRef.current;
          if (cid) s.emit("conversation:join", { conversationId: cid });
        });

        s.on("connect_error", (e) =>
          console.log("socket connect_error:", e.message),
        );

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
                    },
              )
              .sort(
                (a, b) =>
                  new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
              ),
          );

          if (cid === String(activeIdRef.current)) {
            const shouldAuto =
              String(message.senderId) === String(meIdRef.current) ||
              isNearBottom(messagesScrollRef.current);

            setMessages((prev) => [...prev, message]);
            setTyping(false);

            requestAnimationFrame(() => {
              if (shouldAuto) scrollMessagesToBottom("smooth");
              else setShowJumpToBottom(true);
            });
          } else {
            setConversations((prev) =>
              prev.map((c) =>
                String(c._id) === cid
                  ? { ...c, unread: Number(c.unread || 0) + 1 }
                  : c,
              ),
            );
          }

          if (
            soundOnRef.current &&
            String(message.senderId) !== String(meIdRef.current)
          ) {
            playPing();
          }
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
      } catch (error) {
  console.error("Failed to disconnect socket:", error);
}
    };
  }, [authLoading, sessionReady]);

  useEffect(() => {
    if (!activeId) return;
    socketRef.current?.emit("conversation:join", { conversationId: activeId });
    loadMessages(activeId);
  }, [activeId]);

  return (
    <>
      <style>{`
        .glass-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(148,163,184,.35) transparent;
        }
        .glass-scroll::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .glass-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .glass-scroll::-webkit-scrollbar-thumb {
          background: rgba(148,163,184,.28);
          border: 2px solid transparent;
          background-clip: padding-box;
          border-radius: 999px;
        }
        .glass-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(148,163,184,.42);
          border: 2px solid transparent;
          background-clip: padding-box;
        }
      `}</style>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* LEFT / INBOX */}
        <div className="xl:col-span-4">
          <div className="relative h-[70vh] xl:h-[calc(100vh-10rem)] overflow-hidden rounded-[30px] border border-white/10 bg-base-100/55 backdrop-blur-2xl shadow-[0_18px_60px_rgba(0,0,0,0.10)]">
            <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-white/[0.03]" />

            <div className="relative flex h-full flex-col">
              <div className="border-b border-white/10 bg-base-100/35 px-4 py-4 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-black tracking-tight">
                      Live Chat
                    </div>
                    <div className="text-xs opacity-65 mt-1">
                      Customer inbox and real-time support
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-ghost btn-sm rounded-full gap-2 hover:bg-base-200/40"
                    onClick={() => {
                      const next = !soundOn;
                      setSoundOn(next);
                      localStorage.setItem(SOUND_KEY, next ? "1" : "0");
                    }}
                  >
                    {soundOn ? <FiVolume2 /> : <FiVolumeX />}
                    <span className="hidden sm:inline">
                      {soundOn ? "Sound on" : "Sound off"}
                    </span>
                  </button>
                </div>

                <div className="mt-4 relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-45" />
                  <input
                    className="input input-bordered w-full rounded-2xl pl-10 bg-base-100/65 backdrop-blur border-white/10"
                    placeholder="Search customer…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
              </div>

              <div
                ref={convoScrollRef}
                className="glass-scroll flex-1 overflow-y-auto"
              >
                {!sessionReady ? (
                  <div className="p-4 text-sm opacity-65">
                    Session not ready…
                  </div>
                ) : loading ? (
                  <div className="p-4 text-sm opacity-65">
                    Loading conversations…
                  </div>
                ) : list.length === 0 ? (
                  <div className="p-4 text-sm opacity-65">
                    No conversations yet.
                  </div>
                ) : (
                  <div className="p-2">
                    {list.map((c) => {
                      const id = String(c._id);
                      const selected = id === String(activeId);
                      const title = pickTitle(c);
                      const avatar = pickAvatar(c);
                      const lastAt =
                        c.lastMessageAt || c.updatedAt || c.createdAt;
                      const online = c?.otherUser?._id
                        ? !!presence.get(String(c.otherUser._id))
                        : false;

                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setActiveId(id)}
                          className={[
                            "w-full text-left rounded-2xl px-3 py-3 transition-all duration-200",
                            "border mb-2",
                            selected
                              ? "bg-base-100/70 border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.10)]"
                              : "bg-transparent border-transparent hover:bg-base-100/35 hover:border-white/10",
                          ].join(" ")}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <img
                                src={avatar}
                                alt={title}
                                className="h-11 w-11 rounded-2xl object-cover border border-white/10"
                              />
                              <span
                                className={[
                                  "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-base-100",
                                  online ? "bg-emerald-500" : "bg-slate-300",
                                ].join(" ")}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-bold truncate">
                                  {title}
                                </div>
                                {c.unread ? (
                                  <span className="badge badge-primary badge-sm border-0">
                                    {c.unread}
                                  </span>
                                ) : null}
                              </div>

                              <div className="mt-0.5 flex items-center justify-between gap-2 text-xs opacity-65">
                                <span className="truncate">
                                  {c.lastMessage || "—"}
                                </span>
                                <span className="shrink-0">
                                  {lastAt ? timeOnly(lastAt) : ""}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT / CHAT */}
        <div className="xl:col-span-8">
          <div className="relative h-[78vh] xl:h-[calc(100vh-10rem)] overflow-hidden rounded-[30px] border border-white/10 bg-base-100/55 backdrop-blur-2xl shadow-[0_18px_60px_rgba(0,0,0,0.10)]">
            <div className="pointer-events-none absolute -top-16 left-8 h-44 w-44 rounded-full bg-secondary/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-white/[0.03]" />

            <div className="relative flex h-full flex-col">
              {/* Chat header */}
              <div className="border-b border-white/10 bg-base-100/35 px-4 py-4 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    {active ? (
                      <>
                        <div className="relative shrink-0">
                          <img
                            src={pickAvatar(active)}
                            alt={pickTitle(active)}
                            className="h-11 w-11 rounded-2xl object-cover border border-white/10"
                          />
                          <span
                            className={[
                              "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-base-100",
                              activeOnline ? "bg-emerald-500" : "bg-slate-300",
                            ].join(" ")}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="font-black text-lg truncate">
                            {pickTitle(active)}
                          </div>
                          <div className="text-xs opacity-65 mt-0.5 truncate">
                            {activeOnline ? "Online" : "Offline"}
                            {active?.otherUser?.email
                              ? ` • ${active.otherUser.email}`
                              : ""}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div>
                        <div className="font-black text-lg">
                          Select a conversation
                        </div>
                        <div className="text-xs opacity-65 mt-0.5">
                          Pick a customer chat from the inbox.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="hidden md:block text-xs opacity-60">
                    {active?.createdAt
                      ? `Created: ${safeDate(active.createdAt)}`
                      : ""}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="relative flex-1 min-h-0">
                <div
                  ref={messagesScrollRef}
                  className="glass-scroll h-full overflow-y-auto px-3 md:px-4 py-4 md:py-5"
                >
                  {!activeId ? (
                    <div className="text-sm opacity-65">
                      Pick a chat from the left.
                    </div>
                  ) : msgLoading ? (
                    <div className="text-sm opacity-65">Loading messages…</div>
                  ) : messages.length === 0 ? (
                    <div className="text-sm opacity-65">
                      No messages yet. Say hi 👋
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((m) => {
                        const isMine =
                          meId && String(m.senderId) === String(meId);
                        const type = m.type || (m.imageUrl ? "image" : "text");
                        const url = m.fileUrl || m.imageUrl || "";

                        return (
                          <div
                            key={m._id}
                            className={`flex ${
                              isMine ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={[
                                "max-w-[85%] md:max-w-[78%]",
                                "rounded-[22px] px-4 py-3 border",
                                isMine
                                  ? "bg-primary/88 text-primary-content border-primary/25 rounded-br-[8px] shadow-sm"
                                  : "bg-base-100/60 backdrop-blur-xl border-white/10 rounded-bl-[8px] shadow-[0_10px_30px_rgba(0,0,0,0.10)]",
                              ].join(" ")}
                            >
                              {type === "image" && url ? (
                                <img
                                  src={url}
                                  alt="chat"
                                  className="max-h-64 w-full rounded-2xl object-cover border border-white/10 mb-2"
                                />
                              ) : null}

                              {type === "audio" && url ? (
                                <div className="mb-1">
                                  <AudioMessagePlayer
                                    src={url}
                                    duration={m.duration}
                                    fileName={m.fileName}
                                    mine={isMine}
                                  />
                                </div>
                              ) : null}

                              {type === "file" && url ? (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block rounded-2xl border border-white/10 px-3 py-3 bg-base-100/45 hover:bg-base-100/60 transition"
                                >
                                  <div className="font-semibold text-sm truncate">
                                    {m.fileName || "Download file"}
                                  </div>
                                  <div className="text-[11px] opacity-65 truncate mt-1">
                                    {m.mime || url}
                                  </div>
                                </a>
                              ) : null}

                              {m.text ? (
                                <div className="text-sm whitespace-pre-wrap mt-1">
                                  {m.text}
                                </div>
                              ) : null}

                              <div className="mt-2 text-[11px] opacity-75 flex items-center justify-between gap-3">
                                <span>
                                  {m.createdAt ? timeOnly(m.createdAt) : ""}
                                </span>

                                <div className="flex items-center gap-2">
                                  {m.failed ? (
                                    <span className="font-semibold text-rose-200">
                                      Failed
                                    </span>
                                  ) : null}
                                  {m.optimistic && !m.failed ? (
                                    <span className="opacity-80">Sending…</span>
                                  ) : null}
                                  {isMine && !m.failed && !m.optimistic ? (
                                    <FiCheckCircle className="opacity-80" />
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {typing ? (
                        <div className="flex justify-start">
                          <div className="rounded-full border border-white/10 bg-base-100/50 px-3 py-2 text-xs opacity-70 backdrop-blur">
                            Typing…
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {showJumpToBottom && activeId ? (
                  <button
                    type="button"
                    onClick={() => scrollMessagesToBottom("smooth")}
                    className="absolute bottom-4 right-4 btn btn-sm rounded-full shadow-lg bg-base-100/85 backdrop-blur border border-white/10"
                    title="Jump to latest"
                  >
                    <FiArrowDown />
                    Latest
                  </button>
                ) : null}
              </div>

              {/* Composer */}
              <div
                ref={composerRef}
                className="border-t border-white/10 bg-base-100/35 px-3 md:px-4 py-3 backdrop-blur-xl relative"
              >
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
                  <button
                    type="button"
                    className="btn btn-ghost rounded-2xl hover:bg-base-200/35"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={!activeId || sending || recording}
                    title="Send image"
                  >
                    <FiImage />
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost rounded-2xl hover:bg-base-200/35"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!activeId || sending || recording}
                    title="Attach file"
                  >
                    <FiPaperclip />
                  </button>

                  {!recording ? (
                    <button
                      type="button"
                      className="btn btn-ghost rounded-2xl hover:bg-base-200/35"
                      onClick={startRecording}
                      disabled={!activeId || sending}
                      title="Record voice note"
                    >
                      <FiMic />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-white/10 bg-base-100/45 backdrop-blur">
                      <span className="text-sm font-semibold">Recording</span>
                      <span className="text-sm opacity-80">
                        {formatSec(recSec)}
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={cancelRecording}
                        title="Cancel"
                      >
                        <FiX />
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={stopRecordingSend}
                        title="Send"
                      >
                        <FiSquare />
                      </button>
                    </div>
                  )}

                  <textarea
                    className="textarea textarea-bordered rounded-[22px] flex-1 min-h-[46px] max-h-32 bg-base-100/65 backdrop-blur border-white/10"
                    placeholder={
                      activeId
                        ? "Type a message…"
                        : "Select a conversation first"
                    }
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

                  <button
                    type="button"
                    className="btn btn-primary rounded-[22px] gap-2"
                    disabled={!activeId || sending || recording || !text.trim()}
                    onClick={() => sendMessage({ type: "text", text })}
                    title="Send"
                  >
                    <FiSend />
                    <span className="hidden sm:inline">
                      {sending ? "Sending" : "Send"}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost rounded-2xl hover:bg-base-200/35"
                    onClick={() => setEmojiOpen((v) => !v)}
                    disabled={!activeId || recording}
                    title="Emoji"
                  >
                    😊
                  </button>
                </div>

                {emojiOpen ? (
                  <div className="absolute bottom-[76px] right-4 z-50">
                    <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-base-100/90 backdrop-blur">
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          setText((t) => (t || "") + emojiData.emoji);
                          setEmojiOpen(false);
                        }}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="text-[11px] opacity-60 mt-2">
                  Enter to send • Shift+Enter for new line
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
