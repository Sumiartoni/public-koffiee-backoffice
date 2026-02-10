import React, { useState, useEffect } from 'react';
import { Users, Award, Gift, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';

export default function ReferralManager() {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetails, setUserDetails] = useState([]);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/referrals/stats`);
            setStats(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (userId) => {
        try {
            const res = await axios.get(`${API_URL}/referrals/${userId}/details`);
            setUserDetails(res.data);
            setSelectedUser(userId);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-8 animate-premium">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-4xl font-black italic tracking-tighter text-white">Referral System</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Monitoring Program Referral Pengguna</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Leaderboard / List */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xl font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2"><Users className="text-amber-500" /> Top Referrer</h3>

                    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-950 text-slate-500 uppercase text-[10px] tracking-widest font-bold">
                                <tr>
                                    <th className="p-6">User</th>
                                    <th className="p-6">Kode Referral</th>
                                    <th className="p-6 text-center">Total Referral</th>
                                    <th className="p-6 text-center">Reward Diberikan</th>
                                    <th className="p-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-sm">
                                {stats.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-600 italic">Belum ada data referral</td></tr>
                                ) : stats.map((user, idx) => (
                                    <tr key={user.id} className="hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => handleViewDetails(user.id)}>
                                        <td className="p-6 font-bold text-white">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${idx < 3 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                                                    {idx + 1}
                                                </div>
                                                {user.name}
                                            </div>
                                        </td>
                                        <td className="p-6 font-mono text-amber-500">{user.referral_code}</td>
                                        <td className="p-6 text-center font-bold text-white text-lg">{user.total_referrals}</td>
                                        <td className="p-6 text-center">
                                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold">{user.rewards_given}</span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <ChevronRight className="inline text-slate-600 group-hover:text-amber-500 transition-colors" size={16} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Details Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 h-fit">
                    <h3 className="text-xl font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2"><Award className="text-amber-500" /> Detail Referral</h3>

                    {selectedUser ? (
                        <div className="space-y-6">
                            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Referrer</p>
                                <h4 className="text-xl font-black text-white">{stats.find(s => s.id === selectedUser)?.name}</h4>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-xs text-slate-500 uppercase font-bold border-b border-slate-800 pb-2">Daftar Pengguna Yang Direferensikan</h4>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
                                    {userDetails.length === 0 ? (
                                        <p className="text-sm text-slate-600 italic">Tidak ada data detail</p>
                                    ) : userDetails.map(u => (
                                        <div key={u.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                                            <div>
                                                <p className="text-sm font-bold text-white">{u.name}</p>
                                                <p className="text-[10px] text-slate-500">{new Date(u.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.is_verified ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-700 text-slate-400'}`}>
                                                {u.is_verified ? 'Verified' : 'Pending'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-20 text-center text-slate-600">
                            <Gift size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-bold italic">Pilih user dari leaderboard untuk melihat detail</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
