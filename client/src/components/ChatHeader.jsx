import { Button } from "@/components/ui/button";

// Импортируем иконки из Lucide
import { Menu, Trash2, FolderX, LogOut } from "lucide-react";

export default function ChatHeader({
  role,
  isProgrammer,
  clearChat,
  clearUploads,
  toggleMobileMenu,
  handleLogout,
}) {
  return (
    <div className="bg-slate-800 p-3 sm:p-4 border-b border-slate-700 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Button
          className="rounded-full sm:hidden bg-transparent"
          size="icon"        
          onClick={toggleMobileMenu}
        >
          <Menu className="h-5 w-5 text-white" />
        </Button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white"><span className="text-green-600">To Do</span> чат</h1>
          <span className="text-xs text-slate-400 hidden sm:block">
            Роль: {role}
          </span>
        </div>
      </div>
      <div className="flex gap-2 ">
        {isProgrammer && (
          <>
            <Button
              variant="destructive"
              size="sm"
              onClick={clearChat}
              className="rounded-full gap-1.5" // Добавляем отступ между иконкой и текстом
            >
              <Trash2 className="h-4 w-4" />
              {/* На маленьких экранах можно скрыть текст, оставив только иконку, 
                  но пока оставим текст, так как кнопки не очень длинные */}
              <span className="hidden md:inline">Очистить</span> чат
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={clearUploads}
              className="rounded-full gap-1.5"
            >
              <FolderX className="h-4 w-4" />
              <span className="hidden md:inline">Очистить</span> файлы
            </Button>
          </>
        )}
        <Button
          variant="destructive"
          size="sm"
          className="rounded-full sm:hidden gap-1.5"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Выйти</span>
        </Button>
      </div>
    </div>
  );
}
