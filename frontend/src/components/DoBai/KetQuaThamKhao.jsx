import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

export default function KetQuaThamKhao({ nhanXet }) {
  if (!nhanXet) return null

  const isDung = nhanXet.ket_qua === 'dung'
  const isMotPhan = nhanXet.ket_qua === 'mot_phan'

  const config = isDung
    ? {
        border: 'border-emerald-200',
        bg: 'bg-emerald-50',
        icon: <CheckCircle2 size={20} className="text-emerald-500" strokeWidth={2.5} />,
        title: 'Chính xác!',
        titleColor: 'text-emerald-700',
      }
    : isMotPhan
      ? {
          border: 'border-amber-200',
          bg: 'bg-amber-50',
          icon: <AlertTriangle size={20} className="text-amber-500" strokeWidth={2.5} />,
          title: 'Gần đúng',
          titleColor: 'text-amber-700',
        }
      : {
          border: 'border-red-200',
          bg: 'bg-red-50',
          icon: <XCircle size={20} className="text-red-400" strokeWidth={2.5} />,
          title: 'Chưa chính xác',
          titleColor: 'text-red-700',
        }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-slate-700 font-semibold text-sm">Kết quả tham khảo</p>
      <div className={`rounded-2xl p-5 border ${config.border} ${config.bg}`}>
        <div className="flex items-center gap-2.5 mb-2">
          {config.icon}
          <p className={`font-bold text-base ${config.titleColor}`}>{config.title}</p>
        </div>
        <p className="text-slate-600 text-sm leading-relaxed">{nhanXet.nhan_xet}</p>
        {nhanXet.ket_qua !== 'dung' && nhanXet.dap_an_mau && (
          <div className="mt-3 pt-3 border-t border-slate-200/60">
            <p className="text-slate-400 text-xs font-medium mb-1">Đáp án chuẩn:</p>
            <p className="text-emerald-600 text-sm leading-relaxed font-medium">{nhanXet.dap_an_mau}</p>
          </div>
        )}
      </div>
    </div>
  )
}
