import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff, Mail, Lock, User, KeyRound } from 'lucide-react' 

function Logo({ darkText = true }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-cyan-400 flex items-center justify-center font-bold text-slate-900 text-lg">
        AI
      </div>
      <span className={`text-xl ${darkText ? 'text-slate-800 font-semibold' : 'text-white font-medium'}`}>
        Tutor
      </span>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder, icon: Icon }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-medium text-slate-800">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          <Icon size={18} />
        </span>
        <input
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-[#E8E8E8] border-none rounded-lg pl-10 pr-10 py-3
            text-sm text-slate-800 placeholder-slate-400 outline-none
            focus:ring-2 focus:ring-[#2C1F4A]/50 transition-all"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  )
}

function LoginForm({ onSwitch, onSuccess }) {
  const [email, setEmail] = useState('')
  const [matKhau, setMatKhau] = useState('')
  const { loading, error, dangNhap } = useAuth(onSuccess)

  const handleSubmit = (e) => {
    e.preventDefault()
    dangNhap(email, matKhau)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-sm gap-4">
      <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="Email" icon={Mail} />
        
      <Field label="Mật khẩu" type="password" value={matKhau} onChange={(e) => setMatKhau(e.target.value)}
        placeholder="Mật khẩu" icon={Lock} />

      {error && (
        <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex flex-col gap-3 mt-2">
        <button
          type="submit"
          disabled={loading || !email || !matKhau}
          className="w-full py-3 rounded-lg bg-[#2C1F4A] text-white font-medium
            hover:bg-[#3a2963] disabled:opacity-50 transition-all"
        >
          {loading ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>
        
        <div className="text-right">
          <a href="#" className="text-xs text-slate-500 hover:text-slate-800">Quên mật khẩu?</a>
        </div>

        <button
          type="button"
          onClick={onSwitch}
          className="w-full py-3 rounded-lg bg-white border border-slate-300 text-slate-800 font-medium
            hover:bg-slate-50 transition-all mt-2"
        >
          Đăng ký
        </button>
      </div>
    </form>
  )
}

function RegisterForm({ onSwitch, onSuccess }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [matKhau, setMatKhau] = useState('')
  const [confirm, setConfirm] = useState('')
  const { loading, error, dangKy, setError } = useAuth(onSuccess)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (matKhau !== confirm) { setError('Mật khẩu xác nhận không khớp'); return }
    if (matKhau.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự'); return }
    dangKy(fullName, email, matKhau)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-sm gap-4">
      <Field label="Họ và tên" value={fullName} onChange={(e) => setFullName(e.target.value)}
        placeholder="Họ và tên" icon={User} />
        
      <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="Email" icon={Mail} />
        
      <Field label="Mật khẩu" type="password" value={matKhau} onChange={(e) => setMatKhau(e.target.value)}
        placeholder="Mật khẩu" icon={Lock} />
        
      <Field label="Xác nhận mật khẩu" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
        placeholder="Xác nhận mật khẩu" icon={KeyRound} />

      {error && (
        <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex flex-col gap-3 mt-2">
        <button
          type="submit"
          disabled={loading || !fullName || !email || !matKhau || !confirm}
          className="w-full py-3 rounded-lg bg-[#2C1F4A] text-white font-medium
            hover:bg-[#3a2963] disabled:opacity-50 transition-all"
        >
          {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
        </button>
        
        <button
          type="button"
          onClick={onSwitch}
          className="w-full py-3 rounded-lg bg-white border border-slate-300 text-slate-800 font-medium
            hover:bg-slate-50 transition-all mt-2"
        >
          Quay lại Đăng nhập
        </button>
      </div>
    </form>
  )
}

export default function AuthPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login')

  return (
    <div className="flex min-h-screen w-full">
      
      <div className="hidden md:flex w-1/3 lg:w-[35%] bg-[#2C1F4A] flex-col items-center justify-center">
        <Logo darkText={false} />
      </div>

      <div className="flex-1 bg-white flex flex-col items-center justify-center p-8">
        
        <div className="w-full max-w-sm flex flex-col items-center">
          
          <div className="mb-10">
            <Logo darkText={true} />
          </div>

          {mode === 'login' 
            ? <LoginForm onSwitch={() => setMode('register')} onSuccess={onLoginSuccess} />
            : <RegisterForm onSwitch={() => setMode('login')} onSuccess={onLoginSuccess} />
          }
        </div>

      </div>
    </div>
  )
}