import { ButtonSpinner } from '../components/Spinner';
import { DashboardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import { Users, Building2, Home, KeyRound, CreditCard, CalendarDays, Clock, IndianRupee, TrendingUp, TrendingDown, ArrowUpRight, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import Chart from 'react-apexcharts';
import UserAvatar from '../components/UserAvatar';
import { useSocietyConfig, typeName } from '../context/SocietyConfigContext';

const fmt = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });

export default function Dashboard() {
  const { user } = useAuth();
  const { config, incomeTypes } = useSocietyConfig();
  const propertyLabel = config?.propertyLabel || 'Property';
  const [stats, setStats] = useState({ users: 0, properties: 0, occupied: 0, vacant: 0, rented: 0 });
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, propertiesRes, paymentsRes, bookingsRes, expensesRes] = await Promise.all([
          adminAPI.getUsers(), adminAPI.getProperties(), adminAPI.getAllPayments(), adminAPI.getAllBookings(), adminAPI.getExpenses(),
        ]);
        const propertiesList = propertiesRes.data;
        setStats({
          users: usersRes.data.length, properties: propertiesList.length,
          occupied: propertiesList.filter(v => v.status === 'OCCUPIED').length,
          vacant: propertiesList.filter(v => v.status === 'VACANT').length,
          rented: propertiesList.filter(v => v.status === 'RENTED').length,
        });
        setPayments(paymentsRes.data);
        setExpenses(expensesRes.data);
        setPendingPayments(paymentsRes.data.filter(p => p.status === 'PENDING'));
        setPendingBookings(bookingsRes.data.filter(b => b.status === 'PENDING'));
      } catch (err) { console.error('Failed to load stats', err); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  const totalCollected = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0);
  const totalPendingDues = pendingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);

  // --- Chart Data Computations ---

  // Monthly trend: last 6 months of income and expenses
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) });
    }

    const income = months.map(m => {
      return payments.filter(p => {
        if (p.status !== 'PAID') return false;
        const dt = new Date(p.paidAt || p.createdAt);
        return dt.getFullYear() === m.year && dt.getMonth() === m.month;
      }).reduce((s, p) => s + Number(p.amount), 0);
    });

    const expense = months.map(m => {
      return expenses.filter(e => {
        const dt = new Date(e.expenseDate || e.createdAt);
        return dt.getFullYear() === m.year && dt.getMonth() === m.month;
      }).reduce((s, e) => s + Number(e.amount), 0);
    });

    return { labels: months.map(m => m.label), income, expense };
  }, [payments, expenses]);

  // Payment type distribution
  const paymentTypeData = useMemo(() => {
    const types = {};
    payments.filter(p => p.status === 'PAID').forEach(p => {
      const t = typeName(p.paymentType, incomeTypes) || 'Other';
      types[t] = (types[t] || 0) + Number(p.amount);
    });
    return { labels: Object.keys(types), series: Object.values(types) };
  }, [payments, incomeTypes]);

  // Property occupancy
  const propertyData = useMemo(() => ({
    labels: ['Occupied', 'Vacant', 'Rented'],
    series: [stats.occupied, stats.vacant, stats.rented],
  }), [stats]);

  // Chart theme colors
  const chartColors = {
    primary: '#1a6dd1',
    success: '#0da684',
    danger: '#ef3463',
    warning: '#f4a14d',
    info: '#41cbd8',
    purple: '#4a94e0',
  };

  // ApexCharts base options
  const isDark = document.documentElement.classList.contains('dark');
  const baseChart = {
    chart: { fontFamily: 'inherit', toolbar: { show: false }, background: 'transparent' },
    theme: { mode: isDark ? 'dark' : 'light' },
    grid: { borderColor: isDark ? '#2a3248' : '#e3ebf6', strokeDashArray: 4 },
    tooltip: { theme: isDark ? 'dark' : 'light' },
  };

  // Monthly Trend (Area chart)
  const trendOptions = {
    ...baseChart,
    chart: { ...baseChart.chart, type: 'area', height: 320, sparkline: { enabled: false } },
    colors: [chartColors.primary, chartColors.danger],
    stroke: { curve: 'smooth', width: 2.5 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 95, 100] } },
    dataLabels: { enabled: false },
    xaxis: { categories: monthlyData.labels, labels: { style: { colors: isDark ? '#7a82b1' : '#95a0c5', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: isDark ? '#7a82b1' : '#95a0c5', fontSize: '11px' }, formatter: (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v } },
    legend: { position: 'top', horizontalAlign: 'right', labels: { colors: isDark ? '#a8b5d1' : '#555b7e' }, fontSize: '12px', markers: { size: 4, offsetX: -2 } },
  };
  const trendSeries = [
    { name: 'Receipts', data: monthlyData.income },
    { name: 'Payments', data: monthlyData.expense },
  ];

  // Payment Type (Donut)
  const donutOptions = {
    ...baseChart,
    chart: { ...baseChart.chart, type: 'donut', height: 280 },
    colors: [chartColors.primary, chartColors.success, chartColors.purple, chartColors.warning],
    labels: paymentTypeData.labels,
    plotOptions: { pie: { donut: { size: '70%', labels: { show: true, name: { fontSize: '13px', color: isDark ? '#d9e1ec' : '#25282d' }, value: { fontSize: '18px', fontWeight: 600, color: isDark ? '#d9e1ec' : '#25282d', formatter: (v) => `₹${fmt(v)}` }, total: { show: true, label: 'Total', color: isDark ? '#7a82b1' : '#95a0c5', formatter: (w) => `₹${fmt(w.globals.seriesTotals.reduce((a, b) => a + b, 0))}` } } } } },
    dataLabels: { enabled: false },
    legend: { position: 'bottom', labels: { colors: isDark ? '#a8b5d1' : '#555b7e' }, fontSize: '12px', markers: { size: 4, offsetX: -2 } },
    stroke: { width: 0 },
  };

  // Property Occupancy (Donut)
  const propertyOptions = {
    ...baseChart,
    chart: { ...baseChart.chart, type: 'donut', height: 280 },
    colors: [chartColors.success, chartColors.warning, chartColors.purple],
    labels: propertyData.labels,
    plotOptions: { pie: { donut: { size: '70%', labels: { show: true, name: { fontSize: '13px', color: isDark ? '#d9e1ec' : '#25282d' }, value: { fontSize: '22px', fontWeight: 600, color: isDark ? '#d9e1ec' : '#25282d' }, total: { show: true, label: `Total ${propertyLabel}s`, color: isDark ? '#7a82b1' : '#95a0c5', formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0) } } } } },
    dataLabels: { enabled: false },
    legend: { position: 'bottom', labels: { colors: isDark ? '#a8b5d1' : '#555b7e' }, fontSize: '12px', markers: { size: 4, offsetX: -2 } },
    stroke: { width: 0 },
  };

  // Income vs Expense Bar Chart
  const barOptions = {
    ...baseChart,
    chart: { ...baseChart.chart, type: 'bar', height: 320 },
    colors: [chartColors.success, chartColors.danger],
    plotOptions: { bar: { horizontal: false, columnWidth: '50%', borderRadius: 4, borderRadiusApplication: 'end' } },
    dataLabels: { enabled: false },
    xaxis: { categories: monthlyData.labels, labels: { style: { colors: isDark ? '#7a82b1' : '#95a0c5', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: isDark ? '#7a82b1' : '#95a0c5', fontSize: '11px' }, formatter: (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v } },
    legend: { position: 'top', horizontalAlign: 'right', labels: { colors: isDark ? '#a8b5d1' : '#555b7e' }, fontSize: '12px', markers: { size: 4, offsetX: -2 } },
  };
  const barSeries = [
    { name: 'Receipts', data: monthlyData.income },
    { name: 'Payments', data: monthlyData.expense },
  ];

  const cards = [
    { label: 'Total Collections', value: `₹${fmt(totalCollected)}`, icon: TrendingUp, color: 'bg-green-500', textColor: 'text-green-600 dark:text-green-400' },
    { label: 'Outstanding Dues', value: `₹${fmt(totalPendingDues)}`, icon: Clock, color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400', link: '/payments' },
    { label: 'Total Expenditure', value: `₹${fmt(totalExpenses)}`, icon: TrendingDown, color: 'bg-red-500', textColor: 'text-red-600 dark:text-red-400', link: '/expenses' },
    { label: 'Net Surplus / (Deficit)', value: `₹${fmt(totalCollected - totalExpenses)}`, icon: IndianRupee, color: 'bg-indigo-500', textColor: (totalCollected - totalExpenses) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' },
  ];

  const statCards = [
    { label: 'Registered Members', value: stats.users, icon: Users, color: 'bg-indigo-100 dark:bg-indigo-500/15', iconColor: 'text-indigo-600 dark:text-indigo-400' },
    { label: `Total ${propertyLabel}s`, value: stats.properties, icon: Building2, color: 'bg-purple-100 dark:bg-purple-500/15', iconColor: 'text-purple-600 dark:text-purple-400' },
    { label: 'Occupied', value: stats.occupied, icon: Home, color: 'bg-green-100 dark:bg-green-500/15', iconColor: 'text-green-600 dark:text-green-400' },
    { label: 'Vacant', value: stats.vacant, icon: KeyRound, color: 'bg-amber-100 dark:bg-amber-500/15', iconColor: 'text-amber-600 dark:text-amber-400' },
    { label: 'Rented', value: stats.rented, icon: Building2, color: 'bg-cyan-100 dark:bg-cyan-500/15', iconColor: 'text-cyan-600 dark:text-cyan-400' },
    { label: 'Pending Reservations', value: pendingBookings.length, icon: CalendarDays, color: 'bg-orange-100 dark:bg-orange-500/15', iconColor: 'text-orange-600 dark:text-orange-400', link: '/booking-requests' },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-heading">Welcome, {user?.firstName || user?.fullName}</h1>
        <p className="text-[13px] text-muted mt-0.5">Here's an overview of your society</p>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cards.map((card) => {
              const inner = (
                <div className="bg-card rounded-lg border border-border p-5 stat-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-medium text-muted uppercase tracking-wider">{card.label}</p>
                      <p className={`text-[22px] font-bold mt-1 ${card.textColor}`}>{card.value}</p>
                    </div>
                    <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              );
              return card.link ? <Link key={card.label} to={card.link}>{inner}</Link> : <div key={card.label}>{inner}</div>;
            })}
          </div>

          {/* Stat Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {statCards.map((card) => {
              const inner = (
                <div className="bg-card rounded-lg border border-border p-4 text-center stat-card">
                  <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                    <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  <p className="text-[20px] font-bold text-heading">{card.value}</p>
                  <p className="text-[11px] text-muted mt-0.5">{card.label}</p>
                </div>
              );
              return card.link ? <Link key={card.label} to={card.link}>{inner}</Link> : <div key={card.label}>{inner}</div>;
            })}
          </div>

          {/* Charts Row 1: Monthly Trend + Payment Type */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-card rounded-lg border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-[14px] font-semibold text-heading">Revenue & Expenditure Trend</h2>
                <p className="text-[11px] text-muted mt-0.5">Monthly receipts vs. payments over the last 6 months</p>
              </div>
              <div className="p-4">
                <Chart options={trendOptions} series={trendSeries} type="area" height={320} />
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-[14px] font-semibold text-heading">Collection by Category</h2>
                <p className="text-[11px] text-muted mt-0.5">Income distribution by type</p>
              </div>
              <div className="p-4 flex items-center justify-center">
                {paymentTypeData.series.length > 0 ? (
                  <Chart options={donutOptions} series={paymentTypeData.series} type="donut" height={280} />
                ) : (
                  <EmptyState icon={CreditCard} title="No payment data" description="Payment data will appear here once collections are recorded." />
                )}
              </div>
            </div>
          </div>

          {/* Charts Row 2: Income vs Expense Bar + Property Occupancy */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-card rounded-lg border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-[14px] font-semibold text-heading">Receipts vs. Expenditure</h2>
                <p className="text-[11px] text-muted mt-0.5">Monthly comparison</p>
              </div>
              <div className="p-4">
                <Chart options={barOptions} series={barSeries} type="bar" height={320} />
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-[14px] font-semibold text-heading">{propertyLabel} Occupancy</h2>
                <p className="text-[11px] text-muted mt-0.5">Current occupancy status</p>
              </div>
              <div className="p-4 flex items-center justify-center">
                {propertyData.series.some(v => v > 0) ? (
                  <Chart options={propertyOptions} series={propertyData.series} type="donut" height={280} />
                ) : (
                  <EmptyState icon={Building2} title={`No ${propertyLabel.toLowerCase()} data`} description={`${propertyLabel} occupancy data will appear here once properties are added.`} />
                )}
              </div>
            </div>
          </div>

          {/* Pending Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Dues */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-heading">Outstanding Receivables</h2>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-bold text-amber-600 dark:text-amber-400">₹{fmt(totalPendingDues)}</span>
                  <Link to="/payments" className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium flex items-center gap-0.5">View All <ArrowUpRight className="w-3 h-3" /></Link>
                </div>
              </div>
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {pendingPayments.length === 0
                  ? <EmptyState icon={CreditCard} title="No pending dues" description="All members are up to date with their payments." />
                  : pendingPayments.slice(0, 8).map((p) => (
                    <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                      <UserAvatar name={p.fullName} src={p.profileImage} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-heading truncate">{p.fullName}</p>
                        <p className="text-[11px] text-muted">{typeName(p.paymentType, incomeTypes)}</p>
                      </div>
                      <span className="text-[13px] font-semibold text-heading">₹{fmt(p.amount)}</span>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Booking Requests */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-heading">Pending Facility Reservations</h2>
                <Link to="/booking-requests" className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium flex items-center gap-0.5">View All <ArrowUpRight className="w-3 h-3" /></Link>
              </div>
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {pendingBookings.length === 0
                  ? <EmptyState icon={CalendarDays} title="No pending requests" description="There are no facility reservation requests to review." />
                  : pendingBookings.slice(0, 8).map((b) => (
                    <div key={b.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-500/20 rounded-full flex items-center justify-center shrink-0">
                        <CalendarDays className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-heading truncate">{b.fullName}</p>
                        <p className="text-[11px] text-muted">{b.amenityName} &middot; {b.bookingDate} to {b.bookingEndDate}</p>
                      </div>
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400">Pending</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
