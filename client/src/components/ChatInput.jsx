import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FilePreview from "./FilePreview";

// Импортируем иконки из Lucide
import { Paperclip, Send, Loader2 } from "lucide-react";

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
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedFile) sendFile();
    else sendMessage(e);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 sm:p-4 bg-slate-800 border-t border-slate-700"
    >
      <FilePreview
        selectedFile={selectedFile}
        filePreview={filePreview}
        cancelFile={cancelFile}
      />
      <div className="flex gap-2 items-center">
        {/* Кнопка прикрепления файла */}
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
        <input
          id="fileInput"
          type="file"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploadingFile}
        />

        {/* Поле ввода */}
        <Input
          value={inputMessage}
          onChange={(e) => {
            setInputMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Введите сообщение..."
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
              <span className="hidden sm:inline">Отправить</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
