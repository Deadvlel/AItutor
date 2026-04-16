const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function req(method, path, body) {
  const res = await fetch(`${API_URL}/api/cuoc-tro-chuyen${path}`, {
    method,
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Lỗi server')
  return data
}

export const convService = {
  layLichSu: () => req('GET', '/lich-su'),
  taoMoi: (tieu_de) => req('POST', '/tao-moi', { tieu_de }),
  layTinNhan: (id) => req('GET', `/${id}/tin-nhan`),
  guiTin: (id_cuoc_tro_chuyen, noi_dung) => req('POST', '/gui', { id_cuoc_tro_chuyen, noi_dung }),
  xoa: (id) => req('DELETE', `/${id}`),
}
