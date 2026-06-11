import { useEffect, useRef, useState } from "react";
import useChatStore from "../stores/useChatStore";
import {
  PhoneOff,
  MicOff,
  VideoOff,
  Mic,
  Video,
  Minimize2,
  Maximize2,
  Phone,
} from "lucide-react";
import { getRoleColor } from "../constants";

export default function VideoCallModal() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const ringtoneRef = useRef(null);
  const ringbackRef = useRef(null);
  const endCallRef = useRef(null);
  const hasBeenInCall = useRef(false);

  const [isMinimized, setIsMinimized] = useState(false);
  const [callDuration, setCallDuration] = useState("00:00");

  const callState = useChatStore((state) => state.callState);
  const callPartner = useChatStore((state) => state.callPartner);
  const localStream = useChatStore((state) => state.localStream);
  const remoteStream = useChatStore((state) => state.remoteStream);
  const isAudioOff = useChatStore((state) => state.isAudioOff);
  const isVideoOff = useChatStore((state) => state.isVideoOff);
  const isRemoteVideoOff = useChatStore((state) => state.isRemoteVideoOff);
  const callType = useChatStore((state) => state.callType);
  const callStartTime = useChatStore((state) => state.callStartTime);

  const endCall = useChatStore((state) => state.endCall);
  const answerCall = useChatStore((state) => state.answerCall);
  const rejectCall = useChatStore((state) => state.rejectCall);
  const toggleAudio = useChatStore((state) => state.toggleAudio);
  const toggleVideo = useChatStore((state) => state.toggleVideo);

  // === ЛОГИКА ТАЙМЕРА ===
  useEffect(() => {
    if (callState === "active" && callStartTime) {
      const interval = setInterval(() => {
        const diff = Math.floor((Date.now() - callStartTime) / 1000);
        const mins = String(Math.floor(diff / 60)).padStart(2, "0");
        const secs = String(diff % 60).padStart(2, "0");
        setCallDuration(`${mins}:${secs}`);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      queueMicrotask(() => {
        setCallDuration("00:00");
      });
    }
  }, [callState, callStartTime]);

  // === ЛОГИКА ЗВУКОВ ===
  useEffect(() => {
    if (!ringtoneRef.current) {
      ringtoneRef.current = new Audio("/sounds/ringtone.mp3");
      ringtoneRef.current.loop = true;
      ringtoneRef.current.volume = 0.5;
    }
    if (!ringbackRef.current) {
      ringbackRef.current = new Audio("/sounds/ringback.mp3");
      ringbackRef.current.loop = true;
      ringbackRef.current.volume = 0.4;
    }
    if (!endCallRef.current) {
      endCallRef.current = new Audio("/sounds/call-end.mp3");
      endCallRef.current.loop = false;
      endCallRef.current.volume = 0.6;
    }

    const ringtone = ringtoneRef.current;
    const ringback = ringbackRef.current;
    const endCallSound = endCallRef.current;

    if (callState === "ringing") {
      hasBeenInCall.current = true;
      ringback.pause();
      ringtone.currentTime = 0;
      ringtone.play().catch(() => {});
    } else if (callState === "offering") {
      hasBeenInCall.current = true;
      ringtone.pause();
      ringback.currentTime = 0;
      ringback.play().catch(() => {});
    } else if (callState === "active") {
      ringtone.pause();
      ringback.pause();
    } else if (callState === "idle") {
      ringtone.pause();
      ringback.pause();
      if (hasBeenInCall.current) {
        endCallSound.currentTime = 0;
        endCallSound.play().catch(() => {});
        hasBeenInCall.current = false;
      }
    }

    return () => {
      ringtone.pause();
      ringback.pause();
    };
  }, [callState]);

  // Привязка видео потоков
  useEffect(() => {
    if (localVideoRef.current && localStream)
      localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream)
      remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    if (callState === "idle")
      queueMicrotask(() => {
        setIsMinimized(false);
      });
  }, [callState]);

    // === ЗАКРЫВАЕМ МОБИЛЬНЫЙ САЙДБАР ПРИ ЗВОНКЕ ===
  useEffect(() => {
    // Если звонок активен (любое состояние, кроме idle), закрываем сайдбар
    if (callState !== "idle") {
      useChatStore.setState({ mobileMenuOpen: false });
    }
  }, [callState]);
  // ===============================================

  if (callState === "idle") return null;

  const isAudioCall = callType === "audio";

  return (
    <div className="fixed inset-0 bg-black z-100 flex flex-col items-center justify-center p-4">
      {/* 1. УДАЛЕННОЕ ВИДЕО - ВСЕГДА В DOM! При аудиозвонке прозрачное, чтобы играл звук */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={`absolute inset-0 w-full h-full object-cover z-0 ${isAudioCall ? "opacity-0" : ""}`}
      />

      {/* ЗАГЛУШКА: Если у СОБЕСЕДНИКА нет видео ИЛИ это аудиозвонок */}
      {(isRemoteVideoOff || isAudioCall) && callState === "active" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10 gap-4">
          <div
            className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center text-5xl text-white font-bold animate-pulse"
            style={{ backgroundColor: getRoleColor(callPartner?.role) }}
          >
            {callPartner?.name?.[0] || "?"}
          </div>
          <span className="text-white text-xl font-semibold">
            {callPartner?.name}
          </span>
        </div>
      )}

      {/* 2. ЛОКАЛЬНОЕ ВИДЕО (Ты) - При аудиозвонке просто скрываем окошко */}
      {!isAudioCall && (
        <div className="absolute bottom-6 left-6 w-40 h-28 md:w-56 md:h-40 rounded-xl border-2 border-white/30 shadow-2xl z-20 bg-slate-900 overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isVideoOff ? "opacity-0" : "opacity-100"}`}
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center">
              <VideoOff className="w-10 h-10 text-slate-500" />
            </div>
          )}
        </div>
      )}

      {/* 3. ЭКРАН ОЖИДАНИЯ (Гудки) */}
      {(callState === "ringing" || callState === "offering") && (
        <div className="relative z-30 flex flex-col items-center gap-6 bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700">
          {/* Аватарка при гудках */}
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-4xl text-white font-bold"
            style={{ backgroundColor: getRoleColor(callPartner?.role) }}
          >
            {callPartner?.name?.[0] || "?"}
          </div>

          <h2 className="text-white text-2xl font-bold text-center">
            {callState === "ringing" &&
              `Входящий ${isAudioCall ? "аудио" : "видео"}звонок`}
            {callState === "offering" && `Звоним ${callPartner?.name}...`}
          </h2>

          <div className="flex items-center gap-6">
            {callState === "ringing" ? (
              <>
                {/* КНОПКА ОТВЕТА - ЗЕЛЕНАЯ */}
                <button
                  onClick={answerCall}
                  className="bg-green-600 hover:bg-green-700 p-4 rounded-full text-white transition-colors"
                  title="Ответить"
                >
                  {isAudioCall ? (
                    <Phone className="w-6 h-6" />
                  ) : (
                    <Video className="w-6 h-6" />
                  )}
                </button>
                {/* КНОПКА СБРОСА - КРАСНАЯ */}
                <button
                  onClick={rejectCall}
                  className="bg-red-600 hover:bg-red-700 p-4 rounded-full text-white transition-colors"
                  title="Отклонить"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              </>
            ) : (
              <button
                onClick={endCall}
                className="bg-red-600 hover:bg-red-700 p-4 rounded-full text-white transition-colors animate-pulse"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. ПАНЕЛЬ УПРАВЛЕНИЯ (Активный звонок) */}
      {callState === "active" && (
        <div className="absolute top-4 right-4 z-30">
          {!isMinimized ? (
            <div className="bg-slate-900/90 backdrop-blur-md p-2.5 rounded-2xl border border-slate-700 shadow-xl flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3 px-2">
                <div className="flex flex-col">
                  <span
                    className="text-sm font-medium text-white"
                    style={{ color: getRoleColor(callPartner?.role) }}
                  >
                    {callPartner?.name}
                  </span>
                  {/* ТАЙМЕР */}
                  <span className="text-xs text-slate-400 font-mono">
                    {callDuration}
                  </span>
                </div>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
                  title="Свернуть"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAudio}
                  className={`p-3 rounded-xl text-white transition-colors ${isAudioOff ? "bg-red-600" : "bg-slate-700 hover:bg-slate-600"}`}
                  title={
                    isAudioOff ? "Включить микрофон" : "Выключить микрофон"
                  }
                >
                  {isAudioOff ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>

                {/* КНОПКА КАМЕРЫ - ТОЛЬКО ПРИ ВИДЕОЗВОНКЕ */}
                {!isAudioCall && (
                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-xl text-white transition-colors ${isVideoOff ? "bg-red-600" : "bg-slate-700 hover:bg-slate-600"}`}
                    title={isVideoOff ? "Включить камеру" : "Выключить камеру"}
                  >
                    {isVideoOff ? (
                      <VideoOff className="w-5 h-5" />
                    ) : (
                      <Video className="w-5 h-5" />
                    )}
                  </button>
                )}

                {/* КНОПКА ЗАВЕРШЕНИЯ - КРАСНАЯ */}
                <button
                  onClick={endCall}
                  className="bg-red-600 hover:bg-red-700 p-3 rounded-xl text-white transition-colors"
                  title="Завершить звонок"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-2">
              {/* Свернутый режим с таймером */}
              <div className="bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-sm font-mono shadow-lg border border-slate-700">
                {callDuration}
              </div>
              <button
                onClick={() => setIsMinimized(false)}
                className="p-2.5 rounded-xl bg-slate-800/80 backdrop-blur-md hover:bg-slate-700 text-white transition-colors shadow-lg border border-slate-700"
                title="Развернуть"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
              <button
                onClick={endCall}
                className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors shadow-lg"
                title="Завершить звонок"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
