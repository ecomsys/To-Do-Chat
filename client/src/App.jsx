import { useState, useEffect, useRef, useCallback } from "react";
import { getSocket, resetSocket } from "./socket";
import { ROLE_PASSWORDS } from "./constants";

import LoadingScreen from "./components/LoadingScreen";
import LoginForm from "./components/LoginForm";
import Sidebar from "./components/Sidebar";
import MobileSidebar from "./components/MobileSidebar";
import ChatHeader from "./components/ChatHeader";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";

function App() {
  const [step, setStep] = useState("loading");
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const hasJoined = useRef(false);
  const audioRef = useRef(null);

  // === Загрузка сохранённой сессии ===
  useEffect(() => {
    const savedRole = localStorage.getItem("chatRole");
    const savedName = localStorage.getItem("chatName");
    const savedPassword = localStorage.getItem("chatPassword");
    if (savedRole && savedPassword) {
      queueMicrotask(() => {
        setRole(savedRole);
        setName(savedName || "");
        setPassword(savedPassword);
        setStep("chat");
      });
    } else {
      queueMicrotask(() => setStep("login"));
    }
  }, []);

  // === Инициализация звука ===
  useEffect(() => {
    audioRef.current = new Audio("/sounds/iphone.mp3");
    audioRef.current.volume = 0.3;
  }, []);

  // === Подключение к чату ===
  useEffect(() => {
    if (step === "chat") {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      resetSocket();
      const socket = getSocket();
      socketRef.current = socket;

      const onUsersList = (list) => setUsers(list);
      const onMessage = (msg) => {
        setMessages((prev) => [...prev, msg]);
        if (audioRef.current && msg.userId !== socket.id) {
          audioRef.current.play().catch((e) => console.warn("Звук заблокирован", e));
        }
      };
      const onUserTyping = ({ userId, isTyping }) =>
        setTypingUsers((prev) => ({ ...prev, [userId]: isTyping }));
      const onRoleTaken = (data) => {
        setLoginError(data.message);
        setStep("login");
        hasJoined.current = false;
        resetSocket();
        localStorage.removeItem("chatRole");
        localStorage.removeItem("chatName");
        localStorage.removeItem("chatPassword");
      };
      const onMessageHistory = (history) => setMessages(history);

      socket.on("messageHistory", onMessageHistory);
      socket.on("usersList", onUsersList);
      socket.on("message", onMessage);
      socket.on("userTyping", onUserTyping);
      socket.on("roleTaken", onRoleTaken);

      if (!hasJoined.current) {
        socket.emit("userJoin", { role, name: name || role });
        hasJoined.current = true;
      }

      return () => {
        socket.off("messageHistory", onMessageHistory);
        socket.off("usersList", onUsersList);
        socket.off("message", onMessage);
        socket.off("userTyping", onUserTyping);
        socket.off("roleTaken", onRoleTaken);
      };
    }
  }, [step, role, name]);

  // === Обработчики ===
  const handleLogin = (e) => {
    e.preventDefault();
    setPasswordError("");
    setLoginError("");
    if (!role) return;
    const expectedPassword = ROLE_PASSWORDS[role];
    if (password !== expectedPassword) {
      setPasswordError(`Неверный пароль для роли "${role}"`);
      return;
    }
    localStorage.setItem("chatRole", role);
    if (name) localStorage.setItem("chatName", name);
    localStorage.setItem("chatPassword", password);
    setStep("chat");
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && socketRef.current) {
      socketRef.current.emit("chatMessage", { message: inputMessage });
      setInputMessage("");
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socketRef.current.emit("typing", { isTyping: false });
    }
  };

  const sendFile = useCallback(async () => {
    if (!selectedFile || !socketRef.current) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const res = await fetch("/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      socketRef.current.emit("chatFile", {
        name: data.name,
        type: data.type,
        url: data.url,
      });
      setSelectedFile(null);
      setFilePreview("");
    } catch (err) {
      console.error("Ошибка загрузки файла:", err);
    }
  }, [selectedFile]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview("");
      }
    }
  };

  const cancelFile = () => {
    setSelectedFile(null);
    setFilePreview("");
  };

  const handleTyping = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit("typing", { isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("typing", { isTyping: false });
    }, 1000);
  }, []);

  const handleLogout = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    resetSocket();
    localStorage.removeItem("chatRole");
    localStorage.removeItem("chatName");
    localStorage.removeItem("chatPassword");
    setStep("login");
    setMessages([]);
    setUsers([]);
    setTypingUsers({});
    hasJoined.current = false;
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  // === Рендер ===
  if (step === "loading") return <LoadingScreen />;

  if (step === "login") {
    return (
      <LoginForm
        role={role}
        setRole={setRole}
        name={name}
        setName={setName}
        password={password}
        setPassword={setPassword}
        passwordError={passwordError}
        loginError={loginError}
        handleLogin={handleLogin}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      <Sidebar
        users={users}
        typingUsers={typingUsers}
        handleLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          role={role}
          toggleMobileMenu={toggleMobileMenu}
          handleLogout={handleLogout}
        />

        <MessageList messages={messages} />

        <ChatInput
          selectedFile={selectedFile}
          filePreview={filePreview}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleFileChange={handleFileChange}
          cancelFile={cancelFile}
          handleTyping={handleTyping}
          sendMessage={sendMessage}
          sendFile={sendFile}
        />
      </div>

      <MobileSidebar
        mobileMenuOpen={mobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        users={users}
        typingUsers={typingUsers}
        handleLogout={handleLogout}
      />
    </div>
  );
}

export default App;