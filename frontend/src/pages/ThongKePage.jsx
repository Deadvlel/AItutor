import { useState, useEffect } from 'react'
import { BookOpen, Clock, Star, FileText, BarChart3 } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }
}

function TienDoKyNang({ ten, mucDo }) {
  const barColor = mucDo >= 70 ? 'bg-emerald-500' : mucDo >= 40 ? 'bg-blue-500' : 'bg-amber-500'
  const textColor = mucDo >= 70 ? 'text-emerald-600' : mucDo >= 40 ? 'text-blue-600' : 'text-amber-600'

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <p className="text-slate-700 text-sm font-medium">{ten}</p>
        <span className={`text-xs font-bold ${textColor}`}>{mucDo}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${mucDo}%` }}
        />
      </div>
    </div>
  )
}

const DAYS_VI = { Mon: 'T2', Tue: 'T3', Wed: 'T4', Thu: 'T5', Fri: 'T6', Sat: 'T7', Sun: 'CN' }

export default function StatsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/api/thong-ke`, { headers: authHeaders() })
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => {
        setStats({
          tong_bai: 0,
          bai_tuan_nay: 0,
          diem_trung_binh: 0,
          xu_huong_diem: 0,
          hoat_dong_7_ngay: [],
          hoat_dong_gan_day: [],
          ky_nang: [],
        })
        setLoading(false)
      })
  }, [])

  const barData = stats?.hoat_dong_7_ngay || []
  const maxBar = Math.max(...barData.map(d => d.so_bai), 1)

  const statCards = [
    {
      label: 'Bài đã học',
      value: stats?.tong_bai || 0,
      trend: stats?.bai_tuan_nay ? `+${stats.bai_tuan_nay} tuần này` : null,
      icon: BookOpen,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trendColor: 'text-emerald-600',
    },
    {
      label: 'Thời gian học',
      value: `${Math.round((stats?.tong_bai || 0) * 0.5)}h`,
      subtext: 'ước tính',
      icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      label: 'Điểm trung bình',
      value: stats?.diem_trung_binh || 0,
      trend: stats?.xu_huong_diem ? `${stats.xu_huong_diem > 0 ? '\u2191' : '\u2193'}${Math.abs(stats.xu_huong_diem)}` : null,
      icon: Star,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      trendColor: stats?.xu_huong_diem >= 0 ? 'text-emerald-600' : 'text-red-500',
    },
  ]

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-5xl">
        <div>
          <div className="w-48 h-7 bg-slate-100 rounded-lg animate-pulse" />
          <div className="w-64 h-4 bg-slate-100 rounded mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
              <div className="w-11 h-11 rounded-xl bg-slate-100 mb-4" />
              <div className="w-20 h-8 rounded-lg bg-slate-100 mb-2" />
              <div className="w-28 h-4 rounded bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="flex gap-4">
          <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-6 h-56 animate-pulse" />
          <div className="w-80 bg-white rounded-2xl border border-slate-100 p-6 h-56 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-slate-800 font-bold text-2xl">Thống kê học tập</h1>
        <p className="text-slate-400 text-sm mt-1">Tổng quan tiến độ và hoạt động.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {statCards.map((s, i) => {
          const Icon = s.icon
          return (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md hover:shadow-slate-100/50 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                  <Icon size={20} className={s.iconColor} strokeWidth={2} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-slate-800">{s.value}</p>
                {s.trend && (
                  <span className={`text-sm font-medium ${s.trendColor || 'text-slate-400'}`}>
                    {s.trend}
                  </span>
                )}
                {s.subtext && (
                  <span className="text-sm text-slate-400">{s.subtext}</span>
                )}
              </div>
              <p className="text-slate-400 text-sm mt-1">{s.label}</p>
            </div>
          )
        })}
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-6">
          <p className="text-slate-800 font-bold text-base mb-6">Hoạt động 7 ngày qua</p>

          {barData.length > 0 ? (
            <>
              <div className="flex items-end gap-3 h-36">
                {barData.map((d, i) => {
                  const pct = (d.so_bai / maxBar) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar">
                      <div className="relative w-full flex items-end" style={{ height: '120px' }}>
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 ${
                            d.la_hom_nay ? 'bg-blue-500' : 'bg-slate-100 group-hover/bar:bg-blue-200'
                          }`}
                          style={{ height: `${Math.max(pct, 4)}%`, transitionDelay: `${i * 60}ms` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${d.la_hom_nay ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                        {DAYS_VI[d.ngay] || d.ngay}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-slate-500 text-xs">Hôm nay</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <span className="text-slate-500 text-xs">Các ngày khác</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-36 text-slate-400 text-sm">
              Chưa có dữ liệu hoạt động
            </div>
          )}
        </div>

        <div className="w-80 bg-white rounded-2xl border border-slate-100 p-6 flex-shrink-0">
          <p className="text-slate-800 font-bold text-base mb-4">Hoạt động gần đây</p>
          {stats.hoat_dong_gan_day.length > 0 ? (
            <div className="flex flex-col">
              {stats.hoat_dong_gan_day.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-blue-600" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 text-sm font-semibold truncate">{item.tieu_de}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{item.thoi_gian}</p>
                  </div>
                  {item.diem != null && (
                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg font-bold ${
                        item.diem >= 8 ? 'text-emerald-600' : item.diem >= 6.5 ? 'text-blue-600' : 'text-amber-600'
                      }`}>{item.diem}</p>
                      <p className="text-slate-400 text-xs">Điểm</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-4">Chưa có hoạt động</p>
          )}

          {stats.ky_nang && stats.ky_nang.length > 0 && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={14} className="text-blue-600" />
                <p className="text-slate-800 font-semibold text-sm">Kỹ năng</p>
              </div>
              <div className="flex flex-col gap-3">
                {stats.ky_nang.map((kn, i) => (
                  <TienDoKyNang key={i} ten={kn.ten} mucDo={kn.muc_do} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}