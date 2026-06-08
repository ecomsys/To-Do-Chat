import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ROLE_COLORS } from "../constants";
import useChatStore from "../store/useChatStore";

export default function Sidebar({ users, typingUsers, handleLogout }) {
  const messages = useChatStore((state) => state.messages);

  return (
    <div className="hidden sm:flex sm:w-64 flex-col bg-slate-800 border-r border-slate-700">
      <Card className="bg-transparent border-0 shadow-none rounded-none flex-1 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex justify-between items-center">
            Участники
            <Button variant="destructive" size="sm" onClick={handleLogout} className="rounded-full">
              Выйти
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-3 custom-scroll">
          {users.map((user) => {
            // ИСПРАВЛЕНО: Ищем по role, а не по userId, так как socket.id меняется при реконнектах
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
                    style={{ backgroundColor: ROLE_COLORS[user.role] }}
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
        </CardContent>
      </Card>
    </div>
  );
}