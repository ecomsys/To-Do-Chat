import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import MessageItem from "./MessageItem";
import { ArrowDown } from "lucide-react";
import useChatStore from "../stores/useChatStore";
import { motion, AnimatePresence } from "framer-motion"; // Импортируем framer-motion

function MessageList({ messages , className}) {
  const containerRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isNearBottomRef = useRef(true);
  const prevMsgCountRef = useRef(messages.length);

  const currentSocketId = useChatStore((state) => state.socket?.id);

  const scrollToBottom = (smooth = true) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    isNearBottomRef.current = nearBottom;

    if (nearBottom) {
      setShowScrollBtn(false);
      setUnreadCount(0);
    } else {
      setShowScrollBtn(true);
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (messages.length === 0) {
      prevMsgCountRef.current = 0;
      queueMicrotask(() => {
        setUnreadCount(0);
      });

      return;
    }

    if (messages.length > prevMsgCountRef.current + 1) {
      scrollToBottom(false);
      setUnreadCount(0);
    } else if (messages.length === prevMsgCountRef.current + 1) {
      const lastMsg = messages[messages.length - 1];
      const isMyMessage = lastMsg.userId === currentSocketId;

      if (isMyMessage) {
        scrollToBottom(true);
        queueMicrotask(() => {
          setUnreadCount(0);
        });
      } else {
        if (isNearBottomRef.current) {
          scrollToBottom(true);
        } else {
          setUnreadCount((prev) => prev + 1);
        }
      }
    }
    // Если сообщение удалили (длина массива уменьшилась), ничего не скроллим
    else if (messages.length < prevMsgCountRef.current) {
      // Просто обновляем счетчик
    }

    prevMsgCountRef.current = messages.length;
  }, [messages, currentSocketId]);

  return (
     <div className={cn("flex flex-col overflow-hidden relative bg-gradient-to-br from-slate-800 to-slate-900", className)}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
         className="flex-1 min-h-0 overflow-y-auto custom-scroll p-4 space-y-4"
      >
        {/* AnimatePresence включает анимацию удаления (exit) */}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }} // Начальное состояние: невидимый, снизу, чуть меньше
              animate={{ opacity: 1, y: 0, scale: 1 }} // К какому состоянию анимировать: видимым, на месте, нормальный размер
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }} // Анимация удаления: растворяется и чуть уменьшается
              transition={{ duration: 0.2, ease: "easeOut" }} // Настройки времени и плавности
            >
              <MessageItem msg={msg} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Кнопка скролла вниз со счетчиком */}
      <button
        onClick={() => scrollToBottom(true)}
        className={`
          absolute bottom-4 right-4 
          bg-slate-700 hover:bg-slate-600 text-white 
          p-2.5 rounded-full shadow-lg border border-slate-600
          
          transition-all duration-300 ease-in-out
          
          ${
            showScrollBtn
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-75 translate-y-4 pointer-events-none"
          }
        `}
        title="К последнему сообщению"
      >
        <ArrowDown className="w-5 h-5" />

        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md border-2 border-slate-800">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}

export default MessageList;
