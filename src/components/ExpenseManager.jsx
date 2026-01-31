import React, { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Plus, Calendar, TrendingDown, Download, Filter } from 'lucide-react';
import { expenseAPI } from '../api';
import { formatCurrency, formatDate } from '../config';

export default function ExpenseManager() {
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [summary, setSummary] = useState({ total: 0, by_category: {} });
    const [dateFilter, setDateFilter] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, [dateFilter]);

    const fetchData = async () => {
        try {
            const [expRes, catRes] = await Promise.all([
                expenseAPI.getAll(dateFilter),
                expenseAPI.getCategories()
            ]);
            const data = expRes.data;
            setExpenses(data.expenses || []);
            setCategories(catRes.data.categories || []);

            // Calculate summary
            const total = (data.expenses || []).reduce((sum, e) => sum + e.amount, 0);
            const byCategory = {};
            (data.expenses || []).forEach(e => {
                byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
            });
            setSummary({ total, by_category: byCategory });
        } catch (error) {
            console.error('Fetch expense error:', error);
        }
    };

    // Chart data
    const categoryChartData = {
        labels: Object.keys(summary.by_category),
        datasets: [{
            label: 'Pengeluaran per Kategori',
            data: Object.values(summary.by_category),
            backgroundColor: [
                'rgba(249, 115, 22, 0.8)',
                'rgba(239, 68, 68, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(16, 185, 129, 0.8)',
                'rgba(168, 85, 247, 0.8)',
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                        Pengeluaran
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Kelola dan analisis pengeluaran operasional
                    </p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-all">
                    <Download size={20} />
                    Export
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                    <Filter size={20} className="text-slate-500" />
                    <input
                        type="date"
                        value={dateFilter.start}
                        onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                        className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                    <span className="text-slate-500">s/d</span>
                    <input
                        type="date"
                        value={dateFilter.end}
                        onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                        className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
                    <p className="text-sm opacity-90 mb-2">Total Pengeluaran</p>
                    <p className="text-4xl font-black">{formatCurrency(summary.total)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Jumlah Transaksi</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white">{expenses.length}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Rata-rata</p>
                    <p className="text-4xl font-black text-slate-900 dark:text-white">
                        {formatCurrency(expenses.length > 0 ? summary.total / expenses.length : 0)}
                    </p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                {/* Category Chart */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Per Kategori</h3>
                    <div className="h-80">
                        <Doughnut data={categoryChartData} options={{
                            ...chartOptions,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: { color: '#cbd5e1', font: { size: 12 } }
                                }
                            }
                        }} />
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Breakdown Kategori</h3>
                    <div className="space-y-3">
                        {Object.entries(summary.by_category)
                            .sort((a, b) => b[1] - a[1])
                            .map(([category, amount]) => {
                                const percentage = (amount / summary.total * 100).toFixed(1);
                                const cat = categories.find(c => c.name === category);
                                return (
                                    <div key={category} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{cat?.emoji || '📦'}</span>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{category}</p>
                                                <p className="text-xs text-slate-500">{percentage}% dari total</p>
                                            </div>
                                        </div>
                                        <p className="font-black text-lg text-red-600">{formatCurrency(amount)}</p>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>

            {/* Expense List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Riwayat Transaksi</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                <th className="text-left py-3 px-4 text-sm font-bold text-slate-600 dark:text-slate-400">Tanggal</th>
                                <th className="text-left py-3 px-4 text-sm font-bold text-slate-600 dark:text-slate-400">Kategori</th>
                                <th className="text-left py-3 px-4 text-sm font-bold text-slate-600 dark:text-slate-400">Deskripsi</th>
                                <th className="text-left py-3 px-4 text-sm font-bold text-slate-600 dark:text-slate-400">Pembayaran</th>
                                <th className="text-right py-3 px-4 text-sm font-bold text-slate-600 dark:text-slate-400">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-12 text-slate-500">
                                        <TrendingDown size={48} className="mx-auto mb-3 opacity-20" />
                                        <p>Belum ada pengeluaran pada periode ini</p>
                                    </td>
                                </tr>
                            ) : (
                                expenses.map(exp => {
                                    const cat = categories.find(c => c.name === exp.category);
                                    return (
                                        <tr key={exp.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                                                {formatDate(exp.expense_date)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-full text-sm">
                                                    <span>{cat?.emoji || '📦'}</span>
                                                    <span className="font-medium">{exp.category}</span>
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-900 dark:text-white">{exp.description}</td>
                                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 uppercase">
                                                {exp.payment_method}
                                            </td>
                                            <td className="text-right py-3 px-4 font-bold text-red-600">
                                                {formatCurrency(exp.amount)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
