import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FilePreview from "./FilePreview";
import useChatStore from "@/stores/useChatStore";

// Импортируем иконки из Lucide
import { Paperclip, Send, Loader2, X, Pencil } from "lucide-react";

export default function ChatInput({
  selectedFile,
  filePreview,
  inputMessage,
  setInputMessage,
  handleFileChange,
  cancelFile,
  handleTyping,
  sendMessage,
  sendFile,
  uploadingFile,
  className,
  style,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedFile) sendFile();
    else sendMessage(e);

    // Убираем фокус с инпута, чтобы гарантированно закрыть клавиатуру
    if (document.activeElement) {
      document.activeElement.blur();
    }
  };

  const replyingTo = useChatStore((state) => state.replyingTo);
  const clearReplyingTo = useChatStore((state) => state.clearReplyingTo);

  const editingMessage = useChatStore((state) => state.editingMessage);
  const clearEditingMessage = useChatStore(
    (state) => state.clearEditingMessage,
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "bg-slate-800 border-t border-b border-slate-700 relative z-10 shrink-0",
        className,
      )}
      style={style}
    >
      {/* Плашка "Редактирование" */}
      {editingMessage && (
        <div className="flex items-center justify-between bg-blue-900/50 border border-blue-500 px-3 py-2 mb-3 rounded-lg">
          <div className="flex-1 min-w-0 border-l-2 border-blue-500 pl-2">
            <p className="text-xs font-semibold text-blue-400 flex items-center gap-1">
              <Pencil className="w-3 h-3" /> Редактирование
            </p>
            <p className="text-xs text-slate-400 truncate">
              {editingMessage.message}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearEditingMessage}
            className="shrink-0 ml-2 h-6 w-6 text-slate-400 hover:text-white hover:bg-transparent"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Плашка "Ответ для..." */}
      {replyingTo && (
        <div className="flex items-center justify-between bg-slate-700/50 border border-slate-600 px-3 py-2 mb-3 rounded-lg">
          <div className="flex-1 min-w-0 border-l-2 border-blue-500 pl-2">
            <p className="text-xs font-semibold text-blue-400">
              {replyingTo.name}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {replyingTo.type === "file"
                ? `📎 ${replyingTo.fileName}`
                : replyingTo.message}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearReplyingTo}
            className="shrink-0 ml-2 h-6 w-6 text-slate-400 hover:text-white hover:bg-transparent"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <FilePreview
        selectedFile={selectedFile}
        filePreview={filePreview}
        cancelFile={cancelFile}
      />
      <div className="flex gap-2 items-center">
        {/* Кнопка прикрепления файла */}
        {!editingMessage && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => document.getElementById("fileInput").click()}
            disabled={uploadingFile}
            className="shrink-0 h-10 w-10 rounded-full " // Чтобы кнопка не сжималась
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        )}
        <input
          id="fileInput"
          type="file"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploadingFile || !!editingMessage}
        />

        {/* Поле ввода */}
        <Input
          value={inputMessage}
          onChange={(e) => {
            setInputMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={(e) => {
            // Если нажат Enter и НЕ зажат Shift (Shift+Enter для переноса строки, если будешь делать textarea)
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault(); // Предотвращаем стандартный перевод строки или пик звука
              handleSubmit(e); // Отправляем форму
            }
          }}
          placeholder={
            editingMessage
              ? "Отредактируйте сообщение..."
              : "Введите сообщение..."
          }
          className="h-10 rounded-full flex-1 bg-slate-700 border-slate-600 text-white"
          disabled={uploadingFile}
        />
        {/* Кнопка отправки */}
        <Button
          type="submit"
          disabled={uploadingFile}
          className="h-10 rounded-full shrink-0 gap-1.5 text-green-500"
        >
          {uploadingFile ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />{" "}
              {/* Спиннер при загрузке */}
              <span className="hidden sm:inline">Загрузка...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> {/* Иконка отправки */}
              <span className="hidden sm:inline">
                {editingMessage ? "Сохранить" : "Отправить"}
              </span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
