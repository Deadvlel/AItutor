import { useState, useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` }
}

// ── Component dùng chung cho PDF và Word ─────────────────────
function UploadAIFile({ loai, onDone }) {
  const config = {
    pdf:  { icon: '📕', label: 'PDF',  accept: '.pdf',        ext: '.pdf',
            mauIcon: '🔴', color: 'from-rose-600 to-rose-800' },
    word: { icon: '📘', label: 'Word', accept: '.docx,.doc',  ext: '.docx / .doc',
            mauIcon: '🔵', color: 'from-blue-600 to-blue-800' },
  }[loai]

  const [file,      setFile]      = useState(null)
  const [tenChuDe,  setTenChuDe]  = useState('')
  const [tieuDe,    setTieuDe]    = useState('')
  const [soCau,     setSoCau]     = useState(5)
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState(null)
  const [error,     setError]     = useState('')
  const inputRef = useRef()

  const handle = async () => {
    if (!file || !tenChuDe || !tieuDe) return
    setLoading(true); setError(''); setResult(null)

    const form = new FormData()
    form.append('file',        file)
    form.append('ten_chu_de',  tenChuDe)
    form.append('tieu_de',     tieuDe)
    form.append('so_cau',      soCau)

    try {
      const res  = await fetch(`${API_URL}/api/do-bai/upload/${loai}`,
        { method: 'POST', headers: authHeader(), body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      setResult(data); onDone?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${file ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/15 hover:border-white/25'}`}>
        <p className="text-3xl mb-1">{file ? config.icon : '⬆️'}</p>
        <p className="text-white text-sm font-medium">{file ? file.name : `Chọn file ${config.label}`}</p>
        <p className="text-slate-500 text-xs mt-0.5">{config.ext} — tối đa 10MB</p>
        <input ref={inputRef} type="file" accept={config.accept} className="hidden"
          onChange={e => setFile(e.target.files[0])} />
      </div>

      {/* Thông tin */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Chủ đề *</label>
          <input value={tenChuDe} onChange={e => setTenChuDe(e.target.value)}
            placeholder="Toán 12, Ngữ văn 11..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm
              text-white placeholder-slate-600 outline-none focus:border-amber-400/40 transition-colors" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Tên bài *</label>
          <input value={tieuDe} onChange={e => setTieuDe(e.target.value)}
            placeholder="Hàm số lũy thừa..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm
              text-white placeholder-slate-600 outline-none focus:border-amber-400/40 transition-colors" />
        </div>
      </div>

      {/* Số câu */}
      <div>
        <label className="text-xs text-slate-400 mb-2 block">
          AI sinh <span className="text-amber-400 font-medium">{soCau}</span> câu hỏi
        </label>
        <div className="flex gap-2">
          {[3, 5, 7, 10].map(n => (
            <button key={n} onClick={() => setSoCau(n)}
              className={`flex-1 py-2 rounded-lg text-sm transition-all
                ${soCau === n
                  ? 'bg-amber-400 text-[#0a0720] font-medium'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
              {n}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
          <p className="text-red-400 text-sm">⚠ {error}</p>
        </div>
      )}

      {result && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
          <p className="text-emerald-400 font-semibold text-sm">✅ {result.message}</p>
          <div className="flex flex-col gap-1 mt-2 max-h-36 overflow-y-auto">
            {result.cac_cau_hoi?.map((c, i) => (
              <p key={i} className="text-slate-400 text-xs">• {c}</p>
            ))}
          </div>
        </div>
      )}

      <button onClick={handle}
        disabled={!file || !tenChuDe || !tieuDe || loading}
        className="w-full py-3 rounded-xl bg-amber-400 text-[#0a0720] font-semibold text-sm
          hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-[#0a0720]/30 border-t-[#0a0720] rounded-full animate-spin" />
            AI đang đọc và tạo câu hỏi...
          </span>
        ) : `🤖 AI sinh câu hỏi từ ${config.label}`}
      </button>
    </div>
  )
}

// ── Upload Excel/CSV ─────────────────────────────────────────
function UploadExcel({ onDone }) {
  const [file,    setFile]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState('')
  const inputRef = useRef()

  const handle = async () => {
    if (!file) return
    setLoading(true); setError(''); setResult(null)
    const form = new FormData()
    form.append('file', file)
    try {
      const res  = await fetch(`${API_URL}/api/do-bai/upload/excel`,
        { method: 'POST', headers: authHeader(), body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      setResult(data); onDone?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${file ? 'border-violet-500/50 bg-violet-500/5' : 'border-white/15 hover:border-white/25'}`}>
        <p className="text-3xl mb-2">{file ? '📄' : '⬆️'}</p>
        <p className="text-white text-sm font-medium">{file ? file.name : 'Chọn file Excel / CSV'}</p>
        <p className="text-slate-500 text-xs mt-1">.xlsx, .xls, .csv — tối đa 5MB</p>
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
          onChange={e => setFile(e.target.files[0])} />
      </div>

      {/* Tải file mẫu */}
      <p className="text-center text-xs text-slate-500">
        Chưa có file mẫu?{' '}
        <a href={`${API_URL}/api/do-bai/tai-file-mau`}
          className="text-amber-400 hover:text-amber-300 transition-colors">
          Tải file mẫu Excel
        </a>
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
          <p className="text-red-400 text-sm">⚠ {error}</p>
        </div>
      )}

      {result && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
          <p className="text-emerald-400 font-semibold text-sm">✅ {result.message}</p>
          <p className="text-slate-400 text-xs mt-1">Bài: {result.bai_hocs?.join(', ')}</p>
        </div>
      )}

      <button onClick={handle} disabled={!file || loading}
        className="w-full py-3 rounded-xl bg-violet-600 text-white font-medium text-sm
          hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Đang xử lý...
          </span>
        ) : '⬆️ Upload và lưu câu hỏi'}
      </button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
const TABS = [
  { id: 'excel', label: '📊 Excel / CSV', desc: 'Tự soạn câu hỏi' },
  { id: 'pdf',   label: '📕 PDF',          desc: 'AI sinh câu hỏi' },
  { id: 'word',  label: '📘 Word',         desc: 'AI sinh câu hỏi' },
]

export default function UploadBaiHocPage({ onDone }) {
  const [tab, setTab] = useState('excel')

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-700 to-violet-900 rounded-2xl p-6">
        <p className="text-violet-300 text-xs uppercase tracking-wider mb-1">Quản lý nội dung</p>
        <h1 className="text-white text-xl font-semibold">Tải chương trình học lên 📚</h1>
        <p className="text-violet-200/70 text-sm mt-1">
          Excel: tự soạn câu hỏi · PDF/Word: AI tự sinh câu hỏi từ nội dung
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white/5 rounded-xl p-1 flex gap-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 rounded-lg text-sm transition-all flex flex-col items-center gap-0.5
              ${tab === t.id
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-white'}`}>
            <span className="font-medium">{t.label}</span>
            <span className="text-xs opacity-70">{t.desc}</span>
          </button>
        ))}
      </div>

      {/* Nội dung tab */}
      <div className="bg-[#130f2e] border border-white/10 rounded-2xl p-6">
        {tab === 'excel' && <UploadExcel onDone={onDone} />}
        {tab === 'pdf'   && <UploadAIFile loai="pdf"  onDone={onDone} />}
        {tab === 'word'  && <UploadAIFile loai="word" onDone={onDone} />}
      </div>
    </div>
  )
}
