import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { TrendingUp, DollarSign, ShoppingCart, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { reportAPI, orderAPI } from '../api';
import { formatCurrency, formatNumber } from '../config';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function EnhancedDashboard() {
    const [stats, setStats] = useState({
        sales: 0,
        orders: 0,
        gross_profit: 0,
        gross_margin: 0,
        net_profit: 0,
        net_margin: 0,
        revenue_trend: 0,
        revenueTrend: [],
        topProducts: []
    });
    const [hourlyData, setHourlyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(Date.now());

    useEffect(() => {
        fetchDashboardData();

        // Auto-refresh every 30 seconds for realtime updates
        const interval = setInterval(() => {
            fetchDashboardData();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Get today's date in WIB timezone (UTC+7)
            const todayStr = new Date(new Date().getTime() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0];

            // Fetch dashboard stats
            const response = await reportAPI.getDashboard();
            setStats(response.data);

            // Fetch hourly breakdown for today
            const hourlyResponse = await reportAPI.getBreakdown('hourly', todayStr, todayStr);
            const apiData = hourlyResponse.data.data || [];

            // Generate complete 24-hour labels
            const complete24Hours = [];
            for (let hour = 0; hour < 24; hour++) {
                const label = `${String(hour).padStart(2, '0')}:00`;
                const existingData = apiData.find(d => d.label === label);
                complete24Hours.push({
                    label,
                    orders: existingData?.orders || 0,
                    revenue: existingData?.revenue || 0
                });
            }

            setHourlyData(complete24Hours);
            setRefreshKey(Date.now());
        } catch (error) {
            console.error('Dashboard error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Chart configurations - using hourly data for today
    const revenueChartData = {
        labels: hourlyData.map(d => d.label),
        datasets: [
            {
                label: 'Penjualan (Rp)',
                data: hourlyData.map(d => d.revenue),
                borderColor: 'rgb(249, 115, 22)',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const topProductsChartData = {
        labels: (stats.topProducts || []).map(p => p.name),
        datasets: [{
            label: 'Penjualan',
            data: (stats.topProducts || []).map(p => p.revenue),
            backgroundColor: [
                'rgba(249, 115, 22, 0.8)',
                'rgba(251, 146, 60, 0.8)',
                'rgba(253, 186, 116, 0.8)',
                'rgba(254, 215, 170, 0.8)',
                'rgba(254, 243, 199, 0.8)'
            ]
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: '#cbd5e1',
                    font: { family: "'Inter', sans-serif" }
                }
            }
        },
        scales: {
            y: {
                ticks: { color: '#64748b' },
                grid: { color: 'rgba(100, 116, 139, 0.1)' }
            },
            x: {
                ticks: { color: '#64748b' },
                grid: { color: 'rgba(100, 116, 139, 0.1)' }
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Dashboard</h1>
                <p className="text-slate-600 dark:text-slate-400">Overview penjualan & performa bisnis</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <KPICard
                    title="Penjualan Hari Ini"
                    value={formatCurrency(stats.sales)}
                    icon={<DollarSign />}
                    trend={stats.revenue_trend}
                    color="orange"
                />
                <KPICard
                    title="Jumlah Transaksi"
                    value={formatNumber(stats.orders)}
                    icon={<ShoppingCart />}
                    trend={+3.1}
                    color="blue"
                />
                <KPICard
                    title="Margin Kotor"
                    value={`${stats.gross_margin}%`}
                    subtitle={formatCurrency(stats.gross_profit)}
                    icon={<TrendingUp />}
                    color="emerald"
                />
                <KPICard
                    title="Margin Bersih"
                    value={`${stats.net_margin}%`}
                    subtitle={formatCurrency(stats.net_profit)}
                    icon={<TrendingUp />}
                    color="purple"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-orange-600" />
                        Penjualan Per Jam Hari Ini
                        <span className="ml-auto px-3 py-1 bg-red-500 text-white text-xs font-black rounded-full animate-pulse flex items-center gap-1">
                            <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                            LIVE
                        </span>
                    </h3>
                    <div className="h-80">
                        <Line key={`revenue-${refreshKey}`} data={revenueChartData} options={chartOptions} />
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Top Produk</h3>
                    <div className="h-80">
                        <Doughnut
                            key={`top-${refreshKey}`}
                            data={topProductsChartData}
                            options={{
                                ...chartOptions,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: {
                                            color: '#cbd5e1',
                                            font: { size: 11 }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Top Products Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Produk Terlaris Hari Ini</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                <th className="text-left py-3 px-4 text-sm font-bold text-slate-600 dark:text-slate-400">Produk</th>
                                <th className="text-right py-3 px-4 text-sm font-bold text-slate-600 dark:text-slate-400">Terjual</th>
                                <th className="text-right py-3 px-4 text-sm font-bold text-slate-600 dark:text-slate-400">Harga</th>
                                <th className="text-right py-3 px-4 text-sm font-bold text-slate-600 dark:text-slate-400">HPP</th>
                                <th className="text-right py-3 px-4 text-sm font-bold text-slate-600 dark:text-slate-400">Pendapatan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.topProducts.map((product, i) => (
                                <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{product.emoji}</span>
                                            <span className="font-medium text-slate-900 dark:text-white">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="text-right py-3 px-4 font-bold text-orange-600">{product.total_sold}</td>
                                    <td className="text-right py-3 px-4 text-slate-600 dark:text-slate-400">{formatCurrency(product.price)}</td>
                                    <td className="text-right py-3 px-4 text-slate-600 dark:text-slate-400">{formatCurrency(product.hpp)}</td>
                                    <td className="text-right py-3 px-4 font-bold text-slate-900 dark:text-white">{formatCurrency(product.revenue)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, subtitle, icon, trend, color }) {
    const colorClasses = {
        orange: 'from-orange-500 to-orange-600',
        blue: 'from-blue-500 to-blue-600',
        emerald: 'from-emerald-500 to-emerald-600',
        purple: 'from-purple-500 to-purple-600'
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`}></div>
            <div className="relative">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]} bg-opacity-10`}>
                        {React.cloneElement(icon, { size: 20, className: `text-${color}-600` })}
                    </div>
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white mb-1">{value}</p>
                {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
                {trend !== undefined && (
                    <div className="flex items-center gap-1 mt-2">
                        {trend > 0 ? (
                            <>
                                <ArrowUp size={16} className="text-emerald-500" />
                                <span className="text-sm font-bold text-emerald-500">+{trend}%</span>
                            </>
                        ) : (
                            <>
                                <ArrowDown size={16} className="text-red-500" />
                                <span className="text-sm font-bold text-red-500">{trend}%</span>
                            </>
                        )}
                        <span className="text-xs text-slate-500">vs kemarin</span>
                    </div>
                )}
            </div>
        </div>
    );
}
