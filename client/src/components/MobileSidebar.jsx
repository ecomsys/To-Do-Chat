import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getRoleColor } from "../constants";
import useChatStore from "../store/useChatStore";

export default function MobileSidebar({
  mobileMenuOpen,
  toggleMobileMenu,
  users,
  typingUsers,
  handleLogout,
}) {
  const messages = useChatStore((state) => state.messages);

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={toggleMobileMenu}>
      <SheetContent side="left" className="bg-slate-800 border-slate-700 p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-slate-700">
          <SheetTitle className="text-white">Участники</SheetTitle>
          <SheetDescription className="sr-only">
            Список участников и их статус печати
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll">
          {users.map((user) => {
            // ИСПРАВЛЕНО: Ищем по role
            const lastMsg = [...messages].reverse().find((m) => m.role === user.role);
            let lastMsgText = "";
            if (lastMsg) {
              lastMsgText = lastMsg.type === "file" ? `📎 ${lastMsg.fileName}` : lastMsg.message;
            }

            return (
              <div key={user.id} className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback 
                    className="text-xs text-white"
                    style={{ backgroundColor: getRoleColor(user.role) }}                    
                  >
                    {user.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">
                    {user.name}{" "}
                    <span className="text-slate-400 text-xs">({user.role})</span>
                  </div>
                  {typingUsers[user.id] ? (
                    <div className="text-xs text-blue-400 animate-pulse">
                      печатает...
                    </div>
                  ) : (
                    lastMsgText && (
                      <div className="text-xs text-slate-500 truncate">
                        {lastMsgText}
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-slate-700">
          <Button
            variant="destructive"
            onClick={() => {
              handleLogout();
              toggleMobileMenu();
            }}
            className="w-full"
          >
            Выйти
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}