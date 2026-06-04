import { ROLE_COLORS } from "../constants";

function Sidebar({ users, typingUsers, handleLogout }) {
  return (
    <div className="hidden sm:flex sm:w-64 bg-slate-800 p-4 flex-col border-r border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Участники</h2>
        <button
          onClick={handleLogout}
          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm"
        >
          Выйти
        </button>
      </div>
      <div className="space-y-2 overflow-y-auto">
        {users.map((user) => (
          <div key={user.id} className="flex flex-col gap-0">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: ROLE_COLORS[user.role] }}
              />
              <span className="text-slate-200 text-sm truncate">
                {user.name}{" "}
                <span className="text-slate-400">({user.role})</span>
              </span>
            </div>
            {typingUsers[user.id] && (
              <span className="text-xs text-blue-400 ml-5 animate-pulse">
                печатает...
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;