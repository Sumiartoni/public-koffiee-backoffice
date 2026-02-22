import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, Edit3, Save, Loader, RefreshCw, AlertCircle, CheckCircle, Percent, DollarSign, Clock } from 'lucide-react';
import { customerVoucherAPI } from '../api';
import { formatCurrency } from '../config';

export default function NewUserVoucherManager() {
    const [voucher, setVoucher] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Get all and filter for active new_user voucher
            // Ideally backend should have a specific endpoint, but filtering client side is fine for now
            const res = await customerVoucherAPI.getAll();
            const newUserVouchers = res.data.filter(v => v.category === 'new_user');

            // Find active one, or just the most recent one if none active
            const active = newUserVouchers.find(v => v.is_active);
            setVoucher(active || (newUserVouchers.length > 0 ? newUserVouchers[0] : null));

            if (!active && newUserVouchers.length > 0) {
                // Determine if we should show the inactive one or prompt to create new
                // User requirement: "Hanya boleh ada satu voucher new_user yang aktif."
                // So if we find one, we show it.
            }

        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        const formData = new FormData(e.target);
        const rawData = Object.fromEntries(formData.entries());

        // Explicit Payload Construction to prevent null values
        const payload = {
            title: rawData.title,
            description: rawData.description,
            category: 'new_user', // HARDCODED
            type: rawData.type,
            value: Number(rawData.value),
            min_purchase: Number(rawData.min_purchase) || 0,
            max_discount: rawData.max_discount ? Number(rawData.max_discount) : null,
            quota: rawData.quota ? Number(rawData.quota) : null,
            validity_days: Number(rawData.validity_days) || 30,
            is_active: true,
            start_date: null,
            end_date: null
        };

        console.log("Saving Payload:", payload);

        try {
            if (voucher && voucher.id) {
                await customerVoucherAPI.update(voucher.id, payload);
            } else {
                await customerVoucherAPI.create(payload);
            }
            setIsEditing(false);
            fetchData();
            alert('Voucher Pengguna Baru berhasil disimpan!');
        } catch (e) {
            alert('Gagal menyimpan: ' + (e.response?.data?.error || e.message));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64 opacity-50">
            <Loader className="animate-spin mb-4" />
            <p className="font-black text-[10px] uppercase tracking-widest">Memuat Voucher...</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-premium">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-950/40 p-10 rounded-[3rem] border border-slate-800/60 shadow-2xl">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase">Voucher Pengguna Baru</h2>
                    <p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.4em] mt-2">Diskon Otomatis Saat Install Aplikasi</p>
                </div>
                {!voucher && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-3 bg-orange-600 hover:bg-orange-500 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl shadow-orange-900/20 active:scale-95"
                    >
                        <Plus size={16} /> Buat Voucher
                    </button>
                )}
            </header>

            {!voucher && !isEditing ? (
                <div className="flex flex-col items-center justify-center p-20 border border-dashed border-slate-800 rounded-[3rem] bg-slate-900/20">
                    <Tag size={48} className="mb-4 text-slate-700" />
                    <p className="font-black text-slate-600 uppercase tracking-widest">Belum ada voucher aktif</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* PREVIEW CARD */}
                    <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Tag size={120} />
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-8">
                                <span className="px-4 py-2 rounded-xl bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
                                    New User Only
                                </span>
                                {voucher?.is_active && (
                                    <span className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                                        <CheckCircle size={14} /> Aktif
                                    </span>
                                )}
                            </div>

                            <h3 className="text-3xl font-black italic uppercase text-white mb-2">
                                {isEditing ? 'Draft Voucher' : voucher?.title}
                            </h3>
                            <p className="text-sm font-bold text-slate-500 mb-8 max-w-md">
                                {isEditing ? 'Deskripsi voucher akan muncul disini...' : voucher?.description}
                            </p>

                            <div className="bg-black/20 rounded-3xl p-6 border border-white/5 backdrop-blur-sm space-y-4">
                                <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-2xl">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">Nilai Diskon</span>
                                    <span className="text-xl font-black text-white flex items-center gap-1">
                                        {voucher?.type === 'nominal' ? formatCurrency(voucher?.value || 0) : `${voucher?.value || 0}%`}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-800/50 p-4 rounded-2xl">
                                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Min. Belanja</span>
                                        <span className="text-sm font-bold text-slate-200">{formatCurrency(voucher?.min_purchase || 0)}</span>
                                    </div>
                                    <div className="bg-slate-800/50 p-4 rounded-2xl">
                                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Valid Days</span>
                                        <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                                            <Clock size={12} /> {voucher?.validity_days || 0} Hari
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="mt-8 w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-widest transition-all"
                            >
                                Edit Voucher
                            </button>
                        )}
                    </div>

                    {/* EDIT FORM */}
                    {isEditing && (
                        <motion.form
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onSubmit={handleSave}
                            className="bg-slate-900/50 border border-slate-800 rounded-[3rem] p-10 space-y-6"
                        >
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
                                <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500">
                                    <Edit3 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase">Edit Konfigurasi</h3>
                                    <p className="text-[10px] font-bold text-slate-500">Perubahan akan langsung berlaku untuk user baru berikutnya.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Judul Voucher</label>
                                    <input name="title" defaultValue={voucher?.title} required className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs font-bold focus:border-orange-500 outline-none transition-all" placeholder="Contoh: Voucher Pengguna Baru" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Deskripsi</label>
                                    <textarea name="description" defaultValue={voucher?.description} required className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs font-bold focus:border-orange-500 outline-none transition-all h-20 resize-none" placeholder="Selamat datang di Public Koffie..." />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipe</label>
                                        <select name="type" defaultValue={voucher?.type || 'nominal'} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs font-bold focus:border-orange-500 outline-none appearance-none">
                                            <option value="nominal">Potongan Harga (Rp)</option>
                                            <option value="percent">Potongan Persen (%)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nilai</label>
                                        <input type="number" name="value" defaultValue={voucher?.value} required className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs font-bold focus:border-orange-500 outline-none" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Min. Belanja</label>
                                        <input type="number" name="min_purchase" defaultValue={voucher?.min_purchase} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs font-bold focus:border-orange-500 outline-none" placeholder="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Max Disc</label>
                                        <input type="number" name="max_discount" defaultValue={voucher?.max_discount} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs font-bold focus:border-orange-500 outline-none" placeholder="Unltd" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Valid (Hari)</label>
                                        <input type="number" name="validity_days" defaultValue={voucher?.validity_days || 30} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs font-bold focus:border-orange-500 outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                                    Batal
                                </button>
                                <button type="submit" disabled={saving} className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                    {saving ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                                    Simpan & Aktifkan
                                </button>
                            </div>
                        </motion.form>
                    )}
                </div>
            )}
        </div>
    );
}
