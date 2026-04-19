const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}

async function req(method, path, body) {
  const res = await fetch(`${API_URL}/api/kiem-tra${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Lỗi server')
  return data
}

export const examService = {
  taoDe: (chu_de, so_cau, do_kho) =>
    req('POST', '/tao-de', { chu_de, so_cau, do_kho }),
  nopBai: (id_kiem_tra, cau_tra_loi) =>
    req('POST', '/nop-bai', { id_kiem_tra, cau_tra_loi }),
  layLichSu: () => req('GET', '/lich-su'),
}
