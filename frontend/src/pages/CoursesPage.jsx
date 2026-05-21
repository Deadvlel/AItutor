import { useState, useEffect, useRef, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeader() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}

/* ─── Render markdown bold ─── */
function NoiDungAI({ text }) {
  if (!text) return null
  const parts = []
  const regex = /\*\*(.+?)\*\*/g
  let lastIdx = 0, match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push({ type: 'text', value: text.slice(lastIdx, match.index) })
    parts.push({ type: 'bold', value: match[1] })
    lastIdx = match.index + match[0].length
  }
  if (lastIdx < text.length) parts.push({ type: 'text', value: text.slice(lastIdx) })
  return (
    <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) =>
        part.type === 'bold'
          ? <strong key={i} className="text-white font-semibold">{part.value}</strong>
          : <span key={i}>{part.value}</span>
      )}
    </p>
  )
}

/* ─── Hook cuộc trò chuyện ─── */
function useCuocTroChuyen() {
  const [idCuoc, setIdCuoc]     = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(false)

  const khoiTaoCuoc = useCallback(async (tieuDe = null) => {
    try {
      const res = await fetch(`${API_URL}/api/cuoc-tro-chuyen/tao-moi`, {
        method: 'POST', headers: authHeader(),
        body: JSON.stringify({ tieu_de: tieuDe }),
      })
      const data = await res.json()
      setIdCuoc(data.id)
      setMessages([{ role: 'assistant', content: 'Xin chào Em! 😊 Thầy ở đây để giúp Em. Hỏi Thầy bất cứ điều gì về bài học nhé!' }])
      return data.id
    } catch { return null }
  }, [])

  const guiTin = useCallback(async (noiDung, idOverride = null) => {
    const cuocId = idOverride || idCuoc
    if (!cuocId || loading) return null
    setMessages(prev => [...prev, { role: 'user', content: noiDung }])
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/cuoc-tro-chuyen/gui`, {
        method: 'POST', headers: authHeader(),
        body: JSON.stringify({ id_cuoc: cuocId, noi_dung: noiDung }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || '' }])
      return data
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lỗi kết nối, Em thử lại nhé!' }])
      return null
    } finally { setLoading(false) }
  }, [idCuoc, loading])

  const reset = useCallback(() => { setIdCuoc(null); setMessages([]); setLoading(false) }, [])

  return { idCuoc, messages, loading, khoiTaoCuoc, guiTin, reset }
}

/* ─── Cột phải: Lịch sử hội thoại (hiện khi không học bài) ─── */
function LichSuPanel({ onChonCuoc }) {
  const [danhSach, setDanhSach] = useState([])
  const [loading, setLoading]   = useState(true)

  const loadDanhSach = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/cuoc-tro-chuyen/lich-su`, { headers: authHeader() })
      const data = await res.json()
      setDanhSach(Array.isArray(data) ? data : [])
    } catch { setDanhSach([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadDanhSach() }, [])

  const xoaCuoc = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Xóa cuộc trò chuyện này?')) return
    try {
      await fetch(`${API_URL}/api/cuoc-tro-chuyen/${id}`, { method: 'DELETE', headers: authHeader() })
      setDanhSach(prev => prev.filter(c => c.id !== id))
    } catch {}
  }

  return (
    <div className="flex flex-col h-full bg-[#0f0c28] border border-white/8 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/8 flex-shrink-0">
        <p className="text-white text-sm font-semibold">Lịch sử trò chuyện</p>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : danhSach.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 px-4 text-center">
            <p className="text-2xl mb-2">💬</p>
            <p className="text-slate-500 text-xs">Chưa có cuộc trò chuyện nào</p>
          </div>
        ) : (
          <div className="flex flex-col py-1">
            {danhSach.map(cuoc => (
              <button
                key={cuoc.id}
                onClick={() => onChonCuoc?.(cuoc)}
                className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-all group text-left border-b border-white/5 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-xs font-medium truncate group-hover:text-white transition-colors">
                    {cuoc.tieu_de}
                  </p>
                  <p className="text-slate-600 text-xs mt-0.5">{cuoc.ngay_tao}</p>
                </div>
                <button
                  onClick={(e) => xoaCuoc(cuoc.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all flex-shrink-0 text-xs p-0.5 rounded"
                >🗑️</button>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Mini Chatbox (cột phải khi học bài) ─── */
function MiniChatbox({ tenBai, onExpand, cuocTroChuyen }) {
  const [input, setInput] = useState('')
  const msgEndRef = useRef(null)
  const { messages, loading, idCuoc, khoiTaoCuoc, guiTin } = cuocTroChuyen

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const guiCauHoi = async () => {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    let cuocId = idCuoc
    if (!cuocId) cuocId = await khoiTaoCuoc(tenBai ? `Bài: ${tenBai}` : null)
    if (cuocId) await guiTin(q, cuocId)
  }

  return (
    <div className="flex flex-col h-full bg-[#1a1640] border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#1e1b4b] flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">🎓</span>
          <p className="text-white text-xs font-semibold">Hỏi gia sư AI</p>
          {loading && <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />}
        </div>
        <button onClick={onExpand} className="text-slate-400 hover:text-white text-xs transition-colors flex items-center gap-1">
          ⛶ Phóng to
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2 min-h-0">
        {messages.length === 0 && !loading ? (
          <p className="text-slate-500 text-xs leading-relaxed py-2">💡 Gõ câu hỏi để hỏi Thầy về bài học!</p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`text-xs leading-relaxed rounded-xl px-2.5 py-2 flex-shrink-0
              ${m.role === 'user' ? 'bg-violet-600/40 text-violet-100 ml-4' : 'bg-white/5 text-slate-300 mr-4'}`}>
              {m.role === 'assistant' ? <NoiDungAI text={m.content} /> : m.content}
            </div>
          ))
        )}
        {loading && (
          <div className="bg-white/5 rounded-xl px-2.5 py-2 mr-4 flex-shrink-0">
            <div className="flex gap-1 items-center">
              {[0,1,2].map(j => <div key={j} className="w-1 h-1 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${j*0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={msgEndRef} />
      </div>
      <div className="flex gap-2 px-3 py-2 border-t border-white/5 flex-shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && guiCauHoi()}
          placeholder="Hỏi về bài học..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5
            text-xs text-white placeholder-slate-600 outline-none focus:border-amber-400/40 transition-colors"
        />
        <button onClick={guiCauHoi} disabled={loading || !input.trim()}
          className="w-7 h-7 rounded-lg bg-amber-400 text-[#0a0720] flex items-center
            justify-center text-xs font-bold hover:bg-amber-300 disabled:opacity-40 transition-all flex-shrink-0">
          {loading ? '·' : '➤'}
        </button>
      </div>
    </div>
  )
}

/* ─── Chatbox phóng to: fixed full screen ─── */
function ChatboxLon({ tenBai, onClose, cuocTroChuyen }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const { messages, loading, idCuoc, khoiTaoCuoc, guiTin } = cuocTroChuyen

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const guiCauHoi = async () => {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    let cuocId = idCuoc
    if (!cuocId) cuocId = await khoiTaoCuoc(tenBai ? `Bài: ${tenBai}` : null)
    if (cuocId) await guiTin(q, cuocId)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-end p-4">
      <div className="w-full max-w-lg h-[75vh] bg-[#130f2e] border border-white/10 rounded-2xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center text-base">🎓</div>
            <div>
              <p className="text-white font-semibold text-sm">Gia sư AI</p>
              <p className="text-emerald-400 text-xs">● Sẵn sàng hỗ trợ</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="flex items-end gap-2 flex-row-reverse">
                <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center text-xs flex-shrink-0">👤</div>
                <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-br-sm bg-violet-600 text-white text-sm leading-relaxed">{m.content}</div>
              </div>
            ) : (
              <div key={i} className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-xs flex-shrink-0">🎓</div>
                <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-[#1e1b4b] border border-white/10 text-sm leading-relaxed">
                  <NoiDungAI text={m.content} />
                </div>
              </div>
            )
          )}
          {loading && (
            <div className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-xs">🎓</div>
              <div className="px-3.5 py-3 rounded-2xl rounded-bl-sm bg-[#1e1b4b] border border-white/10">
                <div className="flex gap-1">
                  {[0,1,2].map(j => <div key={j} className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${j*0.15}s` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2 px-4 py-3 border-t border-white/10 flex-shrink-0">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && guiCauHoi()}
            placeholder="Hỏi Thầy về bài học..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
              text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/40 transition-colors"
          />
          <button onClick={guiCauHoi} disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-amber-400 text-[#0a0720] font-bold text-sm
              hover:bg-amber-300 disabled:opacity-40 transition-all active:scale-[0.97] flex-shrink-0">
            Gửi
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Modal xem chi tiết 1 cuộc trò chuyện ─── */
function ModalCuocTroChuyen({ cuoc, onClose }) {
  const [tinNhans, setTinNhans] = useState([])
  const [loading, setLoading]   = useState(true)
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetch(`${API_URL}/api/cuoc-tro-chuyen/tin-nhan/${cuoc.id}`, { headers: authHeader() })
      .then(r => r.json())
      .then(data => { setTinNhans(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [cuoc.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [tinNhans, sending])

  const guiTin = async () => {
    const q = input.trim()
    if (!q || sending) return
    setInput('')
    setSending(true)
    setTinNhans(prev => [...prev, { id: Date.now(), role: 'user', noi_dung: q }])
    try {
      const res = await fetch(`${API_URL}/api/cuoc-tro-chuyen/gui`, {
        method: 'POST', headers: authHeader(),
        body: JSON.stringify({ id_cuoc: cuoc.id, noi_dung: q }),
      })
      const data = await res.json()
      setTinNhans(prev => [...prev, { id: Date.now()+1, role: 'assistant', noi_dung: data.reply || '' }])
    } catch {
      setTinNhans(prev => [...prev, { id: Date.now()+1, role: 'assistant', noi_dung: 'Lỗi kết nối!' }])
    } finally { setSending(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg h-[75vh] bg-[#130f2e] border border-white/10 rounded-2xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-sm">🎓</div>
            <div>
              <p className="text-white font-semibold text-sm truncate max-w-xs">{cuoc.tieu_de}</p>
              <p className="text-slate-500 text-xs">{cuoc.ngay_tao}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tinNhans.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-12">Chưa có tin nhắn.</p>
          ) : tinNhans.map((m, i) => (
            m.role === 'user' ? (
              <div key={m.id ?? i} className="flex items-end gap-2 flex-row-reverse">
                <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center text-xs flex-shrink-0">👤</div>
                <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-br-sm bg-violet-600 text-white text-sm leading-relaxed">{m.noi_dung}</div>
              </div>
            ) : (
              <div key={m.id ?? i} className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-xs flex-shrink-0">🎓</div>
                <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-[#1e1b4b] border border-white/10 text-sm leading-relaxed">
                  <NoiDungAI text={m.noi_dung} />
                </div>
              </div>
            )
          ))}
          {sending && (
            <div className="flex items-end gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center text-xs">🎓</div>
              <div className="px-3.5 py-3 rounded-2xl rounded-bl-sm bg-[#1e1b4b] border border-white/10">
                <div className="flex gap-1">
                  {[0,1,2].map(j => <div key={j} className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${j*0.15}s` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2 px-4 py-3 border-t border-white/10 flex-shrink-0">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && guiTin()}
            placeholder="Nhắn tin cho Thầy..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5
              text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/40 transition-colors"
          />
          <button onClick={guiTin} disabled={sending || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-amber-400 text-[#0a0720] font-bold text-sm
              hover:bg-amber-300 disabled:opacity-40 transition-all flex-shrink-0">
            Gửi
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Chọn môn học ─── */
function ChonMonHoc({ onChon }) {
  const [monHocs, setMonHocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/khoa-hoc/mon-hoc`, { headers: authHeader() })
      .then(r => r.json())
      .then(data => { setMonHocs(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Chọn môn học 📚</h1>
        <p className="text-slate-400 text-sm mt-1">AI gia sư hướng dẫn từng bước theo SGK</p>
      </div>
      {monHocs.length === 0 ? (
        <div className="bg-[#130f2e] border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-white font-semibold">Chưa có môn học nào</p>
          <p className="text-slate-400 text-sm mt-1">Upload chương trình học để bắt đầu</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {monHocs.map(mon => (
            <button key={mon.id} onClick={() => onChon(mon)}
              className={`bg-gradient-to-br ${mon.color} rounded-2xl p-6 text-left
                hover:opacity-90 hover:scale-[1.02] transition-all active:scale-[0.98] shadow-lg`}>
              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl">{mon.emoji}</span>
                <span className="text-white/60 text-xs bg-white/10 px-2 py-1 rounded-full">{mon.so_bai} bài</span>
              </div>
              <p className="text-white text-lg font-bold leading-tight">{mon.ten}</p>
              <p className="text-white/60 text-xs mt-1">Bấm để xem bài học →</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Chọn bài học ─── */
function ChonBaiHoc({ mon, onChon, onBack }) {
  const [mucLuc, setMucLuc]   = useState([])
  const [loading, setLoading] = useState(true)
  const [mo, setMo]           = useState({})

  useEffect(() => {
    fetch(`${API_URL}/api/khoa-hoc/muc-luc/${mon.id}`, { headers: authHeader() })
      .then(r => r.json())
      .then(data => {
        const ds = data?.muc_luc || []
        setMucLuc(ds)
        if (ds.length > 0) setMo({ [ds[0].id ?? 0]: true })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [mon.id])

  const DoKhoLabel = ({ do_kho }) => {
    const map = { 1: ['Dễ','text-emerald-400'], 2: ['Trung bình','text-amber-400'], 3: ['Khó','text-red-400'] }
    const [text, cls] = map[do_kho] || ['?','text-gray-400']
    return <span className={`text-xs font-medium ${cls}`}>{'⭐'.repeat(do_kho)} {text}</span>
  }

  return (
    <div className="flex flex-col gap-5">
      <div className={`bg-gradient-to-r ${mon.color} rounded-2xl p-6`}>
        <button onClick={onBack} className="text-white/60 text-sm hover:text-white mb-3 flex items-center gap-1">← Quay lại</button>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{mon.emoji}</span>
          <div>
            <h1 className="text-white text-xl font-bold">{mon.ten}</h1>
            <p className="text-white/60 text-sm">Chọn bài muốn học</p>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : mucLuc.length === 0 ? (
        <div className="bg-[#130f2e] border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-slate-400">Môn này chưa có bài học. Upload tài liệu để thêm!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {mucLuc.map((chuong, cidx) => (
            <div key={chuong.id ?? cidx} className="bg-[#130f2e] border border-white/10 rounded-2xl overflow-hidden">
              <button
                onClick={() => setMo(prev => ({ ...prev, [chuong.id ?? cidx]: !prev[chuong.id ?? cidx] }))}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-all">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${mon.color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                  {cidx + 1}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-semibold text-sm">{chuong.tieu_de}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{chuong.bai_hocs?.length || 0} bài</p>
                </div>
                <span className={`text-slate-400 text-xs transition-transform duration-200 ${mo[chuong.id ?? cidx] ? 'rotate-90' : ''}`}>▶</span>
              </button>
              {mo[chuong.id ?? cidx] && (
                <div className="border-t border-white/5">
                  {(chuong.bai_hocs || []).map((bai, bidx) => (
                    <button key={bai.id} onClick={() => onChon(bai)}
                      className="w-full flex items-center gap-4 px-5 py-3.5 pl-14
                        hover:bg-white/5 transition-all border-b border-white/5 last:border-0 group">
                      <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 text-xs flex-shrink-0">
                        {bidx + 1}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-slate-200 text-sm group-hover:text-white transition-colors">{bai.tieu_de}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <DoKhoLabel do_kho={bai.do_kho} />
                          {bai.so_cau_hoi > 0 && <span className="text-slate-500 text-xs">{bai.so_cau_hoi} câu hỏi</span>}
                        </div>
                      </div>
                      <span className="text-slate-600 group-hover:text-violet-400 transition-colors text-sm">→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Học bài ─── */
function HocBai({ bai, mon, onBack, onDoBai, cuocTroChuyen, onExpandChat }) {
  const [buoc, setBuoc]                = useState(1)
  const [huongDan, setHuongDan]        = useState(null)
  const [loading, setLoading]          = useState(false)
  const [showDoBaiPopup, setShowDoBai] = useState(false)

  useEffect(() => {
    cuocTroChuyen.reset()
    cuocTroChuyen.khoiTaoCuoc(`Bài: ${bai.tieu_de}`)
  }, [bai.id])

  const layHuongDan = useCallback(async (b) => {
    setLoading(true); setHuongDan(null)
    try {
      const res = await fetch(`${API_URL}/api/khoa-hoc/huong-dan`, {
        method: 'POST', headers: authHeader(),
        body: JSON.stringify({ id_tai_lieu: bai.id, buoc_hien_tai: b }),
      })
      setHuongDan(await res.json())
    } finally { setLoading(false) }
  }, [bai.id])

  useEffect(() => { layHuongDan(1) }, [])

  const buocTiep  = () => { const n = buoc + 1; setBuoc(n); layHuongDan(n) }
  const buocTruoc = () => { const p = buoc - 1; setBuoc(p); layHuongDan(p) }
  const pct = huongDan?.tong_buoc ? Math.round((buoc / huongDan.tong_buoc) * 100) : 0

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Header */}
      <div className={`bg-gradient-to-r ${mon.color} rounded-2xl p-5 flex-shrink-0`}>
        <button onClick={onBack} className="text-white/60 text-sm hover:text-white mb-2 flex items-center gap-1">
          ← {mon.ten}
        </button>
        <h1 className="text-white text-lg font-bold">{bai.tieu_de}</h1>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white/80 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-white/70 text-xs flex-shrink-0">Bước {buoc}/{huongDan?.tong_buoc || '...'}</span>
        </div>
      </div>

      {/* Nội dung AI */}
      <div className="bg-[#130f2e] border border-white/10 rounded-2xl p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Thầy AI đang chuẩn bị...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-sm flex-shrink-0">🎓</div>
              <div>
                <p className="text-amber-400 text-xs font-medium uppercase tracking-wider">Gia sư AI</p>
                {huongDan?.ten_bai && <p className="text-slate-500 text-xs">{huongDan.ten_bai}</p>}
              </div>
            </div>
            <NoiDungAI text={huongDan?.noi_dung} />
          </>
        )}
      </div>

      {/* Nút điều hướng */}
      {!loading && (
        <div className="flex gap-3">
          {buoc > 1 && (
            <button onClick={buocTruoc}
              className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-all">
              ← Bước trước
            </button>
          )}
          {!huongDan?.la_buoc_cuoi ? (
            <button onClick={buocTiep}
              className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-medium text-sm hover:bg-violet-500 transition-all active:scale-[0.98]">
              Tiếp theo →
            </button>
          ) : (
            <button onClick={() => setShowDoBai(true)}
              className="flex-1 py-3 rounded-xl bg-amber-400 text-[#0a0720] font-bold text-sm hover:bg-amber-300 transition-all active:scale-[0.98]">
              🎯 Dò bài ôn lại!
            </button>
          )}
        </div>
      )}

      {/* Popup dò bài */}
      {showDoBaiPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#130f2e] border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center">
            <p className="text-4xl mb-4">🎉</p>
            <p className="text-white text-lg font-bold mb-2">Học xong rồi!</p>
            <p className="text-slate-400 text-sm mb-6">Em muốn dò bài "<span className="text-white">{bai.tieu_de}</span>" không?</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => onDoBai(bai)}
                className="w-full py-3 rounded-xl bg-amber-400 text-[#0a0720] font-bold hover:bg-amber-300 transition-all">
                🎙️ Dò bài ngay!
              </button>
              <button onClick={() => { setShowDoBai(false); onBack() }}
                className="w-full py-3 rounded-xl bg-white/5 text-slate-400 text-sm hover:bg-white/10 transition-all">
                Thôi, học bài khác
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── CoursesPage: layout 2 cột cố định ─── */
export default function CoursesPage({ onNavigateToDoBai }) {
  const [screen, setScreen]       = useState('mon')
  const [monChon, setMonChon]     = useState(null)
  const [baiChon, setBaiChon]     = useState(null)
  const [cuocModal, setCuocModal] = useState(null)
  const [chatLon, setChatLon]     = useState(false)

  const cuocTroChuyen = useCuocTroChuyen()
  const dangHocBai = screen === 'hoc' && baiChon

  return (
    <div className="flex gap-5 h-full overflow-hidden">

      {/* ── Cột trái: nội dung chính ── */}
      <div className="flex-1 overflow-y-auto min-h-0 min-w-0">
        {screen === 'mon' && (
          <ChonMonHoc onChon={mon => { setMonChon(mon); setScreen('bai') }} />
        )}
        {screen === 'bai' && monChon && (
          <ChonBaiHoc
            mon={monChon}
            onChon={bai => { setBaiChon(bai); setScreen('hoc') }}
            onBack={() => setScreen('mon')}
          />
        )}
        {screen === 'hoc' && baiChon && monChon && (
          <HocBai
            bai={baiChon}
            mon={monChon}
            onBack={() => setScreen('bai')}
            onDoBai={bai => onNavigateToDoBai?.(bai)}
            cuocTroChuyen={cuocTroChuyen}
            onExpandChat={() => setChatLon(true)}
          />
        )}
      </div>

      {/* ── Cột phải: lịch sử hoặc mini chatbox ── */}
      <div className="w-64 flex-shrink-0 h-full min-h-0">
        {dangHocBai ? (
          <MiniChatbox
            tenBai={baiChon.tieu_de}
            onExpand={() => setChatLon(true)}
            cuocTroChuyen={cuocTroChuyen}
          />
        ) : (
          <LichSuPanel onChonCuoc={cuoc => setCuocModal(cuoc)} />
        )}
      </div>

      {/* Chatbox phóng to (fixed toàn màn hình) */}
      {chatLon && (
        <ChatboxLon
          tenBai={baiChon?.tieu_de}
          onClose={() => setChatLon(false)}
          cuocTroChuyen={cuocTroChuyen}
        />
      )}

      {/* Modal xem cuộc trò chuyện cũ */}
      {cuocModal && (
        <ModalCuocTroChuyen cuoc={cuocModal} onClose={() => setCuocModal(null)} />
      )}
    </div>
  )
}