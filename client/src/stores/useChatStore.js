import { create } from "zustand";
import { getSocket, resetSocket } from "../socket";
import { CALL_TIMEOUT_MS } from "../constants";
import { toast } from "sonner";

// ==========================================
// ВСПОМОГАТЕЛЬНАЯ ЛОГИКА (Вне стора)
// ==========================================

// --- Логика бейджа PWA и заголовка вкладки ---
let unreadCount = 0;
let activeNotification = null;

// === НОВОЕ: СИСТЕМНЫЕ УВЕДОМЛЕНИЯ (Фоллбэк для Linux) ===
const sendSystemNotification = (msg) => {
  // Проверяем, поддерживает ли браузер уведомления и дал ли юзер разрешение
  if (!("Notification" in window) || Notification.permission === "denied")
    return;

  if (Notification.permission === "granted") {
    createNotification(msg);
  } else if (Notification.permission !== "denied") {
    // Если разрешения еще нет, запрашиваем и сразу показываем
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") createNotification(msg);
    });
  }
};

const createNotification = (msg) => {
  const title = `Новое сообщение от ${msg.name}`;
  const options = {
    body: msg.type === "file" ? `📎 ${msg.fileName}` : msg.message,
    icon: "/android-chrome-192x192.png",
  };

  // Сохраняем уведомление в переменную
  activeNotification = new Notification(title, options);

  // По клику на уведомление открываем окно
  activeNotification.onclick = () => {
    window.focus();
    activeNotification.close(); // Закрываем при клике
    activeNotification = null;
  };
};
// ========================================================
const updateBadgeAndTitle = () => {
  if (unreadCount > 0) {
    if ("setAppBadge" in navigator)
      navigator.setAppBadge(unreadCount).catch(() => {});
    // Стандарт индустрии: (1) Название
    document.title = `(${unreadCount}) To-Do Chat`;
  } else {
    if ("clearAppBadge" in navigator) navigator.clearAppBadge().catch(() => {});
    // Возвращаем чистый заголовок без пробелов в начале
    document.title = "To-Do Chat";
  }
};

// Слушаем фокус окна, чтобы сбросить счетчик и убрать точку в Linux
let focusListenerAttached = false;
const attachFocusListener = () => {
  if (focusListenerAttached) return;
  window.addEventListener("focus", () => {
    unreadCount = 0;
    updateBadgeAndTitle();

    // === МАГИЯ LINUX: Явно закрываем уведомление ===
    if (activeNotification) {
      activeNotification.close();
      activeNotification = null;
    }
    // ==============================================
  });
  focusListenerAttached = true;
};

// --- Глобальные переменные для WebRTC ---
// Не в стейте, чтобы не вызывать лишние рендеры React при изменении потока
let peerConnection = null;
let localStream = null;
let iceCandidatesQueue = [];
let callTimeoutId = null;

// --- Настройка слушателей Socket.io ---
// Вынесено отдельно, чтобы метод connectSocket был чистым и читаемым
const setupSocketListeners = (newSocket, set, get) => {
  const onUsersList = (list) => set({ users: list });

  const onMessage = (msg) => {
    set((state) => ({ messages: [...state.messages, msg] }));
    const currentAudio = get().audio;
    if (currentAudio && msg.userId !== newSocket.id) {
      currentAudio.play().catch(() => {});
    }
    if (!document.hasFocus()) {
      unreadCount++;
      updateBadgeAndTitle(); // Меняем заголовок и бейдж (где возможно)

      // === ОТПРАВЛЯЕМ СИСТЕМНОЕ УВЕДОМЛЕНИЕ ===
      sendSystemNotification(msg);
      // ==============================================
    }
  };

  const onUserTyping = ({ userId, isTyping }) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [userId]: isTyping },
    }));

  const onRoleTaken = (data) => {
    set({ loginError: data.message, step: "login", hasJoined: false });
    resetSocket();
  };

  const onMessageHistory = (history) => set({ messages: history });

  const onMessageDeleted = ({ messageId }) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    }));

  const onRoleDeleted = async (data) => {
    if (newSocket) newSocket.disconnect();
    resetSocket();
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    await get().fetchRoles();
    set({
      step: "login",
      loginError: data.message || "Ваша роль была удалена",
      messages: [],
      users: [],
      typingUsers: {},
      hasJoined: false,
      mobileMenuOpen: false,
      role: "",
      name: "",
      password: "",
    });
  };

  const onRolesUpdated = () => get().fetchRoles();

  // --- Слушатели WebRTC ---
  const onIncomingCall = (data) => {
    if (get().callState !== "idle") {
      newSocket.emit("end-call", { targetSocketId: data.from });
      return;
    }
    set({
      incomingCall: data,
      callState: "ringing",
      callType: data.callType || "video",
      callPartner: {
        id: data.from,
        name: data.callerName,
        role: data.callerRole,
      },
    });
  };

  const onCallAnswered = async ({ answer }) => {
    clearTimeout(callTimeoutId);
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer),
        );
        set({ callState: "active", callStartTime: Date.now() });
      } catch (e) {
        console.error("Error setting remote desc on answer", e);
      }
    }
  };

  const onIceCandidate = async ({ candidate }) => {
    if (!candidate) return;
    if (peerConnection && peerConnection.remoteDescription) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("Error adding ICE candidate", e);
      }
    } else {
      iceCandidatesQueue.push(candidate);
    }
  };

  const onCallEnded = () => get().endCall();

  const onMessageEdited = (updatedMsg) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === updatedMsg.id ? updatedMsg : m,
      ),
    }));

  // Подключаем все события
  newSocket.on("incoming-call", onIncomingCall);
  newSocket.on("call-answered", onCallAnswered);
  newSocket.on("ice-candidate", onIceCandidate);
  newSocket.on("call-ended", onCallEnded);
  newSocket.on("rolesUpdated", onRolesUpdated);
  newSocket.on("roleDeleted", onRoleDeleted);
  newSocket.on("messageEdited", onMessageEdited);
  newSocket.on("messageHistory", onMessageHistory);
  newSocket.on("usersList", onUsersList);
  newSocket.on("message", onMessage);
  newSocket.on("userTyping", onUserTyping);
  newSocket.on("roleTaken", onRoleTaken);
  newSocket.on("messageDeleted", onMessageDeleted);

  // Возвращаем функцию очистки
  return () => {
    newSocket.off("incoming-call", onIncomingCall);
    newSocket.off("call-answered", onCallAnswered);
    newSocket.off("ice-candidate", onIceCandidate);
    newSocket.off("call-ended", onCallEnded);
    newSocket.off("rolesUpdated", onRolesUpdated);
    newSocket.off("roleDeleted", onRoleDeleted);
    newSocket.off("messageEdited", onMessageEdited);
    newSocket.off("messageHistory", onMessageHistory);
    newSocket.off("usersList", onUsersList);
    newSocket.off("message", onMessage);
    newSocket.off("userTyping", onUserTyping);
    newSocket.off("roleTaken", onRoleTaken);
    newSocket.off("messageDeleted", onMessageDeleted);
  };
};

// ==========================================
//  ОСНОВНОЙ СТОР
// ==========================================

const useChatStore = create((set, get) => ({
  // --- АВТОРИЗАЦИЯ И ПОЛЬЗОВАТЕЛЬ ---
  step: "loading",
  role: "",
  name: "",
  password: "",
  passwordError: "",
  loginError: "",

  /** Инициализация приложения (проверка сессии, звуки, ICE серверы) */
  initApp: async () => {
    const audio = new Audio("/sounds/iphone.mp3");
    audio.volume = 0.3;
    set({ audio });

    get().fetchRoles();

    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        set({ role: data.role, name: data.name, step: "chat" });

        try {
          const turnRes = await fetch("/api/turn-credentials", {
            credentials: "include",
          });
          if (turnRes.ok) {
            const turnData = await turnRes.json();
            set({ iceServers: turnData.iceServers });
          }
        } catch (e) {
          console.error("Не удалось загрузить TURN ключи", e);
        }
      } else {
        set({ step: "login" });
      }
    } catch {
      set({ step: "login" });
    }
  },

  /** Обработка формы входа */
  handleLogin: async (e) => {
    e.preventDefault();
    const { role, name, password } = get();
    set({ passwordError: "", loginError: "" });
    if (!role) return;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, password, name }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        set({ passwordError: data.error || "Ошибка входа" });
        return;
      }
      set({ role: data.role, name: data.name, password: "", step: "chat" });
    } catch (err) {
      console.log(err);
      set({ loginError: "Сервер недоступен" });
    }
  },

  /** Выход из аккаунта */
  handleLogout: async () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
    resetSocket();
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    get().endCall();
    set({
      step: "login",
      messages: [],
      users: [],
      typingUsers: {},
      hasJoined: false,
      mobileMenuOpen: false,
      role: "",
      name: "",
      password: "",
      replyingTo: null,
      callState: "idle",
      callPartner: null,
      incomingCall: null,
    });
  },

  // --- ЧАТ И СООБЩЕНИЯ ---
  messages: [],
  inputMessage: "",
  replyingTo: null,
  typingUsers: {},
  editingMessage: null,

  setEditingMessage: (msg) => set({ editingMessage: msg, replyingTo: null }),
  clearEditingMessage: () => set({ editingMessage: null }),

  /** Отправка текстового сообщения */
  sendMessage: (e) => {
    e.preventDefault();
    const { inputMessage, socket, typingTimeout, replyingTo, editingMessage } =
      get();

    // Если мы в режиме редактирования ===
    if (editingMessage) {
      socket.emit("editMessage", {
        messageId: editingMessage.id,
        newText: inputMessage.trim(),
      });
      set({ inputMessage: "", editingMessage: null });
      if (typingTimeout) clearTimeout(typingTimeout);
      socket.emit("typing", { isTyping: false });
      return;
    }

    if (inputMessage.trim() && socket) {
      const replyData = replyingTo
        ? {
            id: replyingTo.id,
            name: replyingTo.name,
            snippet:
              replyingTo.type === "file"
                ? `📎 ${replyingTo.fileName}`
                : replyingTo.message.substring(0, 50),
          }
        : null;

      socket.emit("chatMessage", { message: inputMessage, replyTo: replyData });
      set({ inputMessage: "", replyingTo: null });
      if (typingTimeout) clearTimeout(typingTimeout);
      socket.emit("typing", { isTyping: false });
    }
  },

  /** Очистка всей истории чата (только для Программиста) */
  clearChat: () => {
    const { socket } = get();
    if (socket) socket.emit("clearChat");
  },

  /** Удаление конкретного сообщения */
  deleteMessage: (messageId) => {
    const { socket } = get();
    if (socket) socket.emit("deleteMessage", { messageId });
  },

  /** Логика индикатора "Печатает..." */
  handleTyping: () => {
    const { socket, typingTimeout } = get();
    if (!socket) return;
    socket.emit("typing", { isTyping: true });
    if (typingTimeout) clearTimeout(typingTimeout);
    const newTimeout = setTimeout(
      () => get().socket?.emit("typing", { isTyping: false }),
      1000,
    );
    set({ typingTimeout: newTimeout });
  },

  // --- ФАЙЛЫ ---
  selectedFile: null,
  filePreview: "",
  uploadingFile: false,

  /** Обработка выбора файла */
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

  /** Отмена выбора файла */
  cancelFile: () => set({ selectedFile: null, filePreview: "" }),

  /** Отправка файла на сервер */
  sendFile: async () => {
    const { selectedFile, socket, replyingTo } = get();
    if (!selectedFile || !socket) return;
    set({ uploadingFile: true });
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();

      const replyData = replyingTo
        ? {
            id: replyingTo.id,
            name: replyingTo.name,
            snippet:
              replyingTo.type === "file"
                ? `📎 ${replyingTo.fileName}`
                : replyingTo.message.substring(0, 50),
          }
        : null;

      socket.emit("chatFile", {
        name: data.name,
        type: data.type,
        url: data.url,
        replyTo: replyData,
      });
      set({ selectedFile: null, filePreview: "", replyingTo: null });
    } catch (err) {
      console.log(err);
      toast.error("Не удалось загрузить файл");
    } finally {
      set({ uploadingFile: false });
    }
  },

  /** Очистка всех загруженных файлов на сервере (только для Программиста) */
  clearUploads: async () => {
    try {
      const res = await fetch("/api/files/clear-uploads", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Ошибка очистки");
      const data = await res.json();
      toast.success(`Очищено файлов: ${data.deleted}`);
    } catch (err) {
      toast.error("Ошибка: " + err.message);
    }
  },

  // --- ИНТЕРФЕЙС И РОЛИ ---
  mobileMenuOpen: false,
  users: [],
  availableRoles: [],
  adminRoles: [],

  toggleMobileMenu: () =>
    set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  setRole: (role) => set({ role }),
  setName: (name) => set({ name }),
  setPassword: (password) => set({ password }),
  setReplyingTo: (msg) => set({ replyingTo: msg }),
  clearReplyingTo: () => set({ replyingTo: null }),
  setLoginError: (error) => set({ loginError: error }),
  setPasswordError: (error) => set({ passwordError: error }),

  /** Загрузка списка ролей для формы логина */
  fetchRoles: async () => {
    try {
      const res = await fetch("/api/roles/public");
      if (res.ok) {
        const data = await res.json();
        set({ availableRoles: data.map((r) => r.role) });
      }
    } catch (err) {
      console.error("Не удалось загрузить роли", err);
    }
  },

  /** Загрузка ролей для панели администратора */
  fetchAdminRoles: async () => {
    try {
      const res = await fetch("/api/roles/admin", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        set({ adminRoles: data });
      }
    } catch (err) {
      console.error("Ошибка загрузки ролей", err);
    }
  },

  // --- ВИДЕОСВЯЗЬ (WEBRTC) ---
  callState: "idle", // 'idle' | 'offering' | 'ringing' | 'active'
  callPartner: null,
  remoteStream: null,
  isRemoteVideoOff: true,
  isAudioOff: false,
  isVideoOff: false,
  callType: null, // 'audio' | 'video'
  callStartTime: null,
  incomingCall: null,
  iceServers: null, // Динамические ICE серверы с бэкенда

  /** Инициация исходящего звонка */
  makeCall: async (targetUser, startWithVideo = true) => {
    // Получение доступа к медиа
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: startWithVideo,
      });
    } catch (err) {
      console.warn("Видео недоступно, пробуем только аудио:", err);
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
      } catch (audioErr) {
        console.error("Ошибка доступа к микрофону:", audioErr);
        toast.error("Не удалось получить доступ к камере или микрофону");
        get().endCall();
        return;
      }
    }

    try {
      const { iceServers } = get();
      if (!iceServers) {
        toast.error("Ошибка подключения к серверу обхода NAT");
        get().endCall();
        return;
      }

      peerConnection = new RTCPeerConnection({ iceServers });
      localStream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, localStream));

      peerConnection.ontrack = (event) => {
        const stream = event.streams[0];
        const hasRemoteVideo = stream.getVideoTracks().length > 0;
        set({ remoteStream: stream, isRemoteVideoOff: !hasRemoteVideo });
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate)
          get().socket.emit("ice-candidate", {
            targetSocketId: targetUser.id,
            candidate: event.candidate,
          });
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      set({
        callState: "offering",
        callPartner: targetUser,
        callType: startWithVideo ? "video" : "audio",
        isAudioOff: false,
        isVideoOff: !localStream.getVideoTracks().length,
        remoteStream: null,
        localStream: localStream,
        callStartTime: null,
      });

      callTimeoutId = setTimeout(() => {
        console.log("Таймаут: звонок отменен");
        get().endCall();
      }, CALL_TIMEOUT_MS);
      get().socket.emit("call-user", {
        targetSocketId: targetUser.id,
        offer,
        callType: startWithVideo ? "video" : "audio",
      });
    } catch (err) {
      console.error("Ошибка создания звонка:", err);
      get().endCall();
    }
  },

  /** Ответ на входящий звонок */
  answerCall: async () => {
    const { socket, incomingCall, iceServers } = get();
    if (!incomingCall) return;
    const currentCallType = incomingCall.callType || "video";

    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: currentCallType === "video",
      });
    } catch (err) {
      console.warn("Видео недоступно, пробуем только аудио:", err);
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
      } catch (audioErr) {
        console.error("Ошибка доступа к микрофону:", audioErr);
        get().endCall();
        return;
      }
    }

    try {
      clearTimeout(callTimeoutId);
      if (!iceServers) {
        toast.error("Ошибка подключения к серверу обхода NAT");
        get().endCall();
        return;
      }

      peerConnection = new RTCPeerConnection({ iceServers });
      localStream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, localStream));

      peerConnection.ontrack = (event) => {
        const stream = event.streams[0];
        const hasRemoteVideo = stream.getVideoTracks().length > 0;
        set({ remoteStream: stream, isRemoteVideoOff: !hasRemoteVideo });
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate)
          socket.emit("ice-candidate", {
            targetSocketId: incomingCall.from,
            candidate: event.candidate,
          });
      };

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer),
      );

      while (iceCandidatesQueue.length) {
        const candidate = iceCandidatesQueue.shift();
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Ошибка добавления ICE из очереди", e);
        }
      }

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("answer-call", { targetSocketId: incomingCall.from, answer });

      set({
        callState: "active",
        callType: currentCallType,
        callStartTime: Date.now(),
        isAudioOff: false,
        isVideoOff: !localStream.getVideoTracks().length,
        localStream: localStream,
        incomingCall: null,
      });
    } catch (err) {
      console.error("Ошибка ответа:", err);
      get().endCall();
    }
  },

  /** Отклонение входящего звонка */
  rejectCall: () => {
    const { socket, incomingCall } = get();
    clearTimeout(callTimeoutId);
    if (incomingCall)
      socket.emit("end-call", { targetSocketId: incomingCall.from });
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    iceCandidatesQueue = [];
    set({
      incomingCall: null,
      callState: "idle",
      isRemoteVideoOff: true,
      callType: null,
      callStartTime: null,
    });
  },

  /** Завершение активного звонка */
  endCall: () => {
    const { socket, callPartner } = get();
    clearTimeout(callTimeoutId);
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      localStream = null;
    }
    if (socket && callPartner)
      socket.emit("end-call", { targetSocketId: callPartner.id });
    iceCandidatesQueue = [];
    set({
      callState: "idle",
      callPartner: null,
      remoteStream: null,
      isAudioOff: false,
      isRemoteVideoOff: true,
      isVideoOff: false,
      localStream: null,
      callType: null,
      callStartTime: null,
    });
  },

  /** Управление микрофоном */
  toggleAudio: () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        set({ isAudioOff: !audioTrack.enabled });
      }
    }
  },

  /** Управление камерой */
  toggleVideo: () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        set({ isVideoOff: !videoTrack.enabled });
      }
    }
  },

  // --- СЕРВИСНЫЕ ПЕРЕМЕННЫЕ ---
  socket: null,
  typingTimeout: null,
  hasJoined: false,
  audio: null,
  setInputMessage: (msg) => set({ inputMessage: msg }),

  /** Подключение к Socket.io серверу */
  connectSocket: () => {
    const { step, socket, hasJoined } = get();
    if (step !== "chat") return;

    if (socket) socket.disconnect();
    resetSocket();

    const newSocket = getSocket();
    set({ socket: newSocket });

    // Делегируем подписку выделенной функции
    const cleanupListeners = setupSocketListeners(newSocket, set, get);

    if (!hasJoined) {
      newSocket.emit("userJoin");
      set({ hasJoined: true });
      attachFocusListener();
    }

    return cleanupListeners;
  },
}));

export default useChatStore;
