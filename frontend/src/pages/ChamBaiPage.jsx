import { useState, useRef } from 'react'
import {
  Camera, Upload, X, Loader2, CheckCircle2, XCircle,
  AlertCircle, FileText, Sparkles, ImagePlus
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}

function KetQuaChamBai({ data, onLamLai }) {
  if (!data) return null

  const diem = data.diem ?? -1
  const diemColor = diem >= 8
    ? 'text-emerald-600'
    : diem >= 6.5
      ? 'text-blue-600'
      : diem >= 5
        ? 'text-amber-600'
        : 'text-red-500'

  const diemBg = diem >= 8
    ? 'from-emerald-500 to-emerald-600'
    : diem >= 6.5
      ? 'from-blue-500 to-blue-600'
      : diem >= 5
        ? 'from-amber-500 to-amber-600'
        : 'from-red-500 to-red-600'

  if (diem < 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <AlertCircle size={20} className="text-amber-500" />
          </div>
          <div>
            <p className="text-slate-800 font-bold">Khong the cham diem</p>
            <p className="text-slate-400 text-sm">{data.nhan_xet || 'Khong doc duoc bai lam tu anh. Thu chup lai ro hon.'}</p>
          </div>
        </div>
        <button
          onClick={onLamLai}
          className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"
        >
          Thu lai
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${diemBg} flex items-center justify-center shadow-lg`}>
            <span className="text-white text-3xl font-bold">{diem}</span>
          </div>
          <div className="flex-1">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Ket qua cham bai</p>
            <p className={`text-2xl font-bold ${diemColor}`}>
              {diem >= 8 ? 'Gioi' : diem >= 6.5 ? 'Kha' : diem >= 5 ? 'Trung binh' : 'Can co gang'}
            </p>
            <p className="text-slate-500 text-sm mt-1">{data.nhan_xet}</p>
          </div>
        </div>
      </div>

      {data.noi_dung_doc_duoc && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-blue-600" />
            <p className="text-slate-800 font-bold text-sm">Noi dung doc duoc</p>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-xl p-4">
            {data.noi_dung_doc_duoc}
          </p>
        </div>
      )}

      {data.chi_tiet && data.chi_tiet.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <p className="text-slate-800 font-bold text-sm mb-4">Chi tiet tung phan</p>
          <div className="flex flex-col gap-2">
            {data.chi_tiet.map((ct, i) => {
              const icon = ct.dung_sai === 'dung'
                ? <CheckCircle2 size={16} className="text-emerald-500" />
                : ct.dung_sai === 'mot_phan'
                  ? <AlertCircle size={16} className="text-amber-500" />
                  : <XCircle size={16} className="text-red-500" />

              const bg = ct.dung_sai === 'dung'
                ? 'bg-emerald-50 border-emerald-100'
                : ct.dung_sai === 'mot_phan'
                  ? 'bg-amber-50 border-amber-100'
                  : 'bg-red-50 border-red-100'

              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${bg}`}>
                  <div className="mt-0.5 flex-shrink-0">{icon}</div>
                  <div>
                    <p className="text-slate-700 text-sm font-semibold">{ct.phan}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{ct.ghi_chu}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {data.goi_y && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-blue-600" />
            <p className="text-blue-700 font-bold text-sm">Goi y cai thien</p>
          </div>
          <p className="text-blue-600/80 text-sm leading-relaxed">{data.goi_y}</p>
        </div>
      )}

      <button
        onClick={onLamLai}
        className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"
      >
        Cham bai khac
      </button>
    </div>
  )
}

export default function ChamBaiPage() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [deBai, setDeBai] = useState('')
  const [dapAn, setDapAn] = useState('')
  const [loading, setLoading] = useState(false)
  const [ketQua, setKetQua] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleFile = (f) => {
    if (!f) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!allowed.includes(f.type)) {
      alert('Chi chap nhan anh .jpg, .png, .webp')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      alert('Anh qua lon (toi da 10MB)')
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setKetQua(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async () => {
    if (!file) return
    setLoading(true)
    setKetQua(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('de_bai', deBai)
    formData.append('dap_an', dapAn)

    try {
      const res = await fetch(`${API_URL}/api/cham-bai/upload-anh`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Loi')
      setKetQua(data)
    } catch (err) {
      setKetQua({
        diem: -1,
        nhan_xet: err.message || 'Khong the ket noi den server. Thu lai sau.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLamLai = () => {
    setFile(null)
    setPreview(null)
    setKetQua(null)
    setDeBai('')
    setDapAn('')
  }

  if (ketQua) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        {preview && (
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <img src={preview} alt="Bai lam" className="w-full max-h-64 object-contain rounded-xl" />
          </div>
        )}
        <KetQuaChamBai data={ketQua} onLamLai={handleLamLai} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Camera size={16} className="text-violet-200" />
            <p className="text-violet-200 text-xs font-semibold uppercase tracking-wider">Cham bai</p>
          </div>
          <h1 className="text-white text-xl font-bold">Cham bai tu anh chup</h1>
          <p className="text-violet-100 text-sm mt-1">Chup anh bai lam, AI se doc va cham diem</p>
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={`bg-white border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
          ${dragOver
            ? 'border-violet-400 bg-violet-50'
            : file
              ? 'border-slate-200'
              : 'border-slate-200 hover:border-violet-300 hover:bg-violet-50/30'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {file && preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="Preview" className="max-h-56 rounded-xl mx-auto" />
            <button
              onClick={(e) => { e.stopPropagation(); handleLamLai() }}
              className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
            >
              <X size={14} />
            </button>
            <p className="text-slate-500 text-xs mt-3">{file.name}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
              <ImagePlus size={24} className="text-violet-500" />
            </div>
            <div>
              <p className="text-slate-700 font-semibold text-sm">Keo tha anh vao day hoac nhan de chon</p>
              <p className="text-slate-400 text-xs mt-1">JPG, PNG, WebP - Toi da 10MB</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div>
          <label className="text-slate-700 text-sm font-semibold mb-1.5 block">De bai (tuy chon)</label>
          <textarea
            value={deBai}
            onChange={(e) => setDeBai(e.target.value)}
            placeholder="Nhap de bai de AI cham chinh xac hon..."
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-violet-300 focus:bg-white transition-all resize-none"
          />
        </div>

        <div>
          <label className="text-slate-700 text-sm font-semibold mb-1.5 block">Dap an chuan (tuy chon)</label>
          <textarea
            value={dapAn}
            onChange={(e) => setDapAn(e.target.value)}
            placeholder="Nhap dap an de AI so sanh va cham diem..."
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-violet-300 focus:bg-white transition-all resize-none"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!file || loading}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm
          hover:from-violet-700 hover:to-purple-700 transition-all active:scale-[0.98]
          shadow-lg shadow-violet-200 flex items-center justify-center gap-2
          disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            AI dang doc va cham bai...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Cham bai
          </>
        )}
      </button>
    </div>
  )
}
