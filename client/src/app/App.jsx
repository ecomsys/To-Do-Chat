import { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import useChatStore from "@/stores/useChatStore";

import LoadingScreen from "@/components/LoadingScreen";
import LoginForm from "@/pages/LoginFormPage";
import ChatPage from "@/pages/ChatPage";
import AdminPanel from "@/pages/AdminPanelPage";
import { AuthGuard, AdminGuard } from "@/components/ProtectedRoute";


import { Toaster } from "sonner";
import Modal from "@/components/Modal";

function App() {
  const step = useChatStore((state) => state.step);
  const initApp = useChatStore((state) => state.initApp);
  const connectSocket = useChatStore((state) => state.connectSocket);
  const location = useLocation();
  const navigate = useNavigate();

  // Инициализация приложения
  useEffect(() => {
    initApp();
  }, [initApp]);


  // Подключение сокетов, когда шаг меняется на 'chat'
  useEffect(() => {
    if (step === "chat") {
      const cleanup = connectSocket();
      return cleanup;
    }
  }, [step, connectSocket]);

  // Редирект на логин, если сессия протухла (пока мы не на /login)
  useEffect(() => {
    if (step === "login" && location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }
  }, [step, location.pathname, navigate]);

  if (step === "loading") return <LoadingScreen />;

  return (
    <div className="h-[100dvh] bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden">
      {/* Фоновый узор */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10 z-0"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, #cbd5e1 0rem, #cbd5e1 0.0625rem, transparent 0.0625rem, transparent 1.5rem)`,
        }}
      />

      <div className="h-full max-w-6xl px-3 sm:px-8 mx-auto z-10 relative flex">
        <Routes>
          {/* Роут Логина */}
          <Route
            path="/login"
            element={
              step === "chat" ? <Navigate to="/" replace /> : <LoginForm />
            }
          />

          {/* Роут Админки (Защищен ролью Программиста) */}
          <Route
            path="/admin"
            element={
              <AdminGuard>
                <AdminPanel />
              </AdminGuard>
            }
          />

          {/* Главный роут Чата (Защищен авторизацией) */}
          <Route
            path="/"
            element={
              <AuthGuard>
                <ChatPage />
              </AuthGuard>
            }
          />

          {/* Если URL кривой — кидаем на главную */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Toaster richColors position="bottom-left" theme="dark" />
        <Modal />
      </div>
    </div>
  );
}

export default App;
