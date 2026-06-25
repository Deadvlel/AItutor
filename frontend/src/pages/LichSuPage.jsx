import { useState, useEffect, useCallback } from 'react';
import { History, Trophy, TrendingUp, Award } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: 'Bearer ' + localStorage.getItem('token'),
});

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function xepLoaiBadge(xepLoai) {
  const map = {
    'Giỏi': 'bg-emerald-100 text-emerald-700',
    'Khá': 'bg-blue-100 text-blue-700',
    'Trung bình': 'bg-amber-100 text-amber-700',
    'Yếu': 'bg-red-100 text-red-700',
  };
  return map[xepLoai] || 'bg-gray-100 text-gray-700';
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <History className="w-16 h-16 mb-4 stroke-1" />
      <p className="text-lg font-medium text-gray-500">Chưa có dữ liệu</p>
      <p className="text-sm mt-1">Lịch sử điểm sẽ hiển thị sau khi bạn hoàn thành bài học</p>
    </div>
  );
}

export default function LichSuPage() {
  const [lichSu, setLichSu] = useState([]);
  const [tong, setTong] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/lich-su?limit=50&offset=0`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setLichSu(data.lich_su || []);
      setTong(data.tong || 0);
    } catch {
      setLichSu([]);
      setTong(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const diemTrungBinh =
    lichSu.length > 0
      ? (lichSu.reduce((sum, item) => sum + item.diem, 0) / lichSu.length).toFixed(1)
      : '---';

  const diemCaoNhat =
    lichSu.length > 0
      ? Math.max(...lichSu.map((item) => item.diem)).toFixed(1)
      : '---';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <History className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Lịch sử điểm</h1>
          </div>
          <p className="text-blue-100 text-sm ml-11">Theo dõi quá trình học tập</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            icon={Award}
            label="Tổng bài làm"
            value={loading ? '...' : tong}
            color="bg-blue-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Điểm trung bình"
            value={loading ? '...' : diemTrungBinh}
            color="bg-emerald-500"
          />
          <StatCard
            icon={Trophy}
            label="Điểm cao nhất"
            value={loading ? '...' : diemCaoNhat}
            color="bg-amber-500"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['STT', 'Ngày', 'Môn', 'Bài', 'Loại', 'Điểm', 'Xếp loại'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          ) : lichSu.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['STT', 'Ngày', 'Môn', 'Bài', 'Loại', 'Điểm', 'Xếp loại'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lichSu.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/40 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {formatDate(item.ngay)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                        {item.ten_mon}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.ten_bai}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {item.loai}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-blue-600">
                        {item.diem}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${xepLoaiBadge(item.xep_loai)}`}
                        >
                          {item.xep_loai}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
