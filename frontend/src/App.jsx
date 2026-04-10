import { useState } from 'react'
import { authService } from './services/authService'

import AuthPage from './pages/AuthPage'
import ChatBox from './components/ChatBox'

export default function App() {
  const [user, setUser] = useState(() => authService.getUser())

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

  return (
    <div className="min-h-screen bg-[#0a0720] text-white">
      
      <div className="flex justify-between items-center p-4 border-b border-white/10 bg-[#1e1b4b]">
        <h1 className="font-bold text-amber-400">Hệ thống AI Tutor</h1>
        <div className="flex items-center gap-4">
          <span>Xin chào, {user.full_name}</span>
          <button 
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      <ChatBox />
      
    </div>
  )
}