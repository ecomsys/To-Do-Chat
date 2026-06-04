function ChatHeader({
  role,
  toggleMobileMenu,
  handleLogout,
  isProgrammer,
  clearChat,
  clearUploads,
}) {
  return (
    <div className="bg-slate-800 p-3 sm:p-4 border-b border-slate-700 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMobileMenu}
          className="sm:hidden text-white p-2 rounded-lg bg-slate-700 active:bg-slate-600"
        >
          ☰
        </button>
        <div className="flex flex-col leading-tight">
          <h1 className="text-lg sm:text-xl font-bold text-white truncate">
            Совместный To‑Do
          </h1>
          <span className="text-xs text-slate-400 hidden sm:block">
            Роль: {role}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isProgrammer && (
          <>
            <button
              onClick={clearChat}
              title="Очистить чат"
              className="px-2 py-1 sm:px-3 sm:py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs sm:text-sm flex items-center gap-1 transition active:scale-95"
            >
              🗑️ <span className="hidden sm:inline">Очистить чат</span>
            </button>
            <button
              onClick={clearUploads}
              title="Очистить загруженные файлы"
              className="px-2 py-1 sm:px-3 sm:py-1.5 bg-orange-700 hover:bg-orange-800 text-white rounded-lg text-xs sm:text-sm flex items-center gap-1 transition active:scale-95"
            >
              📁 <span className="hidden sm:inline">Очистить файлы</span>
            </button>
          </>
        )}

        <button
          onClick={handleLogout}
          className="sm:hidden px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}

export default ChatHeader;