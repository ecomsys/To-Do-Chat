import { Navigate } from "react-router-dom";
import useChatStore from "../stores/useChatStore";
import { PROGRAMMER_ROLE } from "../constants";
import LoadingScreen from "./LoadingScreen";

// Guard для проверки авторизации (нужен для чата)
export function AuthGuard({ children }) {
  const step = useChatStore((state) => state.step);
  
  if (step === "loading") return <LoadingScreen />;
  if (step !== "chat") return <Navigate to="/login" replace />;
  
  return children;
}

// Guard для проверки роли Программиста (нужен для админки)
export function AdminGuard({ children }) {
  const step = useChatStore((state) => state.step);
  const role = useChatStore((state) => state.role);
  
  if (step === "loading") return <LoadingScreen />;
  if (step !== "chat" || role !== PROGRAMMER_ROLE) {
    // Если не программист — назад в чат
    return <Navigate to="/" replace />;
  }
  
  return children;
}