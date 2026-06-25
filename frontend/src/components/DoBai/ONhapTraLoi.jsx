import { Send } from 'lucide-react'

export default function ONhapTraLoi({ value, onChange, onSubmit, disabled }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Hoặc gõ câu trả lời của bạn vào đây..."
          rows={3}
          className="w-full bg-transparent text-slate-700 text-sm leading-relaxed outline-none resize-none placeholder-slate-400 pr-12"
        />
        <button
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="absolute right-0 bottom-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-30 transition-all"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
