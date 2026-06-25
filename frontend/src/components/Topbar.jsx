import { Search, Bell, LogOut, Check, User } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}

export default function Topbar({ user, onLogout, onNavigate }) {
  const [showMenu, setShowMenu] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [thongBaos, setThongBaos] = useState([])
  const [chuaDoc, setChuaDoc] = useState(0)
  const menuRef = useRef(null)
  const notifRef = useRef(null)

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .slice(-2)
    .join('')
    .toUpperCase() || 'U'

  useEffect(() => {
    fetch(`${API_URL}/api/thong-bao`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setThongBaos(data.thong_baos || [])
          setChuaDoc(data.chua_doc || 0)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleDocHet = () => {
    fetch(`${API_URL}/api/thong-bao/doc-het`, {
      method: 'PUT',
      headers: authHeaders(),
    }).then(() => {
      setChuaDoc(0)
      setThongBaos(prev => prev.map(tb => ({ ...tb, da_doc: true })))
    }).catch(() => {})
  }

  const thoiGianFormat = (isoStr) => {
    if (!isoStr) return ''
    const d = new Date(isoStr)
    const now = new Date()
    const diff = Math.floor((now - d) / 1000 / 60)
    if (diff < 1) return 'Vừa xong'
    if (diff < 60) return `${diff} phút trước`
    if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`
    return `${Math.floor(diff / 1440)} ngày trước`
  }

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-6 gap-4 flex-shrink-0">
      <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 w-80 transition-all focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-sm">
        <Search size={16} className="text-slate-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Tìm kiếm bài học..."
          className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none flex-1"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Bell size={18} strokeWidth={1.8} />
            {chuaDoc > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 rounded-full bg-red-500 ring-2 ring-white flex items-center justify-center text-white text-[10px] font-bold px-1">
                {chuaDoc > 9 ? '9+' : chuaDoc}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-12 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 w-80 animate-scaleIn z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <p className="text-slate-800 text-sm font-bold">Thông báo</p>
                {chuaDoc > 0 && (
                  <button
                    onClick={handleDocHet}
                    className="flex items-center gap-1 text-blue-600 text-xs font-medium hover:text-blue-700"
                  >
                    <Check size={12} />
                    Đọc hết
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {thongBaos.length > 0 ? (
                  thongBaos.map(tb => (
                    <div
                      key={tb.id}
                      className={`px-4 py-3 border-b border-slate-50 last:border-0 ${!tb.da_doc ? 'bg-blue-50/50' : ''}`}
                    >
                      <p className={`text-sm font-semibold ${!tb.da_doc ? 'text-slate-800' : 'text-slate-500'}`}>
                        {tb.tieu_de}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{tb.noi_dung}</p>
                      <p className="text-xs text-slate-300 mt-1">{thoiGianFormat(tb.ngay_tao)}</p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-slate-400 text-sm">
                    Chưa có thông báo
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-200 transition-all"
          >
            {initials}
          </button>

          {showMenu && (
            <div className="absolute right-0 top-12 bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 py-2 w-48 animate-scaleIn z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-slate-800 text-sm font-semibold truncate">{user?.full_name}</p>
                <p className="text-slate-400 text-xs truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { onNavigate?.('profile'); setShowMenu(false) }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <User size={15} strokeWidth={2} />
                Tài khoản
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} strokeWidth={2} />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}