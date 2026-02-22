import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, Trash2, Edit3, X, Loader, ToggleLeft, ToggleRight, DollarSign, Percent, ShoppingBag, Clock } from 'lucide-react';
import { customerVoucherAPI } from '../api';
import { formatCurrency } from '../config';

export default function CustomerVouchersManager() {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await customerVoucherAPI.getAll();
            setVouchers(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus voucher ini?')) return;
        try {
            await customerVoucherAPI.delete(id);
            fetchData();
        } catch (e) { alert('Gagal menghapus'); }
    };

    const handleToggle = async (id) => {
        try {
            // If API has toggle use it, otherwise use update
            // Assuming update endpoint handles is_active toggle if full object sent, 
            // but let's try specific toggle if we added it to backend or check implementation.
            // Current backend customer_vouchers.js didn't show toggle route explicitly?
            // Actually I didn't see toggle in customer_vouchers.js earlier!
            // I should add it to backend if missing, or use PUT.
            // For now, let's use PUT with flipped status.
            const voucher = vouchers.find(v => v.id === id);
            if (voucher) {
                await customerVoucherAPI.update(id, { ...voucher, is_active: !voucher.is_active });
                fetchData();
            }
        } catch (e) { alert('Gagal mengubah status'); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // Convert types
        data.value = Number(data.value);
        data.min_purchase = Number(data.min_purchase) || 0;
        data.max_discount = data.max_discount ? Number(data.max_discount) : null;
        data.quota = data.quota ? Number(data.quota) : null;
        data.validity_days = Number(data.validity_days) || 0;

        try {
            if (modal.mode === 'add') {
                await customerVoucherAPI.create(data);
            } else {
                data.is_active = modal.data.is_active; // Preserve status
                await customerVoucherAPI.update(modal.data.id, data);
            }
            setModal(null);
            fetchData();
        } catch (e) { alert('Gagal menyimpan: ' + (e.response?.data?.error || e.message)); }
    };

    const getVoucherTypeIcon = (type) => {
        switch (type) {
            case 'nominal': return <DollarSign size={14} />;
            case 'percent': return <Percent size={14} />;
            default: return <Tag size={14} />;
        }
    };

    return (
        <div className="space-y-10 animate-premium">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-slate-950/40 p-10 rounded-[3rem] border border-slate-800/60 shadow-2xl">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase">Voucher Pelanggan</h2>
                    <p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.4em] mt-2">Kelola Voucher Diskon & Promosi</p>
                </div>
                <button
                    onClick={() => setModal({ mode: 'add', data: { type: 'nominal', validity_days: 7 } })}
                    className="flex items-center gap-3 bg-orange-600 hover:bg-orange-500 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl shadow-orange-900/20 active:scale-95"
                >
                    <Plus size={16} /> Buat Voucher
                </button>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 opacity-50">
                    <Loader className="animate-spin mb-4" />
                    <p className="font-black text-[10px] uppercase tracking-widest">Memuat Voucher...</p>
                </div>
            ) : vouchers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 opacity-40">
                    <Tag size={48} className="mb-4 text-slate-600" />
                    <p className="font-black text-sm text-slate-500 uppercase tracking-widest">Belum ada voucher</p>
                    <p className="text-[10px] text-slate-600 mt-2">Klik "Buat Voucher" untuk memulai</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    {vouchers.map(v => (
                        <div key={v.id} className="group relative bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 hover:border-orange-500/40 transition-all shadow-xl overflow-hidden flex flex-col h-full">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20 group-hover:scale-110 transition-transform">
                                    <Tag size={24} />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleToggle(v.id)} className={`p-3 rounded-xl transition-all ${v.is_active ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>
                                        {v.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                    </button>
                                    <button onClick={() => setModal({ mode: 'edit', data: v })} className="p-3 bg-slate-800 hover:bg-orange-600 rounded-xl text-slate-300 hover:text-white transition-all"><Edit3 size={14} /></button>
                                    <button onClick={() => handleDelete(v.id)} className="p-3 bg-slate-800 hover:bg-red-600 rounded-xl text-slate-300 hover:text-white transition-all"><Trash2 size={14} /></button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-xl font-black italic uppercase mb-1 group-hover:text-orange-500 transition-colors line-clamp-1">{v.title}</h3>
                                <p className="text-[10px] text-slate-500 font-medium line-clamp-2 min-h-[2.5em]">{v.description}</p>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800/50">
                                    <span className="text-slate-600 font-bold uppercase tracking-wider text-[9px]">Nilai Voucher</span>
                                    <span className="font-black text-white flex gap-1 items-center">
                                        {v.type === 'nominal' ? formatCurrency(v.value) : `${v.value}%`}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800/50">
                                    <span className="text-slate-600 font-bold uppercase tracking-wider text-[9px]">Min. Belanja</span>
                                    <span className="font-bold text-slate-400">{v.min_purchase > 0 ? formatCurrency(v.min_purchase) : '-'}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800/50">
                                    <span className="text-slate-600 font-bold uppercase tracking-wider text-[9px]">Masa Berlaku</span>
                                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                                        <Clock size={10} /> {v.validity_days ? `${v.validity_days} Hari` : 'Selamanya'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-auto pt-4 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-600">
                                <span>Kuota: {v.quota != null ? v.quota : '∞'}</span>
                                <div className={`px-3 py-1 rounded-full border ${v.is_active ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-slate-700 text-slate-500'}`}>
                                    {v.is_active ? 'AKTIF' : 'NONAKTIF'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL */}
            <AnimatePresence>
                {modal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-3xl font-black italic uppercase">{modal.mode === 'add' ? 'Buat' : 'Edit'} Voucher</h3>
                                    <p className="text-xs text-slate-500 font-bold mt-1">Atur detail voucher pelanggan</p>
                                </div>
                                <button onClick={() => setModal(null)} className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"><X /></button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-8 flex-1 overflow-y-auto pr-4 custom-scroll">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Judul Voucher</label>
                                    <input name="title" defaultValue={modal.data.title} required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-xs font-bold focus:border-orange-500 outline-none transition-all" placeholder="Contoh: Diskon Kemerdekaan" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Deskripsi</label>
                                    <textarea name="description" defaultValue={modal.data.description} className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-xs font-bold focus:border-orange-500 outline-none transition-all h-24 resize-none" placeholder="Deskripsi singkat voucher..." />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipe Potongan</label>
                                        <select name="type" defaultValue={modal.data.type || 'nominal'} className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs font-bold outline-none focus:border-orange-500 appearance-none cursor-pointer">
                                            <option value="nominal">Potongan Harga (Rp)</option>
                                            <option value="percent">Potongan Persen (%)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nilai Potongan</label>
                                        <input type="number" name="value" defaultValue={modal.data.value} required className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs font-bold focus:border-orange-500 outline-none" placeholder="0" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Min. Belanja</label>
                                        <input type="number" name="min_purchase" defaultValue={modal.data.min_purchase} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs font-bold focus:border-orange-500 outline-none" placeholder="0" />
                                    </div>
                                    {/* Only show Max Discount for Percent Type if needed, but keeping it generic is fine */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Maks. Potongan</label>
                                        <input type="number" name="max_discount" defaultValue={modal.data.max_discount} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs font-bold focus:border-orange-500 outline-none" placeholder="Kosongkan jika unlimited" />
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-950/50 rounded-[2rem] border border-slate-800/60 space-y-4">
                                    <div className="flex items-center gap-3 text-orange-500 mb-2">
                                        <Clock size={16} />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Pengaturan Validitas</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase">Masa Berlaku (Hari)</label>
                                            <input type="number" name="validity_days" defaultValue={modal.data.validity_days || 7} min="1" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs font-bold outline-none focus:border-orange-500 transition-all text-center" />
                                            <p className="text-[8px] text-slate-600 ml-1">Hari setelah klaim</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase">Kuota Voucher</label>
                                            <input type="number" name="quota" defaultValue={modal.data.quota} min="0" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs font-bold outline-none focus:border-orange-500 transition-all text-center" placeholder="Unlimited" />
                                            <p className="text-[8px] text-slate-600 ml-1">Jumlah total</p>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 py-6 rounded-2xl font-black text-lg uppercase tracking-widest mt-6 transition-all shadow-2xl shadow-orange-900/40 active:scale-[0.98]">
                                    SIMPAN VOUCHER
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
