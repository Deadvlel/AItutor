import { useState, useEffect, useRef, useCallback } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}
function speak(text, onEnd) {
  window.speechSynthesis.cancel()

  const doSpeak = () => {
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang  = 'vi-VN'
    utt.rate  = 0.85
    utt.pitch = 1

    const voices = window.speechSynthesis.getVoices()
    const viVoice = voices.find(v =>
      v.lang === 'vi-VN' || v.lang === 'vi' || v.name.toLowerCase().includes('viet')
    )
    if (viVoice) utt.voice = viVoice

    utt.onend   = onEnd || (() => {})
    utt.onerror = onEnd || (() => {})
    window.speechSynthesis.speak(utt)
  }

  if (window.speechSynthesis.getVoices().length > 0) {
    doSpeak()
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null
      doSpeak()
    }
  }
}

function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('')
  const [listening,  setListening]  = useState(false)
  const [supported,  setSupported]  = useState(true)
  const recogRef = useRef(null)

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) setSupported(false)
  }, [])

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      alert('Trình duyệt không hỗ trợ Voice. Dùng Chrome nhé!')
      return
    }

    recogRef.current?.abort()

    const r = new SR()
    r.lang           = 'vi-VN'
    r.continuous     = false
    r.interimResults = false
    r.maxAlternatives = 1

    r.onstart  = () => setListening(true)
    r.onend    = () => setListening(false)
    r.onerror  = (e) => {
      console.warn('Speech error:', e.error)
      setListening(false)
    }
    r.onresult = (e) => {
      const text = e.results[0][0].transcript
      setTranscript(text)
    }

    recogRef.current = r
    try { r.start() } catch (e) { console.warn(e) }
  }, [])

  const stop = useCallback(() => {
    recogRef.current?.stop()
    setListening(false)
  }, [])

  const reset = useCallback(() => setTranscript(''), [])

  return { transcript, setTranscript, listening, supported, start, stop, reset }
}

/* ─────────────────────────────────────────────
   BƯỚC 1 — Chọn môn học (từ API khóa học)
   ───────────────────────────────────────────── */
function ChonMon({ onChon }) {
  const [monHocs, setMonHocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/khoa-hoc/mon-hoc`, { headers: authHeaders() })
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
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="bg-gradient-to-r from-violet-700 to-violet-900 rounded-2xl p-6">
        <p className="text-violet-300 text-xs uppercase tracking-wider mb-1">Dò bài AI</p>
        <h1 className="text-white text-xl font-semibold">Chọn môn học 🎙️</h1>
        <p className="text-violet-200/70 text-sm mt-1">
          AI sẽ sinh câu hỏi từ SGK, Em trả lời bằng giọng nói
        </p>
      </div>

      {monHocs.length === 0 ? (
        <div className="bg-[#130f2e] border border-white/10 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-white font-semibold">Chưa có môn học nào</p>
          <p className="text-slate-400 text-sm mt-1">Vào trang Khóa học để thêm môn trước nhé!</p>
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
              <p className="text-white/60 text-xs mt-1">Bấm để chọn bài →</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   BƯỚC 2 — Chọn bài từ mục lục
   ───────────────────────────────────────────── */
function ChonBai({ mon, onChon, onBack }) {
  const [mucLuc, setMucLuc]   = useState([])
  const [loading, setLoading] = useState(true)
  const [mo, setMo]           = useState({})

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

  const DoKhoLabel = ({ do_kho }) => {
    const map = { 1: ['Dễ','text-emerald-400'], 2: ['Trung bình','text-amber-400'], 3: ['Khó','text-red-400'] }
    const [text, cls] = map[do_kho] || ['?','text-gray-400']
    return <span className={`text-xs ${cls}`}>{'⭐'.repeat(do_kho)} {text}</span>
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      <div className={`bg-gradient-to-r ${mon.color} rounded-2xl p-6`}>
        <button onClick={onBack} className="text-white/60 text-sm hover:text-white mb-3 flex items-center gap-1">
          ← Quay lại
        </button>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{mon.emoji}</span>
          <div>
            <h1 className="text-white text-xl font-bold">{mon.ten}</h1>
            <p className="text-white/60 text-sm">Chọn bài muốn dò</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : mucLuc.length === 0 ? (
        <div className="bg-[#130f2e] border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-slate-400">Môn này chưa có bài học nào.</p>
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
                        </div>
                      </div>
                      <span className="text-slate-600 group-hover:text-violet-400 transition-colors">🎙️</span>
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

/* ─────────────────────────────────────────────
   BƯỚC 3 — Cấu hình số câu
   ───────────────────────────────────────────── */
function CauHinhDoBai({ bai, mon, onBatDau, onBack }) {
  const [soCau, setSoCau] = useState(5)

  return (
    <div className="max-w-md mx-auto flex flex-col gap-5">
      <div className={`bg-gradient-to-r ${mon.color} rounded-2xl p-6`}>
        <button onClick={onBack} className="text-white/60 text-sm hover:text-white mb-3 flex items-center gap-1">← Quay lại</button>
        <p className="text-white/70 text-sm">{mon.ten}</p>
        <h2 className="text-white text-lg font-bold mt-1">{bai.tieu_de}</h2>
      </div>

      <div className="bg-[#130f2e] border border-white/10 rounded-2xl p-6 flex flex-col gap-5">
        <div>
          <p className="text-white font-semibold mb-1">Số câu hỏi</p>
          <p className="text-slate-400 text-xs mb-4">AI sẽ sinh câu hỏi từ nội dung SGK bài này</p>
          <div className="flex gap-3 flex-wrap">
            {[3, 5, 7, 10].map(n => (
              <button key={n} onClick={() => setSoCau(n)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${soCau === n
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'}`}>
                {n} câu
              </button>
            ))}
          </div>
        </div>

        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
          <p className="text-violet-300 text-xs font-medium mb-1">💡 Lưu ý</p>
          <p className="text-slate-400 text-xs leading-relaxed">
            AI sẽ đọc câu hỏi bằng giọng nói. Em bấm nút mic và trả lời bằng tiếng Việt. Dùng Chrome để có kết quả tốt nhất.
          </p>
        </div>

        <button
          onClick={() => onBatDau(soCau)}
          className="w-full py-3.5 rounded-xl bg-amber-400 text-[#0a0720] font-bold
            hover:bg-amber-300 transition-all active:scale-[0.98] text-sm"
        >
          🎙️ Bắt đầu dò bài
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   BƯỚC 4 — Session dò bài
   ───────────────────────────────────────────── */
function DoBaiSession({ bai, mon, soCau, onXong }) {
  const [cauHois,   setCauHois]   = useState([])
  const [cauIdx,    setCauIdx]    = useState(0)
  const [phase,     setPhase]     = useState('loading') // loading|reading|listening|checking|result_cau|done
  const [nhanXet,   setNhanXet]   = useState(null)
  const [ketQuas,   setKetQuas]   = useState([])        // lưu kết quả từng câu
  const [aiDangDoc, setAiDangDoc] = useState(false)

  const { transcript, setTranscript, listening, supported, start, stop } = useSpeechRecognition()

  // Load câu hỏi từ API mới
  useEffect(() => {
    fetch(`${API_URL}/api/do-bai/sinh-cau-hoi`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ id_tai_lieu: bai.id, so_cau: soCau }),
    })
      .then(r => r.json())
      .then(data => {
        const ds = data.cau_hois || []
        if (ds.length === 0) {
          alert('AI không sinh được câu hỏi. Thử lại nhé!')
          onXong()
          return
        }
        setCauHois(ds)
        setPhase('reading')
        docCauHoi(ds[0])
      })
      .catch(() => { alert('Lỗi kết nối!'); onXong() })
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

    const cau = cauHois[cauIdx]
    const res = await fetch(`${API_URL}/api/do-bai/cham-diem`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        id_cau_hoi:  cau.id ?? null,
        cau_hoi:     cau.cau_hoi,
        dap_an_mau:  cau.dap_an_mau,
        cau_tra_loi: transcript,
      }),
    })
    const data = await res.json()
    setNhanXet(data)
    setKetQuas(prev => [...prev, { cau_hoi: cau.cau_hoi, cau_tra_loi: transcript, dung: data.la_dung }])
    setPhase('result_cau')

    // AI đọc nhận xét
    speak(data.nhan_xet, () => {})
  }

  const cauTiep = () => {
    const next = cauIdx + 1
    if (next >= cauHois.length) {
      const soDung = ketQuas.filter(k => k.dung).length + (nhanXet?.la_dung ? 1 : 0)
      luuKetQua(soDung, cauHois.length)
      setPhase('done')
    } else {
      setCauIdx(next)
      setPhase('reading')
      docCauHoi(cauHois[next])
    }
  }

  const luuKetQua = async (soDung, tong) => {
    try {
      await fetch(`${API_URL}/api/do-bai/luu-ket-qua`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id_tai_lieu: bai.id, tong_cau: tong, so_cau_dung: soDung }),
      })
    } catch {}
  }

  // ── Loading ──
  if (phase === 'loading') return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">AI đang sinh câu hỏi từ SGK...</p>
    </div>
  )

  // ── Kết quả cuối ──
  if (phase === 'done') {
    const soDung = ketQuas.filter(k => k.dung).length
    const tong   = cauHois.length
    const pct    = Math.round((soDung / tong) * 100)
    const xep    = pct >= 80 ? '🏆 Giỏi' : pct >= 65 ? '👍 Khá' : pct >= 50 ? '😊 Trung bình' : '📚 Cần ôn thêm'

    return (
      <div className="max-w-md mx-auto flex flex-col gap-5">
        <div className={`bg-gradient-to-br ${mon.color} rounded-2xl p-8 text-center`}>
          <p className="text-white/70 text-sm mb-2">{bai.tieu_de}</p>
          <div className="text-7xl font-bold text-white mb-1">{pct}<span className="text-3xl">%</span></div>
          <p className="text-white/80 text-lg mt-1">{xep}</p>
          <div className="flex justify-center gap-10 mt-6 pt-5 border-t border-white/10">
            <div><p className="text-white font-bold text-2xl">{soDung}</p><p className="text-white/60 text-xs">Đúng</p></div>
            <div><p className="text-white font-bold text-2xl">{tong - soDung}</p><p className="text-white/60 text-xs">Sai</p></div>
            <div><p className="text-white font-bold text-2xl">{tong}</p><p className="text-white/60 text-xs">Tổng</p></div>
          </div>
        </div>

        {/* Chi tiết từng câu */}
        <div className="flex flex-col gap-2">
          {ketQuas.map((k, i) => (
            <div key={i} className={`rounded-xl px-4 py-3 border text-sm flex items-start gap-3
              ${k.dung ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <span>{k.dung ? '✅' : '❌'}</span>
              <div>
                <p className="text-slate-300 text-xs">{k.cau_hoi}</p>
                <p className={`text-xs mt-0.5 ${k.dung ? 'text-emerald-400' : 'text-red-400'}`}>
                  Em trả lời: "{k.cau_tra_loi}"
                </p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onXong}
          className="w-full py-3 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-500 transition-all">
          Dò bài khác
        </button>
      </div>
    )
  }

  // ── Session câu hỏi ──
  const cau = cauHois[cauIdx]
  const pctTienDo = Math.round((cauIdx / cauHois.length) * 100)

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-4">

      {/* Header tiến độ */}
      <div className={`bg-gradient-to-r ${mon.color} rounded-2xl p-5`}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-semibold text-sm truncate">{bai.tieu_de}</p>
          <p className="text-amber-400 font-bold text-sm flex-shrink-0 ml-2">
            {cauIdx + 1}/{cauHois.length}
          </p>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${pctTienDo}%` }} />
        </div>
      </div>

      {/* Câu hỏi */}
      <div className="bg-[#130f2e] border border-white/10 rounded-2xl p-6">
        <p className="text-slate-500 text-xs mb-2">Câu {cau.thu_tu}</p>
        <p className="text-white text-base leading-relaxed font-medium">{cau.cau_hoi}</p>
      </div>

      {/* AI đang đọc */}
      {aiDangDoc && (
        <div className="flex items-center gap-3 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <span key={i} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                style={{ animationDelay: `${i*0.15}s` }} />
            ))}
          </div>
          <p className="text-violet-300 text-sm">AI đang đọc câu hỏi...</p>
        </div>
      )}

      {/* Trả lời bằng voice */}
      {phase === 'listening' && (
        <div className="bg-[#130f2e] border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4">
          {/* Nút mic */}
          <button
            onClick={listening ? stop : start}
            className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl
              transition-all shadow-xl
              ${listening
                ? 'bg-red-500 scale-110 shadow-red-500/40 animate-pulse'
                : 'bg-amber-400 hover:bg-amber-300 hover:scale-105 shadow-amber-400/30'}`}
          >
            {listening ? '⏹' : '🎙️'}
          </button>

          <p className="text-slate-400 text-sm text-center">
            {listening
              ? 'Đang nghe... Bấm ⏹ để dừng'
              : supported
                ? 'Bấm 🎙️ để trả lời bằng giọng nói'
                : 'Trình duyệt không hỗ trợ voice. Dùng Chrome nhé!'}
          </p>

          {/* Transcript */}
          {transcript && (
            <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <p className="text-slate-400 text-xs mb-1">Em vừa nói:</p>
              <p className="text-white text-sm italic">"{transcript}"</p>
            </div>
          )}

          {/* Nút nộp hoặc thử lại */}
          {transcript && !listening && (
            <div className="flex gap-3 w-full">
              <button
                onClick={() => { setTranscript(''); start() }}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10
                  text-slate-300 text-sm hover:bg-white/10 transition-all"
              >
                🔄 Nói lại
              </button>
              <button
                onClick={chamDiem}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm
                  font-medium hover:bg-violet-500 transition-all"
              >
                ✅ Nộp câu này
              </button>
            </div>
          )}

          {/* Nút đọc lại câu hỏi */}
          <button
            onClick={() => { setPhase('reading'); docCauHoi(cau) }}
            className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
          >
            🔊 Đọc lại câu hỏi
          </button>
        </div>
      )}

      {/* Đang chấm */}
      {phase === 'checking' && (
        <div className="flex items-center justify-center gap-3 py-8">
          <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400">AI đang chấm bài...</p>
        </div>
      )}

      {/* Kết quả câu */}
      {phase === 'result_cau' && nhanXet && (
        <div className={`rounded-2xl p-5 border
          ${nhanXet.ket_qua === 'dung'
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : nhanXet.ket_qua === 'mot_phan'
              ? 'bg-amber-500/10 border-amber-500/20'
              : 'bg-red-500/10 border-red-500/20'}`}>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">
              {nhanXet.ket_qua === 'dung' ? '✅' : nhanXet.ket_qua === 'mot_phan' ? '⚠️' : '❌'}
            </span>
            <p className="text-white font-semibold text-sm">
              {nhanXet.ket_qua === 'dung' ? 'Đúng rồi!' : nhanXet.ket_qua === 'mot_phan' ? 'Gần đúng!' : 'Chưa đúng'}
            </p>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed">{nhanXet.nhan_xet}</p>

          {nhanXet.ket_qua !== 'dung' && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-slate-400 text-xs mb-1">Đáp án chuẩn:</p>
              <p className="text-emerald-400 text-sm leading-relaxed">{nhanXet.dap_an_mau}</p>
            </div>
          )}

          <button onClick={cauTiep}
            className="mt-4 w-full py-2.5 rounded-xl bg-violet-600 text-white text-sm
              font-medium hover:bg-violet-500 transition-all active:scale-[0.98]">
            {cauIdx + 1 >= cauHois.length ? '🏁 Xem kết quả' : 'Câu tiếp theo →'}
          </button>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────── */
export default function DoBaiPage({ initialBai }) {
  const [step,    setStep]    = useState(initialBai ? 'cauhinh' : 'mon')
  const [monChon, setMonChon] = useState(initialBai ? { color: 'from-violet-600 to-violet-800', ten: '', emoji: '📚' } : null)
  const [baiChon, setBaiChon] = useState(initialBai || null)
  const [soCau,   setSoCau]   = useState(5)

  // Nếu được navigate từ CoursesPage với bài sẵn
  useEffect(() => {
    if (initialBai) {
      setBaiChon(initialBai)
      setStep('cauhinh')
    }
  }, [initialBai])

  if (step === 'mon') return (
    <ChonMon onChon={mon => { setMonChon(mon); setStep('bai') }} />
  )

  if (step === 'bai') return (
    <ChonBai
      mon={monChon}
      onChon={bai => { setBaiChon(bai); setStep('cauhinh') }}
      onBack={() => setStep('mon')}
    />
  )

  if (step === 'cauhinh') return (
    <CauHinhDoBai
      bai={baiChon}
      mon={monChon}
      onBatDau={n => { setSoCau(n); setStep('session') }}
      onBack={() => setStep('bai')}
    />
  )

  if (step === 'session') return (
    <DoBaiSession
      bai={baiChon}
      mon={monChon}
      soCau={soCau}
      onXong={() => setStep('mon')}
    />
  )
}