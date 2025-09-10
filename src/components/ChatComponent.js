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
  const [messagesHeight, setMessagesHeight] = useState("auto");

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

  const updateMessagesHeight = () => {
    const header = document.getElementById("chat-header")?.offsetHeight || 0;
    const footer = document.getElementById("chat-footer")?.offsetHeight || 0;
    setMessagesHeight(`calc(100vh - ${header + footer}px)`);
  };

  useEffect(() => {
    updateMessagesHeight();
    window.addEventListener("resize", updateMessagesHeight);
    return () => window.removeEventListener("resize", updateMessagesHeight);
  }, []);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, messagesHeight]);

  useEffect(() => {
    if (!lastMsgRef.current) return;
    const el = document.querySelector(".msg-bubble:last-child");
    if (el)
      gsap.fromTo(
        el,
        { opacity: 0, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.3, ease: "power1.out" }
      );
    lastMsgRef.current = false;
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !socketRef.current || !user) return;
    const msg = {
      chatId,
      senderId: user.id,
      userName: user.firstName || user.username || "Anon",
      text: message.trim(),
      createdAt: new Date().toISOString(),
    };
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
    if (window.innerWidth < 640) setSidebarOpen(false);
  };

  const selectGeneralChat = () => {
    setChatId("global");
    setChatTitle("General Chat");
    if (window.innerWidth < 640) setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-b from-white via-purple-50 to-white">
      {/* Sidebar */}
      <aside
        className={`bg-white/95 backdrop-blur-sm border-r border-purple-100 fixed sm:relative top-0 left-0 h-full z-30 transition-all duration-300 ${sidebarOpen ? "w-64" : "w-0 sm:w-64"} overflow-hidden flex flex-col`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white text-lg font-bold shadow-lg">
              P
            </div>
            <div className={`${pacifico.className} hidden sm:block text-lg text-purple-700`}>Ping</div>
          </div>
          <button onClick={toggleSidebar} className="sm:hidden p-2 rounded-md hover:bg-purple-50 relative group">
            <svg width="20" height="20" viewBox="0 0 24 24" stroke="#7C3AED" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {onlineUsers.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Show online users
            </span>
          </button>
        </div>

        <div className="px-3 pb-3 flex-1 overflow-auto">
          <div className="text-xs uppercase tracking-wider text-gray-500 px-2">Online</div>
          <ul className="mt-2 space-y-2">
            {onlineUsers.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500">No one online</li>
            )}
            {onlineUsers.filter((u) => u.userId !== user?.id).map((u) => (
              <li
                key={u.userId}
                onClick={() => startPrivateChat(u)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-purple-50 cursor-pointer"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-purple-300 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {u.userName?.charAt(0) || "?"}
                </div>
                <div className="text-sm font-medium text-gray-800 truncate">{u.userName}</div>
                <div className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Online"></div>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-3 border-t border-purple-50 flex flex-col gap-2">
          <button
            onClick={selectGeneralChat}
            className="w-full py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold shadow-lg"
          >
            General
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full py-2 rounded-full border border-purple-200 text-purple-700 font-semibold shadow-md hover:bg-purple-50"
          >
            Logout
          </motion.button>
        </div>
      </aside>

      {/* Main Chat */}
      <main className="flex-1 flex flex-col ml-0 sm:ml-64 h-full">
        <header
          id="chat-header"
          className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white/90 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-10 sm:relative"
        >
          <h2 className={`${pacifico.className} text-xl sm:text-2xl text-purple-700 truncate`}>{chatTitle}</h2>
          <button
            onClick={toggleSidebar}
            className="sm:hidden p-2 rounded-md bg-purple-100 text-purple-700 relative group"
          >
            Users
            {onlineUsers.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>}
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Show online users
            </span>
          </button>
        </header>

        <section style={{ height: messagesHeight }} className="overflow-y-auto p-3 sm:p-6">
          <div className="grid grid-cols-1 gap-3 max-w-full mx-auto">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`msg-bubble px-3 sm:px-4 py-2 rounded-2xl shadow-md max-w-[90%] break-words ${
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

            {typingUser && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-gray-600 italic pl-2 sm:pl-4">
                {typingUser} is typing...
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </section>

        <footer
          id="chat-footer"
          className="p-3 sm:p-4 bg-white border-t border-purple-100 sticky bottom-0 z-10 sm:relative"
        >
          <div className="flex items-center gap-2 sm:gap-3 max-w-full mx-auto">
            <input
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 rounded-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-purple-400 focus:ring-2 focus:ring-purple-500 text-gray-800"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
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
