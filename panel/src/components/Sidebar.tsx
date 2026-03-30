import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Layers, 
  BookOpen, 
  ShieldCheck, 
  Search, 
  RefreshCw,
  Settings
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FileText, label: 'Job Posts', path: '/posts' },
  { icon: Layers, label: 'Sections', path: '/sections' },
  { icon: BookOpen, label: 'Blogs', path: '/blogs' },
  { icon: ShieldCheck, label: 'Schemes', path: '/schemes' },
  { icon: Search, label: 'Global Search', path: '/search' },
  { icon: RefreshCw, label: 'Scrapper', path: '/scrapper' },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-zinc-950 text-zinc-400 border-r border-zinc-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-orange-500" />
          Sarkari Admin
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
              isActive 
                ? "bg-zinc-800 text-white shadow-lg" 
                : "hover:bg-zinc-900 hover:text-zinc-200"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              "group-hover:text-orange-500"
            )} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-zinc-800 text-xs text-zinc-600 text-center">
        v1.0.0 &copy; 2026 Sarkari Afsar
      </div>
    </aside>
  );
}
