import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  FileText, 
  BookOpen, 
  Users, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { formatDate } from '../lib/utils';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="sa-card group">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
        {trend && (
          <div className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-green-600 bg-green-50 w-max px-2 py-0.5 rounded-lg border border-green-100 uppercase tracking-wider">
            <TrendingUp size={12} />
            {trend} increase
          </div>
        )}
      </div>
      <div className={`p-4 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600 group-hover:scale-110 transition-transform duration-300 border border-${color.split('-')[1]}-100`}>
        <Icon size={28} />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    posts: 0,
    blogs: 0,
    schemes: 0,
    users: 0
  });
  const [deadlineJobs, setDeadlineJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const safeGet = async (url, defaultValue) => {
          try {
            const res = await api.get(url);
            return res;
          } catch (e) {
            return { data: defaultValue };
          }
        };

        const [postsRes, blogsRes, schemesRes, usersRes, deadlineRes] = await Promise.all([
          safeGet('/stats/posts', { data: { count: 0 } }),
          safeGet('/stats/blogs', { data: { count: 0 } }),
          safeGet('/stats/schemes', { data: { count: 0 } }),
          safeGet('/user/all?limit=1', { pagination: { total: 0 } }),
          safeGet('/post/get-deadline-jobs?days=7&limit=5', { data: [] })
        ]);

        setStats({
          posts: postsRes.data?.data?.count ?? postsRes.data?.count ?? 0,
          blogs: blogsRes.data?.data?.count ?? blogsRes.data?.count ?? 0,
          schemes: schemesRes.data?.data?.count ?? schemesRes.data?.count ?? 0,
          users: usersRes.data?.pagination?.total ?? usersRes.data?.total ?? 0
        });
        setDeadlineJobs(deadlineRes.data?.data || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-slate-200 rounded-2xl"></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-96 bg-slate-200 rounded-2xl"></div>
        <div className="h-96 bg-slate-200 rounded-2xl"></div>
      </div>
    </div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Overview</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Welcome back! Here's a snapshot of your platform's performance.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white px-4 py-2 rounded-xl border border-dashboard-border shadow-sm">
          <Clock size={14} />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Job Posts" value={stats.posts} icon={Briefcase} color="bg-blue-500" trend="12%" />
        <StatCard title="Blog Articles" value={stats.blogs} icon={FileText} color="bg-purple-500" trend="5%" />
        <StatCard title="Gov Schemes" value={stats.schemes} icon={BookOpen} color="bg-emerald-500" trend="8%" />
        <StatCard title="Registered Users" value={stats.users} icon={Users} color="bg-orange-500" trend="24%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 sa-table-container">
          <div className="p-6 border-b border-dashboard-border flex items-center justify-between bg-slate-50/30">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Clock size={18} className="text-blue-600" />
              Upcoming Deadlines
              <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded-full border border-blue-100">Next 7 Days</span>
            </h3>
            <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline cursor-pointer">View All</button>
          </div>
          <div className="divide-y divide-dashboard-border">
            {deadlineJobs.length > 0 ? deadlineJobs.map((job) => (
              <div key={job._id} className="p-5 hover:bg-slate-50/50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 border border-slate-200 group-hover:bg-white transition-colors">
                    <Briefcase size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{job.title}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{job.category || 'General'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100 uppercase tracking-wider">Expires {formatDate(job.applyLastDate)}</p>
                  <button className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 hover:text-blue-600 flex items-center gap-1 ml-auto transition-colors cursor-pointer">
                    Edit Post <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                  <Clock size={32} />
                </div>
                <p className="text-sm text-slate-400 font-medium">No upcoming deadlines found.</p>
              </div>
            )}
          </div>
        </div>

        <div className="sa-card bg-slate-900 border-slate-800 shadow-xl shadow-slate-900/20">
          <h3 className="font-bold text-white mb-8 flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-400" />
            System Alerts
          </h3>
          <div className="space-y-5">
            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Scrapper Alert</p>
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">SSC section failed to update in the last 24 hours. Check logs.</p>
            </div>
            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">AI Enrichment</p>
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">12 new posts are waiting for AI enrichment. Run cron now.</p>
            </div>
            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl opacity-60">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Cache Status</p>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">Cache hit rate is 92%. Performance is optimal.</p>
            </div>
          </div>
          
          <button className="w-full mt-8 py-3 bg-white text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors cursor-pointer">
            Run System Check
          </button>
        </div>
      </div>
    </div>
  );
}
