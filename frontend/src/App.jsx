import { useState, useEffect } from 'react'
import { authService } from './services/authService'
import DangNhapPage from './pages/DangNhapPage'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import KhoaHocPage from './pages/KhoaHocPage'
import ThongKePage from './pages/ThongKePage'
import KiemTraPage from './pages/KiemTraPage'
import DoBaiPage from './pages/DoBaiPage'
import UploadBaiHocPage from './pages/UploadBaiHocPage'
import LoTrinhPage from './pages/LoTrinhPage'
import ChamBaiPage from './pages/ChamBaiPage'
import HoSoPage from './pages/HoSoPage'
import LichSuPage from './pages/LichSuPage'
import QuanTriPage from './pages/QuanTriPage'

export default function App() {
  const [user, setUser] = useState(() => authService.getUser())
  const [active, setActive] = useState({ page: 'courses', params: {} })
  const navigate = (page, params = {}) => setActive({ page, params })

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'token' && !e.newValue) setUser(null)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const handleLoginSuccess = (data) => {
    setUser({
      full_name: data.full_name,
      email: data.email,
      vai_tro: data.vai_tro || 'hoc_sinh',
    })
  }

  const handleLogout = () => {
    authService.logout()
    setUser(null)
  }

  const handleProfileUpdate = (data) => {
    setUser(prev => ({ ...prev, ...data }))
    authService.updateUser(data)
  }

  if (!user) {
    return <DangNhapPage onLoginSuccess={handleLoginSuccess} />
  }

  const pages = {
    courses: <KhoaHocPage
           params={active.params}
           onNavigateToDoBai={(bai) => navigate('dobai', { initialBai: bai })}/>,
    lotrinh: <LoTrinhPage    onNavigate={navigate} />,
    dobai: <DoBaiPage initialBai={active.params?.initialBai} />,
    exam: <KiemTraPage />,
    chambai: <ChamBaiPage />,
    lichsu: <LichSuPage />,
    stats: <ThongKePage />,
    upload: <UploadBaiHocPage />,
    profile: <HoSoPage onUpdate={handleProfileUpdate} />,
    admin: <QuanTriPage initialTab="users" />,
    adminstats: <QuanTriPage initialTab="stats" />,
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800">
      <Sidebar active={active.page} setActive={(p) => navigate(p)} vaiTro={user.vai_tro} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar user={user} onLogout={handleLogout} onNavigate={navigate} />
        <main className="flex-1 overflow-y-auto p-6">
          {pages[active.page]}
        </main>
      </div>
    </div>
  )
}