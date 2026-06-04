import { ROLE_COLORS } from "../constants";

function MobileSidebar({
  mobileMenuOpen,
  toggleMobileMenu,
  users,
  typingUsers,
  handleLogout,
}) {
  if (!mobileMenuOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 sm:hidden"
        onClick={toggleMobileMenu}
      />
      <div className="fixed top-0 left-0 bottom-0 w-64 bg-slate-800 p-4 flex flex-col z-50 shadow-xl transform transition-transform duration-200 sm:hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Участники</h2>
          <button
            onClick={toggleMobileMenu}
            className="text-slate-400 hover:text-white text-xl"
          >
            ✕
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
        <button
          onClick={() => {
            handleLogout();
            toggleMobileMenu();
          }}
          className="mt-4 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
        >
          Выйти
        </button>
      </div>
    </>
  );
}

export default MobileSidebar;