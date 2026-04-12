const courses = [
  {
    id: 1,
    subject: 'Toán học',
    title: 'Phương trình bậc 2',
    progress: 65,
    chapters: 12,
    done: 8,
    color: 'from-violet-600 to-violet-800',
    emoji: '📐',
  },
  {
    id: 2,
    subject: 'Vật lý',
    title: 'Định luật Newton',
    progress: 40,
    chapters: 10,
    done: 4,
    color: 'from-blue-600 to-blue-800',
    emoji: '⚛️',
  },
  {
    id: 3,
    subject: 'Hóa học',
    title: 'Phản ứng oxi hóa khử',
    progress: 20,
    chapters: 8,
    done: 2,
    color: 'from-emerald-600 to-emerald-800',
    emoji: '🧪',
  },
  {
    id: 4,
    subject: 'Văn học',
    title: 'Truyện Kiều - Nguyễn Du',
    progress: 85,
    chapters: 6,
    done: 5,
    color: 'from-amber-600 to-amber-800',
    emoji: '📖',
  },
]

const currentLesson = {
  subject: 'Toán học',
  title: 'Phương trình bậc 2: ax² + bx + c = 0',
  content: [
    {
      type: 'section',
      heading: '1. Định nghĩa',
      text: 'Phương trình bậc hai một ẩn là phương trình có dạng ax² + bx + c = 0, trong đó a, b, c là các số thực và a ≠ 0.',
    },
    {
      type: 'formula',
      heading: '2. Công thức nghiệm',
      formula: 'x = (-b ± √Δ) / 2a',
      sub: 'Trong đó Δ = b² - 4ac (delta)',
    },
    {
      type: 'cases',
      heading: '3. Biện luận theo Δ',
      cases: [
        { cond: 'Δ > 0', result: 'Phương trình có 2 nghiệm phân biệt' },
        { cond: 'Δ = 0', result: 'Phương trình có nghiệm kép x = -b/2a' },
        { cond: 'Δ < 0', result: 'Phương trình vô nghiệm (trong ℝ)' },
      ],
    },
    {
      type: 'example',
      heading: '4. Ví dụ',
      problem: 'Giải: x² - 5x + 6 = 0',
      steps: [
        'a = 1, b = -5, c = 6',
        'Δ = (-5)² - 4·1·6 = 25 - 24 = 1 > 0',
        'x₁ = (5 + 1) / 2 = 3',
        'x₂ = (5 - 1) / 2 = 2',
      ],
    },
  ],
}

function LessonContent() {
  return (
    <div className="flex flex-col gap-5">
      {currentLesson.content.map((block, i) => {
        if (block.type === 'section') return (
          <div key={i}>
            <h3 className="text-sm font-semibold text-amber-400 mb-2">{block.heading}</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{block.text}</p>
          </div>
        )
        if (block.type === 'formula') return (
          <div key={i}>
            <h3 className="text-sm font-semibold text-amber-400 mb-2">{block.heading}</h3>
            <div className="bg-[#1e1b4b] border border-violet-500/30 rounded-xl p-4 text-center">
              <p className="text-white font-mono text-lg font-medium">{block.formula}</p>
              <p className="text-slate-400 text-xs mt-1">{block.sub}</p>
            </div>
          </div>
        )
        if (block.type === 'cases') return (
          <div key={i}>
            <h3 className="text-sm font-semibold text-amber-400 mb-2">{block.heading}</h3>
            <div className="flex flex-col gap-2">
              {block.cases.map((c, j) => (
                <div key={j} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2.5">
                  <span className="font-mono text-sm text-violet-300 w-16 flex-shrink-0">{c.cond}</span>
                  <span className="text-slate-300 text-sm">{c.result}</span>
                </div>
              ))}
            </div>
          </div>
        )
        if (block.type === 'example') return (
          <div key={i}>
            <h3 className="text-sm font-semibold text-amber-400 mb-2">{block.heading}</h3>
            <div className="bg-[#1e1b4b] border border-white/10 rounded-xl p-4">
              <p className="text-white font-medium text-sm mb-3">📝 {block.problem}</p>
              <div className="flex flex-col gap-1.5">
                {block.steps.map((s, j) => (
                  <div key={j} className="flex items-start gap-2 text-sm">
                    <span className="text-violet-400 font-mono mt-0.5">→</span>
                    <span className="text-slate-300">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
        return null
      })}
    </div>
  )
}

export default function CoursesPage() {
  return (
    <div className="flex gap-6 h-full">
      {/* Main lesson area */}
      <div className="flex-1 flex flex-col gap-5 overflow-y-auto pr-1">
        {/* Lesson header */}
        <div className="bg-gradient-to-r from-violet-700 to-violet-900 rounded-2xl p-6">
          <p className="text-violet-300 text-xs font-medium uppercase tracking-wider mb-1">{currentLesson.subject}</p>
          <h1 className="text-white text-xl font-semibold leading-snug">{currentLesson.title}</h1>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full w-[65%] bg-amber-400 rounded-full" />
            </div>
            <span className="text-white/70 text-xs">65% hoàn thành</span>
          </div>
        </div>

        {/* Lesson content */}
        <div className="bg-[#130f2e] border border-white/5 rounded-2xl p-6">
          <LessonContent />
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between pb-6">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-colors">
            ← Bài trước
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors">
            Bài tiếp theo →
          </button>
        </div>
      </div>

      {/* Course list sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
        <h2 className="text-white font-semibold text-sm">Khóa học của bạn</h2>
        {courses.map((c) => (
          <div
            key={c.id}
            className={`rounded-xl p-4 bg-gradient-to-br ${c.color} cursor-pointer hover:opacity-90 transition-opacity`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white/70 text-xs">{c.subject}</p>
                <p className="text-white text-sm font-medium leading-snug mt-0.5">{c.title}</p>
              </div>
              <span className="text-2xl">{c.emoji}</span>
            </div>
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white/80 rounded-full" style={{ width: `${c.progress}%` }} />
            </div>
            <p className="text-white/60 text-xs mt-1.5">{c.done}/{c.chapters} chương</p>
          </div>
        ))}
      </div>
    </div>
  )
}
