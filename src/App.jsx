import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, ShoppingBag, UtensilsCrossed, TrendingUp, Settings, LogOut, Bell, CheckCircle,
    User, Mail, Phone, Lock, Key, ShieldCheck, Loader2, Plus, Edit, Trash2, Camera, Download, Filter,
    ChevronDown, ChevronLeft, ChevronRight, Monitor, Package, Clock, DollarSign, Tag, Smartphone, MapPin, Receipt, Database, Info, Gift, Calendar as CalendarIcon, X, Layers
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { authAPI, menuAPI, orderAPI, reportAPI } from './api';
import EnhancedDashboard from './components/EnhancedDashboard';
import HPPManager from './components/HPPManager';
import ExpenseManager from './components/ExpenseManager';
import PromoManager from './components/PromoManager';
import ExtrasManager from './components/ExtrasManager';
import RewardProductManager from './components/RewardProductManager';
import CustomerVouchersManager from './components/CustomerVouchersManager';
import BannerManager from './components/BannerManager';
import NotificationManager from './components/NotificationManager';
import NewUserVoucherManager from './components/NewUserVoucherManager';
import LoyaltySettingsManager from './components/LoyaltySettingsManager';
// import ReferralManager from './components/ReferralManager';
import { SOCKET_URL } from './config';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement);

// SOCKET_URL imported from config

export default function UltimateBackoffice() {
    const [initialized, setInitialized] = useState(false);
    const [token, setToken] = useState(localStorage.getItem('admin_token'));
    const [userProfile, setUserProfile] = useState(null);
    const [view, setView] = useState('dashboard');
    const [authState, setAuthState] = useState('login');
    const [notifs, setNotifs] = useState([]);
    const [stats, setStats] = useState({ sales: 0, orders: 0, revenueTrend: [] });
    const [accReport, setAccReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeOrders, setActiveOrders] = useState([]);
    const [fullMenu, setFullMenu] = useState([]);
    const [categories, setCategories] = useState([]);
    const [advancedReport, setAdvancedReport] = useState(null);
    const [breakdownData, setBreakdownData] = useState([]);
    const [breakdownType, setBreakdownType] = useState('daily');
    const [customers, setCustomers] = useState([]);
    const [variants, setVariants] = useState([]);
    const [catReport, setCatReport] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    // UI Control
    const [showProfile, setShowProfile] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [menuModal, setMenuModal] = useState(null);
    const [catModal, setCatModal] = useState(false);
    const [reportRange, setReportRange] = useState({
        start: new Date().toLocaleDateString('en-CA'),
        end: new Date().toLocaleDateString('en-CA')
    });

    useEffect(() => {
        if (token) initializeApp();
        else setInitialized(true);
    }, [token]);

    const initializeApp = async () => {
        setLoading(true);
        try {
            // Token validation logic simulation
            const uRes = await authAPI.getMe();
            setUserProfile(uRes.data.user);
            setupSocket();
            // Start fetching data but don't block the shell initialization
            refreshGlobalData();
        } catch (e) {
            console.error("Sesi Berakhir", e);
            handleLogout();
        } finally {
            setInitialized(true);
            setLoading(false);
        }
    };

    const setupSocket = () => {
        const socket = io(SOCKET_URL);
        socket.on('new-order', (o) => {
            refreshGlobalData();
        });
        socket.on('order-updated', () => refreshGlobalData());
        return () => socket.disconnect();
    };

    // Live Clock Effect
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const refreshGlobalData = async () => {
        try {
            const [dRes, mRes, cRes, oRes] = await Promise.all([
                reportAPI.getDashboard().catch(e => ({ data: stats })),
                menuAPI.getAdminAll().catch(e => ({ data: { items: fullMenu } })),
                menuAPI.getCategories().catch(e => ({ data: { categories: [] } })),
                orderAPI.getAll().catch(e => ({ data: { orders: [] } }))
            ]);

            setStats(dRes.data);
            setFullMenu(mRes.data.items);
            setCategories(cRes.data.categories);
            setActiveOrders(oRes.data.orders);

            // Advanced Reports - Handled individually to prevent total lock
            reportAPI.getAdvanced(reportRange.start, reportRange.end)
                .then(res => setAdvancedReport(res.data))
                .catch(e => console.error("Advanced Report Error", e));

            reportAPI.getBreakdown(breakdownType, reportRange.start, reportRange.end)
                .then(res => setBreakdownData(res.data.data))
                .catch(e => console.error("Breakdown Error", e));

            reportAPI.getCustomers()
                .then(res => setCustomers(res.data.customers))
                .catch(e => console.error("Customers Error", e));

            reportAPI.getVariants(reportRange.start, reportRange.end)
                .then(res => setVariants(res.data.variants))
                .catch(e => console.error("Variants Error", e));

        } catch (err) {
            console.error("Gagal Sinkronisasi Data", err);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        setLoading(true);
        try {
            await orderAPI.updateStatus(id, status);
            await refreshGlobalData();
        } catch (e) { alert("Gagal memperbarui status pesanan"); }
        finally { setLoading(false); }
    };

    const handleDeleteOrder = async (id, orderNumber) => {
        if (!window.confirm(`Batalkan pesanan ${orderNumber}?\n\nTindakan ini akan:\n• Memindahkan pesanan ke laporan Audit/Batal\n• Mengembalikan stok ingredient yang telah dikurangi\n• Mengeluarkan pesanan dari hitungan penjualan harian\n\nApakah Anda yakin?`)) {
            return;
        }

        setLoading(true);
        try {
            await orderAPI.delete(id);
            await refreshGlobalData();
            alert(`Pesanan ${orderNumber} berhasil dihapus`);
        } catch (e) {
            alert("Gagal menghapus pesanan: " + (e.response?.data?.error || e.message));
        }
        finally { setLoading(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        setToken(null);
        setAuthState('login');
        setUserProfile(null);
    };

    if (!token) {
        return (
            <>
                {!initialized && <LoadingScreen message="Menghubungkan ke Server Pusat..." />}
                <AuthFlow
                    authState={authState}
                    setAuthState={setAuthState}
                    onSuccess={(t) => { setToken(t); }}
                    loading={loading}
                    setLoading={setLoading}
                />
            </>
        );
    }

    return (
        <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans antialiased">
            {!initialized && <LoadingScreen message="Sinkronisasi Data Markas..." />}


            {/* 0. Overlay untuk Mobile */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* 1. Sidebar Navigasi Utama */}
            <aside className={`fixed lg:relative inset-y-0 left-0 w-80 border-r border-slate-800/60 bg-slate-950/40 backdrop-blur-3xl p-10 flex flex-col shrink-0 z-[110] transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="flex items-center justify-between mb-16 px-2">
                    <div className="flex items-center gap-4">
                        <img src="/logo.png" className="w-14 h-14 object-contain" alt="Logo" />
                        <div><h1 className="text-xl font-black italic tracking-tight">COFFEE POS</h1><p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.2em] opacity-60">Pusat Kendali</p></div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden w-10 h-10 flex items-center justify-center bg-slate-900 rounded-xl text-slate-500"><X size={20} /></button>
                </div>

                <nav className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
                    <NavItem icon={<LayoutDashboard size={20} />} label="Beranda Utama" active={view === 'dashboard'} onClick={() => { setView('dashboard'); setSidebarOpen(false); }} />
                    <NavItem icon={<ShoppingBag size={20} />} label="Riwayat Pesanan" active={view === 'orders'} onClick={() => { setView('orders'); setSidebarOpen(false); }} />
                    <NavItem icon={<UtensilsCrossed size={20} />} label="Daftar Menu" active={view === 'menu'} onClick={() => { setView('menu'); setSidebarOpen(false); }} />
                    <NavItem icon={<Database size={20} />} label="HPP & Resep" active={view === 'hpp'} onClick={() => { setView('hpp'); setSidebarOpen(false); }} />
                    <NavItem icon={<Receipt size={20} />} label="Pengeluaran" active={view === 'expenses'} onClick={() => { setView('expenses'); setSidebarOpen(false); }} />
                    {/* <NavItem icon={<Receipt size={20} />} label="Pengeluaran" active={view === 'expenses'} onClick={() => { setView('expenses'); setSidebarOpen(false); }} /> */}
                    <NavItem icon={<Layers size={20} />} label="Varian Extra" active={view === 'extras'} onClick={() => { setView('extras'); setSidebarOpen(false); }} />

                    <div className="px-6 py-2 mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">LOYALTY PROGRAM</div>
                    <NavItem icon={<Tag size={20} />} label="Voucher Pengguna Baru" active={view === 'new-user-voucher'} onClick={() => { setView('new-user-voucher'); setSidebarOpen(false); }} />
                    <NavItem icon={<Tag size={20} />} label="Voucher Pelanggan" active={view === 'customer-vouchers'} onClick={() => { setView('customer-vouchers'); setSidebarOpen(false); }} />
                    <NavItem icon={<Package size={20} />} label="Reward Produk" active={view === 'rewards'} onClick={() => { setView('rewards'); setSidebarOpen(false); }} />
                    <NavItem icon={<Monitor size={20} />} label="Banner Aplikasi" active={view === 'banners'} onClick={() => { setView('banners'); setSidebarOpen(false); }} />
                    <NavItem icon={<Bell size={20} />} label="Notifikasi" active={view === 'notifications'} onClick={() => { setView('notifications'); setSidebarOpen(false); }} />
                    <NavItem icon={<Settings size={20} />} label="Pengaturan Point" active={view === 'loyalty-settings'} onClick={() => { setView('loyalty-settings'); setSidebarOpen(false); }} />

                    <NavItem icon={<Gift size={20} />} label="Promo & Diskon" active={view === 'promos'} onClick={() => { setView('promos'); setSidebarOpen(false); }} />
                    <NavItem icon={<TrendingUp size={20} />} label="Laporan Penjualan" active={view === 'reports'} onClick={() => { setView('reports'); setSidebarOpen(false); }} />
                    <div className="my-6 border-t border-slate-800/50"></div>
                    <NavItem icon={<Smartphone size={20} />} label="Aplikasi Mobile" active={view === 'mobile-app'} onClick={() => { setView('mobile-app'); setSidebarOpen(false); }} />
                    <NavItem icon={<Settings size={20} />} label="Sistem & Akun" active={view === 'settings'} onClick={() => { setView('settings'); setSidebarOpen(false); }} />
                </nav>

                <button onClick={handleLogout} className="mt-auto p-6 rounded-3xl bg-slate-900/50 border border-slate-800 text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all flex items-center gap-4 group">
                    <div className="p-2.5 bg-slate-950 rounded-xl group-hover:bg-red-500/10 transition-colors"><LogOut size={20} /></div>
                    <span className="text-xs font-black uppercase tracking-[0.15em]">Keluar Sistem</span>
                </button>
            </aside>

            {/* 2. Konten Utama */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#020617] relative">
                <header className="h-20 lg:h-24 px-6 lg:px-12 border-b border-slate-800/40 flex items-center justify-between bg-slate-950/20 backdrop-blur-xl z-50">
                    <div className="flex gap-4 lg:gap-10 items-center">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-12 h-12 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl text-white">
                            <Layers size={22} />
                        </button>
                        <div className="hidden sm:flex gap-4 items-center">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] pt-0.5">Status Server: <span className="text-emerald-400">Normal</span></span>
                        </div>
                        <div className="hidden lg:block h-4 w-[1px] bg-slate-800"></div>
                        <div className="flex gap-4 lg:gap-6 items-center">
                            <span className="text-sm lg:text-xl font-black text-white leading-none tracking-tighter w-18 lg:w-24">
                                {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        {/* lonceng Notifikasi */}
                        <div className="relative">
                            <button onClick={() => setView('orders')} className="w-12 h-12 flex items-center justify-center bg-slate-900/80 border border-slate-800 rounded-2xl hover:border-amber-500/50 transition-all relative group shadow-lg">
                                <Bell size={22} className="text-slate-400 group-hover:text-white transition-colors" />
                                {notifs.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-4 border-[#020617] animate-bounce"></span>}
                            </button>
                            <AnimatePresence>
                                {notifs.length > 0 && (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="absolute right-0 mt-4 w-80 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl z-[100]">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Pemberitahuan Baru</h4>
                                        <div className="space-y-3">
                                            {notifs.map(n => (
                                                <div key={n.id} className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50 hover:border-amber-500/30 transition-colors cursor-pointer" onClick={() => { setView('orders'); setNotifs(p => p.filter(x => x.id !== n.id)) }}>
                                                    <p className="text-xs font-bold text-white leading-tight">{n.msg}</p>
                                                    <p className="text-[9px] text-amber-500 font-black mt-2 uppercase tracking-tighter">Klik untuk Proses</p>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="h-10 w-[1px] bg-slate-800/60"></div>

                        {/* Profil Pengguna Terverifikasi */}
                        <div className="relative">
                            <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-4 p-2 pl-4 bg-slate-900/80 border border-slate-800 rounded-[2rem] hover:border-amber-500/40 transition-all group shadow-lg">
                                <div className="text-right hidden md:block"><p className="text-xs font-black text-white">@{userProfile?.username || 'admin'}</p><p className="text-[9px] text-amber-500 font-bold uppercase tracking-tighter">Akun Verifikasi</p></div>
                                <div className="w-11 h-11 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center font-black text-white shadow-xl group-hover:scale-105 transition-transform text-xl">
                                    {userProfile?.username ? userProfile.username.charAt(0).toUpperCase() : 'A'}
                                </div>
                            </button>
                            <AnimatePresence>
                                {showProfile && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-4 w-80 bg-slate-900 border border-slate-800 shadow-2xl rounded-[2.5rem] p-8 z-[100] overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 to-orange-600"></div>
                                        <div className="text-center mb-10">
                                            <div className="w-24 h-24 bg-slate-950 rounded-[2rem] mx-auto mb-6 flex items-center justify-center border border-slate-800 relative group overflow-hidden">
                                                <User size={48} className="text-amber-500/40 group-hover:text-amber-500 transition-colors" />
                                                <div className="absolute inset-0 bg-amber-500/5 group-hover:opacity-0 transition-opacity"></div>
                                            </div>
                                            <h4 className="text-white font-black text-lg">{userProfile?.name}</h4>
                                            <p className="text-[10px] font-black text-slate-500 uppercase mt-1 tracking-[0.2em]">{userProfile?.role} Administrator</p>
                                        </div>
                                        <div className="space-y-4">
                                            <ProfileMeta icon={<Mail size={14} />} label="Email Terdaftar" val={userProfile?.email} />
                                            <ProfileMeta icon={<Phone size={14} />} label="Nomor Telepon" val={userProfile?.phone || '+62-POS-CENTER'} />
                                            <ProfileMeta icon={<ShieldCheck size={14} />} label="Status Keamanan" val="ENKRIPSI AKTIF" />
                                        </div>
                                        <button onClick={handleLogout} className="mt-10 w-full py-5 bg-slate-950 border border-slate-800 hover:border-red-500/40 hover:text-red-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Keluar & Hapus Sesi</button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                <section className="flex-1 overflow-y-auto p-6 md:p-12 custom-scroll">
                    <div className="max-w-[1600px] mx-auto">
                        {view === 'dashboard' && <EnhancedDashboard />}
                        {view === 'orders' && <ProcessingView orders={activeOrders} onUpdate={handleUpdateStatus} onDelete={handleDeleteOrder} loading={loading} />}
                        {view === 'menu' && <InventoryView menu={fullMenu} cats={categories} onAction={setMenuModal} onDelete={(id) => {
                            if (window.confirm("Hapus menu ini secara permanen?")) {
                                menuAPI.delete(id)
                                    .then(() => refreshGlobalData())
                                    .catch(err => alert(err.response?.data?.error || "Gagal menghapus menu."));
                            }
                        }} setCatModal={() => setCatModal(true)} />}
                        {view === 'hpp' && <HPPManager />}
                        {view === 'expenses' && <ExpenseManager />}
                        {view === 'promos' && <PromoManager />}
                        {view === 'new-user-voucher' && <NewUserVoucherManager />}
                        {view === 'customer-vouchers' && <CustomerVouchersManager />}
                        {view === 'rewards' && <RewardProductManager menu={fullMenu} />}
                        {view === 'banners' && <BannerManager />}
                        {view === 'notifications' && <NotificationManager />}
                        {view === 'loyalty-settings' && <LoyaltySettingsManager />}
                        {view === 'extras' && <ExtrasManager menu={fullMenu} />}
                        {view === 'reports' && <AdvancedReportingView adv={advancedReport} brk={breakdownData} brkType={breakdownType} setBrkType={setBreakdownType} customers={customers} variants={variants} range={reportRange} setRange={setReportRange} onRefresh={refreshGlobalData} />}
                        {view === 'mobile-app' && <MobileDownloadView />}
                        {view === 'settings' && <SystemSettings user={userProfile} />}
                    </div>
                </section>

                {/* Modal-Modal Fungsional */}
                <ModalRegistry
                    menuModal={menuModal} setMenuModal={setMenuModal}
                    catModal={catModal} setCatModal={setCatModal}
                    categories={categories} refreshData={refreshGlobalData}
                />

            </main>
        </div>
    );
}

function MobileDownloadView() {
    return (
        <div className="max-w-4xl space-y-12 animate-premium lg:px-12">
            <div>
                <h2 className="text-5xl font-black italic tracking-tighter">Aplikasi Mobile</h2>
                <p className="text-xs text-slate-600 font-bold uppercase tracking-[0.3em] mt-2">Unduh POS Kasir untuk Android</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl group-hover:bg-indigo-500/20 transition-all duration-1000"></div>

                <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                    <div className="flex-1 space-y-8">
                        <div>
                            <span className="bg-indigo-500/20 text-indigo-300 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Versi Stabil 1.0.0</span>
                            <h3 className="text-4xl font-black italic mb-4">Mesin Kasir Portable</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Install aplikasi kasir di tablet atau smartphone Android Anda. Bebaskan kasir dari meja dan layani pelanggan di mana saja.
                                Dilengkapi dengan fitur Bluetooth Printer dan Scan QRIS.
                            </p>
                        </div>

                        <a href={`${window.location.origin}/downloads/KoffieePOS-v1.0.1.apk`} target="_blank" download className="inline-flex items-center gap-4 bg-indigo-600 px-10 py-6 rounded-3xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/40 group/btn">
                            <Download className="text-white group-hover/btn:scale-110 transition-transform" />
                            <div className="text-left">
                                <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">Download .APK</p>
                                <p className="text-lg font-black text-white">Unduh Sekarang</p>
                            </div>
                        </a>
                    </div>

                    <div className="w-64 h-64 bg-slate-950 rounded-[3rem] border-8 border-slate-900 shadow-2xl flex items-center justify-center relative">
                        <Smartphone size={80} className="text-slate-800" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-full bg-indigo-500/5 backdrop-blur-sm flex items-center justify-center">
                                <div className="text-center">
                                    <p className="text-4xl font-black text-white">APK</p>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1">ANDROID</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900/50 p-10 rounded-[3rem] border border-slate-800/60">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-6"><Settings size={24} /></div>
                    <h4 className="text-lg font-black text-white mb-2">Cara Install</h4>
                    <ol className="list-decimal list-inside text-sm text-slate-500 space-y-2 leading-relaxed ml-2">
                        <li>Download file APK di atas.</li>
                        <li>Buka file di HP Android Anda.</li>
                        <li>Izinkan "Install from Unknown Source" jika diminta.</li>
                        <li>Buka aplikasi dan atur IP Server di menu Setelan.</li>
                    </ol>
                </div>
                <div className="bg-slate-900/50 p-10 rounded-[3rem] border border-slate-800/60">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-6"><CheckCircle size={24} /></div>
                    <h4 className="text-lg font-black text-white mb-2">Kompatibilitas</h4>
                    <p className="text-sm text-slate-500">
                        Berjalan lancar di Android 8.0 ke atas. Disarankan menggunakan Tablet 10 inch untuk tampilan maksimal, namun tetap responsif di Smartphone.
                    </p>
                </div>
            </div>
        </div>
    )
}

// ... rest of the file (DashboardView, ProcessingView, etc. remains exactly the same as previous)

function DashboardView({ stats }) {
    const trend = (stats.revenueTrend && stats.revenueTrend.length > 0) ? stats.revenueTrend : [{ date: '', revenue: 0 }];
    const chartData = {
        labels: trend.map(d => d.date),
        datasets: [{ label: 'Pendapatan', data: trend.map(d => d.revenue), borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 5, fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 10 }]
    };

    // Format revenue trend text
    const revenueTrend = stats.revenue_trend || 0;
    const trendText = revenueTrend === 0
        ? 'Sama dengan kemarin'
        : revenueTrend > 0
            ? `↑ ${revenueTrend}% vs kemarin`
            : `↓ ${Math.abs(revenueTrend)}% vs kemarin`;
    const trendColor = revenueTrend > 0 ? 'text-emerald-500' : revenueTrend < 0 ? 'text-red-500' : 'text-slate-500';

    return (
        <div className="space-y-12 animate-premium lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="bg-slate-900 border border-slate-800/80 p-10 rounded-[3.5rem] relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-xl">
                    <div className={`w-16 h-16 bg-amber-500/10 text-amber-400 rounded-[1.5rem] flex items-center justify-center mb-10 border border-amber-500/20 shadow-inner group-hover:scale-110 transition-all`}><DollarSign /></div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total Omzet Hari Ini</p>
                    <h4 className="text-4xl font-black text-white mt-2 leading-none italic">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.sales)}</h4>
                    <div className="mt-6 pt-6 border-t border-slate-800 flex justify-between items-center group-hover:border-amber-500/20 transition-colors">
                        <p className={`text-[10px] font-bold uppercase tracking-tighter ${trendColor}`}>● {trendText}</p>
                        <ChevronDown size={14} className="text-slate-800" />
                    </div>
                </div>
                <StatusCard label="Pesanan Sukses" val={stats.orders} ic={<Package />} col="emerald" meta="Tiket yang telah selesai" />
                <StatusCard label="Meja/Node Aktif" val="03 Online" ic={<Monitor />} col="sky" meta="Sistem sinkronisasi live" />
                <StatusCard label="Indeks Keamanan" val="Aman" ic={<ShieldCheck />} col="amber" meta="Jaringan terenkripsi" />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                <div className="xl:col-span-2 bg-slate-900/40 border border-slate-800/80 p-12 rounded-[4rem] shadow-2xl flex flex-col h-[550px]">
                    <div className="flex justify-between items-center mb-16">
                        <div><h3 className="text-2xl font-black italic tracking-tight">Grafik Penjualan</h3><p className="text-xs font-bold text-slate-600 uppercase tracking-widest mt-2">Performa Operasional 7 Hari Terakhir</p></div>
                    </div>
                    <div className="flex-1 pb-10"><Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { display: false }, x: { grid: { display: false }, ticks: { color: '#475569', font: { weight: 'bold', size: 10 } } } }, plugins: { legend: { display: false } } }} /></div>
                </div>
                <div className="bg-slate-900 border border-slate-800/80 p-12 rounded-[4rem] shadow-2xl">
                    <h3 className="text-xl font-black mb-10 italic uppercase border-b border-slate-800 pb-8">Catatan Sistem</h3>
                    <div className="space-y-8">
                        <LogPulse title="Basis Data Inti" msg="Sinkronisasi cloud node berhasil" status="NOMINAL" col="emerald" />
                        <LogPulse title="Web Terminal" msg="Antarmuka publik aktif" status="TERHUBUNG" col="sky" />
                        <LogPulse title="API Keuangan" msg="Siap mengekstrak laporan" status="SIAGA" col="slate" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function ProcessingView({ orders, onUpdate, onDelete, loading }) {
    return (
        <div className="space-y-12 lg:px-12">
            <div className="flex justify-between items-center">
                <div><h2 className="text-5xl font-black italic tracking-tighter">Riwayat Pesanan</h2><p className="text-xs text-slate-600 font-bold uppercase tracking-[0.3em] mt-2">Log seluruh transaksi masuk & status terkini</p></div>
                <div className="px-8 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-500 uppercase flex items-center gap-3"><Monitor size={14} /> Sinkronisasi Real-time</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-[4rem] overflow-hidden shadow-2xl backdrop-blur-md">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-black/40 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                            <th className="p-10">Waktu & ID</th>
                            <th className="p-10">Daftar Menu</th>
                            <th className="p-10">Total</th>
                            <th className="p-10 text-center">Status</th>
                            <th className="p-10 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                        {orders.length === 0 ? (
                            <tr><td colSpan="5" className="p-32 text-center text-slate-700 italic font-black uppercase tracking-widest">Belum Ada Riwayat Pesanan</td></tr>
                        ) : orders.map(o => (
                            <tr key={o.id} className={`group hover:bg-amber-500/[0.03] transition-all ${o.status === 'cancelled' ? 'opacity-50 grayscale' : ''}`}>
                                <td className="p-12">
                                    <p className="text-sm font-black text-white mb-1">
                                        {new Date(o.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                    </p>
                                    <p className="font-mono text-[9px] text-amber-500 font-black italic tracking-widest mb-2">#{o.order_number}</p>
                                    <div className="flex gap-2 items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest"><MapPin size={10} /> {o.order_type}</div>
                                </td>
                                <td className="p-12 max-w-[300px]">
                                    <p className="text-lg font-black text-white group-hover:text-amber-400 transition-colors truncate">{o.customer_name || 'Pelanggan Walk-in'}</p>
                                    {o.address && (
                                        <p className="text-[10px] text-amber-500/80 font-bold uppercase mt-1 leading-relaxed">
                                            {o.address}
                                        </p>
                                    )}
                                    <div className="mt-3 space-y-1 border-t border-slate-800/50 pt-3">
                                        {o.items?.map((it, idx) => {
                                            let extras = [];
                                            try {
                                                const parsed = typeof it.extras === 'string' ? JSON.parse(it.extras) : (it.extras || []);
                                                extras = Array.isArray(parsed) ? parsed : [];
                                            } catch (e) { extras = []; }

                                            return (
                                                <div key={idx} className="mb-1">
                                                    <p className="text-[10px] text-slate-400 font-medium">
                                                        <span className="text-amber-500/70 font-black">×{it.quantity}</span> {it.menu_item_name}
                                                    </p>
                                                    {extras.length > 0 && (
                                                        <p className="text-[9px] text-slate-600 pl-4">+ {extras.map(e => e.name).join(', ')}</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </td>
                                <td className="p-12">
                                    <p className="text-2xl font-black text-white">
                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(o.total)}
                                    </p>
                                    <p className="text-[10px] text-slate-600 font-black uppercase mt-2 tracking-widest">Metode: {o.payment_method}</p>
                                </td>
                                <td className="p-12 text-center">
                                    <span className={`px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-lg ${o.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                        o.status === 'cancelled' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' :
                                            o.status === 'unpaid' ? 'bg-slate-500/10 border-slate-500/30 text-slate-400' :
                                                'bg-orange-500/10 border-orange-500/30 text-orange-500'
                                        }`}>
                                        {o.status === 'unpaid' ? 'BELUM BAYAR' : o.status === 'pending' ? 'MENUNGGU' : o.status === 'completed' ? 'SELESAI' : 'BATAL'}
                                    </span>
                                </td>
                                <td className="p-12 text-right">
                                    <div className="flex gap-3 justify-end items-center">
                                        {o.status === 'pending' && (
                                            <button onClick={() => onUpdate(o.id, 'completed')} disabled={loading} className="p-5 bg-emerald-600 rounded-3xl text-white hover:bg-emerald-500 shadow-2xl shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50">
                                                {loading ? <Loader2 className="animate-spin" /> : <CheckCircle size={24} />}
                                            </button>
                                        )}
                                        {o.status !== 'cancelled' && (
                                            <button
                                                onClick={() => onDelete(o.id, o.order_number)}
                                                disabled={loading}
                                                className="p-5 bg-red-600/10 border border-red-600/20 rounded-3xl text-red-500 hover:bg-red-600 hover:text-white shadow-lg hover:shadow-red-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                                title="Batalkan Pesanan (Audit)"
                                            >
                                                <Trash2 size={24} />
                                            </button>
                                        )}
                                        {o.status === 'cancelled' && (
                                            <div className="w-14 h-14 bg-slate-950/50 rounded-3xl border border-slate-800 flex items-center justify-center text-slate-700 italic text-[10px]">BATAL</div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function InventoryView({ menu, cats, onAction, onDelete, setCatModal }) {
    return (
        <div className="space-y-14">
            <div className="flex justify-between items-center px-4">
                <div><h2 className="text-5xl font-black italic tracking-tighter">Daftar Produk</h2><p className="text-xs text-slate-600 font-bold uppercase tracking-[0.3em] mt-2">Kelola menu, harga, dan ketersediaan stok</p></div>
                <div className="flex gap-6">
                    <button onClick={setCatModal} className="px-10 py-5 rounded-[2rem] bg-slate-900 border border-slate-800 font-black text-[10px] uppercase tracking-widest hover:border-amber-500 hover:text-amber-500 transition-all shadow-xl">Atur Kategori</button>
                    <button onClick={() => onAction({ mode: 'create' })} className="px-10 py-5 rounded-[2rem] bg-amber-600 font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 shadow-2xl shadow-amber-600/30 transition-all flex items-center gap-4 group"><Plus size={18} className="group-hover:rotate-90 transition-transform" />Menu Baru</button>
                </div>
            </div>
            {cats.length === 0 && (
                <div className="p-10 bg-amber-500/10 border border-amber-500/20 rounded-[3rem] flex items-center gap-6 animate-pulse">
                    <Info className="text-amber-500" size={32} />
                    <div>
                        <p className="text-white font-black">PENTING: Kategori Kosong</p>
                        <p className="text-xs text-slate-400 mt-1">Anda harus membuat minimal satu Kategori dulu sebelum bisa menambah menu produk.</p>
                        <button onClick={setCatModal} className="mt-4 text-[10px] font-black uppercase text-amber-500 hover:underline tracking-widest">Klik Disini untuk Buat Kategori Pertama →</button>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
                {menu.map(m => (
                    <div key={m.id} className="bg-slate-900/60 border border-slate-800/80 rounded-[3.5rem] p-4 group relative overflow-hidden flex flex-col h-[520px] hover:border-amber-500/30 transition-all shadow-2xl">
                        {/* Kontainer Gambar - TANPA OVERLAP */}
                        <div className="w-full aspect-[4/5] bg-slate-950 rounded-[3rem] overflow-hidden border border-slate-800 relative group-hover:scale-[1.02] transition-transform duration-700">
                            {m.image_url ? (
                                <img src={m.image_url} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-8xl opacity-40 grayscale">{m.emoji}</div>
                            )}
                            {/* Kontrol di Tengah saat Hover */}
                            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-6">
                                <button onClick={() => onAction({ mode: 'edit', item: m })} className="w-16 h-16 bg-white text-black rounded-3xl flex items-center justify-center hover:scale-110 hover:shadow-2xl transition-all"><Edit size={24} /></button>
                                <button onClick={() => onDelete(m.id)} className="w-16 h-16 bg-red-600 text-white rounded-3xl flex items-center justify-center hover:scale-110 hover:shadow-2xl transition-all"><Trash2 size={24} /></button>
                            </div>
                            {!m.is_available && <div className="absolute top-8 right-8 bg-red-600 px-4 py-1.5 rounded-full text-[8px] font-black uppercase text-white shadow-xl">HABIS</div>}
                        </div>

                        <div className="p-8 pt-10">
                            <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em] mb-2">{m.category_name}</p>
                            <h4 className="text-xl font-black text-white uppercase tracking-tight truncate leading-none">{m.name}</h4>
                            <div className="flex justify-between items-center mt-8 pt-8 border-t border-slate-800/60">
                                <span className="text-xl font-black text-white italic tracking-tighter">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(m.price)}</span>
                                <div className={`w-3 h-3 rounded-full ${m.is_available ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-red-500'} animate-pulse`}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function AdvancedReportingView({ adv, brk, brkType, setBrkType, customers, variants, range, setRange, onRefresh }) {
    const [subTab, setSubTab] = useState('summary');
    if (!adv) return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <Loader2 className="animate-spin text-amber-500 mb-6" size={48} />
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Mengkalkulasi Audit Bisnis...</h2>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-4">Mohon tunggu sebentar, data sedang ditarik dari server</p>
        </div>
    );

    const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

    return (
        <div className="space-y-10 lg:px-4 animate-premium pb-20">
            {/* Header & Date Picker */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end bg-slate-950/40 p-10 rounded-[3rem] border border-slate-800/60 shadow-2xl gap-8">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter">Laporan Penjualan</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-2">Data Real-time & Analisis Penjualan Lanjutan</p>
                </div>
                <div className="flex flex-wrap gap-4 bg-slate-950 p-2 rounded-3xl border border-slate-800">
                    <PremiumDatePicker
                        value={range.start}
                        onChange={val => setRange({ ...range, start: val })}
                        label="Dari Tanggal"
                    />
                    <div className="w-[1px] h-6 bg-slate-800 self-center"></div>
                    <PremiumDatePicker
                        value={range.end}
                        onChange={val => setRange({ ...range, end: val })}
                        label="Sampai Tanggal"
                    />
                    <button onClick={onRefresh} className="p-4 bg-amber-600 rounded-2xl hover:bg-amber-500 transition-all text-white"><Filter size={18} /></button>
                </div>
            </div>

            {/* Sub-Tabs Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                {[
                    { id: 'summary', label: 'Ringkasan', icon: <TrendingUp size={16} /> },
                    { id: 'time', label: 'Periode Waktu', icon: <Clock size={16} /> },
                    { id: 'items', label: 'Produk & Kategori', icon: <Tag size={16} /> },
                    { id: 'operational', label: 'Kasir & Bayar', icon: <User size={16} /> },
                    { id: 'customers', label: 'Loyalitas', icon: <Smartphone size={16} /> },
                    { id: 'audit', label: 'Audit & Batal', icon: <Info size={16} /> }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setSubTab(t.id)}
                        className={`flex items-center gap-3 px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap shadow-xl ${subTab === t.id ? 'bg-amber-600 text-white shadow-amber-900/20' : 'bg-slate-900/50 text-slate-500 border border-slate-800/50 hover:text-slate-300'}`}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={subTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {subTab === 'summary' && (
                        <div className="space-y-10">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                <AccStat label="Total Transaksi" val={adv.summary.total_orders} ic={<Package />} col="amber" />
                                <AccStat label="Rata-rata (AOV)" val={formatIDR(adv.summary.aov)} ic={<DollarSign />} col="emerald" />
                                <AccStat label="Total Omzet" val={formatIDR(adv.summary.gross_sales)} ic={<TrendingUp />} col="amber" />
                                <AccStat label="Potongan Diskon" val={formatIDR(adv.summary.total_discount)} ic={<Tag />} col="orange" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] p-10 flex flex-col items-center">
                                    <h3 className="font-black italic uppercase text-sm tracking-widest mb-10 text-center w-full">Metode Bayar</h3>
                                    <div className="w-full h-[200px] flex items-center justify-center">
                                        <Doughnut
                                            data={{
                                                labels: adv.paymentMethods.map(p => p.payment_method.toUpperCase()),
                                                datasets: [{
                                                    data: adv.paymentMethods.map(p => p.revenue),
                                                    backgroundColor: ['#f59e0b', '#10b981', '#6366f1', '#ec4899'],
                                                    borderWidth: 0
                                                }]
                                            }}
                                            options={{ plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10, weight: '900' } } } }, cutout: '70%', maintainAspectRatio: false }}
                                        />
                                    </div>
                                </div>

                                <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] p-10 flex flex-col items-center">
                                    <h3 className="font-black italic uppercase text-sm tracking-widest mb-10 text-center w-full">Tipe Pesanan</h3>
                                    <div className="w-full h-[200px] flex items-center justify-center">
                                        <Doughnut
                                            data={{
                                                labels: adv.orderTypes.map(p => (p.order_type || 'offline').toUpperCase()),
                                                datasets: [{
                                                    data: adv.orderTypes.map(p => p.revenue),
                                                    backgroundColor: ['#06b6d4', '#8b5cf6', '#f43f5e', '#10b981'],
                                                    borderWidth: 0
                                                }]
                                            }}
                                            options={{ plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10, weight: '900' } } } }, cutout: '70%', maintainAspectRatio: false }}
                                        />
                                    </div>
                                </div>

                                <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] p-10 flex flex-col">
                                    <h3 className="font-black italic uppercase text-sm tracking-widest mb-10">Performa Margin</h3>
                                    <div className="grid grid-cols-1 gap-6 flex-1 justify-center">
                                        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800">
                                            <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Margin Kotor</p>
                                            <p className="text-3xl font-black text-white">{adv.summary.gross_margin}%</p>
                                        </div>
                                        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800">
                                            <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Margin Bersih</p>
                                            <p className="text-3xl font-black text-emerald-500">{adv.summary.net_margin}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {subTab === 'time' && (
                        <div className="space-y-10">
                            <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] p-12 h-[600px] flex flex-col">
                                <div className="flex justify-between items-center mb-10">
                                    <div>
                                        <h3 className="font-black italic uppercase text-xl tracking-widest">Alur Penjualan Periodik</h3>
                                        <p className="text-xs text-slate-500 font-bold mt-2">Visualisasi pendapatan berdasarkan rentang waktu terpilih</p>
                                    </div>
                                    <div className="flex bg-slate-950 p-2 rounded-2xl border border-slate-800">
                                        {[
                                            { id: 'hourly', label: 'JAM' },
                                            { id: 'daily', label: 'HARI' },
                                            { id: 'monthly', label: 'BULAN' }
                                        ].map(b => (
                                            <button
                                                key={b.id}
                                                onClick={() => setBrkType(b.id)}
                                                className={`px-6 py-3 rounded-xl text-[10px] font-black transition-all ${brkType === b.id ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                            >
                                                {b.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-1 min-h-0 bg-slate-950/20 rounded-[2rem] p-8 border border-slate-800/30">
                                    <Line
                                        data={{
                                            labels: brk.map(b => b.label),
                                            datasets: [{
                                                label: 'Pendapatan (Rp)',
                                                data: brk.map(b => b.revenue),
                                                borderColor: '#f59e0b',
                                                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                                fill: true,
                                                tension: 0.4,
                                                pointBackgroundColor: '#f59e0b',
                                                pointRadius: 4
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: false } },
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    grid: { color: 'rgba(255,255,255,0.03)' },
                                                    ticks: { color: '#475569', font: { size: 10, weight: 'bold' } }
                                                },
                                                x: {
                                                    grid: { display: false },
                                                    ticks: { color: '#475569', font: { size: 10, weight: 'bold' } }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800/50">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Periode</p>
                                    <p className="text-2xl font-black text-white">{brk.length} Titik Data</p>
                                </div>
                                <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800/50">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Puncak Tertinggi</p>
                                    <p className="text-2xl font-black text-amber-500">Rp {Math.max(...(brk.map(b => b.revenue) || [0])).toLocaleString()}</p>
                                </div>
                                <div className="bg-slate-900/40 p-8 rounded-3xl border border-slate-800/50">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Rata-rata Pendapatan</p>
                                    <p className="text-2xl font-black text-emerald-500">Rp {Math.round(brk.reduce((a, b) => a + b.revenue, 0) / (brk.length || 1)).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {subTab === 'items' && (
                        <div className="space-y-10">
                            {/* Categories Breakdown */}
                            <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] p-10 overflow-hidden">
                                <h3 className="font-black italic uppercase text-sm tracking-widest mb-10">Performa Kategori</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                    {(adv.categories || []).map(c => (
                                        <div key={c.name} className="bg-slate-950 border border-slate-800 p-8 rounded-3xl hover:border-amber-500/40 transition-all">
                                            <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Volume: {c.volume}</p>
                                            <h4 className="font-black text-white uppercase text-sm mb-2">{c.name}</h4>
                                            <p className="text-xl font-black text-amber-500 italic">{formatIDR(c.revenue)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Product Breakdown (NEW) */}
                            <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] overflow-hidden">
                                <div className="p-10 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
                                    <h3 className="font-black italic uppercase text-sm tracking-widest">Detail Penjualan Per Produk</h3>
                                    <span className="px-5 py-2 bg-amber-600/10 text-amber-500 rounded-xl text-[10px] font-black border border-amber-600/20">TOTAL {(adv.products || []).length} PRODUK</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-950/60 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-800">
                                            <tr>
                                                <th className="p-8">Nama Produk</th>
                                                <th className="p-8 text-center">Volume</th>
                                                <th className="p-8 text-right">Total Pendapatan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/40">
                                            {(adv.products || []).map((p, i) => (
                                                <tr key={i} className="hover:bg-slate-800/20 transition-all">
                                                    <td className="p-8 font-bold text-white uppercase text-xs">{p.name}</td>
                                                    <td className="p-8 text-center text-xs font-black text-slate-400">{p.volume}x</td>
                                                    <td className="p-8 text-right font-black text-amber-500 italic">{formatIDR(p.revenue)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Variant Analysis */}
                            <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] p-10">
                                <h3 className="font-black italic uppercase text-sm tracking-widest mb-10">Varian & Opsi Ekstra</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {(variants || []).map(v => (
                                        <div key={v.variant_name} className="flex justify-between items-center bg-slate-950 p-6 rounded-2xl border border-slate-800">
                                            <div>
                                                <p className="text-white font-bold">{v.variant_name}</p>
                                                <p className="text-[10px] text-slate-500">{v.count}x terjual</p>
                                            </div>
                                            <p className="font-black text-amber-500">{formatIDR(v.revenue)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {subTab === 'operational' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] p-10">
                                <h3 className="font-black italic uppercase text-sm tracking-widest mb-10">Kontribusi Staff (Kasir)</h3>
                                <div className="space-y-4">
                                    {adv.cashiers.map(c => (
                                        <div key={c.name} className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex justify-between items-center group hover:bg-amber-600/5 transition-all">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center font-black group-hover:text-amber-500 text-slate-400 border border-slate-800 transition-colors uppercase">{c.name.substring(0, 2)}</div>
                                                <div><h4 className="font-black text-white text-lg">{c.name}</h4><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{c.orders} Pesanan Diproses</p></div>
                                            </div>
                                            <p className="text-xl font-black text-amber-500">{formatIDR(c.revenue)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] p-10">
                                <h3 className="font-black italic uppercase text-sm tracking-widest mb-10">Faktur Pembayaran</h3>
                                <div className="space-y-4">
                                    {adv.paymentMethods.map(p => (
                                        <div key={p.payment_method} className="bg-slate-950 p-6 rounded-3xl border border-slate-800">
                                            <div className="flex justify-between items-center mb-4"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{p.payment_method}</span><span className="px-3 py-1 bg-amber-600/10 text-amber-500 rounded-lg text-[10px] font-black">{p.count} Transaksi</span></div>
                                            <p className="text-3xl font-black text-white italic tracking-tighter">{formatIDR(p.revenue)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {subTab === 'customers' && (
                        <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] overflow-hidden">
                            <div className="p-10 flex justify-between items-center"><h3 className="font-black italic uppercase text-sm tracking-widest">Database Pelanggan Lanjutan</h3><button className="text-[10px] font-black text-slate-500 uppercase border border-slate-800 px-6 py-3 rounded-xl hover:text-white hover:border-amber-500 transition-all">Export Segmentasi</button></div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-500 tracking-widest border-y border-slate-800"><tr className="divide-x divide-slate-800/40"><th className="p-10">Nama Pelanggan</th><th className="p-10">Kunjungan</th><th className="p-10">Total Belanja</th><th className="p-10">Kunjungan Terakhir</th></tr></thead>
                                <tbody className="divide-y divide-slate-800/40">
                                    {customers.map((c, i) => (
                                        <tr key={i} className="hover:bg-slate-800/30">
                                            <td className="p-10 font-bold text-white uppercase text-xs">{c.customer_name}</td>
                                            <td className="p-10 text-xs font-black text-slate-400">{c.visit_count} Kali</td>
                                            <td className="p-10 font-black text-amber-500 italic">{formatIDR(c.total_spent)}</td>
                                            <td className="p-10 text-xs font-bold text-slate-500">{new Date(c.last_visit).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {subTab === 'audit' && (
                        <div className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-red-500/5 border border-red-500/20 rounded-[3rem] p-10"><h4 className="text-red-500 font-black uppercase text-[10px] tracking-widest mb-2">Peringatan Audit</h4><p className="text-white text-lg font-bold">Ditemukan {adv.voids.length} Percobaan Pembatalan (Void) pada masa audit ini.</p></div>
                                <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] p-10 flex items-center justify-between"><div><h4 className="text-slate-500 font-black uppercase text-[10px] tracking-widest mb-2">Potensi Kerugian</h4><p className="text-white text-3xl font-black italic">{formatIDR(adv.voids.reduce((a, b) => a + b.total, 0))}</p></div><Info size={40} className="text-slate-700" /></div>
                            </div>
                            <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-black/30 text-[10px] font-black uppercase text-slate-500 tracking-widest border-y border-slate-800"><tr><th className="p-10">Nomor Nota</th><th className="p-10">Pelanggan</th><th className="p-10 text-center">Nominal</th><th className="p-10">Alasan Void</th></tr></thead>
                                    <tbody className="divide-y divide-slate-800/40">
                                        {adv.voids.map((v, i) => (
                                            <tr key={i} className="hover:bg-red-500/5 transition-all">
                                                <td className="p-10 font-mono text-red-400 text-xs">{v.order_number}</td>
                                                <td className="p-10 text-xs font-bold text-slate-400">{v.customer_name}</td>
                                                <td className="p-10 text-center font-black text-slate-200">{formatIDR(v.total)}</td>
                                                <td className="p-10 italic text-xs text-red-500/70">{v.void_reason || 'Kesalahan Input / Batal'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function SystemSettings({ user }) {
    return (
        <div className="max-w-4xl space-y-12 animate-premium lg:px-12">
            <div><h2 className="text-5xl font-black italic tracking-tighter">Pengaturan Sistem</h2><p className="text-xs text-slate-600 font-bold uppercase tracking-[0.3em] mt-2">Parameter perizinan & modul perangkat</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-slate-900 border border-slate-800 p-12 rounded-[3.5rem] shadow-2xl space-y-8">
                    <h3 className="text-xl font-black italic uppercase border-b border-slate-800 pb-6">Izin Akses Akun</h3>
                    <ul className="space-y-6">
                        <li className="flex justify-between text-xs font-bold"><span className="text-slate-500">Edit Harga Pesanan</span><span className="text-emerald-500">AKTIF</span></li>
                        <li className="flex justify-between text-xs font-bold"><span className="text-slate-500">Ubah Stok Menu</span><span className="text-emerald-500">AKTIF</span></li>
                        <li className="flex justify-between text-xs font-bold"><span className="text-slate-500">Buka Laporan Keuangan</span><span className="text-emerald-500">AKTIF</span></li>
                        <li className="flex justify-between text-xs font-bold"><span className="text-slate-500">Manajemen Server Inti</span><span className="text-red-500 font-black">TERKUNCI</span></li>
                    </ul>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-12 rounded-[3.5rem] shadow-2xl flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-amber-600/10 rounded-[2rem] flex items-center justify-center mb-8 border border-amber-500/20"><Database size={40} className="text-amber-500" /></div>
                    <h4 className="text-white font-black text-lg">Penyimpanan Lokal</h4>
                    <p className="text-xs text-slate-500 mt-2">Sinkronisasi 1,240 baris data</p>
                    <button className="mt-8 px-10 py-5 bg-amber-600 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all">Bersihkan Cache</button>
                </div>
            </div>
        </div>
    )
}

// --- Komponen Atom & Modal ---

function NavItem({ icon, label, active, onClick }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center gap-6 p-6 rounded-[2rem] transition-all group relative border border-transparent ${active ? 'bg-amber-600 text-white font-black shadow-2xl shadow-amber-600/30' : 'text-slate-500 hover:bg-slate-900/60 hover:text-slate-300 hover:border-slate-800'}`}>
            <div className={`transition-all duration-500 ${active ? 'text-white scale-110' : 'text-slate-600 group-hover:text-amber-400 group-hover:scale-110'}`}>{icon}</div>
            <span className="text-[12px] tracking-[0.15em] uppercase font-black">{label}</span>
            {active && <motion.div layoutId="nav-glow-pro" className="absolute left-[-2px] w-1.5 h-10 bg-white rounded-r-full shadow-[0_0_25px_white]"></motion.div>}
        </button>
    );
}

function StatusCard({ label, val, ic, col, meta }) {
    return (
        <div className="bg-slate-900 border border-slate-800/80 p-10 rounded-[3.5rem] relative overflow-hidden group hover:border-amber-500/40 transition-all shadow-xl">
            <div className={`w-16 h-16 bg-${col}-500/10 text-${col}-400 rounded-[1.5rem] flex items-center justify-center mb-10 border border-${col}-500/20 shadow-inner group-hover:scale-110 transition-all`}>{ic}</div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
            <h4 className="text-4xl font-black text-white mt-2 leading-none italic">{val}</h4>
            <div className="mt-6 pt-6 border-t border-slate-800 flex justify-between items-center group-hover:border-amber-500/20 transition-colors">
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">● {meta}</p>
                <ChevronDown size={14} className="text-slate-800" />
            </div>
        </div>
    )
}

function AccStat({ label, val, ic, col }) {
    return (
        <div className="bg-slate-900/50 border border-slate-800/60 p-10 rounded-[3rem] relative group hover:border-amber-500/30 transition-all">
            <div className={`text-${col}-500 mb-6 group-hover:scale-110 transition-transform`}>{ic}</div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{label}</p>
            <h5 className={`text-2xl font-black text-white group-hover:text-${col}-400 transition-colors`}>{val}</h5>
        </div>
    )
}

function LogPulse({ title, msg, status, col }) {
    return (
        <div className="flex justify-between items-center p-6 bg-slate-950/50 rounded-3xl border border-slate-800/40 hover:border-amber-500/20 transition-colors group">
            <div><p className="text-xs font-black text-white group-hover:text-amber-400 transition-colors">{title}</p><p className="text-[9px] text-slate-600 font-bold mt-1 uppercase tracking-widest">{msg}</p></div>
            <div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full bg-${col}-500 ${status !== 'IDLE' ? 'animate-pulse' : ''}`}></div><span className={`text-[10px] font-black text-${col}-500`}>{status}</span></div>
        </div>
    )
}

function ProfileMeta({ icon, label, val }) {
    return (
        <div className="flex gap-4 items-center bg-slate-950/80 p-5 rounded-[1.5rem] border border-slate-800/60 hover:border-amber-500/30 transition-colors">
            <div className="text-amber-500">{icon}</div>
            <div><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{label}</p><p className="text-[11px] font-black text-slate-200 mt-1">{val}</p></div>
        </div>
    )
}
function ModalRegistry({ menuModal, setMenuModal, catModal, setCatModal, categories, refreshData }) {
    const [preview, setPreview] = React.useState(null);
    const [hppType, setHppType] = React.useState('manual');
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => {
        if (!menuModal) {
            setPreview(null);
            setHppType('manual');
            setSubmitting(false);
        } else {
            setHppType(menuModal.item?.hpp_type || 'manual');
        }
    }, [menuModal]);

    return (
        <AnimatePresence>
            {(menuModal || catModal) && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-slate-950/90 backdrop-blur-3xl overflow-y-auto">
                    {menuModal && (
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 shadow-2xl relative overflow-hidden my-auto">
                            {submitting && (
                                <div className="absolute inset-0 z-[210] bg-slate-950/60 backdrop-blur-md flex flex-col items-center justify-center">
                                    <Loader2 className="animate-spin text-amber-500 mb-4" size={48} />
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Menyimpan Data...</p>
                                </div>
                            )}
                            <div className="flex justify-between items-center mb-8 md:mb-14">
                                <h2 className="text-2xl md:text-4xl font-black italic tracking-tighter">{menuModal.mode === 'create' ? 'Tambah Data Menu' : 'Ubah Data Menu'}</h2>
                                <button onClick={() => setMenuModal(null)} className="w-10 h-10 md:w-14 md:h-14 rounded-2xl md:rounded-3xl bg-slate-800 flex items-center justify-center hover:bg-red-500/20 text-white transition-all"><XCircle /></button>
                            </div>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                setSubmitting(true);
                                try {
                                    const fd = new FormData(e.target);
                                    // FORCE ROUNDING DI FRONTEND UNTUK CEGAH -1 RUPIAH
                                    const rawPrice = fd.get('price');
                                    const rawHpp = fd.get('hpp');
                                    if (rawPrice) fd.set('price', Math.round(Number(rawPrice)));
                                    if (rawHpp) fd.set('hpp', Math.round(Number(rawHpp)));

                                    if (menuModal.mode === 'create') await menuAPI.create(fd);
                                    else await menuAPI.update(menuModal.item.id, fd);
                                    setMenuModal(null);
                                    refreshData();
                                } catch (err) {
                                    console.error(err);
                                    alert("Gagal menyimpan data menu: " + (err.response?.data?.error || err.message));
                                } finally {
                                    setSubmitting(false);
                                }
                            }} className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                                <div className="md:col-span-2 space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-6">Nama Menu Lengkap</label>
                                    <input name="name" defaultValue={menuModal.item?.name} placeholder="Contoh: Kopi Susu Aren" className="w-full bg-slate-950 border border-slate-800 rounded-2xl md:rounded-3xl p-5 md:p-7 text-white font-black text-sm focus:ring-4 ring-amber-500/20 transition-all outline-none" required />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-6">Pilih Kategori</label>
                                    <select name="category_id" defaultValue={menuModal.item?.category_id} className="w-full bg-slate-950 border border-slate-800 rounded-2xl md:rounded-3xl p-5 md:p-7 text-white font-black text-sm focus:ring-4 ring-amber-500/20 transition-all outline-none appearance-none cursor-pointer">
                                        {categories.length === 0 ? <option disabled>Harap buat kategori dulu</option> : categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-6">Harga Jual (Rp)</label>
                                    <input name="price" type="number" defaultValue={menuModal.item?.price} placeholder="25000" className="w-full bg-slate-950 border border-slate-800 rounded-2xl md:rounded-3xl p-5 md:p-7 text-amber-500 font-black text-xl outline-none" required />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center ml-6">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">HPP Estimasi (Rp)</label>
                                        {hppType === 'recipe' && (
                                            <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-md font-black uppercase tracking-widest">Recipe Linked</span>
                                        )}
                                    </div>
                                    <input
                                        name="hpp"
                                        type="number"
                                        defaultValue={menuModal.item?.hpp}
                                        placeholder="10000"
                                        onChange={() => setHppType('manual')}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl md:rounded-3xl p-5 md:p-7 text-emerald-500 font-black text-xl outline-none"
                                    />
                                    <p className="text-[9px] text-slate-600 font-bold ml-6 uppercase">
                                        {hppType === 'recipe'
                                            ? 'Link Resep Aktif. Jika nominal diubah manual, sistem akan memutus link resep.'
                                            : 'Masukkan modal manual jika tidak menggunakan fitur resep otomatis.'}
                                    </p>
                                    <input type="hidden" name="hpp_type" value={hppType} />
                                </div>
                                <div className="md:col-span-2 space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-6">Status Ketersediaan</label>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <label className="flex-1 cursor-pointer">
                                            <input type="radio" name="is_available" value="1" defaultChecked={menuModal.mode === 'create' || menuModal.item?.is_available === 1} className="hidden peer" />
                                            <div className="p-5 md:p-6 bg-slate-950 border border-slate-800 rounded-2xl md:rounded-3xl text-center font-black text-[10px] uppercase tracking-widest peer-checked:bg-emerald-600 peer-checked:border-emerald-500 transition-all">Tersedia / Aktif</div>
                                        </label>
                                        <label className="flex-1 cursor-pointer">
                                            <input type="radio" name="is_available" value="0" defaultChecked={menuModal.item?.is_available === 0} className="hidden peer" />
                                            <div className="p-5 md:p-6 bg-slate-950 border border-slate-800 rounded-2xl md:rounded-3xl text-center font-black text-[10px] uppercase tracking-widest peer-checked:bg-red-600 peer-checked:border-red-500 transition-all">Habis / Matikan</div>
                                        </label>
                                    </div>
                                </div>
                                <div className="md:col-span-2 space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-6">Unggah Foto Menu</label>
                                    <label className="h-40 md:h-56 w-full bg-slate-950 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-slate-800 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-amber-500/5 transition-all overflow-hidden relative group shadow-inner">
                                        <input
                                            type="file"
                                            name="image"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    if (file.size > 2 * 1024 * 1024) {
                                                        alert("Ukuran file terlalu besar! Maksimal adalah 2MB.");
                                                        e.target.value = "";
                                                        setPreview(null);
                                                        return;
                                                    }
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setPreview(reader.result);
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                        <Camera size={24} className="md:size-32 text-slate-700 mb-3 group-hover:text-amber-500 group-hover:animate-bounce" />
                                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Pilih Gambar (Max 2MB)</p>
                                        {(preview || menuModal.item?.image_url) && (
                                            <img
                                                src={preview || menuModal.item.image_url}
                                                className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none group-hover:opacity-20 transition-opacity"
                                            />
                                        )}
                                    </label>
                                </div>
                                <div className="md:col-span-2 pt-4 md:pt-6">
                                    <button type="submit" className="w-full bg-amber-600 py-6 md:py-8 rounded-[2rem] md:rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] hover:bg-amber-500 shadow-2xl shadow-amber-600/30 transition-all hover:scale-[1.02] active:scale-95">Simpan Data Menu</button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {catModal && (
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 shadow-2xl relative overflow-hidden my-auto">
                            <div className="flex justify-between items-center mb-8 md:mb-12"><h3 className="text-2xl md:text-3xl font-black italic tracking-tighter">Pengelola Kategori</h3><button onClick={() => setCatModal(false)} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-red-500/20 transition-all"><XCircle /></button></div>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                await menuAPI.createCategory({ name: e.target.name.value, emoji: e.target.emoji.value });
                                refreshData(); e.target.reset();
                            }} className="space-y-6 md:space-y-8">
                                <input name="name" placeholder="Nama Kategori (Contoh: Makanan)" className="w-full bg-slate-950 border border-slate-800 rounded-2xl md:rounded-3xl p-5 md:p-7 text-white font-black text-sm outline-none" required />
                                <input name="emoji" placeholder="Ikon/Emoji (Contoh: 🍛)" className="w-full bg-slate-950 border border-slate-800 rounded-2xl md:rounded-3xl p-5 md:p-7 text-white font-black text-sm outline-none" required />
                                <button className="w-full bg-emerald-600 py-5 md:py-6 rounded-2xl md:rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 shadow-2xl shadow-emerald-600/20">Tambah Kategori Baru</button>
                            </form>
                            <div className="mt-8 md:mt-12 pt-8 md:pt-10 border-t border-slate-800 space-y-4 max-h-[200px] md:max-h-[300px] overflow-y-auto no-scrollbar">
                                {categories.map(c => (
                                    <div key={c.id} className="flex justify-between items-center bg-slate-950/80 p-4 md:p-5 rounded-2xl md:rounded-3xl border border-slate-800 group hover:border-amber-500/30 transition-all">
                                        <span className="text-xs font-black text-white">{c.emoji} {c.name}</span>
                                        <button onClick={async () => { await menuAPI.deleteCategory(c.id); refreshData(); }} className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-red-950/30 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </AnimatePresence>
    );
}

function LoadingScreen({ message }) {
    return (
        <div className="fixed inset-0 z-[500] bg-[#020617] flex flex-col items-center justify-center text-center p-12 overflow-hidden">
            <div className="relative mb-14">
                <div className="w-36 h-36 bg-amber-600/5 rounded-full blur-3xl absolute animate-pulse"></div>
                <div className="w-32 h-32 bg-slate-900 border border-amber-500/20 rounded-[3rem] flex items-center justify-center shadow-2xl relative">
                    <Loader2 className="animate-spin text-amber-500" size={64} />
                </div>
            </div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">{message}</h2>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.8em] animate-pulse mt-6">Protokol Keamanan Aktif</p>
        </div>
    );
}

function AuthFlow({ authState, setAuthState, onSuccess, loading, setLoading }) {
    const [pendingUser, setPendingUser] = useState(null);
    const [regData, setRegData] = useState({});

    const handlePrimary = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            if (authState === 'login') {
                const r = await authAPI.login({ username: e.target.u.value, password: e.target.p.value });
                // Check verification but allow auto-fix or simplified login
                if (r.data.user.is_verified === 0) {
                    // Legacy support if unverified accounts exist, but new ones are auto-verified
                    alert("Akun lama belum verifikasi. Hubungi admin.");
                } else {
                    localStorage.setItem('admin_token', r.data.token);
                    onSuccess(r.data.token);
                }
            } else if (authState === 'register') {
                const d = { name: e.target.n.value, username: e.target.u.value, email: e.target.e.value, phone: e.target.ph.value, password: e.target.p.value };
                // Register now returns token directly (auto-login)
                const regRes = await authAPI.register(d);

                if (regRes.data.token) {
                    localStorage.setItem('admin_token', regRes.data.token);
                    alert("Registrasi Berhasil! Selamat Datang.");
                    onSuccess(regRes.data.token);
                } else {
                    setAuthState('login');
                    alert("Registrasi Berhasil. Silakan Login.");
                }
            }
        } catch (e) {
            console.error(e);
            alert(e.response?.data?.error || "Akses Ditolak");
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 md:p-12 overflow-hidden relative selection:bg-amber-500 selection:text-white">
            <div className="absolute top-[-30%] left-[-10%] w-[80%] h-[80%] bg-amber-600/5 blur-[120px] rounded-full animate-pulse pointer-events-none"></div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-lg z-20 relative">
                <div className="bg-slate-900 border border-slate-800/80 p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden backdrop-blur-xl">
                    {loading && <div className="absolute inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center rounded-[3rem]"><Loader2 className="animate-spin text-amber-500" size={60} /></div>}

                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-700 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-white font-black text-3xl shadow-xl shadow-amber-600/20">☕</div>
                        <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter leading-none mb-2">BACKOFFICE LOGIN</h2>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] italic">Otoritas Markas Besar</p>
                    </div>

                    <form onSubmit={handlePrimary} className="space-y-5 relative z-30">
                        {authState === 'register' && (
                            <div className="space-y-4">
                                <input name="n" placeholder="Nama Lengkap" className="input-auth" required />
                                <input name="e" type="email" placeholder="Email" className="input-auth" required />
                                <input name="ph" type="tel" placeholder="No. Telepon" className="input-auth" required />
                            </div>
                        )}
                        {authState !== 'otp' ? (
                            <div className="space-y-4">
                                <div className="relative group">
                                    <div style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10, pointerEvents: 'none', color: '#64748b' }}>
                                        <User size={20} />
                                    </div>
                                    <input name="u" placeholder="Username" className="input-auth" style={{ paddingLeft: '4rem', paddingTop: '1.25rem', paddingBottom: '1.25rem' }} required autoComplete="username" />
                                </div>
                                <div className="relative group">
                                    <div style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10, pointerEvents: 'none', color: '#64748b' }}>
                                        <Lock size={20} />
                                    </div>
                                    <input name="p" type="password" placeholder="Password" className="input-auth" style={{ paddingLeft: '4rem', paddingTop: '1.25rem', paddingBottom: '1.25rem' }} required autoComplete="current-password" />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="p-6 bg-amber-600/10 border border-amber-500/20 rounded-[2rem] text-center"><ShieldCheck size={32} className="text-amber-500 mx-auto mb-2" /><p className="text-[10px] font-black text-slate-400 uppercase leading-relaxed tracking-widest">Kirim OTP ke <span className="text-amber-400">@{pendingUser}</span></p></div>
                                <input name="o" maxLength="6" placeholder="000000" className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] p-6 text-center text-4xl font-black text-amber-500 tracking-[0.5em] outline-none shadow-inner" required />
                            </div>
                        )}
                        <button type="submit" className="w-full bg-amber-600 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-amber-500 shadow-xl shadow-amber-600/20 transition-all hover:scale-[1.02] active:scale-95 mt-4">
                            {authState === 'login' ? 'Masuk Sistem' : authState === 'register' ? 'Daftar' : 'Verifikasi'}
                        </button>
                    </form>

                    <div className="mt-10 text-center relative z-30">
                        {authState === 'login' ? (
                            <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Staff Baru? <button type="button" onClick={() => setAuthState('register')} className="text-amber-500 hover:underline cursor-pointer">Daftar Disini</button></p>
                        ) : (
                            <button type="button" onClick={() => setAuthState('login')} className="text-slate-600 text-[10px] font-black uppercase tracking-widest hover:text-amber-400 transition-colors cursor-pointer">Kembali Login</button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function PremiumDatePicker({ value, onChange, label }) {
    const [show, setShow] = useState(false);
    const dateStr = value ? new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pilih Tanggal';

    return (
        <div className="relative">
            <button
                onClick={() => setShow(true)}
                className="flex items-center gap-3 px-4 py-2 hover:bg-slate-900 rounded-2xl transition-all group"
            >
                <CalendarIcon size={14} className="text-slate-500 group-hover:text-amber-500" />
                <div className="text-left">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
                    <p className="text-[10px] font-bold text-slate-200">{dateStr}</p>
                </div>
            </button>

            <AnimatePresence>
                {show && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-4 z-[200]"
                    >
                        <PremiumCalendar
                            selectedDate={value}
                            onSelect={(val) => { onChange(val); setShow(false); }}
                            onClose={() => setShow(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function PremiumCalendar({ selectedDate, onSelect, onClose }) {
    const [viewDate, setViewDate] = useState(selectedDate ? new Date(selectedDate) : new Date());
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    const isSelected = (d) => {
        if (!selectedDate || !d) return false;
        const sel = new Date(selectedDate);
        return sel.getDate() === d.getDate() && sel.getMonth() === d.getMonth() && sel.getFullYear() === d.getFullYear();
    };

    const isToday = (d) => {
        if (!d) return false;
        const today = new Date();
        return today.getDate() === d.getDate() && today.getMonth() === d.getMonth() && today.getFullYear() === d.getFullYear();
    };

    return (
        <div className="w-80 bg-slate-950 border border-slate-800 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-600"></div>

            <div className="flex justify-between items-center mb-6 pt-2">
                <button
                    onClick={() => setViewDate(new Date(year, month - 1))}
                    className="p-2 hover:bg-slate-900 rounded-xl text-slate-500 hover:text-white transition-all"
                >
                    <ChevronLeft size={18} />
                </button>
                <div className="text-center">
                    <p className="text-xs font-black text-white uppercase italic tracking-tighter">{months[month]}</p>
                    <p className="text-[10px] font-bold text-slate-500">{year}</p>
                </div>
                <button
                    onClick={() => setViewDate(new Date(year, month + 1))}
                    className="p-2 hover:bg-slate-900 rounded-xl text-slate-500 hover:text-white transition-all"
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => (
                    <div key={i} className="text-center text-[9px] font-black text-slate-600 pb-2">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((d, i) => (
                    <div key={i} className="aspect-square">
                        {d ? (
                            <button
                                onClick={() => {
                                    const y = d.getFullYear();
                                    const m = String(d.getMonth() + 1).padStart(2, '0');
                                    const day = String(d.getDate()).padStart(2, '0');
                                    onSelect(`${y}-${m}-${day}`);
                                }}
                                className={`w-full h-full rounded-xl flex items-center justify-center text-[10px] font-bold transition-all ${isSelected(d) ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40' : isToday(d) ? 'text-amber-500 border border-amber-500/30' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                            >
                                {d.getDate()}
                            </button>
                        ) : (
                            <div className="w-full h-full"></div>
                        )}
                    </div>
                ))}
            </div>

            <button
                onClick={onClose}
                className="w-full mt-6 py-3 bg-slate-900 border border-slate-800 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-red-400 transition-all"
            >
                Batal
            </button>
        </div>
    );
}

function XCircle(p) { return <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg> }

