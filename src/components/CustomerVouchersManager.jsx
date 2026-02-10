import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit, Trash2, Calendar, Users, Percent, DollarSign, Gift } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

const voucherAPI = {
    getAll: () => axios.get(`${API_URL}/customer-vouchers`),
    create: (data) => axios.post(`${API_URL}/customer-vouchers`, data),
    update: (id, data) => axios.put(`${API_URL}/customer-vouchers/${id}`, data),
    delete: (id) => axios.delete(`${API_URL}/customer-vouchers/${id}`)
};

export default function CustomerVouchersManager() {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('new_user'); // new_user, referral, general
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'new_user', // new_user, referral, general
        type: 'percent', // percent, nominal
        value: 0,
        max_discount: 0,
        min_purchase: 0,
        quota: 0,
        validity_days: 7, // Default 7 days from claim
        start_date: '',
        end_date: '',
        is_active: true
    });

    useEffect(() => {
        fetchVouchers();
    }, []);

    const fetchVouchers = async () => {
        setLoading(true);
        try {
            const res = await voucherAPI.getAll();
            setVouchers(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error(error);
            alert('Gagal mengambil data voucher');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, category: activeTab };

            // Validation Logic (Optional cleanup)
            if (payload.type === 'nominal') payload.max_discount = 0;

            if (editingItem) {
                await voucherAPI.update(editingItem.id, payload);
            } else {
                await voucherAPI.create(payload);
            }

            fetchVouchers();
            setShowForm(false);
            setEditingItem(null);
            resetForm();
        } catch (error) {
            console.error(error);
            alert('Gagal menyimpan voucher');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Yakin ingin menghapus voucher ini?')) {
            try {
                await voucherAPI.delete(id);
                fetchVouchers();
            } catch (error) {
                console.error(error);
                alert('Gagal menghapus voucher');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            category: activeTab,
            type: 'percent',
            value: 0,
            max_discount: 0,
            min_purchase: 0,
            quota: 0,
            validity_days: 7,
            start_date: '',
            end_date: '',
            is_active: true
        });
    };

    const openEdit = (item) => {
        setEditingItem(item);
        setFormData({
            title: item.title,
            description: item.description || '',
            category: item.category,
            type: item.type,
            value: item.value,
            max_discount: item.max_discount || 0,
            min_purchase: item.min_purchase || 0,
            quota: item.quota || 0,
            validity_days: item.validity_days || 7,
            start_date: item.start_date ? item.start_date.split('T')[0] : '',
            end_date: item.end_date ? item.end_date.split('T')[0] : '',
            is_active: item.is_active
        });
        setActiveTab(item.category);
        setShowForm(true);
    };

    // Filtered List
    const filteredVouchers = Array.isArray(vouchers) ? vouchers.filter(v => v.category === activeTab) : [];

    return (
        <div className="space-y-8 animate-premium">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter text-white">Voucher Pelanggan</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Kelola loyalitas & promo khusus aplikasi</p>
                </div>
                {!showForm && (
                    <button onClick={() => { resetForm(); setShowForm(true); }} className="px-8 py-4 bg-amber-600 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white hover:bg-amber-500 transition-all shadow-xl flex items-center gap-3">
                        <Plus size={18} /> Tambah Voucher
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-800 pb-1">
                <TabButton id="new_user" label="Pengguna Baru" icon={<Users size={16} />} active={activeTab} onClick={setActiveTab} />
                <TabButton id="referral" label="Kode Referral" icon={<Gift size={16} />} active={activeTab} onClick={setActiveTab} />
                <TabButton id="general" label="Voucher Umum" icon={<Tag size={16} />} active={activeTab} onClick={setActiveTab} />
            </div>

            {showForm ? (
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 max-w-3xl">
                    <h3 className="text-xl font-black text-white mb-6 uppercase tracking-wider">{editingItem ? 'Edit Voucher' : 'Buat Voucher Baru'} - {activeTab.replace('_', ' ').toUpperCase()}</h3>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Judul Voucher</label>
                                <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" placeholder="Cth: Diskon Pengguna Baru" />
                            </div>

                            {/* Type & Value */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-amber-500 uppercase">Tipe Diskon</label>
                                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none">
                                    <option value="percent">Persentase (%)</option>
                                    <option value="nominal">Potongan Langsung (Rp)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-amber-500 uppercase">Nilai Diskon</label>
                                <div className="relative">
                                    {formData.type === 'percent' ? <Percent className="absolute left-4 top-3.5 text-slate-600" size={16} /> : <DollarSign className="absolute left-4 top-3.5 text-slate-600" size={16} />}
                                    <input required type="number" min="1" value={formData.value} onChange={e => setFormData({ ...formData, value: parseInt(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:border-amber-500 outline-none" />
                                </div>
                            </div>

                            {formData.type === 'percent' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-amber-500 uppercase">Max Diskon (Rp)</label>
                                    <input type="number" min="0" value={formData.max_discount} onChange={e => setFormData({ ...formData, max_discount: parseInt(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" placeholder="0 = Unlimited" />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Min. Belanja (Rp)</label>
                                <input type="number" min="0" value={formData.min_purchase} onChange={e => setFormData({ ...formData, min_purchase: parseInt(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Masa Berlaku (Hari)</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-3.5 text-slate-600" size={16} />
                                    <input required type="number" min="1" value={formData.validity_days} onChange={e => setFormData({ ...formData, validity_days: parseInt(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:border-amber-500 outline-none" />
                                </div>
                                <p className="text-[10px] text-slate-600">*Berlaku setelah diklaim</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Kuota Total</label>
                                <input type="number" min="0" value={formData.quota} onChange={e => setFormData({ ...formData, quota: parseInt(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" placeholder="0 = Unlimited" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Deskripsi</label>
                            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none h-24" placeholder="Jelaskan detail keuntungan..." />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Mulai Tanggal (Opsional)</label>
                                <input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Sampai Tanggal (Opsional)</label>
                                <input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none" />
                            </div>
                        </div>


                        <div className="flex gap-4 pt-6">
                            <button type="button" onClick={() => { setShowForm(false); setEditingItem(null); }} className="flex-1 py-4 bg-slate-800 rounded-xl font-bold text-slate-400 hover:bg-slate-700 transition-colors uppercase text-xs tracking-wider">Batal</button>
                            <button type="submit" className="flex-1 py-4 bg-emerald-600 rounded-xl font-black text-white hover:bg-emerald-500 transition-colors uppercase text-xs tracking-wider shadow-lg shadow-emerald-900/20">Simpan Voucher</button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredVouchers.length === 0 ? (
                        <div className="col-span-3 py-20 text-center">
                            <p className="text-slate-600 font-bold italic">Belum ada voucher di kategori ini</p>
                        </div>
                    ) : filteredVouchers.map(v => (
                        <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 relative group overflow-hidden hover:border-amber-500/30 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Tag size={100} />
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${v.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {v.is_active ? 'Aktif' : 'Non-Aktif'}
                                    </span>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(v)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"><Edit size={14} /></button>
                                        <button onClick={() => handleDelete(v.id)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                </div>

                                <h4 className="text-xl font-black text-white mb-2">{v.title}</h4>
                                <p className="text-xs text-slate-500 line-clamp-2 mb-6">{v.description || 'Tidak ada deskripsi'}</p>

                                <div className="space-y-3 border-t border-slate-800 pt-4">
                                    <MetaRow label="Tipe" val={v.type === 'percent' ? 'Persentase' : 'Potongan Langsung'} />
                                    <MetaRow label="Nilai" val={v.type === 'percent' ? `${v.value}%` : `Rp ${v.value.toLocaleString('id-ID')}`} />
                                    {v.type === 'percent' && v.max_discount > 0 && <MetaRow label="Max Diskon" val={`Rp ${v.max_discount.toLocaleString('id-ID')}`} />}
                                    <MetaRow label="Masa Berlaku" val={`${v.validity_days} Hari`} />
                                    <MetaRow label="Min. Belanja" val={`Rp ${v.min_purchase.toLocaleString('id-ID')}`} />
                                    <MetaRow label="Kuota" val={v.quota === 0 || v.quota === null ? 'Unlimited' : v.quota} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function TabButton({ id, label, icon, active, onClick }) {
    const isActive = active === id;
    return (
        <button
            onClick={() => onClick(id)}
            className={`flex items-center gap-2 px-6 py-4 rounded-t-2xl font-bold text-xs uppercase tracking-wider transition-all border-b-2 ${isActive ? 'bg-slate-900 text-amber-500 border-amber-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
        >
            {icon} {label}
        </button>
    );
}

function MetaRow({ label, val }) {
    return (
        <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-bold uppercase">{label}</span>
            <span className="text-white font-mono">{val}</span>
        </div>
    );
}
