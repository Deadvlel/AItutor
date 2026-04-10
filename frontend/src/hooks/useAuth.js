import { useState, useCallback } from 'react'
import { authService } from '../services/authService'

export function useAuth(onSuccess) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const dangNhap = useCallback(async (email, matKhau) => {
    setError('')
    setLoading(true)
    try {
      const data = await authService.dangNhap(email, matKhau)
      authService.saveSession(data)
      onSuccess?.(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [onSuccess])

  const dangKy = useCallback(async (fullName, email, matKhau) => {
    setError('')
    setLoading(true)
    try {
      const data = await authService.dangKy(fullName, email, matKhau)
      authService.saveSession(data)
      onSuccess?.(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [onSuccess])

  return { loading, error, dangNhap, dangKy, setError }
}
