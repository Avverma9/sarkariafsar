import React, { useState, useEffect } from 'react';
import { 
  Search, 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import { formatDate } from '../lib/utils';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/user/all', {
        params: { page, limit: 10 }
      });
      setUsers(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalUsers(response.data.pagination?.total || 0);
    } catch (err) {
      // Handle 401 or other errors gracefully without console spam
      setError('Unable to load users. The server might require different permissions for this endpoint.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
        <p className="text-sm text-slate-500 mt-1">View and manage registered users and their activity.</p>
      </div>

      <div className="sa-table-container">
        <div className="p-4 border-b border-dashboard-border bg-slate-50/50 flex items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search users by name or email..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-dashboard-border rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
            />
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            Total Users: <span className="text-blue-600">{totalUsers}</span>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          {error && (
            <div className="p-4 m-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-800 text-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
          <table className="sa-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Joined Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="p-4"><div className="h-12 bg-slate-100 rounded-lg"></div></td>
                  </tr>
                ))
              ) : users.length > 0 ? users.map((user) => (
                <tr key={user._id} className="group">
                  <td className="whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
                        {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <User size={20} />}
                      </div>
                      <div className="font-bold text-slate-900">{user.name}</div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <Mail size={14} className="text-slate-400" />
                      {user.email}
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                      user.role === 'admin' 
                        ? 'bg-purple-50 text-purple-700 border-purple-100 shadow-sm shadow-purple-50' 
                        : 'bg-blue-50 text-blue-700 border-blue-100 shadow-sm shadow-blue-50'
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-slate-500 font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      {formatDate(user.createdAt)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-400 text-sm font-medium">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-dashboard-border flex items-center justify-between bg-slate-50/50">
          <p className="text-xs text-slate-500 font-bold">
            Page <span className="text-slate-900">{page}</span> of <span className="text-slate-900">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 border border-dashboard-border rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer bg-white shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 border border-dashboard-border rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer bg-white shadow-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Clock({ size, className }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
