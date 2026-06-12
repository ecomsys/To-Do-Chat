import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { modalServices } from "@/services/modalServices";


// Импортируем иконки
import {
  Menu,
  Trash2,
  FolderX,
  LogOut,
  Settings,
  Expand,
  Shrink,
  MoreVertical,
} from "lucide-react";

// Импортируем компоненты шадсин
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ChatHeader({
  role,
  isProgrammer,
  clearChat,
  clearUploads,
  toggleMobileMenu,
  handleLogout,
  className
}) {
  const navigate = useNavigate();  
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Слушаем изменение режима (если юзер нажмет Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Функция перехода в полный экран
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn("Ошибка Fullscreen API:", err);
    }
  };

  const handleClearChat = () => modalServices.handleClearChat(clearChat);
  const handleClearUploads = () => modalServices.handleClearUploads(clearUploads);
  const handleFuncLogout = () => modalServices.handleLogout(handleLogout);

  return (
    <div className={cn("flex justify-between items-center bg-slate-800 border-b border-t border-slate-700", className)}>
      {/* ЛЕВАЯ ЧАСТЬ: Меню + Логотип */}
      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          className="rounded-full sm:hidden bg-transparent hover:bg-transparent"
          size="icon" // Изменил на size="icon" для квадратных кнопок
          onClick={toggleMobileMenu}
        >
          <Menu className="h-5 w-5 text-white" />
        </Button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white">
            <span className="text-green-600">To Do</span>{" "}
            <span className="hidden sm:inline">чат</span>
          </h1>
          <span className="text-xs text-slate-400 hidden sm:block">
            Роль: {role}
          </span>
        </div>
      </div>

      {/* ПРАВАЯ ЧАСТЬ: Fullscreen + Dropdown */}
      <div className="flex items-center gap-1.5">
        {/* Кнопка Fullscreen (Всегда на виду, только иконка) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className="rounded-full text-slate-400 hover:text-white hover:bg-slate-700"
          title={isFullscreen ? "Выйти из полного экрана" : "На весь экран"}
        >
          {isFullscreen ? <Shrink /> : <Expand />}
        </Button>

        {/* Выпадающее меню для остальных действий */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            {isProgrammer && (
              <>
                <DropdownMenuItem
                  onClick={() => navigate("/admin")}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Админка ролей</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleClearChat}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Очистить чат</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleClearUploads}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <FolderX className="mr-2 h-4 w-4" />
                  <span>Очистить загрузки</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem
              onClick={handleFuncLogout}
              className="cursor-pointer text-red-500 focus:text-red-500"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Выйти</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
