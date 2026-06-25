import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  SearchCheck,
  Upload,
  GraduationCap,
  Map,
  Camera,
  History,
  Users,
  BarChart3,
} from 'lucide-react'

const studentItems = [
  { icon: BookOpen,        label: 'Khóa học',   id: 'courses' },
  { icon: Map,             label: 'Lộ trình',   id: 'lotrinh' },
  { icon: SearchCheck,     label: 'Dò bài',     id: 'dobai'   },
  { icon: ClipboardList,   label: 'Kiểm tra',   id: 'exam'    },
  { icon: Camera,          label: 'Chấm bài',   id: 'chambai' },
  { icon: History,         label: 'Lịch sử',    id: 'lichsu'  },
  { icon: LayoutDashboard, label: 'Thống kê',   id: 'stats'   },
  { icon: Upload,          label: 'Upload',     id: 'upload'  },
]

const adminItems = [
  { icon: Users,           label: 'Người dùng', id: 'admin'   },
  { icon: BookOpen,        label: 'Khóa học',   id: 'courses' },
  { icon: Upload,          label: 'Upload',     id: 'upload'  },
  { icon: BarChart3,       label: 'Thống kê',   id: 'adminstats' },
]

export default function Sidebar({ active, setActive, vaiTro }) {
  const isAdmin = vaiTro === 'admin'
  const items = isAdmin ? adminItems : studentItems

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-slate-100 flex flex-col py-6 flex-shrink-0">
      <div className="flex items-center gap-3 px-5 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isAdmin ? 'bg-amber-500 shadow-amber-200' : 'bg-blue-600 shadow-blue-200'}`}>
          <GraduationCap size={20} className="text-white" strokeWidth={2} />
        </div>
        <div>
          <span className={`font-bold text-lg tracking-tight ${isAdmin ? 'text-amber-600' : 'text-blue-600'}`}>AI Tutor</span>
          <p className="text-slate-400 text-[11px] leading-none mt-0.5">Học tập thông minh</p>
        </div>
      </div>

      {isAdmin && (
        <div className="mx-5 mb-6 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-amber-700 text-[11px] font-semibold text-center">Quản trị viên</p>
        </div>
      )}

      <nav className="flex flex-col gap-1 flex-1 px-3">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          const accentColor = isAdmin ? 'amber' : 'blue'
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? `bg-${accentColor}-500 text-white shadow-md shadow-${accentColor}-200`
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              style={isActive ? {
                backgroundColor: isAdmin ? '#f59e0b' : '#2563eb',
                boxShadow: isAdmin ? '0 4px 6px -1px rgba(245,158,11,0.3)' : '0 4px 6px -1px rgba(37,99,235,0.3)',
              } : {}}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-1 h-6 rounded-r-full"
                  style={{ backgroundColor: isAdmin ? '#f59e0b' : '#2563eb' }}
                />
              )}
              <Icon
                size={18}
                strokeWidth={isActive ? 2.2 : 1.8}
                className={isActive ? 'text-white' : 'text-slate-400'}
              />
              {item.label}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}