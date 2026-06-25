import { useState, useEffect, useCallback, useRef } from 'react'
import { Mic, MicOff, Volume2, RefreshCw, ChevronRight, ArrowLeft, CheckCircle2, XCircle, AlertCircle, BookOpen, Star, ChevronDown, Flag, RotateCcw } from 'lucide-react'
import { speak, useSpeechRecognition } from '../hooks/useSpeech'
import { useDoBai, useDoBaiSession } from '../hooks/useDoBai'
import ThanhTienDo from '../components/DoBai/ThanhTienDo'
import TheCauHoi from '../components/DoBai/TheCauHoi'
import NutMicro from '../components/DoBai/NutMicro'
import ONhapTraLoi from '../components/DoBai/ONhapTraLoi'
import KetQuaThamKhao from '../components/DoBai/KetQuaThamKhao'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array(4).fill(0).map((_, i) => (
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
      {Array(3).fill(0).map((_, i) => (
        <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 animate-pulse">
          <div className="flex gap-3 items-center">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex-shrink-0" />
            <div className="flex-1">
              <div className="w-36 h-4 rounded bg-slate-100 mb-2" />
              <div className="w-16 h-3 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function DoKhoLabel({ do_kho }) {
  const map = {
    1: ['Dễ', 'text-emerald-600 bg-emerald-50'],
    2: ['Trung bình', 'text-amber-600 bg-amber-50'],
    3: ['Khó', 'text-white bg-slate-500'],
  }
  const [text, cls] = map[do_kho] || ['?', 'text-slate-500 bg-slate-50']
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls} flex items-center gap-1`}>
      {Array(do_kho || 0).fill(null).map((_, i) => <Star key={i} size={9} className="fill-current" />)}
      {text}
    </span>
  )
}

function ChonMon({ onChon }) {
  const [monHocs, setMonHocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/khoa-hoc/mon-hoc`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { setMonHocs(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const iconColors = [
    'bg-blue-600', 'bg-violet-600', 'bg-emerald-600', 'bg-amber-500',
    'bg-red-500', 'bg-cyan-600', 'bg-pink-500', 'bg-indigo-600',
  ]

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      <div className="bg-blue-600 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-blue-500/30 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute right-12 bottom-0 w-20 h-20 rounded-full bg-blue-400/20 translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Mic size={14} className="text-blue-200" />
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Dò bài AI</p>
          </div>
          <h1 className="text-white text-xl font-bold">Chọn môn học</h1>
          <p className="text-blue-100 text-sm mt-1">
            AI sinh câu hỏi từ SGK — bạn trả lời bằng giọng nói
          </p>
        </div>
      </div>

      {loading ? <SkeletonGrid /> : monHocs.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
          <BookOpen size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-700 font-semibold">Chưa có môn học nào</p>
          <p className="text-slate-400 text-sm mt-1">Vào trang Khóa học để thêm môn trước nhé!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {monHocs.map((mon, idx) => (
            <button
              key={mon.id}
              onClick={() => onChon(mon)}
              className="bg-white border border-slate-100 rounded-2xl p-6 text-left
                hover:border-blue-200 hover:shadow-md hover:shadow-blue-50 hover:-translate-y-0.5
                transition-all duration-200 active:scale-[0.98] group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${iconColors[idx % iconColors.length]} flex items-center justify-center shadow-sm`}>
                  <BookOpen size={20} className="text-white" />
                </div>
                <span className="text-slate-400 text-xs bg-slate-50 border border-slate-100 px-2 py-1 rounded-full">
                  {mon.so_bai} bài
                </span>
              </div>
              <p className="text-slate-800 text-base font-bold leading-tight group-hover:text-blue-700 transition-colors">
                {mon.ten}
              </p>
              <p className="text-slate-400 text-xs mt-1.5 flex items-center gap-1">
                Chọn bài
                <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ChonBai({ mon, onChon, onBack }) {
  const [mucLuc, setMucLuc] = useState([])
  const [loading, setLoading] = useState(true)
  const [mo, setMo] = useState({})

  useEffect(() => {
    fetch(`${API_URL}/api/khoa-hoc/muc-luc/${mon.id}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        const ds = data?.muc_luc || []
        setMucLuc(ds)
        if (ds.length > 0) setMo({ [ds[0].id ?? 0]: true })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [mon.id])

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-400 hover:text-blue-600 text-sm mb-3 transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Quay lại
        </button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-200">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-slate-800 text-lg font-bold">{mon.ten}</h1>
            <p className="text-slate-400 text-sm">Chọn bài muốn dò</p>
          </div>
        </div>
      </div>

      {loading ? <SkeletonMucLuc /> : mucLuc.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center shadow-sm">
          <p className="text-slate-400">Môn này chưa có bài học nào.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {mucLuc.map((chuong, cidx) => (
            <div key={chuong.id ?? cidx} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => setMo(prev => ({ ...prev, [chuong.id ?? cidx]: !prev[chuong.id ?? cidx] }))}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm shadow-blue-200">
                  {cidx + 1}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-slate-800 font-semibold text-sm">{chuong.tieu_de}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{chuong.bai_hocs?.length || 0} bài học</p>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform duration-200 ${mo[chuong.id ?? cidx] ? 'rotate-180' : ''}`}
                />
              </button>
              {mo[chuong.id ?? cidx] && (
                <div className="border-t border-slate-100">
                  {(chuong.bai_hocs || []).map((bai, bidx) => (
                    <button
                      key={bai.id}
                      onClick={() => onChon(bai)}
                      className="w-full flex items-center gap-4 px-5 py-3.5 pl-14
                        hover:bg-blue-50 transition-all border-b border-slate-50 last:border-0 group"
                    >
                      <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-medium flex-shrink-0">
                        {bidx + 1}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-slate-700 text-sm group-hover:text-blue-700 transition-colors font-medium">
                          {bai.tieu_de}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <DoKhoLabel do_kho={bai.do_kho} />
                        </div>
                      </div>
                      <Mic size={14} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
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

function CauHinhDoBai({ bai, mon, onBatDau, onBack }) {
  const [soCau, setSoCau] = useState(5)

  return (
    <div className="max-w-md mx-auto flex flex-col gap-5">
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-400 hover:text-blue-600 text-sm mb-3 transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Quay lại
        </button>
        <p className="text-slate-400 text-xs font-medium mb-1">{mon.ten}</p>
        <h2 className="text-slate-800 text-lg font-bold">{bai.tieu_de}</h2>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
        <div>
          <p className="text-slate-800 font-semibold mb-1">Số câu hỏi</p>
          <p className="text-slate-400 text-xs mb-4">AI sẽ sinh câu hỏi từ nội dung SGK của bài này</p>
          <div className="flex gap-2 flex-wrap">
            {[3, 5, 7, 10].map(n => (
              <button
                key={n}
                onClick={() => setSoCau(n)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150
                  ${soCau === n
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                  }`}
              >
                {n} câu
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-blue-700 text-xs font-semibold mb-1">Hướng dẫn sử dụng</p>
          <p className="text-blue-600/80 text-xs leading-relaxed">
            AI sẽ đọc câu hỏi bằng giọng nói. Nhấn nút mic và trả lời bằng tiếng Việt.
            Nên dùng Chrome để có kết quả nhận dạng giọng nói tốt nhất.
          </p>
        </div>

        <button
          onClick={() => onBatDau(soCau)}
          className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-sm
            hover:bg-blue-700 transition-all active:scale-[0.98] shadow-md shadow-blue-200
            flex items-center justify-center gap-2 group"
        >
          <Mic size={16} className="group-hover:scale-110 transition-transform" />
          Bắt đầu dò bài
        </button>
      </div>
    </div>
  )
}

function DoBaiSession({ bai, mon, soCau, onXong }) {
  const session = useDoBaiSession(bai, soCau, onXong)
  const speech = useSpeechRecognition()
  const daGoiRef = useRef(false)

  const { cauHois, cauIdx, phase, nhanXet, ketQuas, aiDangDoc } = session
  const { transcript, setTranscript, listening, supported, start, stop } = speech

  useEffect(() => {
    if (daGoiRef.current) return
    daGoiRef.current = true
    session.sinhCauHoi().then(ds => {
      if (ds && ds.length > 0) docCauHoi(ds[0])
    })
  }, [])

  const docCauHoi = (cau) => {
    stop()
    window.speechSynthesis.cancel()
    session.setAiDangDoc(true)
    session.setPhase('reading')
    setTranscript('')
    speak(`Câu ${cau.thu_tu}. ${cau.cau_hoi}`, () => {
      session.setAiDangDoc(false)
      setTimeout(() => {
        setTranscript('')
        session.setPhase('listening')
      }, 300)
    })
  }

  const handleChamDiem = async () => {
    if (!transcript.trim()) return
    stop()
    const data = await session.chamDiem(transcript)
    if (data) speak(data.nhan_xet, () => {})
  }

  const handleCauTiep = () => {
    stop()
    setTranscript('')
    const next = session.cauTiep()
    if (next < cauHois.length) {
      docCauHoi(cauHois[next])
    }
  }

  if (phase === 'loading') return (
    <div className="max-w-xl mx-auto flex flex-col gap-4">
      <ThanhTienDo cauIdx={0} tongCau={soCau} />
      <div className="flex flex-col items-center justify-center h-52 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center animate-pulse">
          <BookOpen size={22} className="text-blue-400" />
        </div>
        <div className="text-center">
          <p className="text-slate-700 font-medium">AI đang sinh câu hỏi</p>
          <p className="text-slate-400 text-sm mt-1">Đang phân tích nội dung SGK...</p>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  )

  if (phase === 'done') {
    const soDung = ketQuas.filter(k => k.dung).length
    const tong = cauHois.length
    const pct = Math.round((soDung / tong) * 100)
    const xep = pct >= 80 ? 'Giỏi' : pct >= 65 ? 'Khá' : pct >= 50 ? 'Trung bình' : 'Cần ôn thêm'
    const xepStyle = {
      'Giỏi': 'text-emerald-600 bg-emerald-50 border-emerald-200',
      'Khá': 'text-blue-600 bg-blue-50 border-blue-200',
      'Trung bình': 'text-amber-600 bg-amber-50 border-amber-200',
      'Cần ôn thêm': 'text-red-600 bg-red-50 border-red-200',
    }[xep] || ''

    return (
      <div className="max-w-md mx-auto flex flex-col gap-5 pb-8">
        <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center shadow-sm">
          <p className="text-slate-400 text-sm mb-4">{bai.tieu_de}</p>
          <div className="w-28 h-28 rounded-full border-4 border-blue-100 mx-auto flex flex-col items-center justify-center mb-5 relative">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#EFF6FF" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="54" fill="none" stroke="#3B82F6" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - pct / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="text-3xl font-bold text-slate-800 relative z-10">{pct}</span>
            <span className="text-xs text-slate-400 relative z-10">%</span>
          </div>
          <span className={`inline-block text-base font-bold px-5 py-2 rounded-full border ${xepStyle}`}>
            {xep}
          </span>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            {[
              { icon: CheckCircle2, label: 'Đúng', value: soDung, color: 'text-emerald-500' },
              { icon: XCircle, label: 'Sai', value: tong - soDung, color: 'text-red-400' },
              { icon: Flag, label: 'Tổng', value: tong, color: 'text-blue-500' },
            ].map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <Icon size={20} className={s.color} strokeWidth={2} />
                  <p className="text-slate-800 font-bold text-xl">{s.value}</p>
                  <p className="text-slate-400 text-xs">{s.label}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {ketQuas.map((k, i) => (
            <div
              key={i}
              className={`rounded-xl px-4 py-3.5 border flex items-start gap-3
                ${k.dung ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}
            >
              {k.dung
                ? <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                : <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              }
              <div>
                <p className="text-slate-700 text-xs font-medium">{k.cau_hoi}</p>
                <p className={`text-xs mt-0.5 italic ${k.dung ? 'text-emerald-600' : 'text-red-500'}`}>
                  Bạn trả lời: "{k.cau_tra_loi}"
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onXong}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm
            hover:bg-blue-700 transition-all shadow-md shadow-blue-200
            flex items-center justify-center gap-2"
        >
          <RotateCcw size={15} />
          Dò bài khác
        </button>
      </div>
    )
  }

  const cau = cauHois[cauIdx]

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-4">
      <ThanhTienDo cauIdx={cauIdx} tongCau={cauHois.length || soCau} />

      <TheCauHoi
        cauHoi={cau}
        chuDe={mon?.ten ? `Chủ đề: ${mon.ten}` : null}
        onDocLai={() => docCauHoi(cau)}
        aiDangDoc={aiDangDoc}
      />

      {aiDangDoc && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <Volume2 size={16} className="text-blue-500 flex-shrink-0" />
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-blue-700 text-sm font-medium">AI đang đọc câu hỏi...</p>
        </div>
      )}

      {phase === 'listening' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-sm">
          <NutMicro
            listening={listening}
            supported={supported}
            onToggle={listening ? stop : start}
          />

          <ONhapTraLoi
            value={transcript}
            onChange={setTranscript}
            onSubmit={handleChamDiem}
            disabled={listening}
          />

          <div className="flex gap-3 w-full">
            <button
              onClick={() => { setTranscript(''); start() }}
              className="flex-1 py-2.5 rounded-xl bg-white border border-slate-200
                text-slate-600 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all
                flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} />
              Nói lại
            </button>
            <button
              onClick={handleChamDiem}
              disabled={!transcript.trim() || listening}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm
                font-semibold hover:bg-blue-700 disabled:opacity-40 transition-all shadow-md shadow-blue-200
                flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={14} />
              Nộp câu này
            </button>
          </div>
        </div>
      )}

      {phase === 'checking' && (
        <div className="flex items-center justify-center gap-3 py-8">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">AI đang chấm bài...</p>
        </div>
      )}

      {phase === 'result_cau' && nhanXet && (
        <div>
          <KetQuaThamKhao nhanXet={nhanXet} />
          <button
            onClick={handleCauTiep}
            className="mt-4 w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm
              font-semibold hover:bg-blue-700 transition-all active:scale-[0.98] shadow-md shadow-blue-200
              flex items-center justify-center gap-2 group"
          >
            {cauIdx + 1 >= cauHois.length ? (
              <><Flag size={14} /> Xem kết quả</>
            ) : (
              <>Câu tiếp theo <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" /></>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default function DoBaiPage({ initialBai }) {
  const { step, monChon, baiChon, soCau, chonMon, chonBai, batDau, quayLai, reset } = useDoBai()
  const didInit = useRef(false)

  useEffect(() => {
    if (!initialBai || didInit.current) return
    didInit.current = true
    // Set môn giả để tránh crash khi mon=null trong CauHinhDoBai
    const monGia = {
      id: initialBai.id_chuDe ?? null,
      ten: initialBai.ten_chu_de || 'Bài học',
    }
    chonMon(monGia)
    // chonMon đặt step='bai', giờ set thẳng baiChon và step='cauhinh'
    setTimeout(() => chonBai(initialBai), 0)
  }, [initialBai])

  if (step === 'mon') return <ChonMon onChon={chonMon} />
  if (step === 'bai') return <ChonBai mon={monChon} onChon={chonBai} onBack={() => quayLai('mon')} />
  if (step === 'cauhinh') return <CauHinhDoBai bai={baiChon} mon={monChon ?? { ten: 'Bài học' }} onBatDau={batDau} onBack={() => quayLai('bai')} />
  if (step === 'session') return <DoBaiSession bai={baiChon} mon={monChon ?? { ten: 'Bài học' }} soCau={soCau} onXong={reset} />
}