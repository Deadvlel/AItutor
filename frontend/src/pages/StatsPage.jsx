export default function StatsPage() {
  const stats = [
    { label: 'Bài đã học', value: '47', unit: 'bài', color: 'text-violet-400' },
    { label: 'Thời gian học', value: '32', unit: 'giờ', color: 'text-amber-400' },
    { label: 'Câu hỏi đã hỏi', value: '128', unit: 'câu', color: 'text-emerald-400' },
    { label: 'Điểm trung bình', value: '8.4', unit: '/10', color: 'text-blue-400' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-white font-semibold text-xl">Thống kê học tập</h1>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-[#130f2e] border border-white/5 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">{s.label}</p>
            <p className={`text-4xl font-bold mt-2 ${s.color}`}>
              {s.value}<span className="text-lg font-normal text-slate-400 ml-1">{s.unit}</span>
            </p>
          </div>
        ))}
      </div>
      <div className="bg-[#130f2e] border border-white/5 rounded-2xl p-6">
        <p className="text-white font-medium mb-4">Hoạt động 7 ngày qua</p>
        <div className="flex items-end gap-2 h-24">
          {[40, 70, 55, 90, 30, 80, 65].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-violet-600 rounded-sm opacity-80 hover:opacity-100 transition-opacity"
                style={{ height: `${h}%` }}
              />
              <span className="text-slate-500 text-xs">{['T2','T3','T4','T5','T6','T7','CN'][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
