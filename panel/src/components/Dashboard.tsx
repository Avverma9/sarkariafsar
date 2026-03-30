import React, { useEffect, useState } from 'react';
import { 
  Users, 
  FileText, 
  BookOpen, 
  ShieldCheck, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import api from '@/src/lib/api';

export function Dashboard() {
  const [stats, setStats] = useState({
    posts: 0,
    blogs: 0,
    schemes: 0,
    advanced: null as any
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [postsRes, blogsRes, schemesRes, advancedRes] = await Promise.all([
          api.get('/stats/posts'),
          api.get('/stats/blogs'),
          api.get('/stats/schemes'),
          api.get('/stats/posts/advanced')
        ]);

        setStats({
          posts: postsRes.data.count,
          blogs: blogsRes.data.count,
          schemes: schemesRes.data.count,
          advanced: advancedRes.data
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const cards = [
    { label: 'Total Job Posts', value: stats.posts, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Blogs', value: stats.blogs, icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Total Schemes', value: stats.schemes, icon: ShieldCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Organizations', value: stats.advanced?.byOrganization?.length || 0, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-zinc-100">Dashboard Overview</h2>
        <p className="text-zinc-400 mt-1">Real-time statistics from Sarkari Afsar API</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-700 transition-colors group">
            <div className="flex justify-between items-start">
              <div className={cn("p-3 rounded-xl", card.bg)}>
                <card.icon className={cn("w-6 h-6", card.color)} />
              </div>
              <div className="flex items-center text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +12%
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-zinc-500 text-sm font-medium">{card.label}</h3>
              <p className="text-3xl font-bold text-white mt-1">{card.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="font-bold text-lg text-white">Posts by Organization</h3>
            <button className="text-xs text-orange-500 hover:underline">View all</button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.advanced?.byOrganization?.slice(0, 6).map((org: any) => (
                <div key={org.organization} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-zinc-300 text-sm">{org.organization || 'Unknown'}</span>
                  </div>
                  <span className="text-zinc-500 text-sm font-mono">{org.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-center items-center text-center space-y-4">
          <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-xl font-bold text-white">Growth Insights</h3>
          <p className="text-zinc-400 max-w-xs">
            Your platform has seen a 24% increase in job posts this month. Keep up the good work!
          </p>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-medium transition-colors">
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}

import { cn } from '@/src/lib/utils';
