import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  TrendingUp,
  Receipt,
  UserCheck,
  UserX,
  Trash2,
  Lock,
  ArrowUpDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../services/api';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingUser, setDeletingUser] = useState(null);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getStats(),
      ]);

      if (usersRes.data.success) setUsers(usersRes.data.data);
      if (statsRes.data.success) setStats(statsRes.data.data);
    } catch (err) {
      toast.error('Failed to load admin controls.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleToggleStatus = async (id) => {
    try {
      const res = await adminApi.toggleStatus(id);
      if (res.data.success) {
        toast.success(res.data.message);
        loadAdminData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      const res = await adminApi.updateRole(id, newRole);
      if (res.data.success) {
        toast.success(res.data.message);
        loadAdminData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role.');
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      const res = await adminApi.deleteUser(deletingUser._id);
      if (res.data.success) {
        toast.success(res.data.message);
        loadAdminData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeletingUser(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/25">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Administrative Control Panel
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Role-Based Access Control (RBAC) & System-Wide User Management
          </p>
        </div>
      </div>

      {/* Platform Analytics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Registered Users</span>
            <div className="flex items-baseline justify-between mt-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.totalUsers}
              </h3>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                {stats.activeCount} active
              </span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Total System Volume</span>
            <div className="flex items-baseline justify-between mt-2">
              <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                ₹{Number(stats.platformVolume || 0).toLocaleString('en-IN')}
              </h3>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
                Platform
              </span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Global Transactions</span>
            <div className="flex items-baseline justify-between mt-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.totalTransactions}
              </h3>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                Entries
              </span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase">Admin Accounts</span>
            <div className="flex items-baseline justify-between mt-2">
              <h3 className="text-2xl font-black text-violet-600 dark:text-violet-400">
                {stats.adminCount}
              </h3>
              <span className="text-[10px] font-bold text-violet-600 bg-violet-50 dark:bg-violet-950 px-2 py-0.5 rounded-full">
                Privileged
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            User Accounts & Roles
          </h2>
          <span className="text-xs text-slate-400">{users.length} accounts loaded</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Loading user list...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-3.5 pl-6">User</th>
                  <th className="py-3.5">Email</th>
                  <th className="py-3.5">Role</th>
                  <th className="py-3.5">Status</th>
                  <th className="py-3.5">Txns</th>
                  <th className="py-3.5">Joined</th>
                  <th className="py-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="py-4 pl-6">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-slate-500">{u.email}</td>
                    <td className="py-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className={`text-xs font-bold rounded-lg px-2 py-1 border transition-colors ${
                          u.role === 'admin'
                            ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800'
                            : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                        }`}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-4 text-slate-600 dark:text-slate-300 font-medium">
                      {u.transactionCount}
                    </td>
                    <td className="py-4 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(u._id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setDeletingUser(u)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Delete user and data"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteUser}
        title="Delete User Account?"
        message={`This will permanently remove ${deletingUser?.name} (${deletingUser?.email}) and all their associated transactions.`}
      />
    </div>
  );
}
