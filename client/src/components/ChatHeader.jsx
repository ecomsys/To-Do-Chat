function ChatHeader({ role, toggleMobileMenu, handleLogout }) {
  return (
    <div className="bg-slate-800 p-3 sm:p-4 border-b border-slate-700 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMobileMenu}
          className="sm:hidden text-white p-2 rounded-lg bg-slate-700 active:bg-slate-600"
        >
          ☰
        </button>
        <h1 className="text-lg sm:text-xl font-bold text-white truncate">
          Чат: {role}
        </h1>
      </div>
      <button
        onClick={handleLogout}
        className="sm:hidden px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
      >
        Выйти
      </button>
    </div>
  );
}

export default ChatHeader;