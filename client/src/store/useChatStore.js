import { create } from "zustand";
import { getSocket, resetSocket } from "../socket";
import { CALL_TIMEOUT_MS } from "../constants";

// Глобальные переменные для WebRTC (не в стейте, чтобы не вызывать лишние рендеры)
let peerConnection = null;
let localStream = null;
let iceCandidatesQueue = [];
let callTimeoutId = null;

const useChatStore = create((set, get) => ({
  callState: "idle", // 'idle' | 'offering' | 'ringing' | 'active'
  callPartner: null, // { id, name, role }
  remoteStream: null,
  isRemoteVideoOff: true,
  isAudioOff: false,
  isVideoOff: false,
  callType: null, // 'audio' | 'video'
  callStartTime: null, // Timestamp начала разговора
  incomingCall: null,

  iceServers: null,

  availableRoles: [], // Роли для формы логина
  adminRoles: [], // Роли для админки

  replyingTo: null,

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

  // --- Видео звонки ---
  makeCall: async (targetUser, startWithVideo = true) => {
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
        alert("Не удалось получить доступ к камере или микрофону");
        get().endCall();
        return;
      }
    }

    try {
      const { iceServers } = get();
      if (!iceServers) {
        alert("Ошибка подключения к серверу обхода NAT");
        get().endCall();
        return;
      }
      peerConnection = new RTCPeerConnection({ iceServers });

      localStream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, localStream));

      peerConnection.ontrack = (event) => {
        const stream = event.streams[0];
        // Проверяем, есть ли видеодорожка в потоке собеседника
        const hasRemoteVideo = stream.getVideoTracks().length > 0;
        set({
          remoteStream: stream,
          isRemoteVideoOff: !hasRemoteVideo, // <--- ОБНОВЛЯЕМ СТЕЙТ
        });
      };
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          get().socket.emit("ice-candidate", {
            targetSocketId: targetUser.id,
            candidate: event.candidate,
          });
        }
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

      // ЗАПУСКАЕМ ТАЙМЕР АВТОСБРОСА
      callTimeoutId = setTimeout(() => {
        console.log("Таймаут: звонок отменен, нет ответа");
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

  answerCall: async () => {
    const { socket, incomingCall, iceServers } = get();
    if (!incomingCall) return;

    // Определяем тип звонка из входящих данных (если сервер его передал)
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
      clearTimeout(callTimeoutId); // ОТМЕНЯЕМ ТАЙМЕР

      // 1. Создаем PeerConnection только при ответе!      
      if (!iceServers) {
        alert("Ошибка подключения к серверу обхода NAT");
        get().endCall();
        return;
      }
      peerConnection = new RTCPeerConnection({ iceServers });

      localStream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, localStream));

      peerConnection.ontrack = (event) => {
        const stream = event.streams[0];
        // Проверяем, есть ли видеодорожка в потоке собеседника
        const hasRemoteVideo = stream.getVideoTracks().length > 0;
        set({
          remoteStream: stream,
          isRemoteVideoOff: !hasRemoteVideo, // <--- ОБНОВЛЯЕМ СТЕЙТ
        });
      };
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            targetSocketId: incomingCall.from,
            candidate: event.candidate,
          });
        }
      };

      // 2. Применяем Offer от звонящего
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer),
      );

      // 3. Выгружаем всех кандидатов из очереди и применяем
      while (iceCandidatesQueue.length) {
        const candidate = iceCandidatesQueue.shift();
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Ошибка добавления ICE из очереди", e);
        }
      }

      // 4. Создаем и отправляем Answer
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

  rejectCall: () => {
    const { socket, incomingCall } = get();
    clearTimeout(callTimeoutId);
    if (incomingCall) {
      socket.emit("end-call", { targetSocketId: incomingCall.from });
    }
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    iceCandidatesQueue = []; // Очищаем очередь
    set({
      incomingCall: null,
      callState: "idle",
      isRemoteVideoOff: true,
      callType: null,
      callStartTime: null,
    });
  },

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
    if (socket && callPartner) {
      socket.emit("end-call", { targetSocketId: callPartner.id });
    }

    iceCandidatesQueue = []; // Очищаем очередь
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

  toggleAudio: () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        set({ isAudioOff: !audioTrack.enabled });
      }
    }
  },

  toggleVideo: () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        set({ isVideoOff: !videoTrack.enabled });
      }
    }
  },

  setRole: (role) => set({ role }),
  setName: (name) => set({ name }),
  setPassword: (password) => set({ password }),

  setReplyingTo: (msg) => set({ replyingTo: msg }),
  clearReplyingTo: () => set({ replyingTo: null }),

  setLoginError: (error) => set({ loginError: error }),
  setPasswordError: (error) => set({ passwordError: error }),

  initApp: async () => {
    const audio = new Audio("/sounds/iphone.mp3");
    audio.volume = 0.3;
    set({ audio });

    get().fetchRoles();

    try {
      // Новый путь + credentials
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        set({ role: data.role, name: data.name, step: "chat" });

        // === ЗАГРУЗКА TURN КЛЮЧЕЙ ===
        try {
          const turnRes = await fetch("/api/turn-credentials", {
            credentials: "include",
          });
          if (turnRes.ok) {
            const turnData = await turnRes.json();
            set({ iceServers: turnData.iceServers }); // Сохраняем в стор
          }
        } catch (e) {
          console.error("Не удалось загрузить TURN ключи", e);
        }
        // ============================
      } else {
        set({ step: "login" });
      }
    } catch {
      set({ step: "login" });
    }
  },

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
        credentials: "include",
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
      if (socket) {
        socket.disconnect();
        set({ socket: null });
      }
      resetSocket();

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // ВАЖНО: СНАЧАЛА обновляем список ролей, ПОТОМ показываем форму!
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

    const onRolesUpdated = () => {
      get().fetchRoles(); // Если кто-то изменил роли, пока мы в чате — обновляем список на фоне
    };

    // Внутри connectSocket:
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

    // Если получили Answer
    const onCallAnswered = async ({ answer }) => {
      clearTimeout(callTimeoutId); // Отменяем таймаут при ответе

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

    // Умная обработка ICE кандидатов (с буферизацией)
    const onIceCandidate = async ({ candidate }) => {
      if (!candidate) return;

      // Если PC уже создан И у него есть RemoteDescription - применяем сразу
      if (peerConnection && peerConnection.remoteDescription) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding ICE candidate", e);
        }
      } else {
        // Иначе (PC нет или нет RemoteDesc) - кидаем в очередь ожидания
        iceCandidatesQueue.push(candidate);
      }
    };

    const onCallEnded = () => {
      get().endCall();
    };

    newSocket.on("incoming-call", onIncomingCall);
    newSocket.on("call-answered", onCallAnswered);
    newSocket.on("ice-candidate", onIceCandidate);
    newSocket.on("call-ended", onCallEnded);

    newSocket.on("rolesUpdated", onRolesUpdated);
    newSocket.on("roleDeleted", onRoleDeleted);
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
      newSocket.off("incoming-call", onIncomingCall);
      newSocket.off("call-answered", onCallAnswered);
      newSocket.off("ice-candidate", onIceCandidate);
      newSocket.off("call-ended", onCallEnded);

      newSocket.off("messageHistory", onMessageHistory);
      newSocket.off("usersList", onUsersList);
      newSocket.off("message", onMessage);
      newSocket.off("userTyping", onUserTyping);
      newSocket.off("roleTaken", onRoleTaken);
      newSocket.off("messageDeleted", onMessageDeleted);
      newSocket.off("roleDeleted", onRoleDeleted);
      newSocket.off("rolesUpdated", onRolesUpdated);
    };
  },

  setInputMessage: (msg) => set({ inputMessage: msg }),

  sendMessage: (e) => {
    e.preventDefault();
    const { inputMessage, socket, typingTimeout, replyingTo } = get();
    if (inputMessage.trim() && socket) {
      // Формируем объект цитаты (сохраняем только нужное)
      const replyData = replyingTo
        ? {
            id: replyingTo.id,
            name: replyingTo.name,
            snippet:
              replyingTo.type === "file"
                ? `📎 ${replyingTo.fileName}`
                : replyingTo.message.substring(0, 50), // Берем первые 50 символов
          }
        : null;

      socket.emit("chatMessage", { message: inputMessage, replyTo: replyData });

      // Очищаем поле ввода и цитату
      set({ inputMessage: "", replyingTo: null });
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
    const newTimeout = setTimeout(
      () => get().socket?.emit("typing", { isTyping: false }),
      1000,
    );
    set({ typingTimeout: newTimeout });
  },

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

      set({ selectedFile: null, filePreview: "", replyingTo: null }); // Очищаем цитату
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
        credentials: "include",
      });
      if (!res.ok) throw new Error("Ошибка очистки");
      const data = await res.json();
      alert(`Очищено файлов: ${data.deleted}`);
    } catch (err) {
      alert("Ошибка: " + err.message);
    }
  },

  toggleMobileMenu: () =>
    set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

  handleLogout: async () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
    resetSocket();

    // Новый путь + credentials
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

  // --- Загрузка ролей для формы логина ---
  fetchRoles: async () => {
    try {
      const res = await fetch("/api/roles/public");
      if (res.ok) {
        const data = await res.json();
        // Достаем просто массив строк с названиями ролей
        set({ availableRoles: data.map((r) => r.role) });
      }
    } catch (err) {
      console.error("Не удалось загрузить роли", err);
    }
  },

  // --- Загрузка ролей для админки ---
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
}));

export default useChatStore;
