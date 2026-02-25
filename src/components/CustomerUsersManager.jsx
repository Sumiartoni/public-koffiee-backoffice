import React, { useState, useEffect } from 'react';
import { customerUsersAPI } from '../api';
import { Users, Search, RefreshCw, Smartphone, Star, ShoppingBag, TrendingUp, Clock, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatIDR = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatDatetime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

function StatCard({ label, value, icon, color }) {
    const colors = {
        amber: 'from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-400',
        emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
        sky: 'from-sky-500/10 to-sky-600/5 border-sky-500/20 text-sky-400',
        violet: 'from-violet-500/10 to-violet-600/5 border-violet-500/20 text-violet-400',
    };
    return (
        <div className={`bg-gradient-to-br ${colors[color]} border rounded-[2.5rem] p-8 flex items-center gap-6`}>
            <div className="w-14 h-14 rounded-2xl bg-slate-950/50 flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
                <p className="text-2xl font-black text-white">{value}</p>
            </div>
        </div>
    );
}

export default function CustomerUsersManager() {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({ total: 0, activeToday: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDir, setSortDir] = useState('desc');

    const load = async () => {
        setLoading(true);
        try {
            const res = await customerUsersAPI.getAll();
            setUsers(res.data.users || []);
            setStats({ total: res.data.total || 0, activeToday: res.data.activeToday || 0 });
        } catch (err) {
            console.error('[CustomerUsersManager]', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = users
        .filter(u => {
            const q = search.toLowerCase();
            return !q || u.name?.toLowerCase().includes(q) || u.phone?.includes(q) || u.referral_code?.toLowerCase().includes(q);
        })
        .sort((a, b) => {
            let va = a[sortBy] ?? 0;
            let vb = b[sortBy] ?? 0;
            if (typeof va === 'string') va = va.toLowerCase();
            if (typeof vb === 'string') vb = vb.toLowerCase();
            return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
        });

    const totalRevenue = users.reduce((s, u) => s + parseFloat(u.total_spent || 0), 0);
    const totalPoints = users.reduce((s, u) => s + parseInt(u.points || 0), 0);

    const handleSort = (col) => {
        if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(col); setSortDir('desc'); }
    };

    const SortIcon = ({ col }) => sortBy === col ? (
        <span className="ml-1 text-amber-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
    ) : null;

    return (
        <div className="space-y-10 lg:px-4 animate-premium pb-20">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter text-white">Pengguna Aplikasi</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-2">
                        Database Member &amp; Pelanggan Terdaftar
                    </p>
                </div>
                <button
                    onClick={load}
                    disabled={loading}
                    className="flex items-center gap-3 px-8 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-amber-500 hover:text-amber-500 transition-all disabled:opacity-50"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard label="Total Member" value={stats.total.toLocaleString()} icon={<Users size={24} className="text-amber-400" />} color="amber" />
                <StatCard label="Aktif Hari Ini" value={stats.activeToday.toLocaleString()} icon={<Smartphone size={24} className="text-emerald-400" />} color="emerald" />
                <StatCard label="Total Omzet App" value={formatIDR(totalRevenue)} icon={<TrendingUp size={24} className="text-sky-400" />} color="sky" />
                <StatCard label="Total Poin Beredar" value={totalPoints.toLocaleString()} icon={<Star size={24} className="text-violet-400" />} color="violet" />
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                    type="text"
                    placeholder="Cari nama, nomor HP, atau kode referral..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-14 pr-6 py-5 text-sm text-white placeholder-slate-600 font-medium focus:outline-none focus:border-amber-500/50 transition-colors"
                />
            </div>

            {/* Table */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-[3rem] overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="flex items-center justify-center p-32">
                        <RefreshCw size={36} className="animate-spin text-amber-500" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-32 text-center text-slate-700 italic font-black uppercase tracking-widest">
                        {search ? 'Tidak ditemukan' : 'Belum ada pengguna terdaftar'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-black/40 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] border-b border-slate-800/60">
                                    <th className="p-8">#</th>
                                    <th className="p-8 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('name')}>
                                        Nama Member <SortIcon col="name" />
                                    </th>
                                    <th className="p-8 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('order_count')}>
                                        Pesanan <SortIcon col="order_count" />
                                    </th>
                                    <th className="p-8 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('total_spent')}>
                                        Total Belanja <SortIcon col="total_spent" />
                                    </th>
                                    <th className="p-8 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('points')}>
                                        Poin <SortIcon col="points" />
                                    </th>
                                    <th className="p-8">Kode Referral</th>
                                    <th className="p-8 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('last_order_at')}>
                                        Pesanan Terakhir <SortIcon col="last_order_at" />
                                    </th>
                                    <th className="p-8 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('created_at')}>
                                        Terdaftar <SortIcon col="created_at" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                <AnimatePresence>
                                    {filtered.map((u, i) => (
                                        <motion.tr
                                            key={u.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="group hover:bg-amber-500/[0.03] transition-all"
                                        >
                                            <td className="p-8 text-slate-600 font-black text-xs">{i + 1}</td>
                                            <td className="p-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center font-black text-white text-sm flex-shrink-0">
                                                        {(u.name || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-white text-sm">{u.name || '-'}</p>
                                                        <p className="text-[10px] text-slate-500 font-bold mt-0.5">{u.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-8">
                                                <div className="flex items-center gap-2">
                                                    <ShoppingBag size={14} className="text-slate-600" />
                                                    <span className="font-black text-white text-sm">{parseInt(u.order_count || 0)}</span>
                                                    <span className="text-[10px] text-slate-600">pesanan</span>
                                                </div>
                                            </td>
                                            <td className="p-8">
                                                <p className="font-black text-amber-500 italic text-sm">{formatIDR(u.total_spent)}</p>
                                            </td>
                                            <td className="p-8">
                                                <div className="flex items-center gap-2">
                                                    <Star size={12} className="text-violet-400" />
                                                    <span className="font-black text-violet-400 text-sm">{parseInt(u.points || 0).toLocaleString()}</span>
                                                </div>
                                            </td>
                                            <td className="p-8">
                                                {u.referral_code ? (
                                                    <span className="flex items-center gap-2 px-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl font-mono text-[11px] font-black text-amber-500 tracking-widest w-fit">
                                                        <Hash size={10} />
                                                        {u.referral_code}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-700 text-[10px] italic">—</span>
                                                )}
                                            </td>
                                            <td className="p-8">
                                                <div className="flex items-center gap-2 text-slate-500 text-xs">
                                                    <Clock size={12} />
                                                    {formatDatetime(u.last_order_at)}
                                                </div>
                                            </td>
                                            <td className="p-8 text-slate-500 text-xs font-bold">
                                                {formatDate(u.created_at)}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer */}
                {!loading && filtered.length > 0 && (
                    <div className="px-10 py-6 border-t border-slate-800/60 flex justify-between items-center">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                            Menampilkan {filtered.length} dari {users.length} member
                        </p>
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                            {search && `Filter: "${search}"`}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
