import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { getMonitor, getMonitorHistory } from '../services/api';

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
      {sub && <p className="text-gray-600 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-gray-400 mb-1">{d.time}</p>
      <p className="text-white font-medium">{d.latency} ms</p>
      <p className={d.status === 'UP' ? 'text-green-400' : 'text-red-400'}>{d.status}</p>
    </div>
  );
}

const INTERVAL_LABELS = { 60: '1 min', 300: '5 min', 600: '10 min' };

export default function MonitorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [monitor, setMonitor] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [monRes, histRes] = await Promise.all([
          getMonitor(id),
          getMonitorHistory(id),
        ]);
        setMonitor(monRes.data.data);
        setHistory(histRes.data.data || []);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Monitor not found.');
        } else {
          setError('Failed to load monitor data.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const chartData = history
    .slice()
    .reverse()
    .slice(-50)
    .map((ping) => ({
      time: new Date(ping.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      latency: ping.latency ?? 0,
      status: ping.status,
    }));

  const upCount = history.filter((p) => p.status === 'UP').length;
  const uptimePercent =
    history.length > 0 ? ((upCount / history.length) * 100).toFixed(2) : '—';
  const avgLatency =
    history.length > 0
      ? Math.round(history.reduce((sum, p) => sum + (p.latency ?? 0), 0) / history.length)
      : '—';
  const lastChecked =
    history.length > 0
      ? new Date(history[0].timestamp).toLocaleString()
      : 'Never';
  const lastStatus = history.length > 0 ? history[0].status : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <main className="max-w-5xl mx-auto px-6 py-8 space-y-4">
          <div className="h-6 bg-gray-800 rounded w-64 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4 h-20 animate-pulse" />
            ))}
          </div>
          <div className="bg-gray-800 rounded-lg h-56 animate-pulse" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <main className="max-w-5xl mx-auto px-6 py-8">
          <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Back to Dashboard
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors mb-3 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </button>
          <div className="flex flex-wrap items-start gap-3">
            <div>
              <h1 className="text-white text-xl font-bold break-all">{monitor?.url}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {lastStatus && <StatusBadge status={lastStatus} />}
                <span className="text-gray-500 text-sm">
                  Every {INTERVAL_LABELS[monitor?.interval] || `${monitor?.interval}s`}
                </span>
                {monitor?.antiSleep && (
                  <span className="text-xs bg-blue-900/30 text-blue-400 border border-blue-800 px-2 py-0.5 rounded-full">
                    Anti-sleep
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Uptime"
            value={uptimePercent !== '—' ? `${uptimePercent}%` : '—'}
            sub={`${upCount} / ${history.length} checks`}
          />
          <StatCard
            label="Avg Latency"
            value={avgLatency !== '—' ? `${avgLatency} ms` : '—'}
          />
          <StatCard label="Total Checks" value={history.length} />
          <StatCard label="Last Checked" value={lastChecked} />
        </div>

        {/* Latency Chart */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
          <h2 className="text-gray-300 text-sm font-medium mb-4">Latency (last 50 checks)</h2>
          {chartData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-600 text-sm">
              No ping data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  unit=" ms"
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="latency"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#latencyGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#22c55e' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Pings Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700">
            <h2 className="text-gray-300 text-sm font-medium">Recent Pings</h2>
          </div>
          {history.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-600 text-sm">
              No ping records found. Ensure the ping worker is running.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-500 font-medium px-4 py-2.5 text-xs uppercase tracking-wider">
                      Time
                    </th>
                    <th className="text-left text-gray-500 font-medium px-4 py-2.5 text-xs uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left text-gray-500 font-medium px-4 py-2.5 text-xs uppercase tracking-wider">
                      Code
                    </th>
                    <th className="text-left text-gray-500 font-medium px-4 py-2.5 text-xs uppercase tracking-wider">
                      Latency
                    </th>
                    <th className="text-left text-gray-500 font-medium px-4 py-2.5 text-xs uppercase tracking-wider">
                      Region
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {history.slice(0, 50).map((ping, i) => (
                    <tr key={i} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">
                        {new Date(ping.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={ping.status} />
                      </td>
                      <td className="px-4 py-2.5 text-gray-400">
                        {ping.statusCode ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-gray-300">
                        {ping.latency != null ? `${ping.latency} ms` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 capitalize">
                        {ping.region ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
