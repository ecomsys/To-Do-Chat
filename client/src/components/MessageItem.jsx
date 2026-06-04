import { ROLE_COLORS } from "../constants";

function MessageItem({ msg }) {
  const renderContent = () => {
    if (msg.type === "file") {
      const isImage = msg.fileType?.startsWith("image/");
      const fileName = msg.fileName;

      return (
        <div className="flex flex-col gap-1 my-2">
          {isImage ? (
            <img
              src={msg.fileUrl}
              alt={fileName}
              className="object-cover max-w-[14rem] sm:max-w-xs rounded-lg border border-black/50 bg-black/15"
            />
          ) : (
            <a
              href={msg.fileUrl}
              download={fileName}
              className="text-blue-400 underline flex items-center gap-2 break-all"
            >
              📎 {fileName}
            </a>
          )}
          <span className="text-xs text-slate-400">{fileName}</span>
        </div>
      );
    }
    return <p className="text-slate-300 break-words">{msg.message}</p>;
  };

  return (
    <div className="flex items-start gap-2 sm:gap-3">
      <div
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0"
        style={{ backgroundColor: ROLE_COLORS[msg.role] }}
      >
        {msg.name?.[0] || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-semibold text-white text-sm sm:text-base">
            {msg.name}
          </span>
          <span className="text-xs text-slate-400">
            {new Date(msg.timestamp).toLocaleTimeString()}
          </span>
          <span
            className="text-xs px-1 rounded"
            style={{ color: ROLE_COLORS[msg.role] }}
          >
            {msg.role}
          </span>
        </div>
        {renderContent()}
      </div>
    </div>
  );
}

export default MessageItem;