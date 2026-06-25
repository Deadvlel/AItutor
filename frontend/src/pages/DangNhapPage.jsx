import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff, Mail, Lock, User, KeyRound, GraduationCap, ArrowRight } from 'lucide-react'

function Logo({ darkText = true }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
        <GraduationCap size={20} className="text-white" strokeWidth={2} />
      </div>
      <div>
        <span className={`text-xl font-bold tracking-tight ${darkText ? 'text-slate-800' : 'text-white'}`}>
          AI Tutor
        </span>
        <p className={`text-[11px] leading-none mt-0.5 ${darkText ? 'text-slate-400' : 'text-blue-200'}`}>
          Learning Platform
        </p>
      </div>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder, icon: Icon }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</label>
      <div className="relative group">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
          <Icon size={16} strokeWidth={2} />
        </span>
        <input
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3
            text-sm text-slate-800 placeholder-slate-400 outline-none
            focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white
            transition-all duration-150"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
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
    <form onSubmit={handleSubmit} className="flex flex-col w-full gap-4">
      <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="example@email.com" icon={Mail} />

      <Field label="Mật khẩu" type="password" value={matKhau} onChange={(e) => setMatKhau(e.target.value)}
        placeholder="Nhập mật khẩu" icon={Lock} />

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 mt-1">
        <button
          type="submit"
          disabled={loading || !email || !matKhau}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm
            hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-150 active:scale-[0.98] shadow-md shadow-blue-200
            flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang xử lý...
            </>
          ) : (
            <>
              Đăng nhập
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>

        <div className="text-right">
          <a href="#" className="text-xs text-slate-400 hover:text-blue-600 transition-colors">
            Quên mật khẩu?
          </a>
        </div>

        <div className="relative flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-slate-400 text-xs">hoặc</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={onSwitch}
          className="w-full py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm
            hover:bg-slate-50 hover:border-slate-300 transition-all duration-150"
        >
          Tạo tài khoản mới
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
    <form onSubmit={handleSubmit} className="flex flex-col w-full gap-4">
      <Field label="Họ và tên" value={fullName} onChange={(e) => setFullName(e.target.value)}
        placeholder="Nguyễn Văn A" icon={User} />

      <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="example@email.com" icon={Mail} />

      <Field label="Mật khẩu" type="password" value={matKhau} onChange={(e) => setMatKhau(e.target.value)}
        placeholder="Tối thiểu 6 ký tự" icon={Lock} />

      <Field label="Xác nhận mật khẩu" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
        placeholder="Nhập lại mật khẩu" icon={KeyRound} />

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 mt-1">
        <button
          type="submit"
          disabled={loading || !fullName || !email || !matKhau || !confirm}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm
            hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-150 active:scale-[0.98] shadow-md shadow-blue-200
            flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang xử lý...
            </>
          ) : (
            <>
              Tạo tài khoản
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>

        <div className="relative flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-slate-400 text-xs">hoặc</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={onSwitch}
          className="w-full py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm
            hover:bg-slate-50 hover:border-slate-300 transition-all duration-150"
        >
          Quay lại Đăng nhập
        </button>
      </div>
    </form>
  )
}

const features = [
  { title: 'AI tạo đề thi', desc: 'Tự động sinh câu hỏi theo chủ đề bạn chọn' },
  { title: 'Chấm điểm tức thì', desc: 'Kết quả và giải thích chi tiết ngay lập tức' },
  { title: 'Theo dõi tiến độ', desc: 'Thống kê học tập trực quan, rõ ràng' },
]

export default function AuthPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login')

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      {/* Left Panel */}
      <div className="hidden md:flex w-[42%] bg-blue-600 flex-col items-start justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-500/40" />
          <div className="absolute bottom-0 -left-16 w-72 h-72 rounded-full bg-blue-700/50" />
          <div className="absolute top-1/2 right-8 w-40 h-40 rounded-full bg-blue-400/20" />
          {/* Grid dots */}
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        <Logo darkText={false} />

        <div className="relative z-10 flex flex-col gap-8">
          <div>
            <h2 className="text-white text-4xl font-bold leading-tight mb-3">
              Học thông minh<br />hơn mỗi ngày
            </h2>
            <p className="text-blue-100 text-base leading-relaxed max-w-xs">
              Nền tảng học tập AI giúp bạn ôn luyện hiệu quả, kiểm tra kiến thức và theo dõi tiến độ.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-blue-200 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-300 text-xs relative z-10">
          © 2025 AI Tutor. All rights reserved.
        </p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm flex flex-col">
          {/* Mobile logo */}
          <div className="mb-8 md:hidden">
            <Logo darkText={true} />
          </div>

          <div className="mb-8">
            <h1 className="text-slate-800 text-2xl font-bold mb-1">
              {mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'}
            </h1>
            <p className="text-slate-400 text-sm">
              {mode === 'login'
                ? 'Đăng nhập để tiếp tục hành trình học tập'
                : 'Bắt đầu học tập thông minh hôm nay'}
            </p>
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