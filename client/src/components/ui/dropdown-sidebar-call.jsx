import { Phone, MoreVertical, Video } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserCallDropdown({
  user,
  makeCall,
  visible = false,
  mobileMenuOpen,
  toggleMobileMenu = () => {
    console.log("Its now empty)");
  },
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            visible ? "" : "opacity-0 group-hover:opacity-100 ",
            "p-1 text-slate-500 transition-opacity focus:outline-none shrink-0",
          )}
          title="Позвонить"
        >
          <Phone className="w-4 h-4 text-white/60 hover:text-white" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-max">
        <DropdownMenuItem
          onClick={() => {
            makeCall(user, false);
            if (mobileMenuOpen) toggleMobileMenu();
          }}
        >
          <Phone className="w-4 h-4 mr-2" /> Аудиозвонок
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            makeCall(user, true);
            if (mobileMenuOpen) toggleMobileMenu();
          }}
        >
          <Video className="w-4 h-4 mr-2" /> Видеозвонок
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
