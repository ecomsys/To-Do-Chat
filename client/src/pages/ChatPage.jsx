import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import ChatHeader from "@/components/ChatHeader";
import MessageList from "@/components/MessageList";
import ChatInput from "@/components/ChatInput";
import useChatStore from "../store/useChatStore";
import { PROGRAMMER_ROLE } from "../constants";

export default function ChatPage() {
  const role = useChatStore((state) => state.role);
  const isProgrammer = role === PROGRAMMER_ROLE;
  
  // Достаем всё остальное, что раньше передавалось из App
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
    <div className="flex h-full border border-slate-700 z-10 relative w-full">
      <Sidebar users={users} typingUsers={typingUsers} handleLogout={handleLogout} />
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
  );
}