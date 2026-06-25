import { Volume2 } from 'lucide-react'

export default function TheCauHoi({ cauHoi, chuDe, onDocLai, aiDangDoc }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        {chuDe && (
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
            {chuDe}
          </span>
        )}
        <button
          onClick={onDocLai}
          disabled={aiDangDoc}
          className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 hover:border-blue-200 transition-all disabled:opacity-40"
        >
          <Volume2 size={16} />
        </button>
      </div>
      <h2 className="text-slate-800 text-lg font-bold leading-relaxed">
        {cauHoi?.cau_hoi}
      </h2>
      <p className="text-slate-400 text-sm mt-2">
        Hãy trả lời chi tiết và nêu rõ bối cảnh nếu có thể.
      </p>
    </div>
  )
}
