import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Check, X, Search, Layers, Link as LinkIcon } from 'lucide-react';
import { extraAPI } from '../api';
import { formatCurrency } from '../config';

export default function ExtrasManager({ menu }) {
    const [extras, setExtras] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(null); // { mode: 'create'|'edit'|'link', item?: any }
    const [search, setSearch] = useState('');
    const [linkedExtras, setLinkedExtras] = useState([]); // Used for linking modal

    useEffect(() => {
        fetchExtras();
    }, []);

    const fetchExtras = async () => {
        setLoading(true);
        try {
            const res = await extraAPI.getAll();
            setExtras(res.data.extras);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            price: parseInt(formData.get('price')) || 0,
            is_active: formData.get('is_active') === 'on' ? 1 : 0
        };

        try {
            if (modal.mode === 'create') {
                await extraAPI.create(data);
            } else {
                await extraAPI.update(modal.item.id, data);
            }
            fetchExtras();
            setModal(null);
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal menyimpan data');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus varian extra ini?')) return;
        try {
            await extraAPI.delete(id);
            fetchExtras();
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal menghapus');
        }
    };

    const handleLinkSave = async (menuItemId, selectedIds) => {
        try {
            await extraAPI.linkToMenuItem(menuItemId, selectedIds);
            alert('Varian berhasil dihubungkan ke produk!');
            setModal(null);
        } catch (err) {
            alert(err.response?.data?.error || 'Gagal menghubungkan');
        }
    };

    const filteredExtras = extras.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-10 animate-premium">
            <div className="flex justify-between items-center bg-slate-950/40 p-10 rounded-[3rem] border border-slate-800/60 shadow-2xl">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter">Varian Extra</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-2">Kelola Toping & Tambahan Opsional</p>
                </div>
                <button
                    onClick={() => setModal({ mode: 'create' })}
                    className="px-10 py-5 rounded-[2rem] bg-orange-600 font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 shadow-2xl shadow-orange-600/30 transition-all flex items-center gap-4 group"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Tambah Extra
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* LIST EXTRAS */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            placeholder="Cari Varian..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 p-6 pl-16 rounded-3xl text-sm font-bold focus:border-orange-500 outline-none transition-all"
                        />
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] overflow-hidden">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-950/60 border-b border-slate-800">
                                    <th className="p-8 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Nama Extra</th>
                                    <th className="p-8 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Harga</th>
                                    <th className="p-8 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="p-8 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExtras.map(e => (
                                    <tr key={e.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                                        <td className="p-8"><span className="text-sm font-black text-white uppercase">{e.name}</span></td>
                                        <td className="p-8 text-right"><span className="text-sm font-black text-orange-500 italic">{formatCurrency(e.price)}</span></td>
                                        <td className="p-8 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase ${e.is_active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                                {e.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="p-8 text-right">
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => setModal({ mode: 'edit', item: e })} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"><Edit size={16} /></button>
                                                <button onClick={() => handleDelete(e.id)} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredExtras.length === 0 && (
                                    <tr><td colSpan="4" className="p-20 text-center opacity-30 italic font-bold">Belum ada varian extra.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* LINKING QUICK VIEW */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 flex flex-col">
                    <h3 className="text-lg font-black italic uppercase tracking-widest mb-8 flex items-center gap-4"><LinkIcon className="text-orange-500" /> Hubungkan ke Menu</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase leading-relaxed mb-10">Pilih menu untuk mengatur varian extra apa saja yang tersedia untuk menu tersebut.</p>

                    <div className="space-y-4 overflow-y-auto custom-scroll pr-2 flex-1 max-h-[500px]">
                        {menu.map(m => (
                            <button
                                key={m.id}
                                onClick={async () => {
                                    const res = await extraAPI.getByMenuItem(m.id);
                                    setLinkedExtras(res.data.extras.map(e => e.id));
                                    setModal({ mode: 'link', item: m });
                                }}
                                className="w-full bg-slate-950 border border-slate-800 p-6 rounded-[2rem] flex items-center justify-between group hover:border-orange-500/50 transition-all shadow-xl"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl">{m.emoji}</span>
                                    <div className="text-left">
                                        <p className="text-xs font-black text-white uppercase">{m.name}</p>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{m.category_name}</p>
                                    </div>
                                </div>
                                <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center group-hover:bg-orange-600 transition-all">
                                    <ChevronRight size={16} className="text-slate-500 group-hover:text-white" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* MODAL FOR CREATE/EDIT */}
            {modal && (modal.mode === 'create' || modal.mode === 'edit') && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl">
                        <div className="p-10 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
                            <h3 className="text-xl font-black italic uppercase">{modal.mode === 'create' ? 'Tambah Extra' : 'Edit Extra'}</h3>
                            <button onClick={() => setModal(null)} className="p-3 hover:bg-slate-800 rounded-full transition-all text-slate-500"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-10 space-y-6 text-left">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Varian Extra</label>
                                <input name="name" defaultValue={modal.item?.name} required placeholder="Cth: Extra Topping Keju" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold focus:border-orange-500 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Harga Tambahan (Rp)</label>
                                <input name="price" type="number" defaultValue={modal.item?.price} required placeholder="0" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-sm font-bold focus:border-orange-500 outline-none" />
                            </div>
                            <div className="flex items-center gap-4 bg-slate-950 p-6 rounded-2xl border border-slate-800">
                                <input name="is_active" type="checkbox" defaultChecked={modal.item ? modal.item.is_active : true} className="w-6 h-6 rounded-lg accent-orange-600 cursor-pointer" />
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Aktif & Tampilkan di POS</span>
                            </div>
                            <div className="pt-6 grid grid-cols-2 gap-4">
                                <button type="button" onClick={() => setModal(null)} className="w-full py-5 bg-slate-950 border border-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all text-slate-500">Batal</button>
                                <button type="submit" className="w-full py-5 bg-orange-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl shadow-orange-900/20 text-white">Simpan Data</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* MODAL FOR LINKING */}
            {modal && modal.mode === 'link' && (
                <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 text-left">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-2xl">
                        <div className="p-10 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center text-left">
                            <div>
                                <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">Pengaturan Extra</p>
                                <h3 className="text-xl font-black italic uppercase leading-none">{modal.item?.name}</h3>
                            </div>
                            <button onClick={() => setModal(null)} className="p-3 hover:bg-slate-800 rounded-full transition-all text-slate-500"><X size={20} /></button>
                        </div>
                        <div className="p-10 space-y-8">
                            <p className="text-xs text-slate-400 font-bold leading-relaxed">Pilih varian extra yang akan muncul sebagai pilihan opsional saat kasir memilih menu ini.</p>

                            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto custom-scroll pr-2">
                                {extras.map(e => (
                                    <button
                                        key={e.id}
                                        onClick={() => {
                                            if (linkedExtras.includes(e.id)) setLinkedExtras(p => p.filter(id => id !== e.id));
                                            else setLinkedExtras(p => [...p, e.id]);
                                        }}
                                        className={`w-full p-6 rounded-2xl border transition-all flex items-center justify-between ${linkedExtras.includes(e.id) ? 'bg-orange-600/10 border-orange-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${linkedExtras.includes(e.id) ? 'bg-orange-600' : 'bg-slate-800'}`}>
                                                {linkedExtras.includes(e.id) && <Check size={14} className="text-white" />}
                                            </div>
                                            <span className={`text-sm font-black uppercase tracking-tight ${linkedExtras.includes(e.id) ? 'text-white' : 'text-slate-400'}`}>{e.name}</span>
                                        </div>
                                        <span className="text-xs font-black italic">+ {formatCurrency(e.price)}</span>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => handleLinkSave(modal.item.id, linkedExtras)}
                                className="w-full py-6 bg-orange-600 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl shadow-orange-900/20 text-white flex items-center justify-center gap-4"
                            >
                                <Check size={20} /> Simpan Pengaturan Varian
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
