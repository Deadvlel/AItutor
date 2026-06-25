import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}

export function useDoBai() {
  const [step, setStep]       = useState('mon')
  const [monChon, setMonChon] = useState(null)
  const [baiChon, setBaiChon] = useState(null)
  const [soCau, setSoCau]     = useState(5)

  const chonMon = (mon) => { setMonChon(mon); setStep('bai') }

  const chonBai = (bai) => { setBaiChon(bai); setStep('cauhinh') }

  const batDau = (n) => { setSoCau(n); setStep('session') }

  const quayLai = (target) => setStep(target)

  const reset = () => {
    setStep('mon')
    setMonChon(null)
    setBaiChon(null)
    setSoCau(5)
  }

  return { step, monChon, baiChon, soCau, chonMon, chonBai, batDau, quayLai, reset }
}

export function useDoBaiSession(bai, soCau, onXong) {
  const [cauHois, setCauHois]     = useState([])
  const [cauIdx, setCauIdx]       = useState(0)
  const [phase, setPhase]         = useState('loading')
  const [nhanXet, setNhanXet]     = useState(null)
  const [ketQuas, setKetQuas]     = useState([])
  const [aiDangDoc, setAiDangDoc] = useState(false)

  const sinhCauHoi = async () => {
    try {
      const res = await fetch(`${API_URL}/api/do-bai/sinh-cau-hoi`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ id_tai_lieu: bai.id, so_cau: soCau }),
      })
      const data = await res.json()
      const ds = data.cau_hois || []
      if (ds.length === 0) {
        alert('AI không sinh được câu hỏi. Thử lại nhé!')
        onXong(); return null
      }
      setCauHois(ds)
      setPhase('reading')
      return ds
    } catch {
      alert('Lỗi kết nối!')
      onXong(); return null
    }
  }

  const chamDiem = async (transcript) => {
    if (!transcript.trim()) return null
    setPhase('checking')
    const cau = cauHois[cauIdx]
    try {
      const res = await fetch(`${API_URL}/api/do-bai/cham-diem`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          id_cau_hoi:  cau.id ?? null,
          cau_hoi:     cau.cau_hoi,
          dap_an_mau:  cau.dap_an_mau,
          cau_tra_loi: transcript,
        }),
      })
      const data = await res.json()
      setNhanXet(data)
      setKetQuas(prev => [...prev, {
        cau_hoi: cau.cau_hoi, cau_tra_loi: transcript, dung: data.la_dung,
      }])
      setPhase('result_cau')
      return data
    } catch { return null }
  }

  const cauTiep = () => {
    const next = cauIdx + 1
    if (next >= cauHois.length) {
      const soDung = ketQuas.filter(k => k.dung).length + (nhanXet?.la_dung ? 1 : 0)
      luuKetQua(soDung, cauHois.length)
      setPhase('done')
    } else {
      setCauIdx(next)
      setPhase('reading')
    }
    return next
  }

  const luuKetQua = async (soDung, tong) => {
    const allResults = [...ketQuas]
    if (nhanXet) {
      allResults.push({
        cau_hoi:     cauHois[cauIdx]?.cau_hoi || '',
        cau_tra_loi: nhanXet.cau_tra_loi || '',
        dung:        !!nhanXet.la_dung,
      })
    }
    const chiTiet = allResults.map(k => ({
      cau_hoi: k.cau_hoi, cau_tra_loi: k.cau_tra_loi, dung: !!k.dung,
    }))

    try {
      await fetch(`${API_URL}/api/do-bai/luu-ket-qua`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          id_tai_lieu:  bai.id,
          tong_cau:     tong,
          so_cau_dung:  soDung,
          chi_tiet:     chiTiet,
          id_buoc_hoc:  bai.id_buoc_hoc ?? null,
        }),
      })
    } catch {}
  }

  return {
    cauHois, cauIdx, phase, nhanXet, ketQuas, aiDangDoc,
    setAiDangDoc, setPhase,
    sinhCauHoi, chamDiem, cauTiep,
  }
}
