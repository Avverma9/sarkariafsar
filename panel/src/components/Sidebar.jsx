import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Layers, 
  FileText, 
  BookOpen, 
  FolderOpen, 
  ClipboardCheck, 
  Bell, 
  Users, 
  Database, 
  Cpu,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Job Posts', path: '/jobs', icon: Briefcase },
  { name: 'Sections', path: '/sections', icon: Layers },
  { name: 'Blogs', path: '/blogs', icon: FileText },
  { name: 'Schemes', path: '/schemes', icon: BookOpen },
  { name: 'Resources', path: '/resources', icon: FolderOpen },
  { name: 'Mock Tests', path: '/mock-tests', icon: ClipboardCheck },
  { name: 'Notifications', path: '/notifications', icon: Bell },
  { name: 'Users', path: '/users', icon: Users },
  { name: 'Cache Control', path: '/cache', icon: Database },
  { name: 'AI & Scrapper', path: '/controls', icon: Cpu },
  { name: 'Auth Settings', path: '/auth-settings', icon: ShieldCheck },
];

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="w-64 bg-dashboard-sidebar text-slate-300 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">SA</div>
          Sarkari Afsar
        </h1>
        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-semibold">Admin Panel</p>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              isActive 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon size={18} />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-all w-full"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
