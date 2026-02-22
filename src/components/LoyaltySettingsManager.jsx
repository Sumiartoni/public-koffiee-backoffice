import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Loader, RefreshCw, CheckCircle, AlertCircle, Zap, DollarSign, ShoppingBag, ToggleRight, ToggleLeft } from 'lucide-react';
import { loyaltyAPI } from '../api';
import { formatCurrency } from '../config';

export default function LoyaltySettingsManager() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form state
    const [pointPerRupiah, setPointPerRupiah] = useState('0.001');
    const [minPurchase, setMinPurchase] = useState('0');
    const [isActive, setIsActive] = useState(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await loyaltyAPI.getSettings();
            setSettings(res.data);
            setPointPerRupiah(String(res.data.point_per_rupiah || '0.001'));
            setMinPurchase(String(res.data.min_purchase || '0'));
            setIsActive(res.data.is_active !== false);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                point_per_rupiah: parseFloat(pointPerRupiah) || 0.001,
                min_purchase: parseInt(minPurchase) || 0,
                is_active: isActive
            };
            await loyaltyAPI.updateSettings(payload);
            setIsEditing(false);
            fetchData();
            alert('Pengaturan Point berhasil disimpan!');
        } catch (e) {
            alert('Gagal menyimpan: ' + (e.response?.data?.error || e.message));
        } finally { setSaving(false); }
    };

    // Calculate example for helper text
    const rate = parseFloat(pointPerRupiah) || 0;
    const exampleAmount = rate > 0 ? Math.round(1 / rate) : 0;
    const examplePoints = rate > 0 ? Math.floor(50000 * rate) : 0;

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 opacity-50">
            <Loader className="animate-spin mb-4" />
            <p className="font-black text-[10px] uppercase tracking-widest">Memuat Pengaturan...</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-premium">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-950/40 p-10 rounded-[3rem] border border-slate-800/60 shadow-2xl">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase">Pengaturan Point</h2>
                    <p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.4em] mt-2">Atur Rasio Point Loyalty Pelanggan</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* STATUS CARD */}
                <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap size={120} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <span className="px-4 py-2 rounded-xl bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
                                Loyalty Engine
                            </span>
                            <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${settings?.is_active ? 'text-emerald-500' : 'text-red-500'}`}>
                                {settings?.is_active ? <><CheckCircle size={14} /> Aktif</> : <><AlertCircle size={14} /> Nonaktif</>}
                            </span>
                        </div>

                        <h3 className="text-3xl font-black italic uppercase text-white mb-2">
                            Konfigurasi Aktif
                        </h3>
                        <p className="text-sm font-bold text-slate-500 mb-8 max-w-md">
                            Point akan otomatis diberikan ke pelanggan saat transaksi selesai (PAID).
                        </p>

                        <div className="bg-black/20 rounded-3xl p-6 border border-white/5 backdrop-blur-sm space-y-4">
                            {/* Rate */}
                            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Rasio Point</span>
                                <span className="text-xl font-black text-white flex items-center gap-2">
                                    <Zap size={16} className="text-orange-500" />
                                    {settings?.point_per_rupiah || 0} / Rp
                                </span>
                            </div>

                            {/* Example */}
                            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Contoh</span>
                                <span className="text-sm font-bold text-emerald-400">
                                    Belanja {formatCurrency(50000)} = {Math.floor(50000 * (settings?.point_per_rupiah || 0))} Point
                                </span>
                            </div>

                            {/* Min Purchase */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 p-4 rounded-2xl">
                                    <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Min. Belanja</span>
                                    <span className="text-sm font-bold text-slate-200">
                                        {settings?.min_purchase > 0 ? formatCurrency(settings.min_purchase) : 'Tanpa Minimum'}
                                    </span>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-2xl">
                                    <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">1 Point =</span>
                                    <span className="text-sm font-bold text-orange-400">
                                        {settings?.point_per_rupiah > 0 ? formatCurrency(Math.round(1 / settings.point_per_rupiah)) : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="mt-8 w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-widest transition-all"
                            >
                                Edit Pengaturan
                            </button>
                        )}
                    </div>
                </div>

                {/* EDIT FORM */}
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-slate-900/50 border border-slate-800 rounded-[3rem] p-10 space-y-6"
                    >
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
                            <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500">
                                <Settings size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase">Edit Konfigurasi</h3>
                                <p className="text-[10px] font-bold text-slate-500">Perubahan berlaku untuk transaksi selanjutnya.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Point per Rupiah */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Point Per Rupiah</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={pointPerRupiah}
                                    onChange={e => setPointPerRupiah(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs font-bold focus:border-orange-500 outline-none transition-all"
                                    placeholder="0.001"
                                />
                                <p className="text-[9px] text-slate-600 ml-1">
                                    {rate > 0 ? (
                                        <>💡 1 Point = {formatCurrency(exampleAmount)} | Belanja {formatCurrency(50000)} = <span className="text-emerald-400">{examplePoints} Point</span></>
                                    ) : '⚠️ Masukkan nilai lebih dari 0'}
                                </p>
                            </div>

                            {/* Min Purchase */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Minimum Transaksi (Rp)</label>
                                <input
                                    type="number"
                                    value={minPurchase}
                                    onChange={e => setMinPurchase(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs font-bold focus:border-orange-500 outline-none transition-all"
                                    placeholder="0"
                                />
                                <p className="text-[9px] text-slate-600 ml-1">
                                    {parseInt(minPurchase) > 0 ? `Hanya transaksi di atas ${formatCurrency(parseInt(minPurchase))} yang dapat point` : 'Semua transaksi dapat point (tanpa minimum)'}
                                </p>
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center justify-between bg-slate-950 p-5 rounded-2xl border border-slate-800">
                                <div>
                                    <p className="text-xs font-black text-white">Status Sistem Point</p>
                                    <p className="text-[9px] text-slate-500 mt-1">
                                        {isActive ? 'Point akan diberikan otomatis saat transaksi selesai' : 'Sistem point dinonaktifkan — tidak ada point yang diberikan'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsActive(!isActive)}
                                    className={`p-2 rounded-xl transition-all ${isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}
                                >
                                    {isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                                Simpan Pengaturan
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* INFO CARD (when not editing) */}
                {!isEditing && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-slate-900/30 border border-slate-800/50 rounded-[3rem] p-10 space-y-8"
                    >
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-sky-500/10 rounded-xl text-sky-500">
                                <AlertCircle size={24} />
                            </div>
                            <h3 className="text-xl font-black uppercase">Cara Kerja</h3>
                        </div>

                        <div className="space-y-4">
                            {[
                                { icon: <ShoppingBag size={16} />, title: 'Transaksi Selesai', desc: 'Pelanggan menyelesaikan pembayaran di Kasir/App' },
                                { icon: <Zap size={16} />, title: 'Point Otomatis', desc: 'Sistem menghitung point berdasarkan rasio yang diatur' },
                                { icon: <DollarSign size={16} />, title: 'Akumulasi', desc: 'Point masuk ke akun pelanggan secara realtime' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-4 bg-slate-950/50 p-5 rounded-2xl border border-slate-800/50">
                                    <div className="p-2 bg-slate-800 rounded-xl text-orange-500 shrink-0 mt-0.5">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-white">{item.title}</p>
                                        <p className="text-[10px] text-slate-500 mt-1">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5">
                            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">⚡ Keamanan</p>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                                Point hanya diberikan <span className="text-white font-bold">sekali per transaksi</span>. Sistem mencegah duplikasi otomatis.
                                Jika transaksi dibatalkan, point tidak akan diberikan.
                            </p>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
