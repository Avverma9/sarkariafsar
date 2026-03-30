import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  Calendar,
  Tag,
  Copy,
  RefreshCw
} from 'lucide-react';
import api from '@/src/lib/api';
import { JobPost, ApiResponse } from '@/src/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { useNavigate } from 'react-router-dom';

import { JsonEditorModal } from './JsonEditorModal';

export function PostList() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<JobPost[]>([]);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

  const handleBulkAdd = async (data: any) => {
    try {
      // API expects { data: [...] } or { data: {...} }
      const payload = { data };
      await api.post('/post/add', payload);
      toast.success('Data imported successfully');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to import data. Check JSON structure.');
      throw error;
    }
  };

  const copyToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast.success('JSON copied to clipboard');
  };
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<JobPost[]>>('/post', {
        params: {
          page,
          limit: 10,
          search,
          status
        }
      });
      if (res.data.success) {
        setPosts(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      toast.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/post/id/${id}`);
      toast.success('Post deleted successfully');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-zinc-100">Job Posts</h2>
          <p className="text-zinc-400 mt-1">Manage and monitor all job recruitment posts</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsJsonModalOpen(true)}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all active:scale-95 border border-zinc-700"
          >
            <RefreshCw className="w-4 h-4" />
            Bulk JSON
          </button>
          <button 
            onClick={() => navigate('/posts/add')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add New Post
          </button>
        </div>
      </div>

      <JsonEditorModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        onSave={handleBulkAdd}
        title="Bulk Import Job Posts"
        description="Paste a JSON object or array of job posts to import them in bulk."
        initialData={{ title: "Sample Post", jobtitle: "Engineer" }}
      />

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-800 flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by title, organization..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <div className="flex gap-2">
            <select
              className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-4 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 p-2 rounded-xl transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 text-zinc-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Post Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Deadline</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8">
                      <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
                    </td>
                  </tr>
                ))
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No posts found matching your criteria.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post._id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-zinc-100 font-medium line-clamp-1">{post.title}</span>
                        <span className="text-zinc-500 text-xs mt-1 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {post.jobtitle || 'No Job Title'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase rounded-md">
                        {post.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <Calendar className="w-4 h-4 text-zinc-600" />
                        {post.applyLastDate ? format(new Date(post.applyLastDate), 'MMM dd, yyyy') : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                        post.isActive 
                          ? "bg-green-500/10 text-green-500" 
                          : "bg-zinc-500/10 text-zinc-500"
                      )}>
                        {post.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => copyToClipboard(post)}
                          title="Copy JSON"
                          className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/posts/edit/${post._id}`)}
                          className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => post._id && handleDelete(post._id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <a 
                          href={`https://sarkariafsar.com/post/${post.slug}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-blue-500/10 rounded-lg text-zinc-400 hover:text-blue-500 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-950/30">
          <p className="text-zinc-500 text-sm">
            Page <span className="text-zinc-200 font-medium">{page}</span> of <span className="text-zinc-200 font-medium">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="p-2 border border-zinc-800 rounded-xl text-zinc-400 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="p-2 border border-zinc-800 rounded-xl text-zinc-400 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { cn } from '@/src/lib/utils';
