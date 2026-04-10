const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(endpoint, body) {
  const res = await fetch(`${API_URL}/api/auth/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Có lỗi xảy ra')
  return data
}

export const authService = {
  dangNhap: (email, mat_khau) => request('dang-nhap', { email, mat_khau }),
  dangKy: (full_name, email, mat_khau) => request('dang-ky', { full_name, email, mat_khau }),

  saveSession(data) {
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify({ full_name: data.full_name, email: data.email }))
  },

  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  getUser() {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  },

  isLoggedIn() {
    return !!localStorage.getItem('token')
  },
}
