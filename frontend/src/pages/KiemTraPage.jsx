import { useState, useEffect } from 'react'
import { examService } from '../services/examService'
import {
  Sparkles, Send, RotateCcw, PlusCircle, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, AlertCircle, Target, Layers, Brain,
  ClipboardCheck, Trophy, Percent
} from 'lucide-react'

const DO_KHO_OPTIONS = [
  {
    value: 'de',
    label: 'Dễ',
    desc: 'Định nghĩa, khái niệm cơ bản',
    icon: Target,
    activeClass: 'border-emerald-400 bg-emerald-50',
    iconColor: 'text-emerald-500',
    labelColor: 'text-emerald-700',
  },
  {
    value: 'trung binh',
    label: 'Trung bình',
    desc: 'Vận dụng, tính toán',
    icon: Layers,
    activeClass: 'border-amber-400 bg-amber-50',
    iconColor: 'text-amber-500',
    labelColor: 'text-amber-700',
  },
  {
    value: 'kho',
    label: 'Khó',
    desc: 'Phân tích, nâng cao',
    icon: Brain,
    activeClass: 'border-red-400 bg-red-50',
    iconColor: 'text-red-500',
    labelColor: 'text-red-700',
  },
]

const SO_CAU_OPTIONS = [3, 5, 7, 10]

/* ─── Skeleton ─── */
function SetupSkeleton() {
  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto animate-pulse">
      <div className="bg-slate-100 rounded-2xl h-28" />
      <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-6">
        <div className="h-11 bg-slate-100 rounded-xl" />
        <div className="flex gap-3">
          {[1,2,3,4].map(i => <div key={i} className="flex-1 h-10 bg-slate-100 rounded-xl" />)}
        </div>
        <div className="flex gap-3">
          {[1,2,3].map(i => <div key={i} className="flex-1 h-16 bg-slate-100 rounded-xl" />)}
        </div>
        <div className="h-12 bg-slate-100 rounded-xl" />
      </div>
    </div>
  )
}

/* ─── Setup Screen ─── */
function SetupScreen({ onStart }) {
  const [chuDe, setChuDe] = useState('')
  const [soCau, setSoCau] = useState(5)
  const [doKho, setDoKho] = useState('trung binh')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStart = async () => {
    if (!chuDe.trim()) { setError('Vui lòng nhập chủ đề'); return }
    setError('')
    setLoading(true)
    try {
      const data = await examService.taoDe(chuDe.trim(), soCau, doKho)
      onStart(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <SetupSkeleton />

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      {/* Hero banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-blue-500/30 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute right-12 bottom-0 w-20 h-20 rounded-full bg-blue-400/20 translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-blue-200" />
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Kiểm tra</p>
          </div>
          <h1 className="text-white text-xl font-bold">AI tạo đề thi</h1>
          <p className="text-blue-100 text-sm mt-1 leading-relaxed">
            Nhập chủ đề, AI sẽ tạo đề trắc nghiệm và chấm điểm tự động
          </p>
        </div>
      </div>

      {/* Config card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col gap-6 shadow-sm">
        {/* Topic input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Chủ đề muốn ôn tập
          </label>
          <input
            type="text"
            value={chuDe}
            onChange={e => setChuDe(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            placeholder="Vd: Phương trình bậc 2, Định luật Newton..."
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm
              text-slate-800 placeholder-slate-400 outline-none
              focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 focus:bg-white
              transition-all duration-150"
          />
        </div>

        {/* Question count */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Số câu hỏi
          </label>
          <div className="flex gap-2">
            {SO_CAU_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => setSoCau(n)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150
                  ${soCau === n
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'
                  }`}
              >
                {n} câu
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Độ khó
          </label>
          <div className="flex gap-2">
            {DO_KHO_OPTIONS.map(opt => {
              const Icon = opt.icon
              const isActive = doKho === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setDoKho(opt.value)}
                  className={`flex-1 rounded-xl p-3.5 text-left border transition-all duration-150
                    ${isActive
                      ? `${opt.activeClass} border-2`
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  <Icon size={16} strokeWidth={2} className={isActive ? opt.iconColor : 'text-slate-400'} />
                  <p className={`text-sm font-semibold mt-2 ${isActive ? opt.labelColor : 'text-slate-700'}`}>
                    {opt.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${isActive ? opt.iconColor : 'text-slate-400'}`}>
                    {opt.desc}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
            <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={!chuDe.trim()}
          className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-sm
            hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-150 active:scale-[0.98] shadow-md shadow-blue-200
            flex items-center justify-center gap-2 group"
        >
          <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
          Tạo đề thi {soCau} câu
        </button>
      </div>
    </div>
  )
}

/* ─── Quiz Screen ─── */
function QuizScreen({ exam, onSubmit }) {
  const cauHois = exam.cau_hoi.map(ch => ({
    ...ch,
    dap_an: ch.dap_an.map(da => ({ id: da.id, noi_dung: da.noi_dung })),
  }))

  const [chonDapAn, setChonDapAn] = useState({})
  const [loading, setLoading] = useState(false)

  const daDone = Object.keys(chonDapAn).length
  const tong = cauHois.length

  const handleSubmit = async () => {
    if (daDone < tong) {
      if (!confirm(`Bạn còn ${tong - daDone} câu chưa trả lời. Nộp bài?`)) return
    }
    setLoading(true)
    try {
      const cau_tra_loi = Object.entries(chonDapAn).map(([id_cau, id_da]) => ({
        id_cau_hoi: Number(id_cau),
        id_dap_an: Number(id_da),
      }))
      const result = await examService.nopBai(exam.id_kiem_tra, cau_tra_loi)
      onSubmit(result, exam)
    } catch (e) {
      alert('Lỗi nộp bài: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const labels = ['A', 'B', 'C', 'D']

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto pb-8">
      {/* Sticky progress header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Đang làm bài</p>
            <h2 className="text-slate-800 font-bold text-base mt-0.5 line-clamp-1">{exam.tieu_de}</h2>
          </div>
          <div className="text-right">
            <p className="text-blue-600 font-bold text-xl">{daDone}/{tong}</p>
            <p className="text-slate-400 text-xs">câu đã trả lời</p>
          </div>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(daDone / tong) * 100}%` }}
          />
        </div>
      </div>

      {cauHois.map((cau, idx) => (
        <div
          key={cau.id}
          className={`bg-white border rounded-2xl p-5 transition-all duration-200
            ${chonDapAn[cau.id]
              ? 'border-blue-200 shadow-sm shadow-blue-50'
              : 'border-slate-100 hover:border-slate-200'
            }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Câu {idx + 1}
            </span>
            {chonDapAn[cau.id] && (
              <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                Đã trả lời
              </span>
            )}
          </div>
          <p className="text-slate-800 text-sm font-medium leading-relaxed mb-4">{cau.noi_dung}</p>
          <div className="flex flex-col gap-2">
            {cau.dap_an.map((da, i) => {
              const isChosen = chonDapAn[cau.id] === da.id
              return (
                <button
                  key={da.id}
                  onClick={() => setChonDapAn(prev => ({ ...prev, [cau.id]: da.id }))}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-left
                    border transition-all duration-150
                    ${isChosen
                      ? 'bg-blue-50 border-blue-300 text-blue-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50/50'
                    }`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors
                    ${isChosen ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>
                    {labels[i]}
                  </span>
                  <span className={isChosen ? 'font-medium' : ''}>{da.noi_dung}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-base
          hover:bg-blue-700 disabled:opacity-50 transition-all duration-150
          active:scale-[0.98] shadow-lg shadow-blue-200
          flex items-center justify-center gap-2 group"
      >
        {loading ? (
          <>
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Đang chấm bài...
          </>
        ) : (
          <>
            <Send size={18} className="group-hover:translate-x-0.5 transition-transform" />
            Nộp bài
          </>
        )}
      </button>
    </div>
  )
}

/* ─── Result Screen ─── */
function ResultScreen({ result, exam, onRetry, onNew }) {
  const [showDetail, setShowDetail] = useState(false)

  const pct = Math.round((result.dung / result.tong) * 100)

  const xepLoaiStyle = {
    'Giỏi':      { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    'Khá':       { color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200'    },
    'Trung bình':{ color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
    'Yếu':       { color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200'     },
  }[result.xep_loai] || { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' }

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto pb-8">
      {/* Score card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center shadow-sm">
        <p className="text-slate-400 text-sm mb-4 font-medium">{exam.tieu_de}</p>

        <div className="w-28 h-28 rounded-full border-4 border-blue-100 mx-auto flex flex-col items-center justify-center mb-5 relative">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#EFF6FF" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54" fill="none" stroke="#3B82F6" strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - pct / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <span className="text-3xl font-bold text-slate-800 relative z-10">{result.diem}</span>
          <span className="text-xs text-slate-400 relative z-10">/10</span>
        </div>

        <span className={`inline-block text-lg font-bold px-5 py-2 rounded-full border ${xepLoaiStyle.bg} ${xepLoaiStyle.color} ${xepLoaiStyle.border}`}>
          {result.xep_loai}
        </span>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          {[
            { icon: CheckCircle2, label: 'Đúng', value: result.dung, color: 'text-emerald-500' },
            { icon: XCircle,      label: 'Sai',  value: result.tong - result.dung, color: 'text-red-400' },
            { icon: Percent,      label: 'Tỉ lệ', value: `${pct}%`, color: 'text-blue-500' },
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

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onNew}
          className="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold
            hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150
            flex items-center justify-center gap-2"
        >
          <PlusCircle size={16} />
          Đề thi mới
        </button>
        <button
          onClick={onRetry}
          className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold
            hover:bg-blue-700 transition-all duration-150 shadow-md shadow-blue-200
            flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} />
          Làm lại đề này
        </button>
      </div>

      {/* Detail toggle */}
      <button
        onClick={() => setShowDetail(v => !v)}
        className="w-full py-3 rounded-xl bg-white border border-slate-200 text-slate-600
          text-sm font-medium hover:bg-slate-50 transition-all duration-150
          flex items-center justify-center gap-2"
      >
        {showDetail ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {showDetail ? 'Ẩn' : 'Xem'} chi tiết từng câu
      </button>

      {showDetail && (
        <div className="flex flex-col gap-3">
          {result.chi_tiet.map((c, idx) => (
            <div
              key={c.id_cau_hoi}
              className={`rounded-2xl p-5 border
                ${c.la_dung
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-red-50 border-red-200'
                }`}
            >
              <div className="flex items-start gap-3 mb-3">
                {c.la_dung
                  ? <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  : <XCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                }
                <p className={`text-sm font-medium leading-relaxed flex-1 ${c.la_dung ? 'text-emerald-900' : 'text-red-900'}`}>
                  Câu {idx + 1}: {c.noi_dung_cau}
                </p>
              </div>

              {!c.la_dung && (
                <div className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-2 mb-2 border border-emerald-200">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  <p className="text-emerald-700 text-xs font-medium">Đáp án đúng: {c.noi_dung_dung}</p>
                </div>
              )}

              {c.loi_giai_thich && (
                <div className="bg-white/60 rounded-xl px-4 py-3 mt-2 border border-slate-200/50">
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Giải thích</p>
                  <p className="text-slate-700 text-sm leading-relaxed">{c.loi_giai_thich}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Root ─── */
export default function ExamPage() {
  const [screen, setScreen] = useState('setup')
  const [examData, setExamData] = useState(null)
  const [resultData, setResultData] = useState(null)

  return (
    <div className="overflow-y-auto h-full">
      {screen === 'setup' && <SetupScreen onStart={(data) => { setExamData(data); setScreen('quiz') }} />}
      {screen === 'quiz' && examData && (
        <QuizScreen exam={examData} onSubmit={(result, exam) => { setResultData(result); setScreen('result') }} />
      )}
      {screen === 'result' && resultData && (
        <ResultScreen
          result={resultData}
          exam={examData}
          onRetry={() => setScreen('quiz')}
          onNew={() => { setExamData(null); setResultData(null); setScreen('setup') }}
        />
      )}
    </div>
  )
}