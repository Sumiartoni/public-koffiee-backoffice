import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Plus, Trash2, Edit3, X, Loader, Award, Star, Users, Package, ToggleLeft, ToggleRight, Check } from 'lucide-react';
import { rewardAPI, menuAPI } from '../api';
import { formatCurrency } from '../config';

export default function RewardProductManager() {
    const [rewards, setRewards] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState([]);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rRes, mRes] = await Promise.all([
                rewardAPI.getAll(),
                menuAPI.getAdminAll()
            ]);
            setRewards(rRes.data);
            setMenuItems(mRes.data.items || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus reward ini?')) return;
        try {
            await rewardAPI.delete(id);
            fetchData();
        } catch (e) { alert('Gagal menghapus'); }
    };

    const handleToggle = async (id) => {
        try {
            await rewardAPI.toggle(id);
            fetchData();
        } catch (e) { alert('Gagal mengubah status'); }
    };

    const openModal = (mode, data = {}) => {
        setSelectedProducts(data.product_ids || []);
        setModal({ mode, data });
    };

    const toggleProduct = (productId) => {
        setSelectedProducts(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        if (selectedProducts.length === 0) {
            alert('Pilih minimal 1 produk');
            return;
        }

        data.product_ids = selectedProducts;
        if (!data.points_required) data.points_required = null;
        if (!data.referral_required) data.referral_required = null;
        if (!data.quota) data.quota = null;

        try {
            if (modal.mode === 'add') {
                await rewardAPI.create(data);
            } else {
                data.is_active = modal.data.is_active;
                await rewardAPI.update(modal.data.id, data);
            }
            setModal(null);
            fetchData();
        } catch (e) { alert('Gagal menyimpan: ' + (e.response?.data?.error || e.message)); }
    };

    const getRewardType = (r) => {
        if (r.points_required) return { label: `${r.points_required} Poin`, icon: <Star size={14} />, color: 'amber' };
        if (r.referral_required) return { label: `${r.referral_required} Referral`, icon: <Users size={14} />, color: 'violet' };
        return { label: 'Belum dikonfigurasi', icon: <Package size={14} />, color: 'slate' };
    };

    return (
        <div className="space-y-10 animate-premium">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-slate-950/40 p-10 rounded-[3rem] border border-slate-800/60 shadow-2xl">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase">Reward Produk</h2>
                    <p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.4em] mt-2">Atur Hadiah Produk Gratis untuk Point & Referral</p>
                </div>
                <button
                    onClick={() => openModal('add')}
                    className="flex items-center gap-3 bg-orange-600 hover:bg-orange-500 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl shadow-orange-900/20 active:scale-95"
                >
                    <Plus size={16} /> Tambah Reward
                </button>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 opacity-50">
                    <Loader className="animate-spin mb-4" />
                    <p className="font-black text-[10px] uppercase tracking-widest">Memuat Reward Produk...</p>
                </div>
            ) : rewards.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 opacity-40">
                    <Award size={48} className="mb-4 text-slate-600" />
                    <p className="font-black text-sm text-slate-500 uppercase tracking-widest">Belum ada reward</p>
                    <p className="text-[10px] text-slate-600 mt-2">Klik "Tambah Reward" untuk membuat reward produk pertama</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    {rewards.map(r => {
                        const rType = getRewardType(r);
                        return (
                            <div key={r.id} className="group relative bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 hover:border-orange-500/40 transition-all shadow-xl overflow-hidden flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20 group-hover:scale-110 transition-transform">
                                        <Gift size={24} />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleToggle(r.id)} className={`p-3 rounded-xl transition-all ${r.is_active ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>
                                            {r.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                        </button>
                                        <button onClick={() => openModal('edit', r)} className="p-3 bg-slate-800 hover:bg-orange-600 rounded-xl text-slate-300 hover:text-white transition-all"><Edit3 size={14} /></button>
                                        <button onClick={() => handleDelete(r.id)} className="p-3 bg-slate-800 hover:bg-red-600 rounded-xl text-slate-300 hover:text-white transition-all"><Trash2 size={14} /></button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black italic uppercase mb-2 group-hover:text-orange-500 transition-colors line-clamp-1">{r.title}</h3>

                                {/* Product list */}
                                <div className="mb-4">
                                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-2">Produk Reward:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {(r.products || []).map(p => (
                                            <span key={p.product_id} className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300">
                                                {p.product_name}
                                            </span>
                                        ))}
                                        {(!r.products || r.products.length === 0) && (
                                            <span className="text-[10px] text-slate-600 italic">Belum ada produk</span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-auto space-y-3">
                                    <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Syarat Tukar</span>
                                        <span className="flex items-center gap-2 text-xs font-bold text-white">
                                            {rType.icon} {rType.label}
                                        </span>
                                    </div>

                                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-center">
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Kuota</p>
                                        <p className="text-sm font-black text-white">{r.quota != null ? r.quota : '∞'}</p>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-800 flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                        {new Date(r.created_at).toLocaleDateString('id-ID')}
                                    </span>
                                    <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${r.is_active ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-red-500/30 text-red-500 bg-red-500/5'}`}>
                                        {r.is_active ? 'AKTIF' : 'NONAKTIF'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL */}
            <AnimatePresence>
                {modal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-3xl font-black italic uppercase">{modal.mode === 'add' ? 'Tambah' : 'Edit'} Reward</h3>
                                    <p className="text-xs text-slate-500 font-bold mt-1">Atur reward produk untuk point atau referral</p>
                                </div>
                                <button onClick={() => setModal(null)} className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"><X /></button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-8 flex-1 overflow-y-auto pr-4 custom-scroll">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Reward</label>
                                    <input name="title" defaultValue={modal.data.title} required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-xs font-bold focus:border-orange-500 outline-none transition-all" placeholder="Contoh: Free Drink Pilihan" />
                                </div>

                                {/* Multi-select products */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                        Pilih Produk Reward <span className="text-orange-500">({selectedProducts.length} dipilih)</span>
                                    </label>
                                    <div className="p-4 bg-slate-950/50 rounded-[2rem] border border-slate-800/60 max-h-60 overflow-y-auto custom-scroll space-y-1">
                                        {menuItems.map(m => {
                                            const isSelected = selectedProducts.includes(m.id);
                                            return (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => toggleProduct(m.id)}
                                                    className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${isSelected ? 'bg-orange-600/20 border border-orange-500/30 text-orange-400' : 'bg-slate-900/40 border border-transparent text-slate-400 hover:bg-slate-800'}`}
                                                >
                                                    <span className="flex items-center gap-3">
                                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'border-orange-500 bg-orange-500' : 'border-slate-700'}`}>
                                                            {isSelected && <Check size={12} className="text-white" />}
                                                        </div>
                                                        {m.name}
                                                    </span>
                                                    <span className="text-[10px] text-slate-600">{formatCurrency(m.price)}</span>
                                                </button>
                                            );
                                        })}
                                        {menuItems.length === 0 && (
                                            <p className="text-[10px] text-slate-500 text-center py-4 italic">Tidak ada produk ditemukan di database.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-950/50 rounded-[2rem] border border-slate-800/60 space-y-6">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syarat Penukaran <span className="text-slate-600">(isi salah satu)</span></p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-amber-500 uppercase flex items-center gap-2"><Star size={12} /> Poin yang Dibutuhkan</label>
                                            <input type="number" name="points_required" defaultValue={modal.data.points_required} min="1" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs font-bold outline-none focus:border-amber-500 transition-all" placeholder="Contoh: 10" />
                                            <p className="text-[8px] text-slate-600 ml-1">Untuk reward via sistem point</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-violet-500 uppercase flex items-center gap-2"><Users size={12} /> Jumlah Referral</label>
                                            <input type="number" name="referral_required" defaultValue={modal.data.referral_required} min="1" className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs font-bold outline-none focus:border-violet-500 transition-all" placeholder="Contoh: 10" />
                                            <p className="text-[8px] text-slate-600 ml-1">Untuk reward via referral milestone</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kuota Reward <span className="text-slate-600">(kosongkan = unlimited)</span></label>
                                    <input type="number" name="quota" defaultValue={modal.data.quota} min="0" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-xs font-bold focus:border-orange-500 outline-none transition-all" placeholder="Contoh: 100" />
                                </div>

                                <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 py-6 rounded-2xl font-black text-lg uppercase tracking-widest mt-6 transition-all shadow-2xl shadow-orange-900/40 active:scale-[0.98]">
                                    SIMPAN REWARD
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
