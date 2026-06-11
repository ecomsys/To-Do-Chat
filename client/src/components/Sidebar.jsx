import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getRoleColor } from "../constants";
import useChatStore from "../store/useChatStore";
import { UserCallDropdown } from "./ui/dropdown-sidebar-call";

export default function Sidebar({ users, typingUsers, handleLogout }) {
  const messages = useChatStore((state) => state.messages);
  const currentSocketId = useChatStore((state) => state.socket?.id);
  const makeCall = useChatStore((state) => state.makeCall);
  const currentRole = useChatStore((state) => state.role);

  return (
    <div className="hidden sm:flex w-50 lg:w-64 flex-col bg-slate-800 border-r border-slate-700">
      <Card className="bg-transparent border-0 shadow-none rounded-none flex-1 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex justify-between items-center">
            Участники
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
              className="rounded-full"
            >
              Выйти
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-3 custom-scroll">
          {users.map((user) => {
            const lastMsg = [...messages]
              .reverse()
              .find((m) => m.role === user.role);
            let lastMsgText = "";
            if (lastMsg) {
              lastMsgText =
                lastMsg.type === "file"
                  ? `📎 ${lastMsg.fileName}`
                  : lastMsg.message;
            }

            // ЗВОНИТЬ МОЖЕТ ТОЛЬКО ПРОГРАММИСТ, И ТОЛЬКО НЕ СЕБЕ
            const canCall = currentRole === "Программист" && user.id !== currentSocketId;

            return (
              <div key={user.id} className="flex items-center gap-2.5 group">
                <Avatar className="w-8 h-8">
                  <AvatarFallback
                    className="text-xs text-white"
                    style={{ backgroundColor: getRoleColor(user.role) }}
                  >
                    {user.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white truncate">
                    {user.name}{" "}
                    <span className="text-slate-400">({user.role})</span>
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

                {/* ИСПОЛЬЗУЕМ КОМПОНЕНТ С ТАЙМЕРОМ */}
                {canCall && (
                  <UserCallDropdown
                    user={user}
                    makeCall={makeCall}
                    visible={true}
                  />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
