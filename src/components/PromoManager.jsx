import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Plus, Trash2, Edit3, CheckCircle, X, Calendar, Percent, Gift, ShoppingBag, Info, Loader } from 'lucide-react';
import { promoAPI, menuAPI } from '../api';
import { formatCurrency } from '../config';

export default function PromoManager() {
    const [subTab, setSubTab] = useState('promotions'); // promotions | discounts
    const [promos, setPromos] = useState([]);
    const [discounts, setDiscounts] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(null); // { type: 'promo'|'discount', mode: 'add'|'edit', data: {} }

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pRes, dRes, mRes] = await Promise.all([
                promoAPI.getPromotions(),
                promoAPI.getDiscounts(),
                menuAPI.getAdminAll()
            ]);
            setPromos(pRes.data.promotions);
            setDiscounts(dRes.data.discounts);
            setMenuItems(mRes.data.items);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleDelete = async (type, id) => {
        if (!confirm('Hapus data ini?')) return;
        try {
            if (type === 'promo') await promoAPI.deletePromotion(id);
            else await promoAPI.deleteDiscount(id);
            fetchData();
        } catch (e) { alert('Gagal menghapus'); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            if (modal.type === 'promo') {
                if (modal.mode === 'add') await promoAPI.createPromotion(data);
                else await promoAPI.updatePromotion(modal.data.id, data);
            } else {
                if (modal.mode === 'add') await promoAPI.createDiscount(data);
                else await promoAPI.updateDiscount(modal.data.id, data);
            }
            setModal(null);
            fetchData();
        } catch (e) { alert('Gagal menyimpan'); }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="space-y-10 animate-premium">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-slate-950/40 p-10 rounded-[3rem] border border-slate-800/60 shadow-2xl">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase">Marketing & Promo</h2>
                    <p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.4em] mt-2">Maksimalkan Penjualan dengan Program Loyalitas</p>
                </div>
                <div className="flex bg-slate-950 p-2 rounded-2xl border border-slate-800">
                    <button onClick={() => setSubTab('promotions')} className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${subTab === 'promotions' ? 'bg-orange-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}>PROGRAM PROMO</button>
                    <button onClick={() => setSubTab('discounts')} className={`px-8 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all ${subTab === 'discounts' ? 'bg-orange-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}>VOUCHER DISKON</button>
                </div>
            </header>

            <div className="flex justify-end pr-4">
                <button
                    onClick={() => setModal({ type: subTab === 'promotions' ? 'promo' : 'discount', mode: 'add', data: {} })}
                    className="flex items-center gap-3 bg-orange-600 hover:bg-orange-500 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl shadow-orange-900/20 active:scale-95"
                >
                    <Plus size={16} /> Tambah {subTab === 'promotions' ? 'Promo' : 'Diskon'}
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 opacity-50"><Loader className="animate-spin mb-4" /><p className="font-black text-[10px] uppercase tracking-widest">Memuat Program Marketing...</p></div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    {subTab === 'promotions' ? promos.map(p => (
                        <div key={p.id} className="group relative bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 hover:border-orange-500/40 transition-all shadow-xl overflow-hidden flex flex-col h-full">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20 group-hover:scale-110 transition-transform"><Gift size={24} /></div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setModal({ type: 'promo', mode: 'edit', data: p })} className="p-3 bg-slate-800 hover:bg-orange-600 rounded-xl text-slate-300 hover:text-white transition-all"><Edit3 size={14} /></button>
                                    <button onClick={() => handleDelete('promo', p.id)} className="p-3 bg-slate-800 hover:bg-red-600 rounded-xl text-slate-300 hover:text-white transition-all"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <h3 className="text-xl font-black italic uppercase mb-2 group-hover:text-orange-500 transition-colors line-clamp-1">{p.name}</h3>
                            <p className="text-[10px] text-slate-500 font-bold line-clamp-2 uppercase tracking-wide leading-relaxed">{p.description || 'Tidak ada deskripsi.'}</p>

                            <div className="mt-8 space-y-3 flex-1">
                                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex justify-between items-center group/item hover:border-orange-500/30 transition-colors">
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Syarat</span>
                                    <span className="text-xs font-bold text-slate-200">Min. {p.min_purchase > 0 ? formatCurrency(p.min_purchase) : 'Tanpa Syarat'}</span>
                                </div>
                                {p.type === 'buy_x_get_y' && (
                                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 group/item hover:border-orange-500/30 transition-colors">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Benefit</p>
                                        <p className="text-xs font-bold text-amber-500">Beli {p.buy_qty}x {p.buy_item_name} Gratis {p.get_qty}x {p.get_item_name}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-800 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-slate-500 font-black text-[9px] uppercase tracking-widest"><Calendar size={12} /> {p.end_date || 'Selamanya'}</div>
                                <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${p.is_active ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-red-500/30 text-red-500 bg-red-500/5'}`}>{p.is_active ? 'AKTIF' : 'NONAKTIF'}</div>
                            </div>
                        </div>
                    )) : discounts.map(d => (
                        <div key={d.id} className="group relative bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 hover:border-orange-500/40 transition-all shadow-xl overflow-hidden flex flex-col h-full">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 group-hover:scale-110 transition-transform"><Tag size={24} /></div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setModal({ type: 'discount', mode: 'edit', data: d })} className="p-3 bg-slate-800 hover:bg-orange-600 rounded-xl text-slate-300 hover:text-white transition-all"><Edit3 size={14} /></button>
                                    <button onClick={() => handleDelete('discount', d.id)} className="p-3 bg-slate-800 hover:bg-red-600 rounded-xl text-slate-300 hover:text-white transition-all"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <h3 className="text-xl font-black italic uppercase mb-2 group-hover:text-emerald-500 transition-colors line-clamp-1">{d.name}</h3>
                            <div className="flex items-center gap-2 mb-4"><span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-mono text-emerald-500 font-black">{d.code}</span></div>

                            <div className="mt-4 flex-1">
                                <div className="p-6 bg-slate-950 rounded-[2rem] border border-slate-800 flex flex-col items-center justify-center">
                                    <p className="text-3xl font-black text-white italic">{d.type === 'percentage' ? `${d.value}%` : formatCurrency(d.value)}</p>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">NILAI DISKON</p>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-800 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-slate-500 font-black text-[9px] uppercase tracking-widest"><Calendar size={12} /> {d.end_date || 'Selamanya'}</div>
                                <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${d.is_active ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-red-500/30 text-red-500 bg-red-500/5'}`}>{d.is_active ? 'AKTIF' : 'NONAKTIF'}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL SYSTEM */}
            <AnimatePresence>
                {modal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-3xl bg-slate-950/80">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-3xl font-black italic uppercase">{modal.mode === 'add' ? 'Tambah' : 'Edit'} {modal.type === 'promo' ? 'Promo' : 'Diskon'}</h3>
                                    <p className="text-xs text-slate-500 font-bold mt-1">Lengkapi parameter marketing berikut</p>
                                </div>
                                <button onClick={() => setModal(null)} className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"><X /></button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-8 flex-1 overflow-y-auto pr-4 custom-scroll">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Program</label>
                                        <input name="name" defaultValue={modal.data.name} required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-xs font-bold focus:border-orange-500 outline-none transition-all" placeholder="Contoh: Promo Gajian" />
                                    </div>
                                    {modal.type === 'discount' && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kode Voucher</label>
                                            <input name="code" defaultValue={modal.data.code} required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-xs font-mono font-bold text-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="GAJIAN2024" />
                                        </div>
                                    )}
                                    {modal.type === 'promo' && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipe Promo</label>
                                            <select name="type" defaultValue={modal.data.type || 'buy_x_get_y'} className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-xs font-bold focus:border-orange-500 outline-none appearance-none cursor-pointer">
                                                <option value="buy_x_get_y">PROGRAM BELI X GRATIS Y</option>
                                                <option value="flat_discount">POTONGAN LANGSUNG</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {modal.type === 'promo' && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 bg-slate-950/50 rounded-[2rem] border border-slate-800/60">
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase">Item Beli</label>
                                            <select name="buy_item_id" defaultValue={modal.data.buy_item_id} className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-[10px] font-bold outline-none">
                                                <option value="">Pilih Menu...</option>
                                                {menuItems.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase">Qty Beli</label>
                                            <input type="number" name="buy_qty" defaultValue={modal.data.buy_qty || 1} className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-[10px] font-bold outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase">Qty Gratis</label>
                                            <input type="number" name="get_qty" defaultValue={modal.data.get_qty || 1} className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-[10px] font-bold outline-none" />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase">Item Gratis</label>
                                            <select name="get_item_id" defaultValue={modal.data.get_item_id} className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-[10px] font-bold outline-none">
                                                <option value="">Sama dengan Item Beli</option>
                                                {menuItems.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase">Min. Belanja</label>
                                            <input type="number" name="min_purchase" defaultValue={modal.data.min_purchase || 0} className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-[10px] font-bold outline-none" />
                                        </div>
                                    </div>
                                )}

                                {modal.type === 'discount' && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-slate-950/50 rounded-[2rem] border border-slate-800/60">
                                        <div className="col-span-1 space-y-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase">Tipe</label>
                                            <select name="type" defaultValue={modal.data.type || 'percentage'} className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-[10px] font-bold outline-none">
                                                <option value="percentage">PERSENTASE (%)</option>
                                                <option value="nominal">NOMINAL (IDR)</option>
                                            </select>
                                        </div>
                                        <div className="col-span-1 space-y-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase">Nilai Diskon</label>
                                            <input type="number" name="value" defaultValue={modal.data.value} required className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-[10px] font-black outline-none" />
                                        </div>
                                        <div className="col-span-1 space-y-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase">Min. Belanja</label>
                                            <input type="number" name="min_purchase" defaultValue={modal.data.min_purchase || 0} className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-[10px] font-bold outline-none" />
                                        </div>
                                        <div className="col-span-1 space-y-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase">Maks. Diskon</label>
                                            <input type="number" name="max_discount" defaultValue={modal.data.max_discount} className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-[10px] font-bold outline-none" placeholder="Opsional" />
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Mulai Berlaku</label>
                                        <input
                                            type="date"
                                            name="start_date"
                                            defaultValue={formatDate(modal.data.start_date)}
                                            onClick={(e) => e.target.showPicker()}
                                            className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-[10px] font-bold outline-none cursor-pointer"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Hingga</label>
                                        <input
                                            type="date"
                                            name="end_date"
                                            defaultValue={formatDate(modal.data.end_date)}
                                            onClick={(e) => e.target.showPicker()}
                                            className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-[10px] font-bold outline-none cursor-pointer"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Status</label>
                                        <select name="is_active" defaultValue={modal.data.is_active ?? 1} className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-[10px] font-bold outline-none">
                                            <option value={1}>AKTIF</option>
                                            <option value={0}>NONAKTIF</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Ringkasan Promo</label>
                                    <textarea name="description" defaultValue={modal.data.description} rows={3} className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-xs font-bold focus:border-orange-500 outline-none transition-all resize-none" placeholder="Tuliskan detail promosi Anda..." />
                                </div>

                                <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 py-6 rounded-2xl font-black text-lg uppercase tracking-widest mt-6 transition-all shadow-2xl shadow-orange-900/40 active:scale-[0.98]">SIMPAN PROGRAM SEKARANG</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
