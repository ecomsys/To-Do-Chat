import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ROLE_COLORS } from "../constants";

export default function MobileSidebar({
  mobileMenuOpen,
  toggleMobileMenu,
  users,
  typingUsers,
  handleLogout,
}) {
  return (
    <Sheet open={mobileMenuOpen} onOpenChange={toggleMobileMenu}>
      <SheetContent side="left" className="bg-slate-800 border-slate-700 p-0">
        <SheetHeader className="p-4 border-b border-slate-700">
          <SheetTitle className="text-white">Участники</SheetTitle>
          {/* Добавьте строку ниже — она будет невидима, но удовлетворит требование Radix */}
          <SheetDescription className="sr-only">
            Список участников и их статус печати
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
              <div>
                <div className="text-sm text-white">
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
