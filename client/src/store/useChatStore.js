import { create } from "zustand";
import { getSocket, resetSocket } from "../socket";
import { ROLE_PASSWORDS } from "../constants";

const useChatStore = create((set, get) => ({
  // --- State ---
  step: "loading",
  role: "",
  name: "",
  password: "",
  passwordError: "",
  loginError: "",
  messages: [],
  inputMessage: "",
  users: [],
  typingUsers: {},
  selectedFile: null,
  filePreview: "",
  mobileMenuOpen: false,
  uploadingFile: false,

  // --- Refs (хранятся как обычные свойства стора) ---
  socket: null,
  typingTimeout: null,
  hasJoined: false,
  audio: null,

  // --- Инициализация приложения (звук + сессия) ---
  initApp: () => {
    // Звук
    const audio = new Audio("/sounds/iphone.mp3");
    audio.volume = 0.3;
    set({ audio });

    // Сессия из localStorage
    const savedRole = localStorage.getItem("chatRole");
    const savedName = localStorage.getItem("chatName");
    const savedPassword = localStorage.getItem("chatPassword");
    if (savedRole && savedPassword) {
      set({
        role: savedRole,
        name: savedName || "",
        password: savedPassword,
        step: "chat",
      });
    } else {
      set({ step: "login" });
    }
  },

  // --- Авторизация ---
  setRole: (role) => set({ role }),
  setName: (name) => set({ name }),
  setPassword: (password) => set({ password }),

  handleLogin: (e) => {
    e.preventDefault();
    const { role, password } = get();
    set({ passwordError: "", loginError: "" });
    if (!role) return;
    const expectedPassword = ROLE_PASSWORDS[role];
    if (password !== expectedPassword) {
      set({ passwordError: `Неверный пароль для роли "${role}"` });
      return;
    }
    localStorage.setItem("chatRole", role);
    if (get().name) localStorage.setItem("chatName", get().name);
    localStorage.setItem("chatPassword", password);
    set({ step: "chat" });
  },

  // --- Сокеты ---
  connectSocket: () => {
    const { step, role, name, socket, hasJoined } = get();
    if (step !== "chat") return;

    if (socket) {
      socket.disconnect();
    }
    resetSocket();
    const newSocket = getSocket();
    set({ socket: newSocket });

    const onUsersList = (list) => set({ users: list });
    const onMessage = (msg) => {
      set((state) => ({ messages: [...state.messages, msg] }));
      const currentAudio = get().audio;
      if (currentAudio && msg.userId !== newSocket.id) {
        currentAudio.play().catch((e) => console.warn("Звук заблокирован", e));
      }
    };
    const onUserTyping = ({ userId, isTyping }) =>
      set((state) => ({
        typingUsers: { ...state.typingUsers, [userId]: isTyping },
      }));
    const onRoleTaken = (data) => {
      set({ loginError: data.message, step: "login", hasJoined: false });
      resetSocket();
      localStorage.removeItem("chatRole");
      localStorage.removeItem("chatName");
      localStorage.removeItem("chatPassword");
    };
    const onMessageHistory = (history) => set({ messages: history });

    const onMessageDeleted = ({ messageId }) => {
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== messageId),
      }));
    };

    newSocket.on("messageHistory", onMessageHistory);
    newSocket.on("usersList", onUsersList);
    newSocket.on("message", onMessage);
    newSocket.on("userTyping", onUserTyping);
    newSocket.on("roleTaken", onRoleTaken);
    newSocket.on("messageDeleted", onMessageDeleted);

    if (!hasJoined) {
      newSocket.emit("userJoin", { role, name: name || role });
      set({ hasJoined: true });
    }

    // Функция очистки (будет вызываться в useEffect)
    return () => {
      newSocket.off("messageHistory", onMessageHistory);
      newSocket.off("usersList", onUsersList);
      newSocket.off("message", onMessage);
      newSocket.off("userTyping", onUserTyping);
      newSocket.off("roleTaken", onRoleTaken);
      newSocket.off("messageDeleted", onMessageDeleted);
    };
  },

  // --- Чат ---
  setInputMessage: (msg) => set({ inputMessage: msg }),

  sendMessage: (e) => {
    e.preventDefault();
    const { inputMessage, socket, typingTimeout } = get();
    if (inputMessage.trim() && socket) {
      socket.emit("chatMessage", { message: inputMessage });
      set({ inputMessage: "" });
      if (typingTimeout) clearTimeout(typingTimeout);
      socket.emit("typing", { isTyping: false });
    }
  },

  clearChat: () => {
    if (!window.confirm("Очистить весь чат? Это действие нельзя отменить."))
      return;
    const { socket } = get();
    if (socket) socket.emit("clearChat");
  },

  deleteMessage: (messageId) => {
    const { socket } = get();
    if (socket) socket.emit("deleteMessage", { messageId });
  },

  handleTyping: () => {
    const { socket, typingTimeout } = get();
    if (!socket) return;
    socket.emit("typing", { isTyping: true });
    if (typingTimeout) clearTimeout(typingTimeout);
    const newTimeout = setTimeout(() => {
      get().socket?.emit("typing", { isTyping: false });
    }, 1000);
    set({ typingTimeout: newTimeout });
  },

  // --- Файлы ---
  handleFileChange: (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () =>
          set({ selectedFile: file, filePreview: reader.result });
        reader.readAsDataURL(file);
      } else {
        set({ selectedFile: file, filePreview: "" });
      }
    }
  },

  cancelFile: () => set({ selectedFile: null, filePreview: "" }),

  sendFile: async () => {
    const { selectedFile, socket } = get();
    if (!selectedFile || !socket) return;
    set({ uploadingFile: true });
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const res = await fetch("/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      socket.emit("chatFile", {
        name: data.name,
        type: data.type,
        url: data.url,
      });
      set({ selectedFile: null, filePreview: "" });
    } catch (err) {
      console.error("Ошибка загрузки файла:", err);
      alert("Не удалось загрузить файл");
    } finally {
      set({ uploadingFile: false });
    }
  },

  clearUploads: async () => {
    if (
      !window.confirm(
        "Удалить ВСЕ загруженные файлы? Ссылки в старых сообщениях перестанут работать.",
      )
    )
      return;

    const { role, password } = get();
    try {
      const res = await fetch("/clear-uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, password }),
      });

      const text = await res.text();
      if (!res.ok) {
        let errorMsg = `Ошибка ${res.status}`;
        try {
          const data = JSON.parse(text);
          errorMsg = data.error || errorMsg;
        } catch {
          // err
        }
        throw new Error(errorMsg);
      }
      const data = JSON.parse(text);
      alert(`Очищено файлов: ${data.deleted}`);
    } catch (err) {
      console.error("Ошибка clearUploads:", err);
      alert("Ошибка: " + err.message);
    }
  },

  // --- UI и Выход ---
  toggleMobileMenu: () =>
    set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

  handleLogout: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
    resetSocket();
    localStorage.removeItem("chatRole");
    localStorage.removeItem("chatName");
    localStorage.removeItem("chatPassword");
    set({
      step: "login",
      messages: [],
      users: [],
      typingUsers: {},
      hasJoined: false,
      mobileMenuOpen: false,
    });
  },
}));

export default useChatStore;
