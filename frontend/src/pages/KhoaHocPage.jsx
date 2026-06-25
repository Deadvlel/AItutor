import { useState, useEffect, useRef, useCallback } from 'react'
import {
  BookOpen, ChevronRight, X, Maximize2, Send,
  ArrowLeft, GraduationCap, MessageCircle, History, Trash2,
  ChevronDown, Star, Sparkles
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeader() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}

// ── Spotlight highlight bài cần học ────────────────────────────────────────
function SpotlightBai({ targetEl, tenBai, onClose }) {
  const [rect, setRect] = useState(null)

  useEffect(() => {
    if (!targetEl) return
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const t = setTimeout(() => setRect(targetEl.getBoundingClientRect()), 400)
    return () => clearTimeout(t)
  }, [targetEl])

  if (!rect) return null

  const pad = 8
  const x = rect.left - pad
  const y = rect.top - pad
  const w = rect.width + pad * 2
  const h = rect.height + pad * 2
  const showAbove = rect.top > 180

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="bai-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect x={x} y={y} width={w} height={h} rx="12" fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.7)" mask="url(#bai-mask)" />
        <rect x={x} y={y} width={w} height={h} rx="12"
          fill="none" stroke="#3B82F6" strokeWidth="2.5"
          strokeDasharray="8 4" className="animate-pulse" />
      </svg>

      <div
        className="absolute bg-white rounded-2xl shadow-2xl p-4 w-72 border border-blue-100 z-50"
        style={{
          left: Math.max(12, Math.min(rect.left + rect.width / 2 - 144, window.innerWidth - 300)),
          top:  showAbove ? rect.top - 155 : rect.bottom + 16,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className={`absolute left-8 w-3 h-3 bg-white border-slate-100 rotate-45
          ${showAbove ? 'bottom-[-7px] border-r border-b' : 'top-[-7px] border-l border-t'}`} />
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Sparkles size={13} className="text-white" />
          </div>
          <p className="text-slate-800 font-bold text-sm">Đây là bài bạn cần học!</p>
        </div>
        <p className="text-slate-500 text-xs leading-relaxed mb-1">
          <span className="font-semibold text-blue-600">"{tenBai}"</span> — bấm vào bài này để bắt đầu học nhé!
        </p>
        <button onClick={onClose}
          className="mt-3 w-full py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all">
          Hiểu rồi!
        </button>
      </div>
    </div>
  )
}

// ── Spotlight dò bài (sau khi học xong bài) ─────────────────────────────────
function SpotlightDoBai({ targetEl, tenBai, onClose, onDoBai }) {
  const [rect, setRect] = useState(null)

  useEffect(() => {
    if (!targetEl) return
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const t = setTimeout(() => setRect(targetEl.getBoundingClientRect()), 400)
    return () => clearTimeout(t)
  }, [targetEl])

  if (!rect) return null

  const pad = 10
  const x = rect.left - pad
  const y = rect.top - pad
  const w = rect.width + pad * 2
  const h = rect.height + pad * 2
  const showAbove = rect.top > 200

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="dobai-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect x={x} y={y} width={w} height={h} rx="14" fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#dobai-mask)" />
        <rect x={x} y={y} width={w} height={h} rx="14"
          fill="none" stroke="#10B981" strokeWidth="2.5" opacity="0.9" />
      </svg>

      <div
        className="absolute bg-white rounded-2xl shadow-2xl p-5 w-76 border border-emerald-100 z-50"
        style={{
          left: Math.max(12, Math.min(rect.left + rect.width / 2 - 150, window.innerWidth - 320)),
          top:  showAbove ? rect.top - 200 : rect.bottom + 16,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className={`absolute left-8 w-3 h-3 bg-white rotate-45
          ${showAbove ? 'bottom-[-7px] border-r border-b border-emerald-100' : 'top-[-7px] border-l border-t border-emerald-100'}`} />
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <GraduationCap size={18} className="text-emerald-600" />
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={15} />
          </button>
        </div>
        <p className="text-slate-800 font-bold text-sm mb-1">Học xong rồi! 🎉</p>
        <p className="text-slate-500 text-xs leading-relaxed mb-4">
          Bạn vừa hoàn thành <span className="font-semibold text-emerald-600">"{tenBai}"</span>.
          Thử dò bài để kiểm tra xem nhớ được bao nhiêu nhé!
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => { onClose(); onDoBai() }}
            className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200"
          >
            Dò bài ngay 🎯
          </button>
          <button onClick={onClose}
            className="w-full py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-medium hover:bg-slate-100 transition-all">
            Thôi, xem bài khác
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function NoiDungAI({ text }) {
  if (!text) return null
  const parts = []
  const regex = /\*\*(.+?)\*\*/g
  let lastIdx = 0, match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push({ type:'text', value:text.slice(lastIdx, match.index) })
    parts.push({ type:'bold', value:match[1] })
    lastIdx = match.index + match[0].length
  }
  if (lastIdx < text.length) parts.push({ type:'text', value:text.slice(lastIdx) })
  return (
    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
      {parts.map((p,i) => p.type==='bold'
        ? <strong key={i} className="text-slate-900 font-semibold">{p.value}</strong>
        : <span key={i}>{p.value}</span>)}
    </p>
  )
}

function useCuocTroChuyen() {
  const [idCuoc, setIdCuoc]     = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(false)

  const khoiTaoCuoc = useCallback(async (tieuDe=null) => {
    try {
      const res = await fetch(`${API_URL}/api/cuoc-tro-chuyen/tao-moi`, {
        method:'POST', headers:authHeader(), body:JSON.stringify({ tieu_de:tieuDe }),
      })
      const data = await res.json()
      setIdCuoc(data.id)
      setMessages([{ role:'assistant', content:'Xin chào! Tôi là gia sư AI, sẵn sàng hỗ trợ bạn. Hỏi tôi bất cứ điều gì về bài học nhé!' }])
      return data.id
    } catch { return null }
  }, [])

  const guiTin = useCallback(async (noiDung, idOverride=null) => {
    const cuocId = idOverride || idCuoc
    if (!cuocId || loading) return null
    setMessages(prev => [...prev, { role:'user', content:noiDung }])
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/cuoc-tro-chuyen/gui`, {
        method:'POST', headers:authHeader(), body:JSON.stringify({ id_cuoc:cuocId, noi_dung:noiDung }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role:'assistant', content:data.reply||'' }])
      return data
    } catch {
      setMessages(prev => [...prev, { role:'assistant', content:'Lỗi kết nối, vui lòng thử lại!' }])
      return null
    } finally { setLoading(false) }
  }, [idCuoc, loading])

  const reset = useCallback(() => { setIdCuoc(null); setMessages([]); setLoading(false) }, [])
  return { idCuoc, messages, loading, khoiTaoCuoc, guiTin, reset }
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center py-1">
      {[0,1,2].map(j => (
        <div key={j} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
          style={{ animationDelay:`${j*0.15}s` }} />
      ))}
    </div>
  )
}

function SkeletonMonHoc() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array(4).fill(0).map((_,i) => (
        <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 animate-pulse">
          <div className="flex justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100" />
            <div className="w-14 h-6 rounded-full bg-slate-100" />
          </div>
          <div className="w-28 h-5 rounded bg-slate-100 mb-2" />
          <div className="w-20 h-3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

function SkeletonMucLuc() {
  return (
    <div className="flex flex-col gap-3">
      {Array(3).fill(0).map((_,i) => (
        <div key={i} className="bg-white border border-slate-100 rounded-2xl overflow-hidden animate-pulse">
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex-shrink-0" />
            <div className="flex-1">
              <div className="w-40 h-4 rounded bg-slate-100 mb-1.5" />
              <div className="w-16 h-3 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SkeletonLichSu() {
  return (
    <div className="flex flex-col gap-1 py-2 px-2">
      {Array(4).fill(0).map((_,i) => (
        <div key={i} className="flex gap-3 px-3 py-3 animate-pulse">
          <div className="flex-1">
            <div className="w-3/4 h-3.5 rounded bg-slate-100 mb-1.5" />
            <div className="w-1/2 h-3 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

function DoKhoLabel({ do_kho }) {
  const map = { 1:['Dễ','text-emerald-600 bg-emerald-50'], 2:['Trung bình','text-amber-600 bg-amber-50'], 3:['Khó','text-white bg-slate-500'] }
  const [text,cls] = map[do_kho] || ['?','text-slate-500 bg-slate-50']
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls} flex items-center gap-1`}>
      <span className="flex">{(do_kho?Array(do_kho).fill(null):[]).map((_,i) => <Star key={i} size={9} className="fill-current"/>)}</span>
      {text}
    </span>
  )
}

function LichSuPanel({ onChonCuoc }) {
  const [danhSach, setDanhSach] = useState([])
  const [loading, setLoading]   = useState(true)
  useEffect(() => {
    fetch(`${API_URL}/api/cuoc-tro-chuyen/lich-su`, { headers:authHeader() })
      .then(r=>r.json()).then(data=>{ setDanhSach(Array.isArray(data)?data:[]) })
      .catch(()=>{}).finally(()=>setLoading(false))
  }, [])
  const xoaCuoc = async (id,e) => {
    e.stopPropagation()
    if (!confirm('Xóa cuộc trò chuyện này?')) return
    try {
      await fetch(`${API_URL}/api/cuoc-tro-chuyen/${id}`, { method:'DELETE', headers:authHeader() })
      setDanhSach(prev=>prev.filter(c=>c.id!==id))
    } catch {}
  }
  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0 flex items-center gap-2">
        <History size={15} className="text-slate-400"/>
        <p className="text-slate-700 text-sm font-semibold">Lịch sử trò chuyện</p>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? <SkeletonLichSu/> : danhSach.length===0 ? (
          <div className="flex flex-col items-center justify-center h-32 px-4 text-center">
            <MessageCircle size={24} className="text-slate-200 mb-2"/>
            <p className="text-slate-400 text-xs">Chưa có cuộc trò chuyện nào</p>
          </div>
        ) : (
          <div className="flex flex-col py-1">
            {danhSach.map(cuoc => (
              <button key={cuoc.id} onClick={()=>onChonCuoc?.(cuoc)}
                className="flex items-start gap-2 px-4 py-3 hover:bg-slate-50 transition-all group text-left border-b border-slate-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 text-xs font-medium truncate group-hover:text-blue-600 transition-colors">{cuoc.tieu_de}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{cuoc.ngay_tao}</p>
                </div>
                <button onClick={(e)=>xoaCuoc(cuoc.id,e)}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all flex-shrink-0 p-0.5 rounded">
                  <Trash2 size={13}/>
                </button>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MiniChatbox({ tenBai, onExpand, cuocTroChuyen }) {
  const [input, setInput] = useState('')
  const msgEndRef = useRef(null)
  const { messages, loading, idCuoc, khoiTaoCuoc, guiTin } = cuocTroChuyen
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])
  const guiCauHoi = async () => {
    const q = input.trim(); if (!q||loading) return
    setInput('')
    let cuocId = idCuoc
    if (!cuocId) cuocId = await khoiTaoCuoc(tenBai?`Bài: ${tenBai}`:null)
    if (cuocId) await guiTin(q, cuocId)
  }
  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center"><GraduationCap size={14} className="text-white"/></div>
          <p className="text-slate-700 text-xs font-semibold">Gia sư AI</p>
          {loading && <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"/>}
        </div>
        <button onClick={onExpand} className="text-slate-400 hover:text-blue-500 transition-colors p-1 rounded-lg hover:bg-blue-50"><Maximize2 size={13}/></button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 min-h-0">
        {messages.length===0&&!loading ? (
          <p className="text-slate-400 text-xs leading-relaxed py-2 px-1">Gõ câu hỏi để hỏi gia sư AI về bài học!</p>
        ) : messages.map((m,i) => (
          <div key={i} className={`text-xs leading-relaxed rounded-xl px-2.5 py-2 flex-shrink-0 ${m.role==='user'?'bg-blue-600 text-white ml-4':'bg-slate-50 border border-slate-100 text-slate-700 mr-4'}`}>
            {m.role==='assistant'?<NoiDungAI text={m.content}/>:m.content}
          </div>
        ))}
        {loading&&<div className="bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-2 mr-4 flex-shrink-0"><TypingDots/></div>}
        <div ref={msgEndRef}/>
      </div>
      <div className="flex gap-2 px-3 py-2 border-t border-slate-100 flex-shrink-0">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&guiCauHoi()}
          placeholder="Hỏi về bài học..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-blue-300 focus:bg-white transition-colors"/>
        <button onClick={guiCauHoi} disabled={loading||!input.trim()}
          className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 transition-all flex-shrink-0">
          <Send size={12}/>
        </button>
      </div>
    </div>
  )
}

function ChatboxLon({ tenBai, onClose, cuocTroChuyen }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const { messages, loading, idCuoc, khoiTaoCuoc, guiTin } = cuocTroChuyen
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages,loading])
  const guiCauHoi = async () => {
    const q = input.trim(); if (!q||loading) return
    setInput('')
    let cuocId = idCuoc
    if (!cuocId) cuocId = await khoiTaoCuoc(tenBai?`Bài: ${tenBai}`:null)
    if (cuocId) await guiTin(q, cuocId)
  }
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end justify-end p-4">
      <div className="w-full max-w-lg h-[75vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-200"><GraduationCap size={18} className="text-white"/></div>
            <div>
              <p className="text-slate-800 font-semibold text-sm">Gia sư AI</p>
              <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"/><p className="text-emerald-600 text-xs font-medium">Sẵn sàng hỗ trợ</p></div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"><X size={16}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
          {messages.map((m,i) => m.role==='user' ? (
            <div key={i} className="flex items-end gap-2 flex-row-reverse">
              <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0"><span className="text-white text-xs font-bold">B</span></div>
              <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-br-sm bg-blue-600 text-white text-sm leading-relaxed">{m.content}</div>
            </div>
          ) : (
            <div key={i} className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0"><GraduationCap size={13} className="text-blue-500"/></div>
              <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-slate-50 border border-slate-200 text-sm leading-relaxed"><NoiDungAI text={m.content}/></div>
            </div>
          ))}
          {loading&&<div className="flex items-end gap-2"><div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0"><GraduationCap size={13} className="text-blue-500"/></div><div className="px-3.5 py-3 rounded-2xl rounded-bl-sm bg-slate-50 border border-slate-200"><TypingDots/></div></div>}
          <div ref={bottomRef}/>
        </div>
        <div className="flex gap-2 px-4 py-3 border-t border-slate-100 flex-shrink-0">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&guiCauHoi()}
            placeholder="Hỏi gia sư về bài học..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-blue-300 focus:bg-white transition-all"/>
          <button onClick={guiCauHoi} disabled={loading||!input.trim()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 transition-all flex-shrink-0 flex items-center gap-2">
            <Send size={14}/>Gửi
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalCuocTroChuyen({ cuoc, onClose }) {
  const [tinNhans, setTinNhans] = useState([])
  const [loading, setLoading]   = useState(true)
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const bottomRef = useRef(null)
  useEffect(() => {
    fetch(`${API_URL}/api/cuoc-tro-chuyen/tin-nhan/${cuoc.id}`, { headers:authHeader() })
      .then(r=>r.json()).then(data=>{ setTinNhans(Array.isArray(data)?data:[]); setLoading(false) })
      .catch(()=>setLoading(false))
  }, [cuoc.id])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [tinNhans,sending])
  const guiTin = async () => {
    const q = input.trim(); if (!q||sending) return
    setInput(''); setSending(true)
    setTinNhans(prev=>[...prev,{ id:Date.now(), role:'user', noi_dung:q }])
    try {
      const res = await fetch(`${API_URL}/api/cuoc-tro-chuyen/gui`, { method:'POST', headers:authHeader(), body:JSON.stringify({ id_cuoc:cuoc.id, noi_dung:q }) })
      const data = await res.json()
      setTinNhans(prev=>[...prev,{ id:Date.now()+1, role:'assistant', noi_dung:data.reply||'' }])
    } catch { setTinNhans(prev=>[...prev,{ id:Date.now()+1, role:'assistant', noi_dung:'Lỗi kết nối!' }]) }
    finally { setSending(false) }
  }
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg h-[75vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center"><GraduationCap size={15} className="text-blue-500"/></div>
            <div><p className="text-slate-800 font-semibold text-sm truncate max-w-xs">{cuoc.tieu_de}</p><p className="text-slate-400 text-xs">{cuoc.ngay_tao}</p></div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"><X size={16}/></button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
          {loading ? (
            <div className="flex flex-col gap-3">{Array(3).fill(0).map((_,i)=><div key={i} className={`flex gap-2 animate-pulse ${i%2?'flex-row-reverse':''}`}><div className="w-7 h-7 rounded-xl bg-slate-100 flex-shrink-0"/><div className="w-3/5 h-10 rounded-2xl bg-slate-100"/></div>)}</div>
          ) : tinNhans.length===0 ? <p className="text-center text-slate-400 text-sm py-12">Chưa có tin nhắn.</p>
          : tinNhans.map((m,i) => m.role==='user' ? (
            <div key={m.id??i} className="flex items-end gap-2 flex-row-reverse">
              <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0"><span className="text-white text-xs font-bold">B</span></div>
              <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-br-sm bg-blue-600 text-white text-sm leading-relaxed">{m.noi_dung}</div>
            </div>
          ) : (
            <div key={m.id??i} className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0"><GraduationCap size={13} className="text-blue-500"/></div>
              <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-slate-50 border border-slate-200 text-sm leading-relaxed"><NoiDungAI text={m.noi_dung}/></div>
            </div>
          ))}
          {sending&&<div className="flex items-end gap-2"><div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0"><GraduationCap size={13} className="text-blue-500"/></div><div className="px-3.5 py-3 rounded-2xl rounded-bl-sm bg-slate-50 border border-slate-200"><TypingDots/></div></div>}
          <div ref={bottomRef}/>
        </div>
        <div className="flex gap-2 px-4 py-3 border-t border-slate-100 flex-shrink-0">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&guiTin()} placeholder="Nhắn tin..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-blue-300 focus:bg-white transition-colors"/>
          <button onClick={guiTin} disabled={sending||!input.trim()} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 transition-all flex-shrink-0">Gửi</button>
        </div>
      </div>
    </div>
  )
}

// ── Chọn môn học ─────────────────────────────────────────────────────────────
function ChonMonHoc({ onChon }) {
  const [monHocs, setMonHocs] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch(`${API_URL}/api/khoa-hoc/mon-hoc`, { headers:authHeader() })
      .then(r=>r.json()).then(data=>{ setMonHocs(Array.isArray(data)?data:[]); setLoading(false) })
      .catch(()=>setLoading(false))
  }, [])
  const iconColors = ['bg-blue-600','bg-violet-600','bg-emerald-600','bg-amber-500','bg-red-500','bg-cyan-600','bg-pink-500','bg-indigo-600']
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-slate-800 text-2xl font-bold">Khóa học</h1>
        <p className="text-slate-400 text-sm mt-1">Gia sư AI hướng dẫn từng bước theo sách giáo khoa</p>
      </div>
      {loading ? <SkeletonMonHoc/> : monHocs.length===0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
          <BookOpen size={32} className="text-slate-200 mx-auto mb-3"/>
          <p className="text-slate-700 font-semibold">Chưa có môn học nào</p>
          <p className="text-slate-400 text-sm mt-1">Upload chương trình học để bắt đầu</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {monHocs.map((mon,idx) => (
            <button key={mon.id} onClick={()=>onChon(mon)}
              className="bg-white border border-slate-100 rounded-2xl p-6 text-left hover:border-blue-200 hover:shadow-md hover:shadow-blue-50 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] group">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${iconColors[idx%iconColors.length]} flex items-center justify-center shadow-sm`}>
                  <BookOpen size={20} className="text-white" strokeWidth={2}/>
                </div>
                <span className="text-slate-400 text-xs bg-slate-50 border border-slate-100 px-2 py-1 rounded-full">{mon.so_bai} bài</span>
              </div>
              <p className="text-slate-800 text-base font-bold leading-tight group-hover:text-blue-700 transition-colors">{mon.ten}</p>
              <p className="text-slate-400 text-xs mt-1.5 flex items-center gap-1">Xem bài học <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform"/></p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Chọn bài học — có spotlight ──────────────────────────────────────────────
function ChonBaiHoc({ mon, onChon, onBack, highlightBaiId }) {
  const [mucLuc, setMucLuc]   = useState([])
  const [loading, setLoading] = useState(true)
  const [mo, setMo]           = useState({})
  const [spotlightEl, setSpotlightEl] = useState(null)
  const [spotlightTen, setSpotlightTen] = useState('')
  const [showSpotlight, setShowSpotlight] = useState(false)
  const baiRefs = useRef({})

  useEffect(() => {
    fetch(`${API_URL}/api/khoa-hoc/muc-luc/${mon.id}`, { headers:authHeader() })
      .then(r=>r.json())
      .then(data => {
        const ds = data?.muc_luc || []
        setMucLuc(ds)

        // Tìm bài cần highlight và mở chương chứa nó
        if (highlightBaiId && ds.length > 0) {
          const moInit = {}
          ds.forEach((chuong, cidx) => {
            const coBai = chuong.bai_hocs?.some(b => b.id === highlightBaiId)
            if (coBai) moInit[chuong.id ?? cidx] = true
          })
          setMo(moInit)
        } else if (ds.length > 0) {
          setMo({ [ds[0].id ?? 0]: true })
        }
        setLoading(false)
      })
      .catch(()=>setLoading(false))
  }, [mon.id, highlightBaiId])

  // Sau khi render xong, tìm element của bài cần highlight và hiện spotlight
  useEffect(() => {
    if (!highlightBaiId || loading) return
    const t = setTimeout(() => {
      const el = baiRefs.current[highlightBaiId]
      if (el) {
        // Tìm tên bài
        let tenBai = ''
        mucLuc.forEach(chuong => {
          const bai = chuong.bai_hocs?.find(b => b.id === highlightBaiId)
          if (bai) tenBai = bai.tieu_de
        })
        setSpotlightEl(el)
        setSpotlightTen(tenBai)
        setShowSpotlight(true)
      }
    }, 600)
    return () => clearTimeout(t)
  }, [highlightBaiId, loading, mucLuc])

  return (
    <>
      {showSpotlight && spotlightEl && (
        <SpotlightBai
          targetEl={spotlightEl}
          tenBai={spotlightTen}
          onClose={() => setShowSpotlight(false)}
        />
      )}

      <div className="flex flex-col gap-5">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-slate-400 hover:text-blue-600 text-sm mb-3 transition-colors group">
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform"/> Quay lại
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-200">
              <BookOpen size={20} className="text-white"/>
            </div>
            <div>
              <h1 className="text-slate-800 text-lg font-bold">{mon.ten}</h1>
              <p className="text-slate-400 text-sm">Chọn bài muốn học</p>
            </div>
          </div>
        </div>

        {loading ? <SkeletonMucLuc/> : mucLuc.length===0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center shadow-sm">
            <p className="text-slate-400">Môn này chưa có bài học. Upload tài liệu để thêm!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {mucLuc.map((chuong,cidx) => (
              <div key={chuong.id??cidx} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={()=>setMo(prev=>({...prev,[chuong.id??cidx]:!prev[chuong.id??cidx]}))}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm shadow-blue-200">{cidx+1}</div>
                  <div className="flex-1 text-left">
                    <p className="text-slate-800 font-semibold text-sm">{chuong.tieu_de}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{chuong.bai_hocs?.length||0} bài học</p>
                  </div>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${mo[chuong.id??cidx]?'rotate-180':''}`}/>
                </button>
                {mo[chuong.id??cidx] && (
                  <div className="border-t border-slate-100">
                    {(chuong.bai_hocs||[]).map((bai,bidx) => {
                      const isHighlight = bai.id === highlightBaiId
                      return (
                        <button
                          key={bai.id}
                          ref={el => baiRefs.current[bai.id] = el}
                          onClick={()=>onChon(bai)}
                          className={`w-full flex items-center gap-4 px-5 py-3.5 pl-14
                            transition-all border-b border-slate-50 last:border-0 group
                            ${isHighlight
                              ? 'bg-blue-50 border-l-4 border-l-blue-500'
                              : 'hover:bg-blue-50'
                            }`}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0
                            ${isHighlight ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {bidx+1}
                          </div>
                          <div className="flex-1 text-left">
                            <p className={`text-sm font-medium transition-colors
                              ${isHighlight ? 'text-blue-700 font-semibold' : 'text-slate-700 group-hover:text-blue-700'}`}>
                              {bai.tieu_de}
                              {isHighlight && <span className="ml-2 text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">📍 Bài cần học</span>}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <DoKhoLabel do_kho={bai.do_kho}/>
                              {bai.so_cau_hoi>0 && <span className="text-slate-400 text-xs">{bai.so_cau_hoi} câu hỏi</span>}
                            </div>
                          </div>
                          <ChevronRight size={15} className={isHighlight?'text-blue-400':'text-slate-300 group-hover:text-blue-400 transition-colors'}/>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ── Học bài ──────────────────────────────────────────────────────────────────
function HocBai({ bai, mon, onBack, onDoBai, cuocTroChuyen, onExpandChat }) {
  const [buoc, setBuoc]           = useState(1)
  const [huongDan, setHuongDan]   = useState(null)
  const [loading, setLoading]     = useState(false)
  const [showDoBai, setShowDoBai] = useState(false)
  const doBaiBtnRef               = useRef(null)

  useEffect(() => { cuocTroChuyen.reset(); cuocTroChuyen.khoiTaoCuoc(`Bài: ${bai.tieu_de}`) }, [bai.id])

  const layHuongDan = useCallback(async (b) => {
    setLoading(true); setHuongDan(null)
    try {
      const res = await fetch(`${API_URL}/api/khoa-hoc/huong-dan`, {
        method:'POST', headers:authHeader(),
        body:JSON.stringify({ id_tai_lieu:bai.id, buoc_hien_tai:b }),
      })
      setHuongDan(await res.json())
    } finally { setLoading(false) }
  }, [bai.id])

  useEffect(() => { layHuongDan(1) }, [])
  const buocTiep  = () => { const n=buoc+1; setBuoc(n); layHuongDan(n) }
  const buocTruoc = () => { const p=buoc-1; setBuoc(p); layHuongDan(p) }
  const pct = huongDan?.tong_buoc ? Math.round((buoc/huongDan.tong_buoc)*100) : 0

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-blue-600 text-sm mb-3 transition-colors group">
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform"/> {mon.ten}
        </button>
        <h1 className="text-slate-800 text-lg font-bold mb-3">{bai.tieu_de}</h1>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{width:`${pct}%`}}/>
          </div>
          <span className="text-slate-500 text-xs flex-shrink-0 font-medium">Bước {buoc}/{huongDan?.tong_buoc||'...'}</span>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm min-h-48">
        {loading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex-shrink-0"/>
              <div><div className="w-20 h-3 rounded bg-slate-100 mb-1.5"/><div className="w-28 h-3 rounded bg-slate-100"/></div>
            </div>
            {Array(5).fill(0).map((_,i)=><div key={i} className="h-3.5 rounded bg-slate-100" style={{width:`${85-i*8}%`}}/>)}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-200"><GraduationCap size={16} className="text-white"/></div>
              <div>
                <p className="text-blue-600 text-xs font-semibold uppercase tracking-wider">Gia sư AI</p>
                {huongDan?.ten_bai && <p className="text-slate-400 text-xs">{huongDan.ten_bai}</p>}
              </div>
            </div>
            <NoiDungAI text={huongDan?.noi_dung}/>
          </>
        )}
      </div>

      {!loading && (
        <div className="flex gap-3">
          {buoc>1 && (
            <button onClick={buocTruoc} className="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-medium hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              <ArrowLeft size={15}/> Bước trước
            </button>
          )}
          {!huongDan?.la_buoc_cuoi ? (
            <button onClick={buocTiep} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all active:scale-[0.98] shadow-md shadow-blue-200 flex items-center justify-center gap-2 group">
              Tiếp theo <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform"/>
            </button>
          ) : (
            <button
              ref={doBaiBtnRef}
              onClick={() => setShowDoBai(true)}
              className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm
                hover:bg-emerald-700 transition-all active:scale-[0.98] shadow-md shadow-emerald-200"
            >
              Dò bài ôn lại
            </button>
          )}
        </div>
      )}

      {showDoBai && doBaiBtnRef.current && (
        <SpotlightDoBai
          targetEl={doBaiBtnRef.current}
          tenBai={bai.tieu_de}
          onClose={() => setShowDoBai(false)}
          onDoBai={() => onDoBai({ ...bai, id_chuDe: mon.id, ten_chu_de: mon.ten })}
        />
      )}
    </div>
  )
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function CoursesPage({ params = {}, onNavigateToDoBai }) {
  const [screen, setScreen]   = useState('mon')
  const [monChon, setMonChon] = useState(null)
  const [baiChon, setBaiChon] = useState(null)
  const [cuocModal, setCuocModal] = useState(null)
  const [chatLon, setChatLon] = useState(false)

  const cuocTroChuyen = useCuocTroChuyen()
  const dangHocBai = screen === 'hoc' && baiChon

  // Từ Lộ trình navigate sang: tự mở đúng môn, vào thẳng bài nếu có id_tai_lieu
  useEffect(() => {
    if (!params?.id_chuDe) return
    fetch(`${API_URL}/api/khoa-hoc/mon-hoc`, { headers: authHeader() })
      .then(r => r.json())
      .then(data => {
        const mon = (Array.isArray(data) ? data : []).find(m => m.id === params.id_chuDe)
        if (!mon) return
        setMonChon(mon)

        if (params?.id_tai_lieu) {
          // Fetch mục lục → tìm bài → vào thẳng HocBai
          fetch(`${API_URL}/api/khoa-hoc/muc-luc/${params.id_chuDe}`, { headers: authHeader() })
            .then(r => r.json())
            .then(mlData => {
              const ds = mlData?.muc_luc || []
              let baiTim = null
              for (const chuong of ds) {
                const b = chuong.bai_hocs?.find(b => b.id === params.id_tai_lieu)
                if (b) { baiTim = b; break }
              }
              if (baiTim) {
                setBaiChon(baiTim)
                setScreen('hoc')
              } else {
                setScreen('bai')
              }
            })
            .catch(() => setScreen('bai'))
        } else {
          setScreen('bai')
        }
      })
      .catch(() => {})
  }, [params?.id_chuDe, params?.id_tai_lieu])

  return (
    <div className="flex gap-5 h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto min-h-0 min-w-0">
        {screen==='mon' && <ChonMonHoc onChon={mon=>{ setMonChon(mon); setScreen('bai') }}/>}
        {screen==='bai' && monChon && (
          <ChonBaiHoc
            mon={monChon}
            onChon={bai=>{ setBaiChon(bai); setScreen('hoc') }}
            onBack={()=>setScreen('mon')}
            // --- FIX: truyền id_tai_lieu để spotlight đúng bài ---
            highlightBaiId={params?.id_tai_lieu ?? null}
          />
        )}
        {screen==='hoc' && baiChon && monChon && (
          <HocBai
            bai={baiChon} mon={monChon}
            onBack={()=>setScreen('bai')}
            onDoBai={bai=>onNavigateToDoBai?.(bai)}
            cuocTroChuyen={cuocTroChuyen}
            onExpandChat={()=>setChatLon(true)}
          />
        )}
      </div>

      <div className="w-64 flex-shrink-0 h-full min-h-0">
        {dangHocBai
          ? <MiniChatbox tenBai={baiChon.tieu_de} onExpand={()=>setChatLon(true)} cuocTroChuyen={cuocTroChuyen}/>
          : <LichSuPanel onChonCuoc={cuoc=>setCuocModal(cuoc)}/>
        }
      </div>

      {chatLon && <ChatboxLon tenBai={baiChon?.tieu_de} onClose={()=>setChatLon(false)} cuocTroChuyen={cuocTroChuyen}/>}
      {cuocModal && <ModalCuocTroChuyen cuoc={cuocModal} onClose={()=>setCuocModal(null)}/>}
    </div>
  )
}