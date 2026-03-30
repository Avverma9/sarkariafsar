import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ExternalLink, ChevronLeft, ChevronRight, BookOpen, User, Tag, RefreshCw, Copy } from 'lucide-react';
import api from '@/src/lib/api';
import { Blog, ApiResponse } from '@/src/types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

import { useNavigate } from 'react-router-dom';

import { JsonEditorModal } from './JsonEditorModal';

export function BlogList() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

  const handleBulkAdd = async (data: any) => {
    try {
      await api.post('/blog/add', { data });
      toast.success('Blogs imported successfully');
      fetchBlogs();
    } catch (error) {
      toast.error('Failed to import blogs');
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

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Blog[]>>('/blog', {
        params: { page, limit: 10 }
      });
      if (res.data.success) {
        setBlogs(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      toast.error('Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;
    try {
      await api.delete(`/blog/id/${id}`);
      toast.success('Blog deleted successfully');
      fetchBlogs();
    } catch (error) {
      toast.error('Failed to delete blog');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-zinc-100">Blogs</h2>
          <p className="text-zinc-400 mt-1">Manage educational and informational articles</p>
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
            onClick={() => navigate('/blogs/add')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Write New Blog
          </button>
        </div>
      </div>

      <JsonEditorModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        onSave={handleBulkAdd}
        title="Bulk Import Blogs"
        description="Paste a JSON object or array of blogs to import them."
        initialData={{ title: "Sample Blog", slug: "sample-blog", author: "Admin", excerpt: "...", intro: "...", category: "Tech", sections: [] }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 h-48 animate-pulse"></div>
          ))
        ) : blogs.map((blog) => (
          <div key={blog._id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all group flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 bg-purple-500/10 text-purple-500 text-[10px] font-bold uppercase rounded-md">
                  {blog.category}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => copyToClipboard(blog)}
                    title="Copy JSON"
                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => navigate(`/blogs/edit/${blog._id}`)}
                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => blog._id && handleDelete(blog._id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white line-clamp-2 mb-2 group-hover:text-orange-500 transition-colors">
                {blog.title}
              </h3>
              <p className="text-zinc-500 text-sm line-clamp-2 mb-4">
                {blog.excerpt}
              </p>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-xs text-zinc-400">
                  <User className="w-3 h-3" />
                  {blog.author}
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <Tag className="w-3 h-3" />
                  {blog.tags?.[0] || 'No tags'}
                </div>
              </div>
              <a 
                href={`https://sarkariafsar.com/blog/${blog.slug}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
        <p className="text-zinc-500 text-sm">
          Page <span className="text-zinc-200 font-medium">{page}</span> of <span className="text-zinc-200 font-medium">{totalPages}</span>
        </p>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="p-2 border border-zinc-800 rounded-xl text-zinc-400 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="p-2 border border-zinc-800 rounded-xl text-zinc-400 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
