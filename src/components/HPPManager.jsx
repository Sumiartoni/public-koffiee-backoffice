import React, { useState, useEffect } from 'react';
import { Plus, X, Save, Calculator, Package, AlertCircle, Trash2, Edit } from 'lucide-react';
import { ingredientAPI, menuAPI } from '../api';
import { formatCurrency } from '../config';

export default function HPPManager() {
    const [activeTab, setActiveTab] = useState('recipes'); // 'recipes' or 'ingredients'
    const [menuItems, setMenuItems] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [recipe, setRecipe] = useState([]);
    const [showRecipeModal, setShowRecipeModal] = useState(false);
    const [showIngModal, setShowIngModal] = useState(null); // null or { mode: 'create'|'edit', item?: {} }

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [menuRes, ingRes] = await Promise.all([
                menuAPI.getAdminAll(),
                ingredientAPI.getAll()
            ]);
            setMenuItems(menuRes.data.items || []);
            setIngredients(ingRes.data.ingredients || []);
        } catch (error) {
            console.error('Fetch error:', error);
        }
    };

    // --- Recipe Logic ---
    const fetchRecipe = async (menuItemId) => {
        try {
            const res = await ingredientAPI.getRecipe(menuItemId);
            setRecipe(res.data.recipe || []);
        } catch (error) {
            setRecipe([]);
        }
    };

    const handleSelectItem = (item) => {
        setSelectedItem(item);
        fetchRecipe(item.id);
        setShowRecipeModal(true);
    };

    const addIngredientToRecipe = () => {
        setRecipe([...recipe, { ingredient_id: '', quantity: '' }]);
    };

    const removeIngredientFromRecipe = (index) => {
        setRecipe(recipe.filter((_, i) => i !== index));
    };

    const updateRecipeItem = (index, field, value) => {
        const updated = [...recipe];
        updated[index][field] = value;
        setRecipe(updated);
    };

    const calculateHPP = () => {
        return recipe.reduce((total, r) => {
            const ing = ingredients.find(i => i.id === parseInt(r.ingredient_id));
            if (!ing) return total;
            return total + (parseFloat(r.quantity || 0) * ing.price_per_unit);
        }, 0);
    };

    const saveRecipe = async () => {
        try {
            await ingredientAPI.setRecipe(selectedItem.id, { recipe });
            alert('Resep & HPP berhasil disinkronisasi!');
            setShowRecipeModal(false);
            fetchData();
        } catch (error) {
            alert('Gagal menyimpan: ' + error.message);
        }
    };

    // --- Ingredient Management Logic ---
    const handleSaveIngredient = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = {
            name: fd.get('name'),
            unit: fd.get('unit'),
            price_per_unit: parseFloat(fd.get('price')),
            stock_qty: parseFloat(fd.get('stock') || 0),
            min_stock: parseFloat(fd.get('min') || 0)
        };

        try {
            if (showIngModal.mode === 'create') {
                await ingredientAPI.create(data);
            } else {
                await ingredientAPI.update(showIngModal.item.id, data);
            }
            setShowIngModal(null);
            fetchData();
        } catch (error) {
            alert('Gagal simpan bahan baku');
        }
    };

    const deleteIngredient = async (id) => {
        if (!confirm('Hapus bahan ini?')) return;
        try {
            await ingredientAPI.delete(id);
            fetchData();
        } catch (e) { alert('Gagal hapus'); }
    };

    return (
        <div className="space-y-8 animate-premium">
            {/* Header Tabs */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black italic tracking-tighter mb-2">HPP & PERSEDIAAN</h1>
                    <div className="flex gap-4 mt-4">
                        <button
                            onClick={() => setActiveTab('recipes')}
                            className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'recipes' ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-900 border border-slate-800 text-slate-500'}`}
                        >
                            Komposisi Resep
                        </button>
                        <button
                            onClick={() => setActiveTab('ingredients')}
                            className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'ingredients' ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-900 border border-slate-800 text-slate-500'}`}
                        >
                            Manajemen Bahan Baku
                        </button>
                    </div>
                </div>
                {activeTab === 'ingredients' && (
                    <button
                        onClick={() => setShowIngModal({ mode: 'create' })}
                        className="flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all"
                    >
                        <Plus size={18} /> Tambah Bahan Baru
                    </button>
                )}
            </div>

            {activeTab === 'recipes' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {menuItems.map(item => {
                        const hpp = item.hpp || 0;
                        const marginPercent = item.price > 0 ? ((item.price - hpp) / item.price * 100) : 0;

                        return (
                            <div
                                key={item.id}
                                onClick={() => handleSelectItem(item)}
                                className="bg-slate-900/60 border border-slate-800 p-8 rounded-[3rem] hover:border-orange-500/50 cursor-pointer group transition-all"
                            >
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="text-4xl grayscale group-hover:grayscale-0 transition-all">{item.emoji || '☕'}</div>
                                    <div>
                                        <h3 className="font-black text-white text-lg leading-tight uppercase">{item.name}</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.category_name}</p>
                                    </div>
                                </div>
                                <div className="space-y-4 pt-6 border-t border-slate-800">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">HPP Produksi</span>
                                        <span className="font-black text-red-500 italic">{formatCurrency(hpp)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                        <span className="text-slate-500">Gross Margin</span>
                                        <span className={marginPercent > 60 ? 'text-emerald-500' : 'text-orange-500'}>{marginPercent.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === 'ingredients' && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-[4rem] overflow-hidden shadow-2xl">
                    <table className="w-full text-left">
                        <thead className="bg-black/40 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                            <tr>
                                <th className="p-10">Bahan Baku</th>
                                <th className="p-10">Harga/Satuan</th>
                                <th className="p-10">Stok Aktif</th>
                                <th className="p-10 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                            {ingredients.map(ing => (
                                <tr key={ing.id} className="group hover:bg-emerald-500/[0.02] transition-all">
                                    <td className="p-10">
                                        <p className="text-xl font-black text-white">{ing.name}</p>
                                        <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Satuan: {ing.unit}</p>
                                    </td>
                                    <td className="p-10">
                                        <p className="text-lg font-black text-emerald-500 italic">{formatCurrency(ing.price_per_unit)}</p>
                                    </td>
                                    <td className="p-10">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-2 h-2 rounded-full ${ing.stock_qty <= ing.min_stock ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                                            <p className="font-black text-white">{ing.stock_qty} {ing.unit}</p>
                                        </div>
                                    </td>
                                    <td className="p-10 text-right">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setShowIngModal({ mode: 'edit', item: ing })} className="p-4 bg-slate-950 text-slate-400 hover:text-white rounded-2xl"><Edit size={18} /></button>
                                            <button onClick={() => deleteIngredient(ing.id)} className="p-4 bg-red-950/20 text-red-600 hover:bg-red-600 hover:text-white rounded-2xl"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Manajemen Bahan Baku */}
            {showIngModal && (
                <div className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-3xl flex items-center justify-center p-8">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[4rem] p-16 shadow-2xl relative">
                        <h2 className="text-3xl font-black italic mb-10 tracking-tighter">
                            {showIngModal.mode === 'create' ? 'Tambah Bahan Baku' : 'Edit Bahan Baku'}
                        </h2>
                        <form onSubmit={handleSaveIngredient} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-6">Nama Bahan</label>
                                <input name="name" defaultValue={showIngModal.item?.name} className="input-pro" required placeholder="Contoh: Biji Kopi" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-6">Satuan</label>
                                    <input name="unit" defaultValue={showIngModal.item?.unit} className="input-pro" required placeholder="Gram / Ml / Pcs" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-6">Harga/Satuan</label>
                                    <input name="price" type="number" defaultValue={showIngModal.item?.price_per_unit} className="input-pro text-emerald-500" required placeholder="Rp 500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-6">Stok Awal</label>
                                    <input name="stock" type="number" defaultValue={showIngModal.item?.stock_qty} className="input-pro" placeholder="0" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-6">Min. Stok Warning</label>
                                    <input name="min" type="number" defaultValue={showIngModal.item?.min_stock} className="input-pro" placeholder="10" />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setShowIngModal(null)} className="flex-1 py-8 bg-slate-950 border border-slate-800 rounded-[2rem] font-black text-[10px] uppercase tracking-widest">Batal</button>
                                <button type="submit" className="flex-1 py-8 bg-emerald-600 rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20">Simpan Bahan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Recipe Edit (Overlay UI Premium) */}
            {showRecipeModal && selectedItem && (
                <div className="fixed inset-0 z-[300] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-8">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-[5rem] p-16 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-start mb-12">
                            <div className="flex items-center gap-6">
                                <div className="text-6xl">{selectedItem.emoji}</div>
                                <div>
                                    <h2 className="text-4xl font-black italic tracking-tighter leading-none mb-2">{selectedItem.name}</h2>
                                    <div className="flex items-center gap-3">
                                        <Calculator size={14} className="text-orange-600" />
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Estimasi HPP: <span className="text-orange-500 font-black">{formatCurrency(calculateHPP())}</span></p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setShowRecipeModal(false)} className="w-16 h-16 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white"><X /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-4 custom-scroll space-y-4 mb-10">
                            {recipe.length === 0 ? (
                                <div className="py-20 text-center bg-slate-950/50 rounded-[3rem] border border-dashed border-slate-800">
                                    <AlertCircle className="mx-auto mb-4 text-slate-800" size={48} />
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Belum ada komposisi bahan baku</p>
                                </div>
                            ) : (
                                recipe.map((r, idx) => {
                                    const ing = ingredients.find(i => i.id === parseInt(r.ingredient_id));
                                    const subtotal = ing ? (parseFloat(r.quantity || 0) * ing.price_per_unit) : 0;
                                    return (
                                        <div key={idx} className="flex gap-4 items-center bg-slate-950/50 p-6 rounded-[2.5rem] border border-slate-800/40 group hover:border-orange-500/30 transition-all">
                                            <select
                                                value={r.ingredient_id}
                                                onChange={(e) => updateRecipeItem(idx, 'ingredient_id', e.target.value)}
                                                className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 text-[11px] font-black text-white outline-none focus:ring-2 ring-orange-500/20"
                                            >
                                                <option value="">Pilih Bahan Baku...</option>
                                                {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({formatCurrency(i.price_per_unit)}/{i.unit})</option>)}
                                            </select>
                                            <div className="w-40 relative">
                                                <input
                                                    type="number"
                                                    value={r.quantity}
                                                    onChange={(e) => updateRecipeItem(idx, 'quantity', e.target.value)}
                                                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center font-black text-orange-500 outline-none"
                                                    placeholder="Dosis"
                                                />
                                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-600 uppercase">{ing?.unit || 'UNIT'}</span>
                                            </div>
                                            <div className="w-32 text-right">
                                                <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Cost</p>
                                                <p className="font-black text-white text-xs">{formatCurrency(subtotal)}</p>
                                            </div>
                                            <button onClick={() => removeIngredientFromRecipe(idx)} className="p-4 bg-red-950/20 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16} /></button>
                                        </div>
                                    );
                                })
                            )}
                            <button onClick={addIngredientToRecipe} className="w-full py-6 border-2 border-dashed border-slate-800 rounded-[2.5rem] text-[10px] font-black uppercase text-slate-600 tracking-widest hover:border-orange-500/40 hover:text-orange-500 transition-all">+ Baris Bahan Baku Baru</button>
                        </div>

                        <button onClick={saveRecipe} className="w-full bg-orange-600 py-8 rounded-[3rem] font-black text-sm uppercase tracking-[0.4em] shadow-2xl shadow-orange-500/30 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-6"><Save /> Simpan & Update HPP</button>
                    </div>
                </div>
            )}
        </div>
    );
}
