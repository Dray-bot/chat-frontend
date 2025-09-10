"use client";
import { useState, useEffect, useRef } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Pacifico } from "next/font/google";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import gsap from "gsap";

let dayjs;
try {
  dayjs = require("dayjs");
} catch {
  dayjs = null;
}

const pacifico = Pacifico({ subsets: ["latin"], weight: ["400"] });

export default function ChatComponent() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [chatId, setChatId] = useState("global");
  const [chatTitle, setChatTitle] = useState("General Chat");
  const [typingUser, setTypingUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastMsgRef = useRef(false);

  const formatTime = (date) =>
    date
      ? dayjs
        ? dayjs(date).format("h:mm A")
        : new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

  useEffect(() => {
    if (!user || socketRef.current) return;

    socketRef.current = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "https://chat-backend-s009.onrender.com/",
      { transports: ["websocket"] }
    );

    socketRef.current.emit("register_user", {
      userId: user.id,
      userName: user.firstName || user.username || "Anon",
    });

    socketRef.current.on("load_messages", setMessages);
    socketRef.current.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      lastMsgRef.current = true;
    });
    socketRef.current.on("online_users", setOnlineUsers);
    socketRef.current.on("typing", ({ userName }) => setTypingUser(userName));
    socketRef.current.on("stop_typing", () => setTypingUser(null));

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  useEffect(() => {
    if (socketRef.current && chatId) socketRef.current.emit("join_chat", chatId);
  }, [chatId]);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  useEffect(() => {
    if (!lastMsgRef.current) return;
    const el = document.querySelector(".msg-bubble:last-child");
    if (el)
      gsap.fromTo(el, { opacity: 0, y: 24, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power2.out" });
    lastMsgRef.current = false;
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !socketRef.current || !user) return;
    const msg = { chatId, senderId: user.id, userName: user.firstName || user.username || "Anon", text: message.trim(), createdAt: new Date().toISOString() };
    socketRef.current.emit("send_message", msg);
    setMessage("");
  };

  const handleTyping = () => {
    if (!socketRef.current || !user) return;
    socketRef.current.emit("typing", { chatId, userName: user.firstName });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => socketRef.current.emit("stop_typing", { chatId }), 1200);
  };

  const toggleSidebar = () => setSidebarOpen((s) => !s);

  const handleLogout = async () => {
    socketRef.current?.disconnect();
    await signOut();
    router.push("/");
  };

  const startPrivateChat = (otherUser) => {
    const roomId = [user.id, otherUser.userId].sort().join("_");
    setChatId(roomId);
    setChatTitle(otherUser.userName);
    if (window.innerWidth < 640) setSidebarOpen(false); // auto-close on mobile
  };

  const selectGeneralChat = () => {
    setChatId("global");
    setChatTitle("General Chat");
    if (window.innerWidth < 640) setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gradient-to-b from-white via-purple-50 to-white overflow-hidden">
      <aside
        className={`bg-white/95 backdrop-blur-sm border-r border-purple-100 z-30 transform transition-all duration-300 fixed sm:relative h-full top-0 left-0 ${
          sidebarOpen ? "w-64" : "w-0 sm:w-64"
        } overflow-hidden`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white text-lg font-bold shadow-lg">P</div>
            <div className={`${pacifico.className} hidden sm:block text-lg text-purple-700`}>Ping</div>
          </div>
          <button onClick={toggleSidebar} className="sm:hidden p-2 rounded-md hover:bg-purple-50">
            <svg width="20" height="20" viewBox="0 0 24 24" stroke="#7C3AED" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-3 pb-3 flex-1 overflow-auto">
          <div className="text-xs uppercase tracking-wider text-gray-500 px-2">Online</div>
          <ul className="mt-2 space-y-2">
            {onlineUsers.length === 0 && <li className="px-3 py-2 text-sm text-gray-500">No one online</li>}
            {onlineUsers
              .filter((u) => u.userId !== user?.id)
              .map((u) => (
                <li
                  key={u.userId}
                  onClick={() => startPrivateChat(u)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-purple-50 cursor-pointer"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-purple-300 to-purple-500 flex items-center justify-center text-white font-semibold">{u.userName?.charAt(0) || "?"}</div>
                  <div className="text-sm font-medium text-gray-800 truncate">{u.userName}</div>
                </li>
              ))}
          </ul>
        </div>

        <div className="p-3 border-t border-purple-50">
          <button
            onClick={selectGeneralChat}
            className="w-full py-2 mb-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold shadow-lg hover:opacity-95"
          >
            General
          </button>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="w-full py-2 rounded-full border border-purple-200 text-purple-700 font-semibold shadow-md hover:bg-purple-50"
          >
            Logout
          </motion.button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white/80 backdrop-blur-sm border-b border-purple-100">
          <h2 className={`${pacifico.className} text-xl sm:text-2xl text-purple-700 truncate`}>{chatTitle}</h2>
          <button onClick={toggleSidebar} className="sm:hidden p-2 rounded-md bg-purple-100 text-purple-700">
            Users
          </button>
        </header>

        <section className="flex-1 overflow-auto p-3 sm:p-6">
          <div className="grid grid-cols-1 gap-3 max-w-3xl mx-auto">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: isMe ? 6 : -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`msg-bubble px-3 sm:px-4 py-2 rounded-2xl shadow-md max-w-[95%] sm:max-w-[75%] break-words ${
                        isMe ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white" : "bg-white text-gray-900"
                      }`}
                    >
                      {!isMe && <div className="text-sm font-semibold mb-1">{msg.userName}</div>}
                      <div className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{msg.text}</div>
                      <div className={`text-[10px] sm:text-xs mt-1 text-right ${isMe ? "text-purple-100" : "text-gray-500"}`}>
                        {formatTime(msg.createdAt)}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </section>

        <footer className="p-3 sm:p-4 bg-white border-t border-purple-100">
          <div className="max-w-3xl mx-auto flex items-center gap-2 sm:gap-3">
            <input
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              className="text-gray-800 flex-1 rounded-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-purple-400 focus:ring-2 focus:ring-purple-500"
            />
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={sendMessage}
              className="px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold shadow-lg text-sm sm:text-base"
            >
              Send
            </motion.button>
          </div>
        </footer>
      </main>
    </div>
  );
}
