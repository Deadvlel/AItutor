export default function Topbar() {
  return (
    <header className="h-14 bg-[#0f0b2a] border-b border-white/5 flex items-center px-6 gap-4 flex-shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 w-72">
        <span className="text-slate-400 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Tìm kiếm..."
          className="bg-transparent text-sm text-white placeholder-slate-500 outline-none flex-1"
        />
      </div>

      <div className="ml-auto flex items-center gap-4">
        {/* Bell */}
        <button className="relative w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors">
          🔔
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
        </button>
        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white font-semibold text-sm">
          B
        </div>
      </div>
    </header>
  )
}
