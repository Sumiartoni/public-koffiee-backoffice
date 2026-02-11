import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Trash2, Send, Tag, Users, CheckCircle, X, Loader } from 'lucide-react';
import { notificationAPI, customerVoucherAPI } from '../api';
import { formatCurrency } from '../config';

export default function NotificationManager() {
    const [notifications, setNotifications] = useState([]);
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(null);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchData();
        fetchVouchers();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await notificationAPI.getAll();
            setNotifications(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchVouchers = async () => {
        try {
            const res = await customerVoucherAPI.getAll();
            // Only active vouchers
            setVouchers(res.data.filter(v => v.is_active));
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus histori notifikasi ini? Pesan di inbox user juga akan terhapus.')) return;
        try {
            await notificationAPI.delete(id);
            fetchData();
        } catch (e) { alert('Gagal menghapus'); }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        setSending(true);
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // Convert types
        if (data.voucher_id) data.voucher_id = Number(data.voucher_id);
        else delete data.voucher_id;

        data.is_global = true; // Always global for now

        try {
            await notificationAPI.create(data);
            setModal(null);
            fetchData();
            alert('Notifikasi berhasil dikirim ke semua user!');
        } catch (e) {
            alert('Gagal mengirim: ' + (e.response?.data?.error || e.message));
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-10 animate-premium">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-slate-950/40 p-10 rounded-[3rem] border border-slate-800/60 shadow-2xl">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase">Notifikasi & Inbox</h2>
                    <p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.4em] mt-2">Kirim Pesan & Voucher ke Aplikasi</p>
                </div>
                <button
                    onClick={() => setModal({ mode: 'add' })}
                    className="flex items-center gap-3 bg-orange-600 hover:bg-orange-500 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl shadow-orange-900/20 active:scale-95"
                >
                    <Send size={16} /> Kirim Pesan Baru
                </button>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 opacity-50">
                    <Loader className="animate-spin mb-4" />
                    <p className="font-black text-[10px] uppercase tracking-widest">Memuat Histori...</p>
                </div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 opacity-40">
                    <Bell size={48} className="mb-4 text-slate-600" />
                    <p className="font-black text-sm text-slate-500 uppercase tracking-widest">Belum ada notifikasi terkirim</p>
                    <p className="text-[10px] text-slate-600 mt-2">Klik "Kirim Pesan Baru" untuk memulai broadcast</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map(n => (
                        <div key={n.id} className="group relative bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 hover:border-orange-500/40 transition-all shadow-lg flex flex-col md:flex-row gap-6 items-start md:items-center">
                            <div className={`p-4 rounded-2xl flex-shrink-0 ${n.voucher_id ? 'bg-orange-500/10 text-orange-500' : 'bg-slate-800 text-slate-400'}`}>
                                {n.voucher_id ? <Tag size={24} /> : <Bell size={24} />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-black uppercase text-white truncate">{n.title}</h3>
                                    {n.is_global && (
                                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                            <Users size={10} /> Semua User
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-400 font-medium line-clamp-2">{n.message}</p>
                                {n.voucher_title && (
                                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-orange-500/5 border border-orange-500/20 text-orange-500 text-[10px] font-bold uppercase tracking-wider">
                                        <Tag size={10} />
                                        Bonus Voucher: {n.voucher_title}
                                    </div>
                                )}
                            </div>

                            <div className="text-right flex-shrink-0 flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1">
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                    {new Date(n.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <button onClick={() => handleDelete(n.id)} className="p-2 bg-slate-800 hover:bg-red-600 rounded-xl text-slate-400 hover:text-white transition-all">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL */}
            <AnimatePresence>
                {modal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-2xl font-black italic uppercase">Kirim Notifikasi</h3>
                                    <p className="text-xs text-slate-500 font-bold mt-1">Broadcast pesan ke seluruh pengguna aplikasi</p>
                                </div>
                                <button onClick={() => setModal(null)} className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"><X /></button>
                            </div>

                            <form onSubmit={handleSend} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Judul Pesan</label>
                                    <input name="title" required className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs font-bold focus:border-orange-500 outline-none transition-all" placeholder="Contoh: Promo Spesial Hari Ini!" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Isi Pesan</label>
                                    <textarea name="message" required className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs font-bold focus:border-orange-500 outline-none transition-all h-32 resize-none" placeholder="Tulis pesan anda disini..." />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lampirkan Voucher (Opsional)</label>
                                    <div className="relative">
                                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                        <select name="voucher_id" className="w-full bg-slate-950 border border-slate-800 p-4 pl-12 rounded-2xl text-xs font-bold outline-none focus:border-orange-500 appearance-none cursor-pointer text-slate-300">
                                            <option value="">-- Tanpa Voucher --</option>
                                            {vouchers.map(v => (
                                                <option key={v.id} value={v.id}>
                                                    {v.title} (Valid: {v.validity_days || '∞'} hari)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <p className="text-[9px] text-slate-600 ml-1 italic">Voucher akan otomatis masuk ke inbox user dan harus diklaim.</p>
                                </div>

                                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 flex items-center gap-3">
                                    <CheckCircle size={16} className="text-emerald-500" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Target: Global</p>
                                        <p className="text-[9px] text-slate-500 font-bold">Pesan akan dikirim ke semua pengguna terdaftar.</p>
                                    </div>
                                </div>

                                <button type="submit" disabled={sending} className="w-full bg-orange-600 hover:bg-orange-500 py-5 rounded-2xl font-black text-sm uppercase tracking-widest mt-4 transition-all shadow-2xl shadow-orange-900/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {sending ? <Loader className="animate-spin" size={16} /> : <Send size={16} />}
                                    {sending ? 'Mengirim...' : 'Kirim Broadcast'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
