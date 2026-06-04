import FilePreview from "./FilePreview";

function ChatInput({
  selectedFile,
  filePreview,
  inputMessage,
  setInputMessage,
  handleFileChange,
  cancelFile,
  handleTyping,
  sendMessage,
  sendFile,
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
      <div className="flex gap-2">
        <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-full active:scale-95 transition">
          📎
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => {
            setInputMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Введите сообщение..."
          className="flex-1 px-3 py-2 sm:px-4 sm:py-2 rounded-full bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
        />
        <button
          type="submit"
          className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition active:scale-95 text-sm sm:text-base"
        >
          Отправить
        </button>
      </div>
    </form>
  );
}

export default ChatInput;