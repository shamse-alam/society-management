import { StatSkeleton, TableSkeleton } from '../components/Skeleton';
import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useToast } from '../components/Toast';
import { Shield, Users, LogIn, LogOut, Clock, Search, Ban, XCircle, ChevronDown, BarChart3 } from 'lucide-react';
import Chart from 'react-apexcharts';
import { useSocietyConfig } from '../context/SocietyConfigContext';

const fmt = (dt) => {
  if (!dt) return '-';
  const d = new Date(dt);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
};

const statusBadge = {
  EXPECTED: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  CHECKED_IN: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  CHECKED_OUT: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400',
  DENIED: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  EXPIRED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
};

const statusIcon = {
  EXPECTED: Clock,
  CHECKED_IN: LogIn,
  CHECKED_OUT: LogOut,
  DENIED: Ban,
  EXPIRED: XCircle,
};

export default function AdminVisitorLogs() {
  const toast = useToast();
  const { config } = useSocietyConfig();
  const propertyLabel = config?.propertyLabel || 'Property';
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logsRes, statsRes, analyticsRes] = await Promise.allSettled([
          adminAPI.getVisitorLogs(),
          adminAPI.getVisitorStats(),
          adminAPI.getVisitorAnalytics(),
        ]);
        if (logsRes.status === 'fulfilled') setLogs(logsRes.value.data);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const filtered = logs.filter(v => {
    const matchSearch = !search || v.visitorName?.toLowerCase().includes(search.toLowerCase())
      || v.unitNumber?.toLowerCase().includes(search.toLowerCase())
      || v.residentName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="space-y-6"><StatSkeleton count={4} /><TableSkeleton /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">Visitor Logs</h1>
          <p className="text-[13px] text-muted mt-0.5">All visitor entry and exit records</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Expected Today', value: stats.expectedToday || 0, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', icon: Clock },
          { label: 'Currently Inside', value: stats.currentlyInside || 0, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10', icon: Users },
          { label: "Today's Check-ins", value: stats.todayCheckIns || 0, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10', icon: LogIn },
          { label: "Today's Check-outs", value: stats.todayCheckOuts || 0, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-500/10', icon: LogOut },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.bg}`}>
                <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-heading">{s.value}</p>
                <p className="text-[11px] text-muted font-medium">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      {analytics && (
        <div className="mb-6">
          <button onClick={() => setShowAnalytics(!showAnalytics)} className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg text-[13px] font-medium text-heading hover:bg-card-alt transition-colors mb-3">
            <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Visitor Analytics (Last 30 Days)
            <ChevronDown className={`w-4 h-4 ml-1 text-muted transition-transform ${showAnalytics ? 'rotate-180' : ''}`} />
          </button>
          {showAnalytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Daily Trend */}
              {analytics.dailyTrend?.length > 0 && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border"><h3 className="text-[13px] font-semibold text-heading">Daily Visitor Trend</h3></div>
                  <div className="p-3">
                    <Chart type="line" height={200} options={{
                      chart: { toolbar: { show: false }, background: 'transparent', fontFamily: 'inherit' },
                      theme: { mode: document.documentElement.classList.contains('dark') ? 'dark' : 'light' },
                      colors: ['#1a6dd1'], stroke: { curve: 'smooth', width: 2 },
                      xaxis: { categories: analytics.dailyTrend.map(d => d.date?.slice(5)), labels: { style: { fontSize: '10px' } }, axisBorder: { show: false } },
                      yaxis: { labels: { style: { fontSize: '10px' } } },
                      grid: { borderColor: document.documentElement.classList.contains('dark') ? '#2a3248' : '#e3ebf6', strokeDashArray: 4 },
                      dataLabels: { enabled: false },
                    }} series={[{ name: 'Visitors', data: analytics.dailyTrend.map(d => d.count) }]} />
                  </div>
                </div>
              )}
              {/* Type Distribution */}
              {analytics.typeDistribution && Object.keys(analytics.typeDistribution).length > 0 && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border"><h3 className="text-[13px] font-semibold text-heading">Visitor Types</h3></div>
                  <div className="p-3 flex justify-center">
                    <Chart type="donut" height={200} options={{
                      chart: { background: 'transparent', fontFamily: 'inherit' },
                      theme: { mode: document.documentElement.classList.contains('dark') ? 'dark' : 'light' },
                      labels: Object.keys(analytics.typeDistribution),
                      colors: ['#1a6dd1', '#0da684', '#4a94e0', '#f4a14d', '#ef3463'],
                      legend: { position: 'bottom', fontSize: '11px' },
                      dataLabels: { enabled: false }, stroke: { width: 0 },
                    }} series={Object.values(analytics.typeDistribution)} />
                  </div>
                </div>
              )}
              {/* Peak Hours */}
              {analytics.peakHours && Object.keys(analytics.peakHours).length > 0 && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border"><h3 className="text-[13px] font-semibold text-heading">Peak Hours</h3></div>
                  <div className="p-3">
                    <Chart type="bar" height={200} options={{
                      chart: { toolbar: { show: false }, background: 'transparent', fontFamily: 'inherit' },
                      theme: { mode: document.documentElement.classList.contains('dark') ? 'dark' : 'light' },
                      colors: ['#0da684'],
                      plotOptions: { bar: { borderRadius: 3, columnWidth: '60%' } },
                      xaxis: { categories: Object.keys(analytics.peakHours).sort((a,b) => a-b).map(h => `${h}:00`), labels: { style: { fontSize: '10px' } } },
                      yaxis: { labels: { style: { fontSize: '10px' } } },
                      grid: { borderColor: document.documentElement.classList.contains('dark') ? '#2a3248' : '#e3ebf6', strokeDashArray: 4 },
                      dataLabels: { enabled: false },
                    }} series={[{ name: 'Visitors', data: Object.keys(analytics.peakHours).sort((a,b) => a-b).map(h => analytics.peakHours[h]) }]} />
                  </div>
                </div>
              )}
              {/* Frequent Visitors + Top Properties */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border"><h3 className="text-[13px] font-semibold text-heading">{`Top Visitors & ${propertyLabel}s`}</h3></div>
                <div className="p-4 space-y-4">
                  {analytics.frequentVisitors?.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-muted uppercase mb-2">Frequent Visitors</p>
                      {analytics.frequentVisitors.slice(0, 5).map((v, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 text-[12px]">
                          <span className="text-heading font-medium">{v.name}</span>
                          <span className="text-muted">{v.count} visits</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {analytics.unitWiseCount?.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-muted uppercase mb-2">{`Most Visited ${propertyLabel}s`}</p>
                      {analytics.unitWiseCount.slice(0, 5).map((v, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 text-[12px]">
                          <span className="text-heading font-medium">{propertyLabel} {v.unitNumber}</span>
                          <span className="text-muted">{v.count} visitors</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search visitors, ${propertyLabel.toLowerCase()}s...`} className="w-full pl-9 pr-4 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-input-bg border border-input-border rounded-lg text-[13px] text-heading focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="ALL">All Status</option>
          <option value="EXPECTED">Expected</option>
          <option value="CHECKED_IN">Checked In</option>
          <option value="CHECKED_OUT">Checked Out</option>
          <option value="DENIED">Denied</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <Shield className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-[13px] text-muted">No visitor logs found</p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-card-alt">
                  <th className="text-left px-4 py-3 font-medium text-sub">Visitor</th>
                  <th className="text-left px-4 py-3 font-medium text-sub">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-sub">{propertyLabel}</th>
                  <th className="text-left px-4 py-3 font-medium text-sub">Resident</th>
                  <th className="text-left px-4 py-3 font-medium text-sub">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-sub">Check In</th>
                  <th className="text-left px-4 py-3 font-medium text-sub">Check Out</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const Icon = statusIcon[v.status] || Clock;
                  return (
                    <tr key={v.id} className="border-b border-border last:border-0 hover:bg-card-hover transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-heading">{v.visitorName}</p>
                        <p className="text-muted text-[12px]">{v.visitorPhone}</p>
                      </td>
                      <td className="px-4 py-3 text-muted">{v.visitorType}</td>
                      <td className="px-4 py-3 font-medium text-heading">{v.unitNumber}</td>
                      <td className="px-4 py-3 text-muted">{v.residentName}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${statusBadge[v.status] || ''}`}>
                          <Icon className="w-3 h-3" /> {v.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">{fmt(v.checkInTime)}</td>
                      <td className="px-4 py-3 text-muted">{fmt(v.checkOutTime)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
