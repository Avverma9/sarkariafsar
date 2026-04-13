import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { admin } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-dashboard-border px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4 bg-slate-100 px-3 py-1.5 rounded-full w-96 border border-slate-200">
        <Search size={16} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Search everything..." 
          className="bg-transparent border-none outline-none text-sm w-full text-slate-600"
        />
      </div>

      <div className="flex items-center gap-6">
        <button className="relative text-slate-500 hover:text-slate-900 transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">3</span>
        </button>
        
        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">{admin?.name || 'Admin'}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Super Admin</p>
          </div>
          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 border border-slate-300">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}
