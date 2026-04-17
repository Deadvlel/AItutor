import { useState, useRef, useEffect } from 'react'
import { useConversation } from '../hooks/useConversation'
import { 
  GraduationCap, User, Plus, Send, X, 
  MessageSquare, Brain, BookOpen, PenTool, 
  Microscope, Lightbulb, Target, FileText 
} from 'lucide-react'

const CARD_COLORS = [
  'from-violet-600 to-violet-800',
  'from-blue-600 to-blue-800',
  'from-emerald-600 to-emerald-800',
  'from-amber-600 to-amber-800',
  'from-pink-600 to-pink-800',
  'from-cyan-600 to-cyan-800',
]

const CARD_ICONS = [MessageSquare, Brain, BookOpen, PenTool, Microscope, Lightbulb, Target, FileText]

function TypingDots() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-[#1a1040] flex-shrink-0">
        <GraduationCap size={16} />
      </div>
      <div className="bg-[#1e1b4b] border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"
            style={{ animationDelay: `${i * 0.18}s` }} />
        ))}
      </div>
    </div>
  )
}

function Bubble({ msg }) {
  const isUser = msg.role === 'user'
  const content = msg.noi_dung || msg.text || ""

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
        ${isUser ? 'bg-violet-500 text-white' : 'bg-amber-400 text-[#1a1040]'}`}>
        {isUser ? <User size={14} /> : <GraduationCap size={16} />}
      </div>
      
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap
        ${isUser
          ? 'bg-violet-600 text-white rounded-br-sm'
          : 'bg-[#1e1b4b] text-slate-100 rounded-bl-sm border border-white/10'
        }`}>
        {content}
      </div>
    </div>
  )
}

function WelcomeContent({ onCreate }) {
  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="bg-gradient-to-r from-violet-700 to-violet-900 rounded-2xl p-6">
        <p className="text-violet-300 text-xs font-medium uppercase tracking-wider mb-1">Gia sư AI</p>
        <h1 className="text-white text-xl font-semibold leading-snug">Chào mừng trở lại! 👋</h1>
        <p className="text-violet-200/70 text-sm mt-2">Chọn một cuộc trò chuyện bên phải hoặc bắt đầu hỏi bài mới</p>
      </div>
      <div className="bg-[#130f2e] border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center flex-1 gap-5 text-center">
        <div className="w-20 h-20 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
          <GraduationCap size={40} />
        </div>
        <div>
          <p className="text-white font-semibold text-lg">Bắt đầu hỏi bài</p>
          <p className="text-slate-400 text-sm mt-1 leading-relaxed max-w-xs">
            AI gia sư sẽ gợi ý từng bước, giải thích kỹ càng và đưa ra bài tập tương tự
          </p>
        </div>
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 text-[#0a0720]
            font-semibold text-sm hover:bg-amber-300 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
        >
          <Plus size={18} /> Cuộc trò chuyện mới
        </button>
      </div>
    </div>
  )
}

function ChatContent({ activeCuoc, messages, loading, onSend }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (activeCuoc) setTimeout(() => inputRef.current?.focus(), 100)
  }, [activeCuoc?.id])

  const handleSend = () => {
    if (!input.trim() || loading) return
    onSend(input)
    setInput('')
  }

  const colorIdx = activeCuoc ? (activeCuoc.id % CARD_COLORS.length) : 0
  const color = CARD_COLORS[colorIdx]

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className={`bg-gradient-to-r ${color} rounded-2xl px-6 py-5 flex-shrink-0`}>
        <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">Gia sư AI</p>
        <h1 className="text-white text-xl font-semibold leading-snug line-clamp-2">
          {activeCuoc?.tieu_de || 'Cuộc trò chuyện mới'}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#130f2e] border border-white/5 rounded-2xl p-5
        flex flex-col gap-4 scrollbar-thin scrollbar-thumb-white/10 min-h-0">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center text-slate-500">
            <MessageSquare size={48} className="opacity-20 mb-2" />
            <p className="text-sm">Gửi tin nhắn đầu tiên để bắt đầu!</p>
          </div>
        )}
        {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
        {loading && <TypingDots />}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 flex-shrink-0">
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
          }}
          placeholder="Hỏi về bài học... (Enter để gửi, Shift+Enter xuống dòng)"
          className="flex-1 bg-[#1e1b4b] border border-white/10 rounded-xl px-4 py-3
            text-sm text-white placeholder-slate-500 resize-none outline-none
            focus:border-amber-400/50 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="w-11 h-11 rounded-xl bg-amber-400 text-[#1a1040] flex items-center justify-center
            self-end font-bold hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed
            transition-all active:scale-95"
        >
          <Send size={18} className="ml-1" />
        </button>
      </div>
    </div>
  )
}

function HistorySidebar({ lichSu, activeCuoc, loadingHistory, onSelect, onCreate, onDelete }) {
  const [hoverId, setHoverId] = useState(null)

  return (
    <div className="w-64 flex-shrink-0 flex flex-col gap-4 overflow-hidden h-full">
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-white font-semibold text-sm">Lịch sử trò chuyện</h2>
        <button
          onClick={onCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600
            hover:bg-violet-500 text-white text-xs font-medium transition-colors"
          title="Cuộc trò chuyện mới"
        >
          <Plus size={14} /> Mới
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/10 pb-2">
        {loadingHistory && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {!loadingHistory && lichSu.length === 0 && (
          <div className="text-center mt-8">
            <p className="text-slate-500 text-xs leading-relaxed">
              Chưa có cuộc trò chuyện nào.<br />Bấm "+ Mới" để bắt đầu!
            </p>
          </div>
        )}

        {lichSu.map((c, idx) => {
          const color = CARD_COLORS[idx % CARD_COLORS.length]
          const Icon = CARD_ICONS[idx % CARD_ICONS.length]
          const isActive = activeCuoc?.id === c.id

          return (
            <div
              key={c.id}
              onMouseEnter={() => setHoverId(c.id)}
              onMouseLeave={() => setHoverId(null)}
              onClick={() => onSelect(c)}
              className={`relative rounded-xl p-4 cursor-pointer transition-all
                bg-gradient-to-br ${color}
                ${isActive ? 'ring-2 ring-white/40 scale-[1.02]' : 'hover:opacity-90 hover:scale-[1.01]'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-5">
                  <p className="text-white/70 text-xs mb-0.5">Trò chuyện AI</p>
                  <p className="text-white text-sm font-medium leading-snug line-clamp-2">
                    {c.tieu_de}
                  </p>
                </div>
                <div className="text-white/80 flex-shrink-0">
                  <Icon size={24} />
                </div>
              </div>

              {c.ngay_tao && (
                <p className="text-white/50 text-xs">{c.ngay_tao}</p>
              )}

              {isActive && (
                <div className="absolute bottom-3 left-4 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-white/70 text-xs">Đang xem</span>
                </div>
              )}

              {hoverId === c.id && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(c.id) }}
                  className="absolute top-2.5 right-2.5 w-6 h-6 rounded bg-black/30
                    hover:bg-red-500/80 text-white/70 hover:text-white
                    flex items-center justify-center transition-colors"
                  title="Xoá"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CoursesPage() {
  const {
    lichSu, activeCuoc, messages, loading, loadingHistory,
    moiCuoc, taoCuocMoi, guiTin, xoaCuoc,
  } = useConversation()

  return (
    <div className="flex gap-6 h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {activeCuoc
          ? <ChatContent
              activeCuoc={activeCuoc}
              messages={messages}
              loading={loading}
              onSend={guiTin}
            />
          : <WelcomeContent onCreate={taoCuocMoi} />
        }
      </div>

      <HistorySidebar
        lichSu={lichSu}
        activeCuoc={activeCuoc}
        loadingHistory={loadingHistory}
        onSelect={moiCuoc}
        onCreate={taoCuocMoi}
        onDelete={xoaCuoc}
      />
    </div>
  )
}