import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Plus, Trash2, Edit3, X, Loader, ToggleLeft, ToggleRight, ExternalLink, ArrowUp, ArrowDown } from 'lucide-react';
import { bannerAPI, menuAPI } from '../api';
import { API_URL } from '../config';

const BASE_URL = API_URL.replace('/api', '');

export default function BannerManager() {
    const [banners, setBanners] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(null);
    const [preview, setPreview] = useState(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bRes, mRes, cRes] = await Promise.all([
                bannerAPI.getAll(),
                menuAPI.getAdminAll(),
                menuAPI.getCategories()
            ]);
            setBanners(bRes.data);
            setMenuItems(mRes.data.items || mRes.data || []);
            setCategories(cRes.data.categories || cRes.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus banner ini?')) return;
        try {
            await bannerAPI.delete(id);
            fetchData();
        } catch (e) { alert('Gagal menghapus'); }
    };

    const handleToggle = async (id) => {
        try {
            await bannerAPI.toggle(id);
            fetchData();
        } catch (e) { alert('Gagal mengubah status'); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        try {
            if (modal.mode === 'add') {
                await bannerAPI.create(formData);
            } else {
                await bannerAPI.update(modal.data.id, formData);
            }
            setModal(null);
            setPreview(null);
            fetchData();
        } catch (e) { alert('Gagal menyimpan: ' + (e.response?.data?.error || e.message)); }
    };

    const handleImagePreview = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    const getLinkLabel = (type) => {
        switch (type) {
            case 'product': return 'Produk';
            case 'category': return 'Kategori';
            case 'external': return 'Link Eksternal';
            default: return 'Tidak ada';
        }
    };

    return (
        <div className="space-y-10 animate-premium">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-slate-950/40 p-10 rounded-[3rem] border border-slate-800/60 shadow-2xl">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase">Banner Aplikasi</h2>
                    <p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.4em] mt-2">Atur Banner Promosi di Aplikasi Pelanggan</p>
                </div>
                <button
                    onClick={() => { setModal({ mode: 'add', data: {} }); setPreview(null); }}
                    className="flex items-center gap-3 bg-orange-600 hover:bg-orange-500 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl shadow-orange-900/20 active:scale-95"
                >
                    <Plus size={16} /> Tambah Banner
                </button>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 opacity-50">
                    <Loader className="animate-spin mb-4" />
                    <p className="font-black text-[10px] uppercase tracking-widest">Memuat Banner...</p>
                </div>
            ) : banners.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 opacity-40">
                    <Image size={48} className="mb-4 text-slate-600" />
                    <p className="font-black text-sm text-slate-500 uppercase tracking-widest">Belum ada banner</p>
                    <p className="text-[10px] text-slate-600 mt-2">Klik "Tambah Banner" untuk membuat banner pertama</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {banners.map((b, idx) => (
                        <div key={b.id} className="group bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 hover:border-orange-500/40 transition-all shadow-xl flex gap-6 items-center">
                            {/* Image Preview */}
                            <div className="w-48 h-24 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0">
                                {b.image_url ? (
                                    <img src={`${BASE_URL}${b.image_url}`} alt={b.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-700"><Image size={32} /></div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-black italic uppercase truncate group-hover:text-orange-500 transition-colors">{b.title}</h3>
                                <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <span>Urutan: {b.sort_order}</span>
                                    <span>Link: {getLinkLabel(b.link_type)}</span>
                                    {b.link_value && <span className="text-slate-400 truncate max-w-[200px]">{b.link_value}</span>}
                                </div>
                            </div>

                            {/* Status */}
                            <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border flex-shrink-0 ${b.is_active ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-red-500/30 text-red-500 bg-red-500/5'}`}>
                                {b.is_active ? 'AKTIF' : 'NONAKTIF'}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button onClick={() => handleToggle(b.id)} className={`p-3 rounded-xl transition-all ${b.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                                    {b.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                </button>
                                <button onClick={() => { setModal({ mode: 'edit', data: b }); setPreview(b.image_url ? `${BASE_URL}${b.image_url}` : null); }} className="p-3 bg-slate-800 hover:bg-orange-600 rounded-xl text-slate-300 hover:text-white transition-all"><Edit3 size={14} /></button>
                                <button onClick={() => handleDelete(b.id)} className="p-3 bg-slate-800 hover:bg-red-600 rounded-xl text-slate-300 hover:text-white transition-all"><Trash2 size={14} /></button>
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
                                    <h3 className="text-3xl font-black italic uppercase">{modal.mode === 'add' ? 'Tambah' : 'Edit'} Banner</h3>
                                    <p className="text-xs text-slate-500 font-bold mt-1">Atur banner promosi aplikasi</p>
                                </div>
                                <button onClick={() => { setModal(null); setPreview(null); }} className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"><X /></button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-8 flex-1 overflow-y-auto pr-4 custom-scroll">
                                {/* Title */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Judul Banner</label>
                                    <input name="title" defaultValue={modal.data.title} required className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-xs font-bold focus:border-orange-500 outline-none transition-all" placeholder="Contoh: Promo Akhir Tahun" />
                                </div>

                                {/* Image Upload */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Gambar Banner</label>
                                    <div className="p-6 bg-slate-950/50 rounded-[2rem] border border-slate-800/60 border-dashed">
                                        {preview && (
                                            <div className="mb-4 rounded-2xl overflow-hidden h-40">
                                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            name="image"
                                            accept="image/*"
                                            onChange={handleImagePreview}
                                            className="w-full text-xs text-slate-400 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-orange-600 file:text-white file:font-black file:text-[10px] file:uppercase file:tracking-widest file:cursor-pointer hover:file:bg-orange-500"
                                        />
                                        <p className="text-[8px] text-slate-600 mt-2 ml-1">Maks. 5MB. Format: JPG, PNG, WebP</p>
                                    </div>
                                </div>

                                {/* Link Settings */}
                                <div className="p-8 bg-slate-950/50 rounded-[2rem] border border-slate-800/60 space-y-6">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pengaturan Link</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-600 uppercase">Tipe Link</label>
                                            <select
                                                name="link_type"
                                                defaultValue={modal.data.link_type || 'none'}
                                                onChange={(e) => setModal(prev => ({ ...prev, data: { ...prev.data, link_type: e.target.value } }))}
                                                className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs font-bold outline-none focus:border-orange-500 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="none">Tidak Ada Link</option>
                                                <option value="product">Produk</option>
                                                <option value="category">Kategori</option>
                                                <option value="external">Link Eksternal</option>
                                            </select>
                                        </div>

                                        {modal.data.link_type === 'product' && (
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-600 uppercase">Pilih Produk</label>
                                                <select name="link_value" defaultValue={modal.data.link_value} className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs font-bold outline-none appearance-none cursor-pointer">
                                                    <option value="">Pilih...</option>
                                                    {menuItems.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                </select>
                                            </div>
                                        )}

                                        {modal.data.link_type === 'category' && (
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-600 uppercase">Pilih Kategori</label>
                                                <select name="link_value" defaultValue={modal.data.link_value} className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs font-bold outline-none appearance-none cursor-pointer">
                                                    <option value="">Pilih...</option>
                                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </div>
                                        )}

                                        {modal.data.link_type === 'external' && (
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-600 uppercase">URL</label>
                                                <input type="url" name="link_value" defaultValue={modal.data.link_value} className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs font-bold outline-none focus:border-orange-500 transition-all" placeholder="https://..." />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Sort Order */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Urutan Tampil</label>
                                    <input type="number" name="sort_order" defaultValue={modal.data.sort_order || 0} min="0" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-xs font-bold focus:border-orange-500 outline-none transition-all" placeholder="0" />
                                    <p className="text-[8px] text-slate-600 ml-1">Angka kecil ditampilkan lebih dulu</p>
                                </div>

                                <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 py-6 rounded-2xl font-black text-lg uppercase tracking-widest mt-6 transition-all shadow-2xl shadow-orange-900/40 active:scale-[0.98]">
                                    SIMPAN BANNER
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
