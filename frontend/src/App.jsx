import { useState } from 'react'
import { authService } from './services/authService'

import AuthPage from './pages/AuthPage'

import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import ChatBox from './components/ChatBox' 
import CoursesPage from './pages/CoursesPage'
import StatsPage from './pages/StatsPage'

function PlaceholderPage({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-4">
      <span className="text-6xl opacity-30"></span>
      <p className="text-slate-400 text-lg">{title} — đang phát triển</p>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(() => authService.getUser())

  const [active, setActive] = useState('courses')

  const handleLoginSuccess = (data) => {
    setUser({ full_name: data.full_name, email: data.email })
  }

  const handleLogout = () => {
    authService.logout()
    setUser(null)
  }

  if (!user) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />
  }

  const pages = {
    stats: <StatsPage />,
    courses: <CoursesPage />,
    library: <PlaceholderPage title="Thư viện" />,
    roadmap: <PlaceholderPage title="Lộ trình" />,
  }

  return (
    <div className="flex h-screen bg-[#0a0720] overflow-hidden text-slate-100">
      
      <Sidebar active={active} setActive={setActive} />
      
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <Topbar user={user} onLogout={handleLogout} />
        
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
          {pages[active]}
        </main>
      </div>

      <ChatBox />
      
    </div>
  )
}