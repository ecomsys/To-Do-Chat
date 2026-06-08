import { create } from "zustand";
import { getSocket, resetSocket } from "../socket";

const useChatStore = create((set, get) => ({
  step: "loading",
  role: "",
  name: "",
  password: "", // Возвращаем password для формы
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

  socket: null,
  typingTimeout: null,
  hasJoined: false,
  audio: null,

  initApp: async () => {
    const audio = new Audio("/sounds/iphone.mp3");
    audio.volume = 0.3;
    set({ audio });

    try {
      // Новый путь + credentials
      const res = await fetch("/api/auth/me", { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        set({ role: data.role, name: data.name, step: "chat" });
      } else {
        set({ step: "login" });
      }
    } catch {
      set({ step: "login" });
    }
  },

  setRole: (role) => set({ role }),
  setName: (name) => set({ name }),
  setPassword: (password) => set({ password }), // Возвращаем сеттер
  
  handleLogin: async (e) => {
    e.preventDefault();
    const { role, name, password } = get(); // Берем пароль из стора
    
    set({ passwordError: "", loginError: "" });
    if (!role) return;

    try {
      // Новый путь + credentials
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, password, name }),
        credentials: 'include' 
      });

      const data = await res.json();
      if (!res.ok) {
        set({ passwordError: data.error || "Ошибка входа" });
        return;
      }
      
      // Очищаем пароль из памяти после успешного входа
      set({ role: data.role, name: data.name, password: "", step: "chat" });
    } catch (err) {
      console.log(err);
      set({ loginError: "Сервер недоступен" });
    }
  },

  connectSocket: () => {
    const { step, socket, hasJoined } = get();
    if (step !== "chat") return;

    if (socket) socket.disconnect();
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
      set((state) => ({ typingUsers: { ...state.typingUsers, [userId]: isTyping } }));
    const onRoleTaken = (data) => {
      set({ loginError: data.message, step: "login", hasJoined: false });
      resetSocket();
    };
    const onMessageHistory = (history) => set({ messages: history });
    const onMessageDeleted = ({ messageId }) =>
      set((state) => ({ messages: state.messages.filter((m) => m.id !== messageId) }));

    newSocket.on("messageHistory", onMessageHistory);
    newSocket.on("usersList", onUsersList);
    newSocket.on("message", onMessage);
    newSocket.on("userTyping", onUserTyping);
    newSocket.on("roleTaken", onRoleTaken);
    newSocket.on("messageDeleted", onMessageDeleted);

    if (!hasJoined) {
      newSocket.emit("userJoin");
      set({ hasJoined: true });
    }

    return () => {
      newSocket.off("messageHistory", onMessageHistory);
      newSocket.off("usersList", onUsersList);
      newSocket.off("message", onMessage);
      newSocket.off("userTyping", onUserTyping);
      newSocket.off("roleTaken", onRoleTaken);
      newSocket.off("messageDeleted", onMessageDeleted);
    };
  },

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
    if (!window.confirm("Очистить весь чат?")) return;
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
    const newTimeout = setTimeout(() => get().socket?.emit("typing", { isTyping: false }), 1000);
    set({ typingTimeout: newTimeout });
  },

  handleFileChange: (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => set({ selectedFile: file, filePreview: reader.result });
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
      // Новый путь + credentials
      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
        credentials: 'include' 
      });
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      socket.emit("chatFile", { name: data.name, type: data.type, url: data.url });
      set({ selectedFile: null, filePreview: "" });
    } catch (err) {
      console.log(err);
      alert("Не удалось загрузить файл");
    } finally {
      set({ uploadingFile: false });
    }
  },

  clearUploads: async () => {
    if (!window.confirm("Удалить ВСЕ загруженные файлы?")) return;
    try {
      // Новый путь + credentials
      const res = await fetch("/api/files/clear-uploads", {
        method: "POST",
        credentials: 'include' 
      });
      if (!res.ok) throw new Error("Ошибка очистки");
      const data = await res.json();
      alert(`Очищено файлов: ${data.deleted}`);
    } catch (err) {
      alert("Ошибка: " + err.message);
    }
  },

  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

  handleLogout: async () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
    resetSocket();
    
    // Новый путь + credentials
    await fetch("/api/auth/logout", { method: "POST", credentials: 'include' });
    
    set({ step: "login", messages: [], users: [], typingUsers: {}, hasJoined: false, mobileMenuOpen: false, role: "", name: "", password: "" });
  },
}));

export default useChatStore;