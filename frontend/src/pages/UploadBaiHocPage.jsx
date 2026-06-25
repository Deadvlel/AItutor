import { useState, useRef } from 'react'
import { Upload, FileText, MoreVertical, CheckCircle2, Loader2 } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` }
}

const FILE_TABS = [
  { id: 'all', label: 'Tất cả định dạng' },
  { id: 'pdf', label: 'PDF' },
  { id: 'word', label: 'Word (.doc, .docx)' },
  { id: 'excel', label: 'Excel (.xls, .xlsx)' },
]

const ACCEPT_MAP = {
  all: '.pdf,.doc,.docx,.xls,.xlsx,.csv',
  pdf: '.pdf',
  word: '.doc,.docx',
  excel: '.xls,.xlsx,.csv',
}

function getUploadEndpoint(filename) {
  const ext = filename.toLowerCase().split('.').pop()
  if (ext === 'pdf') return 'pdf'
  if (['doc', 'docx'].includes(ext)) return 'word'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel'
  return 'pdf'
}

export default function UploadBaiHocPage({ onDone }) {
  const [tab, setTab] = useState('all')
  const [file, setFile] = useState(null)
  const [tenChuDe, setTenChuDe] = useState('')
  const [tieuDe, setTieuDe] = useState('')
  const [soCau, setSoCau] = useState(5)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [recentFiles, setRecentFiles] = useState([
    { name: 'Bai_giang_Toan_cao_cap_Chuong1.pdf', size: '2.4 MB', time: 'Tải lên 2 giờ trước' },
  ])
  const [processingStep, setProcessingStep] = useState(0)
  const inputRef = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const handleUpload = async () => {
    if (!file) return

    const endpoint = getUploadEndpoint(file.name)
    const maxMB = endpoint === 'excel' ? 5 : 10
    if (file.size > maxMB * 1024 * 1024) {
      setError(`File quá lớn. Tối đa ${maxMB}MB cho ${endpoint === 'excel' ? 'Excel/CSV' : 'PDF/Word'}.`)
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setProcessingStep(1)

    const form = new FormData()
    form.append('file', file)

    if (endpoint !== 'excel') {
      if (!tenChuDe || !tieuDe) {
        setError('Vui lòng nhập chủ đề và tên bài')
        setLoading(false)
        return
      }
      form.append('ten_chu_de', tenChuDe)
      form.append('tieu_de', tieuDe)
      form.append('so_cau', soCau)
    }

    try {
      setProcessingStep(2)
      const res = await fetch(`${API_URL}/api/do-bai/upload/${endpoint}`, {
        method: 'POST',
        headers: authHeader(),
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)
      setProcessingStep(3)
      setResult(data)
      setRecentFiles(prev => [{ name: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)} MB`, time: 'Vừa tải lên' }, ...prev])
      onDone?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const isAIFile = file && getUploadEndpoint(file.name) !== 'excel'

  return (
    <div className="flex gap-6 max-w-5xl">
      <div className="flex-1 flex flex-col gap-6">
        <div>
          <h1 className="text-slate-800 font-bold text-2xl">Tải lên tài liệu</h1>
          <p className="text-slate-400 text-sm mt-1">Kéo thả tài liệu để AI phân tích và tạo bài học tự động.</p>
        </div>

        <div className="flex gap-1 border-b border-slate-200">
          {FILE_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                tab === t.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : file
                ? 'border-blue-300 bg-blue-50/50'
                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
            <Upload size={24} className="text-blue-500" />
          </div>
          {file ? (
            <>
              <p className="text-slate-700 font-semibold">{file.name}</p>
              <p className="text-slate-400 text-sm mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </>
          ) : (
            <>
              <p className="text-slate-700 font-semibold">Kéo thả file vào đây</p>
              <p className="text-slate-400 text-sm mt-1">hoặc click để chọn file từ máy tính</p>
              <p className="text-slate-300 text-xs mt-2">Hỗ trợ PDF, DOCX, XLSX. Tối đa 10MB (Excel: 5MB).</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_MAP[tab]}
            className="hidden"
            onChange={e => setFile(e.target.files[0])}
          />
        </div>

        {isAIFile && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Chủ đề</label>
                <input
                  value={tenChuDe}
                  onChange={e => setTenChuDe(e.target.value)}
                  placeholder="Toán 12, Ngữ văn 11..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-blue-300 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Tên bài</label>
                <input
                  value={tieuDe}
                  onChange={e => setTieuDe(e.target.value)}
                  placeholder="Hàm số lũy thừa..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-blue-300 focus:bg-white transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Số câu hỏi AI sinh</label>
              <div className="flex gap-2">
                {[3, 5, 7, 10].map(n => (
                  <button
                    key={n}
                    onClick={() => setSoCau(n)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                      soCau === n
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                        : 'bg-slate-50 border border-slate-200 text-slate-500 hover:border-blue-300'
                    }`}
                  >
                    {n} câu
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <p className="text-emerald-700 font-semibold text-sm">{result.message}</p>
            {result.cac_cau_hoi && (
              <div className="mt-2 flex flex-col gap-1">
                {result.cac_cau_hoi.map((c, i) => (
                  <p key={i} className="text-slate-600 text-xs">* {c}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {file && (
          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                AI đang xử lý...
              </>
            ) : (
              <>
                <Upload size={16} />
                Tải lên và phân tích
              </>
            )}
          </button>
        )}

        <div>
          <p className="text-slate-800 font-semibold mb-3">Tài liệu gần đây</p>
          <div className="flex flex-col gap-2">
            {recentFiles.map((f, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 text-sm font-medium truncate">{f.name}</p>
                  <p className="text-slate-400 text-xs">{f.size} * {f.time}</p>
                </div>
                <button className="text-slate-300 hover:text-slate-500 transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="w-72 flex-shrink-0">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Loader2 size={14} className="text-white animate-spin" />
              </div>
              <p className="text-slate-800 font-bold text-sm">AI Đang Phân Tích</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 mb-4">
              <p className="text-slate-400 text-xs">Đang xử lý:</p>
              <p className="text-slate-700 text-sm font-medium truncate">{file?.name}</p>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { label: 'Trích xuất văn bản', done: processingStep >= 2 },
                { label: 'Nhận diện khái niệm chính', done: processingStep >= 3, active: processingStep === 2 },
                { label: 'Tạo bộ câu hỏi trắc nghiệm', done: processingStep >= 4, active: processingStep === 3 },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  {s.done ? (
                    <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : s.active ? (
                    <Loader2 size={18} className="text-blue-500 flex-shrink-0 mt-0.5 animate-spin" />
                  ) : (
                    <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-200 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${
                      s.done ? 'text-slate-700' : s.active ? 'text-blue-600' : 'text-slate-400'
                    }`}>
                      {s.label}
                    </p>
                    {s.done && <p className="text-emerald-600 text-xs">Đã hoàn thành 100%</p>}
                    {s.active && <p className="text-blue-500 text-xs">Đang phân tích cú pháp...</p>}
                    {!s.done && !s.active && <p className="text-slate-300 text-xs">Chờ xử lý</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
