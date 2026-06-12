import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import ChatHeader from "@/components/ChatHeader";
import MessageList from "@/components/MessageList";
import ChatInput from "@/components/ChatInput";
import useChatStore from "../stores/useChatStore";
import { PROGRAMMER_ROLE } from "../constants";

import VideoCallModal from "@/components/VideoCallModal";
import { useKeyboard } from "../hooks/useKeyboard";

import { cn } from "@/lib/utils";

export default function ChatPage() {
  const { keyboardHeight, isKeyboardOpen } = useKeyboard();

  const role = useChatStore((state) => state.role);
  const isProgrammer = role === PROGRAMMER_ROLE;

  const users = useChatStore((state) => state.users);
  const typingUsers = useChatStore((state) => state.typingUsers);
  const messages = useChatStore((state) => state.messages);
  const inputMessage = useChatStore((state) => state.inputMessage);
  const selectedFile = useChatStore((state) => state.selectedFile);
  const filePreview = useChatStore((state) => state.filePreview);
  const uploadingFile = useChatStore((state) => state.uploadingFile);
  const mobileMenuOpen = useChatStore((state) => state.mobileMenuOpen);

  const setInputMessage = useChatStore((state) => state.setInputMessage);
  const handleFileChange = useChatStore((state) => state.handleFileChange);
  const cancelFile = useChatStore((state) => state.cancelFile);
  const handleTyping = useChatStore((state) => state.handleTyping);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const sendFile = useChatStore((state) => state.sendFile);
  const clearChat = useChatStore((state) => state.clearChat);
  const clearUploads = useChatStore((state) => state.clearUploads);
  const handleLogout = useChatStore((state) => state.handleLogout);
  const toggleMobileMenu = useChatStore((state) => state.toggleMobileMenu);

  return (
    <div className="flex border-r border-l border-slate-700 z-10 relative">
      <Sidebar
        users={users}
        typingUsers={typingUsers}
        handleLogout={handleLogout}
        className="hidden sm:flex flex-col w-50 lg:w-64"
      />

      {/* ГЛАВНЫЙ КОНТЕЙНЕР ЧАТА */}
      <div className="flex flex-col h-[100dvh] w-full">
        <ChatHeader
          role={role}
          isProgrammer={isProgrammer}
          clearChat={clearChat}
          clearUploads={clearUploads}
          toggleMobileMenu={toggleMobileMenu}
          handleLogout={handleLogout}
          className="p-3 sm:p-4"
        />

        <MessageList
          messages={messages}
          className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scroll p-4 space-y-4"
        />

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
          className={cn("mt-auto pt-3 pb-7 px-3 sm:px-4 sm:pt-4")}
          style={{
            paddingBottom: isKeyboardOpen ? `2rem` : "0rem",
          }}
        />
      </div>

      <MobileSidebar
        mobileMenuOpen={mobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        users={users}
        typingUsers={typingUsers}
        handleLogout={handleLogout}
      />
      <VideoCallModal />
    </div>
  );
}
