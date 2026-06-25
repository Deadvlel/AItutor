import { useState, useEffect, useRef } from 'react'
import {
  Map, ChevronRight, ArrowLeft, BookOpen, Target, Clock,
  Sparkles, CheckCircle2, Circle, Lock, TrendingUp,
  Star, Zap, BarChart3, ChevronDown, ClipboardList, X
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}

const COLOR_PALETTE = [
  'bg-blue-600','bg-violet-600','bg-emerald-600',
  'bg-amber-500','bg-pink-500','bg-red-500',
  'bg-cyan-600','bg-orange-500','bg-teal-600',
]

const CAP_DO = [
  { value:'moi_bat_dau', label:'Mới bắt đầu', desc:'Chưa có kiến thức nền', icon: Circle },
  { value:'co_ban',      label:'Cơ bản',       desc:'Đã biết kiến thức cơ bản', icon: Star },
  { value:'nang_cao',    label:'Nâng cao',      desc:'Muốn đào sâu và luyện đề', icon: Zap  },
]

const THOI_GIAN = [
  { value:5,  label:'5 giờ/tuần',   desc:'Nhẹ nhàng'  },
  { value:10, label:'10 giờ/tuần',  desc:'Vừa phải'   },
  { value:15, label:'15 giờ/tuần',  desc:'Tích cực'   },
  { value:20, label:'20+ giờ/tuần', desc:'Chuyên sâu' },
]

const GOI_Y_MUC_TIEU = [
  'Ôn thi cuối kỳ','Ôn thi THPT Quốc gia','Tự học nâng cao','Luyện đề thi thử',
]

const DEMO_MON_HOCS = [
  { id:1, ten:'Toán học', so_bai:24, color:'bg-blue-600' },
  { id:2, ten:'Ngữ văn',  so_bai:18, color:'bg-violet-600' },
  { id:3, ten:'Vật lý',   so_bai:32, color:'bg-emerald-600' },
]

function mapMonHocTuAPI(item, i) {
  return { id:item.id, ten:item.ten, so_bai:item.so_bai??0, color:COLOR_PALETTE[i%COLOR_PALETTE.length] }
}

async function capNhatBuoc(idBuoc, trangThai) {
  try {
    await fetch(`${API_URL}/api/lo-trinh/buoc-hoc/${idBuoc}`, {
      method:'PUT', headers:authHeaders(),
      body:JSON.stringify({ trang_thai:trangThai }),
    })
  } catch {}
}

// ── Tour spotlight ──────────────────────────────────────────────────────────
function TourSpotlight({ targetEl, title, desc, onClose }) {
  const [rect, setRect] = useState(null)

  useEffect(() => {
    if (!targetEl) return
    setRect(targetEl.getBoundingClientRect())
  }, [targetEl])

  if (!rect) return null

  const pad = 10
  const x = rect.left - pad
  const y = rect.top - pad
  const w = rect.width + pad * 2
  const h = rect.height + pad * 2
  const showAbove = rect.top > 220

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect x={x} y={y} width={w} height={h} rx="14" fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#tour-mask)" />
        <rect x={x} y={y} width={w} height={h} rx="14"
          fill="none" stroke="#3B82F6" strokeWidth="2.5" opacity="0.9" />
      </svg>

      <div
        className="absolute bg-white rounded-2xl shadow-2xl p-5 w-72 border border-slate-100"
        style={{
          left: Math.max(12, Math.min(rect.left + rect.width/2 - 144, window.innerWidth - 300)),
          top:  showAbove ? rect.top - 168 : rect.bottom + 20,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45
          ${showAbove ? 'bottom-[-7px] border-r border-b border-slate-100' : 'top-[-7px] border-l border-t border-slate-100'}`} />
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={15} />
          </button>
        </div>
        <p className="text-slate-800 font-bold text-sm mb-1">{title}</p>
        <p className="text-slate-500 text-xs leading-relaxed mb-4">{desc}</p>
        <button onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all">
          Hiểu rồi, bắt đầu thôi!
        </button>
      </div>
    </div>
  )
}

// ── Thiết lập lộ trình ──────────────────────────────────────────────────────
function ThietLapLoTrinh({ onTaoXong }) {
  const [buoc, setBuoc]         = useState(1)
  const [monHocs, setMonHocs]   = useState([])
  const [monChon, setMonChon]   = useState([])
  const [capDo, setCapDo]       = useState('co_ban')
  const [mucTieu, setMucTieu]   = useState('')
  const [thoiGian, setThoiGian] = useState(10)
  const [loading, setLoading]   = useState(false)
  const [loadingMon, setLoadingMon] = useState(true)

  useEffect(() => {
    setLoadingMon(true)
    fetch(`${API_URL}/api/khoa-hoc/mon-hoc`, { headers:authHeaders() })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => {
        const ds = Array.isArray(data) ? data : []
        setMonHocs(ds.length > 0 ? ds.map(mapMonHocTuAPI) : DEMO_MON_HOCS)
      })
      .catch(() => setMonHocs(DEMO_MON_HOCS))
      .finally(() => setLoadingMon(false))
  }, [])

  const toggleMon = mon => setMonChon(prev =>
    prev.some(m => m.id===mon.id) ? prev.filter(m => m.id!==mon.id) : [...prev, mon]
  )

  const handleTao = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/lo-trinh/tao-moi`, {
        method:'POST', headers:authHeaders(),
        body:JSON.stringify({ mon_hoc_ids:monChon.map(m=>m.id), cap_do:capDo,
          muc_tieu:mucTieu, thoi_gian_moi_tuan:thoiGian }),
      })
      onTaoXong(await res.json())
    } catch { onTaoXong(null) }
    finally { setLoading(false) }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-80 gap-5 max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
        <Sparkles size={28} className="text-blue-500 animate-pulse" />
      </div>
      <p className="text-slate-800 font-bold text-lg">AI đang tạo lộ trình...</p>
      <div className="flex gap-2">
        {[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Map size={16} className="text-blue-200" />
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Lộ trình</p>
          </div>
          <h1 className="text-white text-xl font-bold">Tạo lộ trình học tập</h1>
          <p className="text-blue-100 text-sm mt-1">AI sẽ tạo kế hoạch phù hợp với mục tiêu của bạn</p>
        </div>
      </div>

      <div className="flex gap-2">
        {[1,2,3].map(i => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all
              ${buoc>=i ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {buoc>i ? <CheckCircle2 size={16}/> : i}
            </div>
            <p className={`text-xs font-medium ${buoc>=i?'text-slate-700':'text-slate-400'}`}>
              {i===1?'Chọn môn':i===2?'Mục tiêu':'Thời gian'}
            </p>
            {i<3 && <div className={`flex-1 h-0.5 rounded ${buoc>i?'bg-blue-500':'bg-slate-100'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        {buoc===1 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-slate-800 font-bold text-lg">Chọn môn học</h2>
              <p className="text-slate-400 text-sm mt-1">Chọn các môn muốn đưa vào lộ trình</p>
            </div>
            {loadingMon ? (
              <div className="grid grid-cols-2 gap-3">
                {Array(4).fill(0).map((_,i) => <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse"/>)}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {monHocs.map(mon => {
                  const sel = monChon.some(m=>m.id===mon.id)
                  return (
                    <button key={mon.id} onClick={()=>toggleMon(mon)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
                        ${sel?'border-blue-500 bg-blue-50':'border-slate-100 bg-white hover:border-slate-200'}`}>
                      <div className={`w-10 h-10 rounded-xl ${mon.color} flex items-center justify-center flex-shrink-0`}>
                        <BookOpen size={18} className="text-white"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${sel?'text-blue-700':'text-slate-700'}`}>{mon.ten}</p>
                        {mon.so_bai>0 && <p className="text-xs text-slate-400">{mon.so_bai} bài học</p>}
                      </div>
                      {sel && <CheckCircle2 size={20} className="text-blue-500 flex-shrink-0"/>}
                    </button>
                  )
                })}
              </div>
            )}
            <button onClick={()=>setBuoc(2)} disabled={monChon.length===0}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm
                hover:bg-blue-700 disabled:opacity-40 transition-all shadow-md shadow-blue-200
                flex items-center justify-center gap-2 group">
              Tiếp theo <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform"/>
            </button>
          </div>
        )}

        {buoc===2 && (
          <div className="flex flex-col gap-5">
            <button onClick={()=>setBuoc(1)} className="flex items-center gap-1.5 text-slate-400 hover:text-blue-600 text-sm group w-fit">
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform"/> Quay lại
            </button>
            <h2 className="text-slate-800 font-bold text-lg">Trình độ hiện tại</h2>
            <div className="flex flex-col gap-2">
              {CAP_DO.map(cd => {
                const Icon=cd.icon; const isA=capDo===cd.value
                return (
                  <button key={cd.value} onClick={()=>setCapDo(cd.value)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                      ${isA?'border-blue-500 bg-blue-50':'border-slate-100 hover:border-slate-200'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isA?'bg-blue-600':'bg-slate-100'}`}>
                      <Icon size={18} className={isA?'text-white':'text-slate-400'}/>
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isA?'text-blue-700':'text-slate-700'}`}>{cd.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{cd.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            <h2 className="text-slate-800 font-bold text-lg">Mục tiêu</h2>
            <div className="flex flex-wrap gap-2">
              {GOI_Y_MUC_TIEU.map(g => (
                <button key={g} onClick={()=>setMucTieu(g)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all
                    ${mucTieu===g?'bg-blue-600 text-white border-blue-600':'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}>
                  {g}
                </button>
              ))}
            </div>
            <input value={mucTieu} onChange={e=>setMucTieu(e.target.value)}
              placeholder="Hoặc nhập mục tiêu riêng..."
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-300 focus:bg-white transition-all"/>
            <button onClick={()=>setBuoc(3)} disabled={!mucTieu.trim()}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm
                hover:bg-blue-700 disabled:opacity-40 transition-all shadow-md shadow-blue-200
                flex items-center justify-center gap-2 group">
              Tiếp theo <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform"/>
            </button>
          </div>
        )}

        {buoc===3 && (
          <div className="flex flex-col gap-5">
            <button onClick={()=>setBuoc(2)} className="flex items-center gap-1.5 text-slate-400 hover:text-blue-600 text-sm group w-fit">
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform"/> Quay lại
            </button>
            <h2 className="text-slate-800 font-bold text-lg">Thời gian cam kết</h2>
            <div className="grid grid-cols-2 gap-3">
              {THOI_GIAN.map(tg => {
                const isA=thoiGian===tg.value
                return (
                  <button key={tg.value} onClick={()=>setThoiGian(tg.value)}
                    className={`p-4 rounded-xl border-2 transition-all text-left
                      ${isA?'border-blue-500 bg-blue-50':'border-slate-100 hover:border-slate-200'}`}>
                    <p className={`text-base font-bold ${isA?'text-blue-700':'text-slate-700'}`}>{tg.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{tg.desc}</p>
                  </button>
                )
              })}
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-blue-700 text-sm font-semibold mb-2">Tóm tắt lộ trình</p>
              <div className="flex flex-col gap-1 text-sm text-blue-600/80">
                <p>Môn học: {monChon.map(m=>m.ten).join(', ')}</p>
                <p>Trình độ: {CAP_DO.find(c=>c.value===capDo)?.label}</p>
                <p>Mục tiêu: {mucTieu}</p>
                <p>Cam kết: {thoiGian} giờ/tuần</p>
              </div>
            </div>
            <button onClick={handleTao}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm
                hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-[0.98]
                shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group">
              <Sparkles size={16} className="group-hover:rotate-12 transition-transform"/>
              AI Tạo Lộ Trình
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Thanh kỹ năng ───────────────────────────────────────────────────────────
function ThanhKyNang({ ten, mucDo }) {
  const bar  = mucDo>=70?'bg-emerald-500':mucDo>=40?'bg-blue-500':'bg-amber-500'
  const text = mucDo>=70?'text-emerald-600':mucDo>=40?'text-blue-600':'text-amber-600'
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between">
        <p className="text-slate-700 text-sm font-medium">{ten}</p>
        <span className={`text-xs font-bold ${text}`}>{mucDo}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${bar}`} style={{width:`${mucDo}%`}}/>
      </div>
    </div>
  )
}

// ── Hiển thị lộ trình ───────────────────────────────────────────────────────
function HienThiLoTrinh({ loTrinh, onTaoMoi, onNavigate }) {
  const [moRong, setMoRong]     = useState({})
  const [buocHocs, setBuocHocs] = useState(loTrinh.buocHocs || [])
  const [tour, setTour]         = useState(null) // { type, el, buoc }
  const diHocEls  = useRef({})
  const doBaiEls  = useRef({})

  const trangThaiCfg = {
    hoan_thanh: { label:'Hoàn thành', color:'text-emerald-600', bg:'bg-emerald-50 border-emerald-200', icon:CheckCircle2, dotCls:'bg-emerald-500 border-emerald-500', textCls:'text-white' },
    dang_hoc:   { label:'Đang học',   color:'text-blue-600',    bg:'bg-blue-50 border-blue-200',       icon:TrendingUp,   dotCls:'bg-white border-blue-500',           textCls:'text-blue-600' },
    dang_on:    { label:'Đang ôn',    color:'text-amber-600',   bg:'bg-amber-50 border-amber-200',     icon:BookOpen,     dotCls:'bg-white border-amber-400',          textCls:'text-amber-500' },
    chua_mo:    { label:'Chưa mở',    color:'text-slate-400',   bg:'bg-slate-50 border-slate-200',     icon:Lock,         dotCls:'bg-white border-slate-200',          textCls:'text-slate-400' },
  }

  const daxemDiHoc = () => localStorage.getItem('tour_di_hoc')==='1'
  const daxemDoBai = () => localStorage.getItem('tour_do_bai')==='1'

  const handleDiHoc = async (buoc) => {
    if (!daxemDiHoc()) {
      setTour({ type:'di_hoc', el:diHocEls.current[buoc.id], buoc })
      return
    }
    doNavigateDiHoc(buoc)
  }

  const doNavigateDiHoc = async (buoc) => {
    await capNhatBuoc(buoc.id, 1)
    setBuocHocs(prev => prev.map(b => b.id===buoc.id ? {...b, trangThai:'dang_hoc', tienDo:45} : b))
    onNavigate('courses', { id_chuDe:buoc.id_chuDe, id_tai_lieu:buoc.id_tai_lieu })
  }

  const handleDoBai = async (buoc) => {
    if (!daxemDoBai()) {
      setTour({ type:'do_bai', el:doBaiEls.current[buoc.id], buoc })
      return
    }
    doNavigateDoBai(buoc)
  }

  const doNavigateDoBai = async (buoc) => {
    await capNhatBuoc(buoc.id, 3)
    setBuocHocs(prev => prev.map(b => b.id===buoc.id ? {...b, trangThai:'dang_on'} : b))
    onNavigate('dobai', { initialBai:{
      id: buoc.id_tai_lieu,
      tieu_de: buoc.ten,
      id_buoc_hoc: buoc.id,
      id_chuDe: buoc.id_chuDe,
      ten_chu_de: buoc.chuDe,
    }})
  }

  const handleKiemTra = (buoc) => {
    onNavigate('exam', { chuDe:buoc.chuDe, id_chuDe:buoc.id_chuDe })
  }

  const closeTour = async () => {
    if (!tour) return
    if (tour.type==='di_hoc') {
      localStorage.setItem('tour_di_hoc','1')
      const b = tour.buoc; setTour(null)
      await doNavigateDiHoc(b)
    } else {
      localStorage.setItem('tour_do_bai','1')
      const b = tour.buoc; setTour(null)
      await doNavigateDoBai(b)
    }
  }

  return (
    <>
      {tour && (
        <TourSpotlight
          targetEl={tour.el}
          title={tour.type==='di_hoc' ? '📚 Đi học' : '🎯 Kiểm tra lý thuyết'}
          desc={tour.type==='di_hoc'
            ? 'Bấm nút này để hệ thống dẫn bạn thẳng đến bài học trong Khóa học. Không cần tự tìm!'
            : 'Bấm nút này để AI hỏi bạn bằng giọng nói về bài. Kiểm tra xem bạn nhớ được bao nhiêu!'}
          onClose={closeTour}
        />
      )}

      <div className="flex gap-6 max-w-5xl">
        <div className="flex-1 flex flex-col gap-5">
          {/* Header */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Map size={16} className="text-blue-600"/>
                  <p className="text-blue-600 text-xs font-semibold uppercase tracking-wider">Lộ trình của bạn</p>
                </div>
                <h1 className="text-slate-800 text-xl font-bold">{loTrinh.mucTieu}</h1>
              </div>
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border
                ${loTrinh.pctTong>=80?'text-emerald-600 bg-emerald-50 border-emerald-200':'text-blue-600 bg-blue-50 border-blue-200'}`}>
                {loTrinh.pctTong}% hoàn thành
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-5">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                style={{width:`${loTrinh.pctTong}%`}}/>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                {icon:CheckCircle2, label:'Đã hoàn thành', value:`${loTrinh.daXong}/${loTrinh.tongBuoc}`, sub:'bước',  color:'text-emerald-600', bg:'bg-emerald-50'},
                {icon:Clock,        label:'Cam kết',        value:`${loTrinh.thoiGianMoiTuan}h`,           sub:'/tuần', color:'text-amber-600',  bg:'bg-amber-50'  },
                {icon:Target,       label:'Trình độ',       value:CAP_DO.find(c=>c.value===loTrinh.capDo)?.label||'Cơ bản', sub:'', color:'text-blue-600', bg:'bg-blue-50'},
              ].map((s,i)=>{
                const Icon=s.icon
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50">
                    <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={18} className={s.color}/>
                    </div>
                    <div>
                      <p className="text-slate-800 text-base font-bold">
                        {s.value}<span className="text-slate-400 text-xs font-normal ml-0.5">{s.sub}</span>
                      </p>
                      <p className="text-slate-400 text-xs">{s.label}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Các bước */}
          <div className="relative flex flex-col gap-0">
            <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-slate-200"/>
            {buocHocs.map(buoc => {
              const cfg = trangThaiCfg[buoc.trangThai] || trangThaiCfg.chua_mo
              const Icon = cfg.icon
              const isOpen = moRong[buoc.id]
              return (
                <div key={buoc.id} className="relative flex gap-4 pb-4">
                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${cfg.dotCls}`}>
                      {buoc.trangThai==='hoan_thanh'
                        ? <CheckCircle2 size={20} className="text-white"/>
                        : <span className={`text-sm font-bold ${cfg.textCls}`}>{buoc.thuTu}</span>
                      }
                    </div>
                  </div>

                  <div className={`flex-1 bg-white border rounded-2xl transition-all duration-200
                    ${buoc.trangThai==='dang_hoc'?'border-blue-200 shadow-md shadow-blue-50'
                      :buoc.trangThai==='dang_on'?'border-amber-200 shadow-md shadow-amber-50'
                      :'border-slate-100 shadow-sm'}`}>

                    <button onClick={()=>setMoRong(p=>({...p,[buoc.id]:!p[buoc.id]}))} className="w-full p-5 text-left">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${buoc.chuDeColor} text-white`}>
                              {buoc.chuDe}
                            </span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg}`}>
                              {cfg.label}
                            </span>
                          </div>
                          <h3 className="text-base font-bold mt-2 text-slate-800">{buoc.ten}</h3>
                          {buoc.moTa && <p className="text-slate-400 text-sm mt-1">{buoc.moTa}</p>}
                        </div>
                        <ChevronDown size={18} className={`text-slate-300 flex-shrink-0 ml-3 transition-transform duration-200 ${isOpen?'rotate-180':''}`}/>
                      </div>
                      {buoc.trangThai==='dang_hoc' && (
                        <div className="mt-3">
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-slate-400">Tiến độ học</span>
                            <span className="text-xs font-semibold text-blue-600">{buoc.tienDo}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{width:`${buoc.tienDo}%`}}/>
                          </div>
                        </div>
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
                          <Clock size={14}/><span>{buoc.thoiGianUocTinh}</span>
                        </div>

                        {/* 3 hàng kỹ năng — mỗi hàng có thanh % + nút hành động bên dưới */}
                        <div className="flex flex-col gap-4">

                          {/* Hàng 1: Lý thuyết → Đi học */}
                          <div className={`rounded-xl p-3 border transition-all
                            ${buoc.trangThai==='dang_hoc' ? 'border-blue-200 bg-blue-50/50' : 'border-slate-100 bg-slate-50/50'}`}>
                            <div className="flex justify-between mb-1.5">
                              <span className="text-xs font-semibold text-slate-700">📘 Lý thuyết</span>
                              <span className={`text-xs font-bold ${buoc.trangThai==='hoan_thanh'||buoc.trangThai==='dang_hoc' ? 'text-blue-600' : 'text-amber-500'}`}>
                                {buoc.trangThai==='hoan_thanh' ? '100' : buoc.trangThai==='dang_hoc' ? buoc.tienDo||45 : 0}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2.5">
                              <div className="h-full bg-blue-500 rounded-full transition-all duration-700"
                                style={{width:`${buoc.trangThai==='hoan_thanh'?100:buoc.trangThai==='dang_hoc'?buoc.tienDo||45:0}%`}}/>
                            </div>
                            <button
                              ref={el => diHocEls.current[buoc.id]=el}
                              onClick={()=>handleDiHoc(buoc)}
                              className="w-full py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold
                                hover:bg-blue-700 transition-all shadow-sm shadow-blue-200
                                flex items-center justify-center gap-1.5"
                            >
                              <BookOpen size={13}/>
                              {buoc.trangThai==='chua_mo' ? '👉 Bắt đầu học' : 'Học bài'}
                            </button>
                          </div>

                          {/* Hàng 2: KT lý thuyết → Dò bài (ẩn khi chua_mo) */}
                          <div className={`rounded-xl p-3 border transition-all
                            ${buoc.trangThai==='chua_mo'
                              ? 'border-slate-100 bg-slate-50/30 opacity-40 pointer-events-none'
                              : buoc.trangThai==='dang_on'||buoc.trangThai==='hoan_thanh' ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100 bg-slate-50/50'
                            }`}>
                            <div className="flex justify-between mb-1.5">
                              <span className="text-xs font-semibold text-slate-700">🎯 Kiểm tra lý thuyết</span>
                              <span className={`text-xs font-bold ${buoc.trangThai==='hoan_thanh'?'text-emerald-600':buoc.trangThai==='dang_on'?'text-amber-600':'text-amber-500'}`}>
                                {buoc.trangThai==='hoan_thanh'?100:buoc.trangThai==='dang_on'?50:0}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2.5">
                              <div className="h-full bg-amber-400 rounded-full transition-all duration-700"
                                style={{width:`${buoc.trangThai==='hoan_thanh'?100:buoc.trangThai==='dang_on'?50:0}%`}}/>
                            </div>
                            <button
                              ref={el => doBaiEls.current[buoc.id]=el}
                              onClick={()=>handleDoBai(buoc)}
                              className="w-full py-2 rounded-lg border-2 border-amber-400 text-amber-600 text-xs font-semibold
                                hover:bg-amber-50 transition-all flex items-center justify-center gap-1.5"
                            >
                              <Target size={13}/>
                              Dò bài
                            </button>
                          </div>

                          {/* Hàng 3: KT thực hành → Kiểm tra (ẩn khi chua_mo) */}
                          <div className={`rounded-xl p-3 border transition-all
                            ${buoc.trangThai==='chua_mo'
                              ? 'border-slate-100 bg-slate-50/30 opacity-40 pointer-events-none'
                              : buoc.trangThai==='hoan_thanh' ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100 bg-slate-50/50'
                            }`}>
                            <div className="flex justify-between mb-1.5">
                              <span className="text-xs font-semibold text-slate-700">📝 Kiểm tra thực hành</span>
                              <span className={`text-xs font-bold ${buoc.trangThai==='hoan_thanh'?'text-emerald-600':'text-amber-500'}`}>
                                {buoc.trangThai==='hoan_thanh'?100:0}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2.5">
                              <div className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                style={{width:`${buoc.trangThai==='hoan_thanh'?100:0}%`}}/>
                            </div>
                            <button
                              onClick={()=>handleKiemTra(buoc)}
                              className="w-full py-2 rounded-lg border-2 border-emerald-500 text-emerald-600 text-xs font-semibold
                                hover:bg-emerald-50 transition-all flex items-center justify-center gap-1.5"
                            >
                              <ClipboardList size={13}/>
                              Làm bài
                            </button>
                          </div>

                        </div>

                        {buoc.trangThai==='chua_mo' && (
                          <p className="text-xs text-slate-400 mt-3 text-center">
                            💡 Học bài trước, sau đó dò bài đạt ≥ 5 điểm để mở bước tiếp theo
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Cột phải */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} className="text-blue-600"/>
              <p className="text-slate-800 font-bold text-sm">Tiến độ kỹ năng</p>
            </div>
            <div className="flex flex-col gap-4">
              {(loTrinh.tienDoKyNang||[]).map((kn,i) =>
                <ThanhKyNang key={i} ten={kn.tenKyNang} mucDo={kn.mucDoThanhThao}/>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-blue-600"/>
              <p className="text-blue-700 font-bold text-sm">Hướng dẫn nhanh</p>
            </div>
            <div className="flex flex-col gap-2 text-xs text-blue-700/80">
              <p>📘 <strong>Đi học</strong> — mở bài học trong Khóa học</p>
              <p>🎯 <strong>KT lý thuyết</strong> — AI hỏi bằng giọng nói</p>
              <p>📝 <strong>KT thực hành</strong> — làm đề trắc nghiệm</p>
            </div>
          </div>

          <button onClick={onTaoMoi}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium
              hover:bg-slate-50 hover:text-slate-700 transition-all">
            Tạo lộ trình mới
          </button>
        </div>
      </div>
    </>
  )
}

// ── Root ────────────────────────────────────────────────────────────────────
export default function LoTrinhPage({ onNavigate }) {
  const [loTrinh, setLoTrinh] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/lo-trinh`, { headers:authHeaders() })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => { if (data && data.id_loTrinh) setLoTrinh(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"/>
      <p className="text-slate-400 text-sm">Đang tải lộ trình...</p>
    </div>
  )

  if (!loTrinh) return <ThietLapLoTrinh onTaoXong={data=>setLoTrinh(data)}/>

  return <HienThiLoTrinh loTrinh={loTrinh} onTaoMoi={()=>setLoTrinh(null)} onNavigate={onNavigate}/>
}