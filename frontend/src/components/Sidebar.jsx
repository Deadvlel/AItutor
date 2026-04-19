import { useState } from 'react'

const navItems = [
  { icon: '▦', label: 'Thống kê', id: 'stats' },
  { icon: '▤', label: 'Khóa học', id: 'courses' },
  { icon: '▥', label: 'Kiểm tra', id: 'exam' },
  { icon: '◈', label: 'Lộ trình', id: 'roadmap' },
]

export default function Sidebar({ active, setActive }) {
  return (
    <aside className="w-56 min-h-screen bg-[#0f0b2a] flex flex-col py-6 px-3 border-r border-white/5 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 mb-10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center font-bold text-[#1a1040] text-sm">
          AI
        </div>
        <span className="text-white font-semibold text-lg tracking-tight">Tutor</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActive(item.id)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
              ${active === item.id
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Settings */}
      <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all">
        <span className="text-base">⚙</span>
        Cài đặt
      </button>
    </aside>
  )
}
