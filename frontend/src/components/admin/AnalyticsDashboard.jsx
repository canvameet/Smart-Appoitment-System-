import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaTimesCircle, FaClock, FaChartLine, FaChartBar, FaChartPie } from 'react-icons/fa';
import LoadingLogo from '../LoadingLogo';

const API = 'http://localhost:5000';

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today'); // today, week, month

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/analytics/dashboard?range=${timeRange}`);
      if (response.data.success) {
        setAnalytics(response.data.data);
      } else {
        console.error('Analytics fetch failed:', response.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Set default empty data
      setAnalytics({
        statusBreakdown: { completed: 0, cancelled: 0, pending: 0 },
        dailyTrend: [],
        slotDistribution: [],
        totalAppointments: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingLogo size="lg" />
        <p className="mt-4 text-gray-600 font-semibold">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  const { statusBreakdown, dailyTrend, slotDistribution, totalAppointments } = analytics;

  // Show empty state if no appointments
  if (totalAppointments === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
            <p className="text-gray-500 mt-1">Comprehensive appointment insights</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-16 rounded-2xl shadow-lg border-2 border-dashed border-blue-300 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaChartLine className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Data Yet</h3>
            <p className="text-gray-600 mb-6">Analytics will appear here once appointments are created. Start by booking appointments to see insights.</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate percentages for pie chart
  const total = statusBreakdown.completed + statusBreakdown.cancelled + statusBreakdown.pending;
  const completedPercent = total > 0 ? (statusBreakdown.completed / total) * 100 : 0;
  const cancelledPercent = total > 0 ? (statusBreakdown.cancelled / total) * 100 : 0;
  const pendingPercent = total > 0 ? (statusBreakdown.pending / total) * 100 : 0;

  // SVG Pie Chart
  const PieChart = () => {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    
    const completedOffset = 0;
    const cancelledOffset = (completedPercent / 100) * circumference;
    const pendingOffset = ((completedPercent + cancelledPercent) / 100) * circumference;

    return (
      <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
        {/* Completed (Green) */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#10b981"
          strokeWidth="40"
          strokeDasharray={`${(completedPercent / 100) * circumference} ${circumference}`}
          strokeDashoffset={-completedOffset}
        />
        {/* Cancelled (Red) */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#ef4444"
          strokeWidth="40"
          strokeDasharray={`${(cancelledPercent / 100) * circumference} ${circumference}`}
          strokeDashoffset={-cancelledOffset}
        />
        {/* Pending (Yellow) */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="40"
          strokeDasharray={`${(pendingPercent / 100) * circumference} ${circumference}`}
          strokeDashoffset={-pendingOffset}
        />
      </svg>
    );
  };

  // Line Chart for Daily Trend
  const LineChart = () => {
    if (!dailyTrend || dailyTrend.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <p>No trend data available</p>
        </div>
      );
    }

    const maxValue = Math.max(...dailyTrend.map(d => d.count), 1);
    const width = 600;
    const height = 200;
    const padding = 40;

    const points = dailyTrend.map((d, i) => {
      const x = padding + (i / (dailyTrend.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((d.count / maxValue) * (height - 2 * padding));
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = padding + (i / 4) * (height - 2 * padding);
          return (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Area under line */}
        <polygon
          points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
          fill="url(#lineGradient)"
          opacity="0.3"
        />

        {/* Data points */}
        {dailyTrend.map((d, i) => {
          const x = padding + (i / (dailyTrend.length - 1)) * (width - 2 * padding);
          const y = height - padding - ((d.count / maxValue) * (height - 2 * padding));
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill="#3b82f6" />
              <text x={x} y={height - 10} textAnchor="middle" fontSize="12" fill="#6b7280">
                {d.date}
              </text>
            </g>
          );
        })}

        {/* Gradient */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  // Bar Chart for Slot Distribution
  const BarChart = () => {
    if (!slotDistribution || slotDistribution.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <p>No slot data available</p>
        </div>
      );
    }

    const maxValue = Math.max(...slotDistribution.map(s => s.count), 1);
    const width = 600;
    const height = 250;
    const padding = 40;
    const barWidth = (width - 2 * padding) / slotDistribution.length - 10;

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = padding + (i / 4) * (height - 2 * padding);
          return (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}

        {/* Bars */}
        {slotDistribution.map((slot, i) => {
          const x = padding + i * ((width - 2 * padding) / slotDistribution.length);
          const barHeight = (slot.count / maxValue) * (height - 2 * padding);
          const y = height - padding - barHeight;

          return (
            <g key={i}>
              <rect
                x={x + 5}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="url(#barGradient)"
                rx="4"
              />
              <text
                x={x + barWidth / 2 + 5}
                y={y - 5}
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill="#3b82f6"
              >
                {slot.count}
              </text>
              <text
                x={x + barWidth / 2 + 5}
                y={height - 10}
                textAnchor="middle"
                fontSize="11"
                fill="#6b7280"
              >
                {slot.timeSlot}
              </text>
            </g>
          );
        })}

        {/* Gradient */}
        <defs>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Time Range Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-500 mt-1">Comprehensive appointment insights</p>
        </div>
        <div className="flex gap-2">
          {['today', 'week', 'month'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-600 font-semibold text-sm uppercase">Total</span>
            <FaChartLine className="text-blue-600 text-xl" />
          </div>
          <p className="text-4xl font-black text-blue-700">{totalAppointments}</p>
          <p className="text-sm text-blue-600 mt-1">Appointments</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-600 font-semibold text-sm uppercase">Completed</span>
            <FaCheckCircle className="text-green-600 text-xl" />
          </div>
          <p className="text-4xl font-black text-green-700">{statusBreakdown.completed}</p>
          <p className="text-sm text-green-600 mt-1">{completedPercent.toFixed(1)}% Success Rate</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border-2 border-red-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-600 font-semibold text-sm uppercase">Cancelled</span>
            <FaTimesCircle className="text-red-600 text-xl" />
          </div>
          <p className="text-4xl font-black text-red-700">{statusBreakdown.cancelled}</p>
          <p className="text-sm text-red-600 mt-1">{cancelledPercent.toFixed(1)}% Cancelled</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border-2 border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-600 font-semibold text-sm uppercase">Pending</span>
            <FaClock className="text-yellow-600 text-xl" />
          </div>
          <p className="text-4xl font-black text-yellow-700">{statusBreakdown.pending}</p>
          <p className="text-sm text-yellow-600 mt-1">{pendingPercent.toFixed(1)}% Pending</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <FaChartPie className="text-blue-600 text-xl" />
            <h3 className="text-lg font-bold text-gray-900">Status Distribution</h3>
          </div>
          <div className="flex flex-col items-center">
            <PieChart />
            <div className="mt-6 space-y-2 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-700">Completed</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{statusBreakdown.completed}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-gray-700">Cancelled</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{statusBreakdown.cancelled}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span className="text-sm font-medium text-gray-700">Pending</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{statusBreakdown.pending}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <FaChartLine className="text-blue-600 text-xl" />
            <h3 className="text-lg font-bold text-gray-900">Daily Appointment Trend</h3>
          </div>
          <div className="overflow-x-auto">
            <LineChart />
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <FaChartBar className="text-blue-600 text-xl" />
          <h3 className="text-lg font-bold text-gray-900">Most Booked Time Slots</h3>
        </div>
        <div className="overflow-x-auto">
          <BarChart />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
