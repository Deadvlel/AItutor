import { Mic, MicOff } from 'lucide-react'

export default function NutMicro({ listening, supported, onToggle }) {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <button
        onClick={onToggle}
        disabled={!supported}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl
          ${listening
            ? 'bg-red-500 scale-110 shadow-red-300 ring-4 ring-red-200 animate-pulse'
            : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-blue-200'
          }
          disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {listening
          ? <MicOff size={32} className="text-white" />
          : <Mic size={32} className="text-white" />
        }
      </button>
      <p className="text-slate-400 text-sm">
        {listening
          ? 'Đang lắng nghe...'
          : supported
            ? 'Nhấn để trả lời bằng giọng nói'
            : 'Trình duyệt không hỗ trợ Voice'
        }
      </p>
    </div>
  )
}
