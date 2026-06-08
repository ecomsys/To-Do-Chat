import { useEffect } from "react";
import useChatStore from "../store/chatStore";

import LoadingScreen from "@/components/LoadingScreen";
import LoginForm from "@/components/LoginForm";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import ChatHeader from "@/components/ChatHeader";
import MessageList from "@/components/MessageList";
import ChatInput from "@/components/ChatInput";

import { PROGRAMMER_ROLE } from "../constants";

function App() {
  // Подписываемся на нужные переменные из стора
  const {
    step,
    role,
    name,
    password,
    passwordError,
    loginError,
    messages,
    inputMessage,
    users,
    typingUsers,
    selectedFile,
    filePreview,
    mobileMenuOpen,
    uploadingFile,

    // Функции
    initApp,
    connectSocket,
    setRole,
    setName,
    setPassword,
    handleLogin,
    setInputMessage,
    sendMessage,
    sendFile,
    handleFileChange,
    cancelFile,
    handleTyping,
    clearChat,
    clearUploads,
    handleLogout,
    toggleMobileMenu,
  } = useChatStore();

  // Вычисляем роль программиста прямо здесь!
  const isProgrammer = role === PROGRAMMER_ROLE;

  // Инициализация (звук + локалсторадж)
  useEffect(() => {
    initApp();
  }, [initApp]);

  // Подключение сокетов при входе в чат
  useEffect(() => {
    if (step === "chat") {
      const cleanup = connectSocket();
      return cleanup; // При размонтировании/смене шага сокеты отключатся
    }
  }, [step, connectSocket]);

  // === Рендер ===
  if (step === "loading") return <LoadingScreen />;

  if (step === "login") {
    return (
      <LoginForm
        role={role}
        setRole={setRole}
        name={name}
        setName={setName}
        password={password}
        setPassword={setPassword}
        passwordError={passwordError}
        loginError={loginError}
        handleLogin={handleLogin}
      />
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto flex min-h-screen border border-slate-700 ">
        <Sidebar
          users={users}
          typingUsers={typingUsers}
          handleLogout={handleLogout}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <ChatHeader
            role={role}
            isProgrammer={isProgrammer}
            clearChat={clearChat}
            clearUploads={clearUploads}
            toggleMobileMenu={toggleMobileMenu}
            handleLogout={handleLogout}
          />

          <MessageList messages={messages} />

          <ChatInput
            selectedFile={selectedFile}
            filePreview={filePreview}
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            handleFileChange={handleFileChange}
            cancelFile={cancelFile}
            handleTyping={handleTyping}
            sendMessage={sendMessage}
            sendFile={sendFile}
            uploadingFile={uploadingFile}
          />
        </div>

        <MobileSidebar
          mobileMenuOpen={mobileMenuOpen}
          toggleMobileMenu={toggleMobileMenu}
          users={users}
          typingUsers={typingUsers}
          handleLogout={handleLogout}
        />
      </div>
    </div>
  );
}

export default App;
