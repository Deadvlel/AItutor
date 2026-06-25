import { useState, useEffect, useCallback } from "react";
import { Users, Shield, Trash2, BarChart3, Trophy, Medal, Award, Bot, Bell, Send } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: "Bearer " + localStorage.getItem("token"),
});

function ConfirmModal({ open, onClose, onConfirm, userName }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-gray-900">Xác nhận xoá</h3>
        <p className="mt-2 text-sm text-gray-600">
          Bạn có chắc chắn muốn xoá người dùng{" "}
          <span className="font-semibold text-gray-900">{userName}</span>? Hành
          động này không thể hoàn tác.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">Huỷ</button>
          <button onClick={onConfirm} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700">Xoá</button>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function RankIcon({ rank }) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Award className="h-5 w-5 text-amber-700" />;
  return <span className="text-sm font-medium text-gray-500">{rank}</span>;
}

export default function AdminPage({ initialTab = "users" }) {
  const [tab, setTab] = useState(initialTab);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [aiLogs, setAiLogs] = useState([]);
  const [aiLogTong, setAiLogTong] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [tbTieuDe, setTbTieuDe] = useState("");
  const [tbNoiDung, setTbNoiDung] = useState("");
  const [tbSending, setTbSending] = useState(false);
  const [tbMsg, setTbMsg] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/nguoi-dung`, { headers: authHeaders() });
      if (res.ok) setUsers(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/thong-ke`, { headers: authHeaders() });
      if (res.ok) setStats(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  const fetchAiLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/ai-log?limit=50`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAiLogs(data.logs || []);
        setAiLogTong(data.tong || 0);
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === "users") fetchUsers();
    else if (tab === "stats") fetchStats();
    else if (tab === "ailog") fetchAiLogs();
  }, [tab, fetchUsers, fetchStats, fetchAiLogs]);

  const toggleRole = async (user) => {
    const newRole = user.vai_tro === "admin" ? "hoc_sinh" : "admin";
    try {
      const res = await fetch(`${API_URL}/api/admin/nguoi-dung/${user.id}/vai-tro`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify({ vai_tro: newRole }),
      });
      if (res.ok) setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, vai_tro: newRole } : u)));
    } catch {}
  };

  const deleteUser = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/nguoi-dung/${deleteTarget.id}`, {
        method: "DELETE", headers: authHeaders(),
      });
      if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    } catch {} finally { setDeleteTarget(null); }
  };

  const guiThongBao = async () => {
    if (!tbTieuDe.trim() || !tbNoiDung.trim()) return;
    setTbSending(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/gui-thong-bao`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ tieu_de: tbTieuDe, noi_dung: tbNoiDung }),
      });
      if (res.ok) {
        const data = await res.json();
        setTbMsg(data.message);
        setTbTieuDe("");
        setTbNoiDung("");
        setTimeout(() => setTbMsg(""), 3000);
      }
    } catch {} finally { setTbSending(false); }
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const tabs = [
    { key: "users", icon: Users, text: "Người dùng" },
    { key: "stats", icon: BarChart3, text: "Thống kê" },
    { key: "ailog", icon: Bot, text: "AI Log" },
    { key: "notify", icon: Bell, text: "Thông báo" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Quản trị hệ thống</h1>
        <p className="mt-1 text-sm text-gray-500">Quản lý người dùng, thống kê và giám sát AI</p>

        <div className="mt-6 flex gap-1 rounded-lg bg-gray-100 p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition ${
                tab === t.key ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.text}
            </button>
          ))}
        </div>

        {loading && (
          <div className="mt-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        )}

        {!loading && tab === "users" && (
          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">STT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Tên</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Vai trò</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Số bài</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-600">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.full_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.vai_tro === "admin" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {u.vai_tro === "admin" ? "Admin" : "Học sinh"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.so_bai_lam}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleRole(u)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600" title="Đổi vai trò">
                          <Shield className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(u)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600" title="Xoá">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && tab === "stats" && stats && (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatsCard icon={Users} label="Tổng người dùng" value={stats.tong_user} color="bg-blue-600" />
              <StatsCard icon={BarChart3} label="Tổng bài làm" value={stats.tong_bai_lam} color="bg-emerald-600" />
              <StatsCard icon={Award} label="Tổng môn học" value={stats.tong_mon} color="bg-violet-600" />
              <StatsCard icon={Trophy} label="Điểm TB" value={stats.diem_trung_binh} color="bg-amber-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <StatsCard icon={BarChart3} label="Tổng tài liệu" value={stats.tong_tai_lieu} color="bg-cyan-600" />
              <StatsCard icon={Trophy} label="Điểm cao nhất" value={stats.diem_cao_nhat} color="bg-rose-600" />
            </div>
            {stats.top_hoc_sinh?.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">Top học sinh</h3>
                <table className="mt-4 w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-2 text-left text-xs font-semibold uppercase text-gray-500">Hạng</th>
                      <th className="pb-2 text-left text-xs font-semibold uppercase text-gray-500">Tên</th>
                      <th className="pb-2 text-left text-xs font-semibold uppercase text-gray-500">Số bài</th>
                      <th className="pb-2 text-left text-xs font-semibold uppercase text-gray-500">Điểm TB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.top_hoc_sinh.map((hs, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-3"><RankIcon rank={i + 1} /></td>
                        <td className="py-3 text-sm font-medium text-gray-900">{hs.ten}</td>
                        <td className="py-3 text-sm text-gray-600">{hs.so_bai}</td>
                        <td className="py-3 text-sm font-semibold text-blue-600">{hs.diem_tb}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!loading && tab === "ailog" && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Tổng: {aiLogTong} lượt tương tác AI</p>
              <button onClick={fetchAiLogs} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition">Làm mới</button>
            </div>
            {aiLogs.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
                <Bot className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-3 text-sm text-gray-400">Chưa có log AI nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aiLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">{log.loai}</span>
                        <span className="text-sm font-medium text-gray-900">{log.ten_user}</span>
                      </div>
                      <span className="text-xs text-gray-400">{formatTime(log.thoi_gian)}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-blue-50 p-3">
                        <p className="text-xs font-semibold text-blue-600 mb-1">Input</p>
                        <p className="text-xs text-gray-700 whitespace-pre-wrap">{log.input || "—"}</p>
                      </div>
                      <div className="rounded-lg bg-emerald-50 p-3">
                        <p className="text-xs font-semibold text-emerald-600 mb-1">Output</p>
                        <p className="text-xs text-gray-700 whitespace-pre-wrap">{log.output || "—"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && tab === "notify" && (
          <div className="mt-6 mx-auto max-w-lg">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                Gửi thông báo cho học sinh
              </h3>
              <p className="mt-1 text-sm text-gray-500">Nhắc nhở học tập, thông báo bài mới, v.v.</p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                  <input
                    type="text"
                    value={tbTieuDe}
                    onChange={(e) => setTbTieuDe(e.target.value)}
                    placeholder="VD: Nhắc nhở ôn bài"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                  <textarea
                    value={tbNoiDung}
                    onChange={(e) => setTbNoiDung(e.target.value)}
                    placeholder="VD: Các bạn nhớ ôn lại bài Giải Tích 12 nhé!"
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-none"
                  />
                </div>
                <button
                  onClick={guiThongBao}
                  disabled={tbSending || !tbTieuDe.trim() || !tbNoiDung.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tbSending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Gửi cho tất cả học sinh
                </button>
                {tbMsg && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-700 font-medium">
                    {tbMsg}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={deleteUser}
          userName={deleteTarget?.full_name}
        />
      </div>
    </div>
  );
}
