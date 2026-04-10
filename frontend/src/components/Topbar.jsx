export default function Topbar({ user, onLogout }) {
  return (
    <header className="h-14 bg-[#0f0b2a] border-b border-white/5 flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 w-72">
        <span className="text-slate-400 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Tìm kiếm..."
          className="bg-transparent text-sm text-white placeholder-slate-500 outline-none flex-1"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button className="relative w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors">
          🔔
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
        </button>

        {/* User info */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600
            flex items-center justify-center text-white font-semibold text-sm">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-white text-xs font-medium leading-none">{user?.full_name}</p>
            <p className="text-slate-500 text-xs mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5
            hover:bg-red-500/10 hover:text-red-400 text-slate-400 text-xs font-medium
            border border-white/5 hover:border-red-500/20 transition-all"
          title="Đăng xuất"
        >
          ⏻ Đăng xuất
        </button>
      </div>
    </header>
  )
}
