import { useRef, useEffect } from "react";
import MessageItem from "./MessageItem";

function MessageList({ messages }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
      {messages.map((msg, idx) => (
        <MessageItem key={msg.id || idx} msg={msg} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;