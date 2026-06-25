export default function ThanhTienDo({ cauIdx, tongCau }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 flex gap-1">
        {Array(tongCau).fill(null).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
              i < cauIdx
                ? 'bg-blue-600'
                : i === cauIdx
                  ? 'bg-blue-500 animate-pulse'
                  : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <span className="text-slate-500 text-sm font-semibold flex-shrink-0">
        Câu {cauIdx + 1}/{tongCau}
      </span>
    </div>
  )
}
