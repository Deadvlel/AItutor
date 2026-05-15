import { useState, useEffect, useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}
function speak(text, onEnd) {
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'vi-VN'
  utt.rate = 0.9
  utt.onend = onEnd
  window.speechSynthesis.speak(utt)
}

function useSpeechRecognition() {
  const [transcript, setTranscript]   = useState('')
  const [listening,  setListening]    = useState(false)
  const recogRef = useRef(null)

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Trình duyệt không hỗ trợ Voice. Dùng Chrome nhé!'); return }

    const r = new SR()
    r.lang           = 'vi-VN'
    r.continuous     = false
    r.interimResults = false

    r.onstart  = () => setListening(true)
    r.onend    = () => setListening(false)
    r.onresult = (e) => setTranscript(e.results[0][0].transcript)
    r.onerror  = () => setListening(false)

    recogRef.current = r
    r.start()
  }

  const stop = () => {
    recogRef.current?.stop()
    setListening(false)
  }

  return { transcript, setTranscript, listening, start, stop }
}
function ChonBai({ onChon }) {
  const [chuDes,    setChuDes]    = useState([])
  const [chuDeChon, setChuDeChon] = useState(null)
  const [baiHocs,   setBaiHocs]   = useState([])

  useEffect(() => {
    fetch(`${API_URL}/api/do-bai/chu-de`).then(r => r.json()).then(setChuDes)
  }, [])

  const chonChuDe = async (cd) => {
    setChuDeChon(cd)
    const res = await fetch(`${API_URL}/api/do-bai/bai-hoc/${cd.id}`)
    setBaiHocs(await res.json())
  }

  const MauChuDe = {
    'Toán 10': 'from-violet-600 to-violet-800',
    'Toán 11': 'from-blue-600 to-blue-800',
    'Toán 12': 'from-indigo-600 to-indigo-800',
    'Ngữ văn 10': 'from-amber-600 to-amber-800',
    'Ngữ văn 11': 'from-orange-600 to-orange-800',
    'Ngữ văn 12': 'from-rose-600 to-rose-800',
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      <div className="bg-gradient-to-r from-violet-700 to-violet-900 rounded-2xl p-6">
        <p className="text-violet-300 text-xs uppercase tracking-wider mb-1">Dò bài AI</p>
        <h1 className="text-white text-xl font-semibold">Chọn bài muốn dò 🎙️</h1>
        <p className="text-violet-200/70 text-sm mt-1">AI sẽ đọc câu hỏi, em trả lời bằng giọng nói</p>
      </div>

      {/* Chủ đề */}
      <div>
        <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Chọn môn</p>
        <div className="grid grid-cols-3 gap-3">
          {chuDes.map(cd => (
            <button
              key={cd.id}
              onClick={() => chonChuDe(cd)}
              className={`rounded-xl p-4 text-left bg-gradient-to-br ${MauChuDe[cd.ten] || 'from-gray-600 to-gray-800'}
                ${chuDeChon?.id === cd.id ? 'ring-2 ring-white/50 scale-[1.02]' : 'hover:opacity-90'}
                transition-all`}
            >
              <p className="text-white font-semibold text-sm">{cd.ten}</p>
            </button>
          ))}
        </div>
      </div>

      {baiHocs.length > 0 && (
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Chọn bài</p>
          <div className="flex flex-col gap-2">
            {baiHocs.map(b => (
              <button
                key={b.id}
                onClick={() => onChon(b, chuDeChon)}
                className="flex items-center justify-between bg-[#130f2e] border border-white/10
                  hover:border-violet-500/40 rounded-xl px-5 py-3.5 text-left transition-all group"
              >
                <div>
                  <p className="text-white text-sm font-medium group-hover:text-violet-300 transition-colors">
                    {b.tieu_de}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {b.loai === 'toan' ? '📐 Toán' : '📖 Ngữ văn'} ·{' '}
                    {'⭐'.repeat(b.do_kho)}
                  </p>
                </div>
                <span className="text-slate-500 group-hover:text-violet-400 transition-colors">→</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DoBaiSession({ bai, chuDe, onXong }) {
  const [cauHois,   setCauHois]   = useState([])
  const [cauIdx,    setCauIdx]    = useState(0)
  const [phase,     setPhase]     = useState('loading')
  const [nhanXet,   setNhanXet]   = useState(null)
  const [score,     setScore]     = useState({ dung: 0, tong: 0 })
  const [aiDangDoc, setAiDangDoc] = useState(false)

  const { transcript, setTranscript, listening, start, stop } = useSpeechRecognition()

  // Load câu hỏi
  useEffect(() => {
    fetch(`${API_URL}/api/do-bai/cau-hoi/${bai.id}`)
      .then(r => r.json())
      .then(data => {
        setCauHois(data)
        setPhase('reading')
        docCauHoi(data[0])
      })
  }, [])

  const docCauHoi = (cau) => {
    setAiDangDoc(true)
    setNhanXet(null)
    setTranscript('')
    speak(`Câu ${cau.thu_tu}. ${cau.cau_hoi}`, () => {
      setAiDangDoc(false)
      setPhase('listening')
    })
  }

  const chamDiem = async () => {
    if (!transcript.trim()) return
    stop()
    setPhase('checking')

    const res = await fetch(`${API_URL}/api/do-bai/cham-diem`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        id_cau_hoi:  cauHois[cauIdx].id,
        cau_tra_loi: transcript,
      }),
    })
    const data = await res.json()
    setNhanXet(data)
    setScore(s => ({ dung: s.dung + (data.la_dung ? 1 : 0), tong: s.tong + 1 }))
    setPhase('result_cau')
    speak(data.nhan_xet, () => {})
  }

  const cauTiep = () => {
    const next = cauIdx + 1
    if (next >= cauHois.length) {
      setPhase('done')
      luuKetQua(score.dung + (nhanXet?.la_dung ? 0 : 0), cauHois.length)
    } else {
      setCauIdx(next)
      setPhase('reading')
      docCauHoi(cauHois[next])
    }
  }

  const luuKetQua = async (dung, tong) => {
    await fetch(`${API_URL}/api/do-bai/luu-ket-qua`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ id_tai_lieu: bai.id, tong_cau: tong, so_cau_dung: dung }),
    })
  }

  const cau = cauHois[cauIdx]

  if (phase === 'loading' || !cau) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (phase === 'done') {
    const pct = Math.round((score.dung / score.tong) * 100)
    return (
      <div className="max-w-md mx-auto flex flex-col gap-5">
        <div className="bg-gradient-to-br from-violet-700 to-violet-900 rounded-2xl p-8 text-center">
          <p className="text-violet-300 text-sm mb-2">{bai.tieu_de}</p>
          <div className="text-6xl font-bold text-white mb-1">{pct}</div>
          <p className="text-amber-400 text-lg">điểm</p>
          <div className="flex justify-center gap-8 mt-5 pt-5 border-t border-white/10">
            <div><p className="text-white font-bold text-xl">{score.dung}</p><p className="text-violet-300 text-xs">Đúng</p></div>
            <div><p className="text-white font-bold text-xl">{score.tong - score.dung}</p><p className="text-violet-300 text-xs">Sai</p></div>
          </div>
        </div>
        <button
          onClick={() => onXong()}
          className="w-full py-3 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-500 transition-all"
        >
          Dò bài khác
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-4">
      <div className="bg-gradient-to-r from-violet-700 to-violet-900 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-semibold text-sm">{bai.tieu_de}</p>
          <p className="text-amber-400 font-bold">{cauIdx + 1}/{cauHois.length}</p>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full transition-all"
            style={{ width: `${((cauIdx) / cauHois.length) * 100}%` }} />
        </div>
      </div>

      <div className="bg-[#130f2e] border border-white/10 rounded-2xl p-6">
        <p className="text-slate-400 text-xs mb-2">Câu {cau.thu_tu}</p>
        <p className="text-white text-base leading-relaxed font-medium">{cau.cau_hoi}</p>
      </div>

      {aiDangDoc && (
        <div className="flex items-center gap-3 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <span key={i} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <p className="text-violet-300 text-sm">AI đang đọc câu hỏi...</p>
        </div>
      )}

      {phase === 'listening' && (
        <div className="flex flex-col items-center gap-4 py-4">
          <button
            onClick={listening ? stop : start}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl
              transition-all shadow-lg ${listening
                ? 'bg-red-500 scale-110 shadow-red-500/30 animate-pulse'
                : 'bg-amber-400 hover:bg-amber-300 shadow-amber-400/20'
              }`}
          >
            {listening ? '⏹' : '🎙️'}
          </button>
          <p className="text-slate-400 text-sm">
            {listening ? 'Đang nghe... Bấm ⏹ để dừng' : 'Bấm 🎙️ để trả lời'}
          </p>

          {transcript && (
            <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-slate-400 text-xs mb-1">Em vừa nói:</p>
              <p className="text-white text-sm italic">"{transcript}"</p>
            </div>
          )}

          {transcript && !listening && (
            <button
              onClick={chamDiem}
              className="px-8 py-3 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-500 transition-all"
            >
              ✅ Nộp câu này
            </button>
          )}
        </div>
      )}

      {phase === 'checking' && (
        <div className="flex items-center justify-center gap-3 py-6">
          <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">AI đang chấm bài...</p>
        </div>
      )}

      {phase === 'result_cau' && nhanXet && (
        <div className={`rounded-2xl p-5 border ${nhanXet.la_dung
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : 'bg-red-500/10 border-red-500/20'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{nhanXet.la_dung ? '✅' : '❌'}</span>
            <p className="text-white font-semibold text-sm">
              {nhanXet.la_dung ? 'Đúng rồi!' : 'Chưa đúng'}
            </p>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{nhanXet.nhan_xet}</p>

          {!nhanXet.la_dung && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-slate-400 text-xs mb-1">Đáp án chuẩn:</p>
              <p className="text-emerald-400 text-sm">{nhanXet.dap_an_mau}</p>
            </div>
          )}

          <button
            onClick={cauTiep}
            className="mt-4 w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm
              font-medium hover:bg-violet-500 transition-all"
          >
            {cauIdx + 1 >= cauHois.length ? '🏁 Xem kết quả' : 'Câu tiếp theo →'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function DoBaiPage() {
  const [baiChon,   setBaiChon]   = useState(null)
  const [chuDeChon, setChuDeChon] = useState(null)

  if (!baiChon) {
    return <ChonBai onChon={(b, cd) => { setBaiChon(b); setChuDeChon(cd) }} />
  }

  return (
    <DoBaiSession
      bai={baiChon}
      chuDe={chuDeChon}
      onXong={() => { setBaiChon(null); setChuDeChon(null) }}
    />
  )
}
