import { useState } from 'react'
import { examService } from '../services/examService'

const DO_KHO_OPTIONS = [
  { value: 'de', label: 'Dễ', desc: 'Định nghĩa, khái niệm cơ bản', color: 'from-emerald-600 to-emerald-700' },
  { value: 'trung binh', label: 'Trung bình', desc: 'Vận dụng, tính toán', color: 'from-amber-600 to-amber-700' },
  { value: 'kho', label: 'Khó', desc: 'Phân tích, nâng cao', color: 'from-red-600 to-red-700' },
]

const SO_CAU_OPTIONS = [3, 5, 7, 10]

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

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      <div className="bg-gradient-to-r from-violet-700 to-violet-900 rounded-2xl p-6">
        <p className="text-violet-300 text-xs font-medium uppercase tracking-wider mb-1">Kiểm tra</p>
        <h1 className="text-white text-xl font-semibold">AI tạo đề thi</h1>
        <p className="text-violet-200/70 text-sm mt-1">
          Nhập chủ đề, AI sẽ tạo đề trắc nghiệm và chấm điểm tự động
        </p>
      </div>

      <div className="bg-[#130f2e] border border-white/5 rounded-2xl p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">
            Chủ đề muốn ôn tập
          </label>
          <input
            type="text"
            value={chuDe}
            onChange={e => setChuDe(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            placeholder="Vd: Phương trình bậc 2, Định luật Newton, Chiến tranh thế giới..."
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm
              text-white placeholder-slate-600 outline-none focus:border-amber-400/50 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">
            Số câu hỏi
          </label>
          <div className="flex gap-3">
            {SO_CAU_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => setSoCau(n)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all
                  ${soCau === n
                    ? 'bg-violet-600 border-violet-500 text-white'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                  }`}
              >
                {n} câu
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">
            Độ khó
          </label>
          <div className="flex gap-3">
            {DO_KHO_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDoKho(opt.value)}
                className={`flex-1 rounded-xl p-3 text-left border transition-all
                  ${doKho === opt.value
                    ? `bg-gradient-to-br ${opt.color} border-white/20`
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
              >
                <p className={`text-sm font-medium ${doKho === opt.value ? 'text-white' : 'text-slate-300'}`}>
                  {opt.label}
                </p>
                <p className={`text-xs mt-0.5 ${doKho === opt.value ? 'text-white/70' : 'text-slate-500'}`}>
                  {opt.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
            <span className="text-red-400">⚠</span>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={loading || !chuDe.trim()}
          className="w-full py-3.5 rounded-xl bg-amber-400 text-[#0a0720] font-semibold text-sm
            hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed
            transition-all active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-[#0a0720]/30 border-t-[#0a0720] rounded-full animate-spin" />
              AI đang tạo đề thi...
            </span>
          ) : `🎯 Tạo đề thi ${soCau} câu`}
        </button>
      </div>
    </div>
  )
}

function QuizScreen({ exam, onSubmit }) {
  // Ẩn đáp án đúng khi đang thi
  const cauHois = exam.cau_hoi.map(ch => ({
    ...ch,
    dap_an: ch.dap_an.map(da => ({ id: da.id, noi_dung: da.noi_dung }))
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

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto pb-8">
      <div className="bg-gradient-to-r from-violet-700 to-violet-900 rounded-2xl p-5 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-violet-300 text-xs uppercase tracking-wider">Đang làm bài</p>
            <h2 className="text-white font-semibold text-base mt-0.5 line-clamp-1">{exam.tieu_de}</h2>
          </div>
          <div className="text-right">
            <p className="text-amber-400 font-bold text-lg">{daDone}/{tong}</p>
            <p className="text-violet-300 text-xs">câu đã trả lời</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-300"
            style={{ width: `${(daDone / tong) * 100}%` }}
          />
        </div>
      </div>

      {cauHois.map((cau, idx) => (
        <div
          key={cau.id}
          className={`bg-[#130f2e] border rounded-2xl p-5 transition-all
            ${chonDapAn[cau.id] ? 'border-violet-500/30' : 'border-white/5'}`}
        >
          <p className="text-slate-400 text-xs mb-2">Câu {idx + 1}/{tong}</p>
          <p className="text-white text-sm font-medium leading-relaxed mb-4">{cau.noi_dung}</p>
          <div className="flex flex-col gap-2">
            {cau.dap_an.map((da, i) => {
              const isChosen = chonDapAn[cau.id] === da.id
              const labels = ['A', 'B', 'C', 'D']
              return (
                <button
                  key={da.id}
                  onClick={() => setChonDapAn(prev => ({ ...prev, [cau.id]: da.id }))}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-left
                    border transition-all
                    ${isChosen
                      ? 'bg-violet-600/30 border-violet-500/60 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/25 hover:bg-white/8'
                    }`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${isChosen ? 'bg-violet-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                    {labels[i]}
                  </span>
                  {da.noi_dung}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-4 rounded-2xl bg-amber-400 text-[#0a0720] font-bold text-base
          hover:bg-amber-300 disabled:opacity-50 transition-all active:scale-[0.98]
          shadow-lg shadow-amber-500/20"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-[#0a0720]/30 border-t-[#0a0720] rounded-full animate-spin" />
            Đang chấm bài...
          </span>
        ) : '📤 Nộp bài'}
      </button>
    </div>
  )
}

function ResultScreen({ result, exam, onRetry, onNew }) {
  const [showDetail, setShowDetail] = useState(false)

  const pct = Math.round((result.dung / result.tong) * 100)
  const xepLoaiColor = {
    'Giỏi': 'text-emerald-400',
    'Khá': 'text-blue-400',
    'Trung bình': 'text-amber-400',
    'Yếu': 'text-red-400',
  }[result.xep_loai] || 'text-slate-400'

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto pb-8">
      <div className="bg-gradient-to-br from-violet-700 to-violet-900 rounded-2xl p-8 text-center">
        <p className="text-violet-300 text-sm mb-3">{exam.tieu_de}</p>
        <div className="text-7xl font-bold text-white mb-1">{result.diem}</div>
        <div className="text-amber-400 text-sm mb-4">/10 điểm</div>
        <span className={`text-2xl font-bold ${xepLoaiColor}`}>{result.xep_loai}</span>
        <div className="flex justify-center gap-6 mt-5 pt-5 border-t border-white/10">
          <div className="text-center">
            <p className="text-white font-bold text-xl">{result.dung}</p>
            <p className="text-violet-300 text-xs">Đúng</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-xl">{result.tong - result.dung}</p>
            <p className="text-violet-300 text-xs">Sai</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-xl">{pct}%</p>
            <p className="text-violet-300 text-xs">Tỉ lệ đúng</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onNew}
          className="flex-1 py-3 rounded-xl bg-violet-600 text-white text-sm font-medium
            hover:bg-violet-500 transition-all"
        >
          + Đề thi mới
        </button>
        <button
          onClick={onRetry}
          className="flex-1 py-3 rounded-xl bg-amber-400 text-[#0a0720] text-sm font-medium
            hover:bg-amber-300 transition-all"
        >
          🔄 Làm lại đề này
        </button>
      </div>

      <button
        onClick={() => setShowDetail(v => !v)}
        className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300
          text-sm hover:bg-white/8 transition-all flex items-center justify-center gap-2"
      >
        {showDetail ? '▲ Ẩn' : '▼ Xem'} chi tiết từng câu
      </button>

      {showDetail && (
        <div className="flex flex-col gap-3">
          {result.chi_tiet.map((c, idx) => (
            <div
              key={c.id_cau_hoi}
              className={`rounded-2xl p-5 border
                ${c.la_dung
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-red-500/10 border-red-500/20'
                }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="text-white text-sm font-medium leading-relaxed flex-1">
                  Câu {idx + 1}: {c.noi_dung_cau}
                </p>
                <span className={`text-lg flex-shrink-0 ${c.la_dung ? '' : ''}`}>
                  {c.la_dung ? '✅' : '❌'}
                </span>
              </div>

              {!c.la_dung && (
                <p className="text-emerald-400 text-xs mb-2">
                  ✓ Đáp án đúng: {c.noi_dung_dung}
                </p>
              )}

              {c.loi_giai_thich && (
                <div className="bg-white/5 rounded-xl px-4 py-3 mt-2">
                  <p className="text-slate-400 text-xs mb-1">Giải thích:</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{c.loi_giai_thich}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ExamPage() {
  const [screen, setScreen] = useState('setup')  
  const [examData, setExamData] = useState(null)
  const [resultData, setResultData] = useState(null)

  const handleStart = (data) => {
    setExamData(data)
    setScreen('quiz')
  }

  const handleSubmit = (result, exam) => {
    setResultData(result)
    setScreen('result')
  }

  const handleRetry = () => {
    setScreen('quiz')   
  }

  const handleNew = () => {
    setExamData(null)
    setResultData(null)
    setScreen('setup')
  }

  return (
    <div className="overflow-y-auto h-full">
      {screen === 'setup' && <SetupScreen onStart={handleStart} />}
      {screen === 'quiz' && examData && (
        <QuizScreen exam={examData} onSubmit={handleSubmit} />
      )}
      {screen === 'result' && resultData && (
        <ResultScreen
          result={resultData}
          exam={examData}
          onRetry={handleRetry}
          onNew={handleNew}
        />
      )}
    </div>
  )
}
