import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ROLE_COLORS } from "../constants";

export default function Sidebar({ users, typingUsers, handleLogout }) {
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
        <CardContent className="flex-1 overflow-y-auto space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex items-start gap-2">
              <Avatar
                className="w-6 h-6"
                style={{ backgroundColor: ROLE_COLORS[user.role] }}
              >
                <AvatarFallback className="text-xs">
                  {user.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 truncate">
                <div className="text-sm text-white truncate">
                  {user.name}{" "}
                  <span className="text-slate-400 text-xs">({user.role})</span>
                </div>
                {typingUsers[user.id] && (
                  <div className="text-xs text-blue-400 animate-pulse">
                    печатает...
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
