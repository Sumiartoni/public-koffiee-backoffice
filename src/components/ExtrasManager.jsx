import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Check, X, Search, Layers, Link as LinkIcon, Tag, Settings } from 'lucide-react';
import { extraAPI } from '../api';
import { formatCurrency } from '../config';

export default function ExtrasManager({ menu }) {
    const [categories, setCategories] = useState([]);
    const [extras, setExtras] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(null);
    const [search, setSearch] = useState('');
    const [linkedCategoryIds, setLinkedCategoryIds] = useState([]);

    useEffect(() => { fetchCategories(); }, []);

    useEffect(() => {
        if (selectedCategory) fetchExtras(selectedCategory.id);
    }, [selectedCategory]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await extraAPI.getCategories();
            setCategories(res.data.categories || []);
            if (!selectedCategory && res.data.categories?.length > 0) {
                setSelectedCategory(res.data.categories[0]);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchExtras = async (catId) => {
        try {
            const res = await extraAPI.getAll(catId);
            setExtras(res.data.extras || []);
        } catch (err) { console.error(err); }
    };

    // Category CRUD
    const handleSaveCategory = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = {
            name: fd.get('name'),
            is_required: fd.get('is_required') === 'on',
            max_select: parseInt(fd.get('max_select')) || 1,
            sort_order: parseInt(fd.get('sort_order')) || 0
        };
        try {
            if (modal.mode === 'create-cat') {
                await extraAPI.createCategory(data);
            } else {
                await extraAPI.updateCategory(modal.item.id, { ...data, is_active: modal.item.is_active });
            }
            fetchCategories();
            setModal(null);
        } catch (err) { alert(err.response?.data?.error || 'Gagal menyimpan kategori'); }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Hapus kategori ini? Semua extra di dalamnya akan kehilangan kategori.')) return;
        try {
            await extraAPI.deleteCategory(id);
            if (selectedCategory?.id === id) setSelectedCategory(null);
            fetchCategories();
        } catch (err) { alert('Gagal menghapus kategori'); }
    };

    // Extra CRUD
    const handleSaveExtra = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = {
            name: fd.get('name'),
            price: parseInt(fd.get('price')) || 0,
            is_active: fd.get('is_active') === 'on' ? 1 : 0,
            category_id: selectedCategory?.id
        };
        try {
            if (modal.mode === 'create-extra') {
                await extraAPI.create(data);
            } else {
                await extraAPI.update(modal.item.id, data);
            }
            fetchExtras(selectedCategory.id);
            setModal(null);
        } catch (err) { alert(err.response?.data?.error || 'Gagal menyimpan extra'); }
    };

    const handleDeleteExtra = async (id) => {
        if (!window.confirm('Hapus varian extra ini?')) return;
        try {
            await extraAPI.delete(id);
            fetchExtras(selectedCategory.id);
        } catch (err) { alert('Gagal menghapus'); }
    };

    // Link categories to menu item
    const handleLinkSave = async (menuItemId) => {
        try {
            await extraAPI.linkCategoriesToMenuItem(menuItemId, linkedCategoryIds);
            alert('Kategori extra berhasil dihubungkan!');
            setModal(null);
        } catch (err) { alert('Gagal menghubungkan'); }
    };

    const filteredExtras = extras.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-10 animate-premium">
            {/* HEADER */}
            <div className="flex justify-between items-center bg-slate-950/40 p-10 rounded-[3rem] border border-slate-800/60 shadow-2xl">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter">Varian Extra</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-2">Kelola Kategori & Varian Tambahan</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setModal({ mode: 'create-cat' })}
                        className="px-8 py-5 rounded-[2rem] bg-slate-800 font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center gap-3 border border-slate-700">
                        <Layers size={16} /> Tambah Kategori
                    </button>
                    {selectedCategory && (
                        <button onClick={() => setModal({ mode: 'create-extra' })}
                            className="px-8 py-5 rounded-[2rem] bg-orange-600 font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 shadow-2xl shadow-orange-600/30 transition-all flex items-center gap-3 group">
                            <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Tambah Extra
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* LEFT: CATEGORY LIST */}
                <div className="lg:col-span-1 space-y-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Kategori Extra</p>
                    <div className="space-y-3">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat)}
                                className={`w-full p-5 rounded-2xl border transition-all text-left group ${selectedCategory?.id === cat.id
                                    ? 'bg-orange-600/10 border-orange-500 shadow-lg shadow-orange-900/10'
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className={`text-xs font-black uppercase tracking-tight ${selectedCategory?.id === cat.id ? 'text-orange-400' : 'text-white'}`}>{cat.name}</p>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-[9px] font-bold text-slate-500">{cat.extras_count || 0} item</span>
                                            {cat.is_required && <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">WAJIB</span>}
                                            {cat.max_select > 1 && <span className="text-[8px] font-bold text-slate-500">max {cat.max_select}</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); setModal({ mode: 'edit-cat', item: cat }); }}
                                            className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"><Edit size={12} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                                            className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            </button>
                        ))}
                        {categories.length === 0 && (
                            <div className="p-10 text-center opacity-30 italic text-sm font-bold">
                                Belum ada kategori.<br />Klik "Tambah Kategori".
                            </div>
                        )}
                    </div>
                </div>

                {/* CENTER: EXTRAS LIST */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedCategory ? (
                        <>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Kategori</p>
                                    <h3 className="text-2xl font-black italic uppercase tracking-tight">{selectedCategory.name}</h3>
                                </div>
                                <div className="relative flex-1 max-w-xs">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-800 p-4 pl-12 rounded-2xl text-sm font-bold focus:border-orange-500 outline-none transition-all" />
                                </div>
                            </div>

                            <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] overflow-hidden">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-950/60 border-b border-slate-800">
                                            <th className="p-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Nama Extra</th>
                                            <th className="p-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Harga</th>
                                            <th className="p-6 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                            <th className="p-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredExtras.map(e => (
                                            <tr key={e.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                                                <td className="p-6"><span className="text-sm font-black text-white uppercase">{e.name}</span></td>
                                                <td className="p-6 text-right"><span className="text-sm font-black text-orange-500 italic">{formatCurrency(e.price)}</span></td>
                                                <td className="p-6 text-center">
                                                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase ${e.is_active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                                        {e.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </span>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => setModal({ mode: 'edit-extra', item: e })} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"><Edit size={14} /></button>
                                                        <button onClick={() => handleDeleteExtra(e.id)} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredExtras.length === 0 && (
                                            <tr><td colSpan="4" className="p-16 text-center opacity-30 italic font-bold text-sm">Belum ada varian di kategori ini.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-80 opacity-20">
                            <div className="text-center">
                                <Layers size={48} className="mx-auto mb-4" />
                                <p className="font-black uppercase tracking-widest text-sm">Pilih kategori di sebelah kiri</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: LINK TO MENU */}
                <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col">
                    <h3 className="text-sm font-black italic uppercase tracking-widest mb-6 flex items-center gap-3"><LinkIcon size={16} className="text-orange-500" /> Link ke Menu</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed mb-6">Pilih menu untuk mengatur kategori extra mana yang tersedia.</p>

                    <div className="space-y-3 overflow-y-auto custom-scroll pr-1 flex-1 max-h-[500px]">
                        {menu.map(m => (
                            <button
                                key={m.id}
                                onClick={async () => {
                                    const res = await extraAPI.getCategoryIdsByMenuItem(m.id);
                                    setLinkedCategoryIds(res.data.categoryIds || []);
                                    setModal({ mode: 'link', item: m });
                                }}
                                className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl flex items-center justify-between group hover:border-orange-500/50 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{m.emoji}</span>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-white uppercase leading-tight">{m.name}</p>
                                        <p className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">{m.category_name}</p>
                                    </div>
                                </div>
                                <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center group-hover:bg-orange-600 transition-all">
                                    <ChevronRight size={14} className="text-slate-500 group-hover:text-white" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* MODAL: Create/Edit Category */}
            {modal && (modal.mode === 'create-cat' || modal.mode === 'edit-cat') && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl">
                        <div className="p-10 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
                            <h3 className="text-xl font-black italic uppercase">{modal.mode === 'create-cat' ? 'Tambah Kategori' : 'Edit Kategori'}</h3>
                            <button onClick={() => setModal(null)} className="p-3 hover:bg-slate-800 rounded-full transition-all text-slate-500"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveCategory} className="p-10 space-y-6 text-left">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Kategori</label>
                                <input name="name" defaultValue={modal.item?.name} required placeholder="Cth: Level Gula, Topping, Size" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold focus:border-orange-500 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Max Pilihan</label>
                                    <input name="max_select" type="number" min="1" defaultValue={modal.item?.max_select || 1} className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold focus:border-orange-500 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Urutan</label>
                                    <input name="sort_order" type="number" min="0" defaultValue={modal.item?.sort_order || 0} className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold focus:border-orange-500 outline-none" />
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                                <input name="is_required" type="checkbox" defaultChecked={modal.item?.is_required || false} className="w-6 h-6 rounded-lg accent-orange-600 cursor-pointer" />
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Wajib Dipilih</span>
                            </div>
                            <div className="pt-4 grid grid-cols-2 gap-4">
                                <button type="button" onClick={() => setModal(null)} className="w-full py-5 bg-slate-950 border border-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all text-slate-500">Batal</button>
                                <button type="submit" className="w-full py-5 bg-orange-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl shadow-orange-900/20 text-white">Simpan</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* MODAL: Create/Edit Extra */}
            {modal && (modal.mode === 'create-extra' || modal.mode === 'edit-extra') && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl">
                        <div className="p-10 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
                            <div>
                                <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">{selectedCategory?.name}</p>
                                <h3 className="text-xl font-black italic uppercase">{modal.mode === 'create-extra' ? 'Tambah Extra' : 'Edit Extra'}</h3>
                            </div>
                            <button onClick={() => setModal(null)} className="p-3 hover:bg-slate-800 rounded-full transition-all text-slate-500"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveExtra} className="p-10 space-y-6 text-left">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Varian</label>
                                <input name="name" defaultValue={modal.item?.name} required placeholder="Cth: Normal, Less Sugar, Boba" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold focus:border-orange-500 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Harga Tambahan (Rp)</label>
                                <input name="price" type="number" defaultValue={modal.item?.price || 0} required placeholder="0" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold focus:border-orange-500 outline-none" />
                            </div>
                            <div className="flex items-center gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                                <input name="is_active" type="checkbox" defaultChecked={modal.item ? modal.item.is_active : true} className="w-6 h-6 rounded-lg accent-orange-600 cursor-pointer" />
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Aktif</span>
                            </div>
                            <div className="pt-4 grid grid-cols-2 gap-4">
                                <button type="button" onClick={() => setModal(null)} className="w-full py-5 bg-slate-950 border border-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all text-slate-500">Batal</button>
                                <button type="submit" className="w-full py-5 bg-orange-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl shadow-orange-900/20 text-white">Simpan</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* MODAL: Link Categories to Menu Item */}
            {modal && modal.mode === 'link' && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 text-left">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-2xl">
                        <div className="p-10 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
                            <div>
                                <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">Pengaturan Kategori Extra</p>
                                <h3 className="text-xl font-black italic uppercase leading-none">{modal.item?.emoji} {modal.item?.name}</h3>
                            </div>
                            <button onClick={() => setModal(null)} className="p-3 hover:bg-slate-800 rounded-full transition-all text-slate-500"><X size={20} /></button>
                        </div>
                        <div className="p-10 space-y-6">
                            <p className="text-xs text-slate-400 font-bold leading-relaxed">Pilih kategori extra yang tersedia untuk menu ini. Pelanggan akan melihat kategori yang dicentang beserta isi extra-nya.</p>

                            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto custom-scroll pr-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            if (linkedCategoryIds.includes(cat.id)) {
                                                setLinkedCategoryIds(p => p.filter(id => id !== cat.id));
                                            } else {
                                                setLinkedCategoryIds(p => [...p, cat.id]);
                                            }
                                        }}
                                        className={`w-full p-6 rounded-2xl border transition-all flex items-center justify-between ${linkedCategoryIds.includes(cat.id) ? 'bg-orange-600/10 border-orange-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${linkedCategoryIds.includes(cat.id) ? 'bg-orange-600' : 'bg-slate-800'}`}>
                                                {linkedCategoryIds.includes(cat.id) && <Check size={14} className="text-white" />}
                                            </div>
                                            <div className="text-left">
                                                <span className={`text-sm font-black uppercase tracking-tight ${linkedCategoryIds.includes(cat.id) ? 'text-white' : 'text-slate-400'}`}>{cat.name}</span>
                                                <p className="text-[9px] text-slate-500 font-bold mt-0.5">{cat.extras_count || 0} varian • {cat.is_required ? 'Wajib' : 'Opsional'} • Max {cat.max_select}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                {categories.length === 0 && (
                                    <p className="text-center text-slate-500 italic text-sm py-10">Belum ada kategori. Buat kategori terlebih dahulu.</p>
                                )}
                            </div>

                            <button
                                onClick={() => handleLinkSave(modal.item.id)}
                                className="w-full py-6 bg-orange-600 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl shadow-orange-900/20 text-white flex items-center justify-center gap-4"
                            >
                                <Check size={20} /> Simpan Pengaturan
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

function ChevronRight({ size, className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}
