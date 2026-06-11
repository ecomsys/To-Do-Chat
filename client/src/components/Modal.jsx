import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useModalStore from "@/stores/useModalStore";
import { cn } from "@/lib/utils";
import { X } from "lucide-react"; // Твоя библиотека иконок

export default function Modal({ className, closeOnBackdropClick = true }) {
  const { isOpen, content, onClose, closeModal, blockUntil } = useModalStore();  
  const [isBlocked, setIsBlocked] = useState(false);
  const timerRef = useRef(null);

  // Эффект для обновления блокировки
  useEffect(() => {
    if (!isOpen || !blockUntil) {
      queueMicrotask(() => {
        setIsBlocked(false);
      });
      return;
    }

    const update = () => {
      const now = Date.now();
      const blocked = now < blockUntil;      
      setIsBlocked(blocked);
      
      if (!blocked && timerRef.current) {
        clearInterval(timerRef.current);
      }
    };

    update();
    timerRef.current = setInterval(update, 200);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, blockUntil]);

  const handleClose = () => {
    if (isBlocked) return;
    if (onClose) onClose();
    closeModal();
  };

  const handleBackdropClick = () => {
    if (closeOnBackdropClick && !isBlocked) handleClose();
  };

  // Блокировка скролла тела документа
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Бэкдроп */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60" // Добавил легкий блюр фона
            onClick={handleBackdropClick}
          />
          
          {/* Контейнер модалки */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            // На мобилке снизу, на десктопе по центру
            className="fixed inset-x-0 bottom-0 z-50 flex items-end justify-center pointer-events-none sm:inset-0 sm:items-center"
          >
            <div
              className={cn(
                "relative pointer-events-auto w-full",
                "bg-slate-900 border-slate-700", // Цвета твоей темы
                "rounded-t-2xl sm:rounded-2xl", // Скругления
                "border-t-2 border-blue-500 sm:border", // Синяя полоска сверху на мобилке (как в Telegram)
                "shadow-2xl",
                "max-w-lg", // Ограничиваем ширину на десктопе, чтобы не растягивалась
                className,
              )}
            >
              {/* Кнопка закрытия */}
              <button
                onClick={handleClose}
                disabled={isBlocked}
                className={cn(
                  "absolute right-3 top-3 sm:right-4 sm:top-4 z-10 p-1 rounded-full transition-colors",
                  isBlocked 
                    ? "text-slate-600 cursor-not-allowed" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                <X className="w-5 h-5" />
              </button>

              {/* Полоска-хваталка сверху на мобилке (чисто визуал) */}
              <div className="flex justify-center pt-3 sm:hidden">
                 <div className="w-10 h-1 bg-slate-600 rounded-full"></div>
              </div>

              {/* Контент */}
              <div className="max-h-[85vh] sm:max-h-[90vh] overflow-y-auto custom-scroll p-6 pt-2 sm:p-6">
                {content}              
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}