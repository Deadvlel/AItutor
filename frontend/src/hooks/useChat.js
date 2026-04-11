import { useState, useCallback } from 'react'
import { sendMessage } from '../services/chatService'

export function useChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Xin chào! Tôi là gia sư AI \nBạn đang học bài nào? Cứ hỏi tôi bất cứ điều gì nhé!',
    },
  ])
  const [loading, setLoading] = useState(false)

  const send = useCallback(async (text) => {
    if (!text.trim() || loading) return
    setMessages((prev) => [...prev, { role: 'user', text }])
    setLoading(true)
    try {
      const reply = await sendMessage(text)
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: '⚠️ Không thể kết nối server. Vui lòng thử lại.' },
      ])
    } finally {
      setLoading(false)
    }
  }, [loading])

  return { messages, loading, send }
}
