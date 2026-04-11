import React, { useState, useRef, useEffect } from 'react'
import { Bot, User, Send, MessageCircle } from 'lucide-react';
import { useChat } from '../hooks/useChat'; // <-- GỌI "NÃO" TỪ HOOK VÀO ĐÂY

function TypingDots() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 text-white">
        <Bot size={18} />
      </div>
      <div className="bg-[#1e1b4b] border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  )
}

function Bubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white
          ${isUser ? 'bg-violet-500' : 'bg-amber-400'}`}
      >
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>
      <div
        className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
          ${isUser
            ? 'bg-violet-600 text-white rounded-br-sm'
            : 'bg-[#1e1b4b] text-slate-100 rounded-bl-sm border border-white/10'
          }`}
      >
        {msg.text}
      </div>
    </div>
  )
}

export default function ChatBox() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const { messages, loading, send } = useChat() 
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  const handleSend = () => {
    if (!input.trim() || loading) return;
    
    const text = input;
    setInput('');
    
    send(text);
  }

  return (
    <div className="min-h-screen bg-[#0a0720]"> 
      
      <button
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl text-white
          flex items-center justify-center transition-all duration-300
          ${open
            ? 'bg-slate-700 rotate-90 scale-95'
            : 'bg-gradient-to-br from-amber-400 to-amber-500 hover:scale-110'
          }`}
        title="Hỏi gia sư AI"
      >
        {open ? <span className='text-2xl'>✕</span> : <MessageCircle size={28} />}
      </button>

      {!open && (
        <span className="fixed bottom-[62px] right-5 z-50 w-3 h-3 rounded-full bg-red-500 border-2 border-white animate-pulse" />
      )}

      <div
        className={`fixed bottom-24 right-6 z-40 w-[360px] rounded-2xl overflow-hidden shadow-2xl
          border border-white/10 bg-[#130f2e]
          transition-all duration-300 origin-bottom-right
          ${open ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'}`}
      >
        <div className="flex items-center gap-3 px-4 py-3 bg-[#1e1b4b] border-b border-white/10">
          <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center text-white">
            <Bot size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Gia sư AI</p>
            <p className="text-xs text-emerald-400">● Đang hoạt động</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="ml-auto text-slate-400 hover:text-white transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="h-72 overflow-y-auto px-4 py-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/10">
          {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
          {loading && <TypingDots />}
          <div ref={bottomRef} />
        </div>

        <div className="px-3 pb-3 pt-2 border-t border-white/10 flex gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
            }}
            placeholder="Hỏi AI câu hỏi của bạn..."
            className="flex-1 bg-[#1e1b4b] border border-white/10 rounded-xl px-3 py-2
              text-sm text-white placeholder-slate-400 resize-none outline-none
              focus:border-amber-400/50 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-xl bg-amber-400 text-[#1a1040] flex items-center justify-center
              self-end hover:bg-amber-300 disabled:opacity-40
              disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}