import { useState, useEffect, useCallback } from 'react'
import { convService } from '../services/convService'

export function useConversation() {
  const [lichSu, setLichSu] = useState([])          // danh sách cuộc trò chuyện
  const [activeCuoc, setActiveCuoc] = useState(null) // cuộc đang mở { id, tieu_de }
  const [messages, setMessages] = useState([])       // tin nhắn của cuộc đang mở
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)

  // Load lịch sử khi mount
  useEffect(() => {
    loadLichSu()
  }, [])

  const loadLichSu = async () => {
    setLoadingHistory(true)
    try {
      const data = await convService.layLichSu()
      setLichSu(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingHistory(false)
    }
  }

  // Mở một cuộc trò chuyện cũ
  const moiCuoc = useCallback(async (cuoc) => {
    setActiveCuoc(cuoc)
    setMessages([])
    try {
      const data = await convService.layTinNhan(cuoc.id)
      setMessages(data)
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Tạo cuộc trò chuyện mới
  const taoCuocMoi = useCallback(async () => {
    try {
      const cuoc = await convService.taoMoi(null)
      const newCuoc = { id: cuoc.id, tieu_de: cuoc.tieu_de, ngay_tao: '' }
      setLichSu((prev) => [newCuoc, ...prev])
      setActiveCuoc(newCuoc)
      setMessages([])
    } catch (e) {
      console.error(e)
    }
  }, [])

  // Gửi tin nhắn
  const guiTin = useCallback(async (text) => {
    if (!text.trim() || !activeCuoc || loading) return

    // Thêm tin user lên UI ngay
    setMessages((prev) => [...prev, { role: 'user', noi_dung: text, ngay_tao: '' }])
    setLoading(true)

    try {
      const data = await convService.guiTin(activeCuoc.id, text)

      // Cập nhật tiêu đề nếu vừa được sinh
      if (data.tieu_de !== activeCuoc.tieu_de) {
        const updated = { ...activeCuoc, tieu_de: data.tieu_de }
        setActiveCuoc(updated)
        setLichSu((prev) =>
          prev.map((c) => (c.id === activeCuoc.id ? { ...c, tieu_de: data.tieu_de } : c))
        )
      }

      // Thêm reply AI
      setMessages((prev) => [...prev, { role: 'assistant', noi_dung: data.reply, ngay_tao: '' }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', noi_dung: '⚠️ Lỗi kết nối, vui lòng thử lại.', ngay_tao: '' },
      ])
    } finally {
      setLoading(false)
    }
  }, [activeCuoc, loading])

  // Xoá cuộc trò chuyện
  const xoaCuoc = useCallback(async (id) => {
    try {
      await convService.xoa(id)
      setLichSu((prev) => prev.filter((c) => c.id !== id))
      if (activeCuoc?.id === id) {
        setActiveCuoc(null)
        setMessages([])
      }
    } catch (e) {
      console.error(e)
    }
  }, [activeCuoc])

  return {
    lichSu, activeCuoc, messages, loading, loadingHistory,
    moiCuoc, taoCuocMoi, guiTin, xoaCuoc,
  }
}
