import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, FileText, ExternalLink, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { formatDate } from '../lib/utils';
import Modal from '../components/Modal';

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', slug: '', excerpt: '', author: 'Admin', category: '', intro: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchBlogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/blog/', {
        params: { page, limit: 10, search }
      });
      setBlogs(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err) {
      setError('Unable to load blogs. Please check your network connection.');
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBlogs();
  };

  const deleteBlog = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    try {
      const response = await api.delete(`/blog/id/${id}`);
      if (response.data.success) {
        setBlogs(blogs.filter(b => b._id !== id));
      }
    } catch (error) {
      console.error('Failed to delete blog:', error);
    }
  };

  const openModal = (blog = null) => {
    if (blog) {
      setEditingId(blog._id);
      setFormData({
        title: blog.title || '', slug: blog.slug || '', excerpt: blog.excerpt || '',
        author: blog.author || 'Admin', category: blog.category || '', intro: blog.intro || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '', slug: '', excerpt: '', author: 'Admin', category: '', intro: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/blog/id/${editingId}`, { data: formData });
      } else {
        await api.post('/blog/add', { data: formData });
      }
      setIsModalOpen(false);
      fetchBlogs();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save blog');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Blogs Manager</h2>
          <p className="text-sm text-slate-500 mt-1">Manage articles, guides, and preparation tips.</p>
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer">
          <Plus size={18} />
          Write Article
        </button>
      </div>

      <div className="sa-table-container">
        <div className="p-4 border-b border-dashboard-border bg-slate-50/50">
          <form onSubmit={handleSearch} className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search articles..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-dashboard-border rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
            />
          </form>
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
                <th>Article Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Published Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="p-4"><div className="h-12 bg-slate-100 rounded-lg"></div></td>
                  </tr>
                ))
              ) : blogs.length > 0 ? blogs.map((blog) => (
                <tr key={blog._id} className="group">
                  <td className="min-w-[300px] max-w-md">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0 border border-purple-100">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate" title={blog.title}>{blog.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{blog.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap font-medium text-slate-700">{blog.author || 'Admin'}</td>
                  <td className="whitespace-nowrap">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                      {blog.category}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-slate-500 font-medium">{formatDate(blog.createdAt)}</td>
                  <td className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(blog)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer" title="Edit"><Edit2 size={16} /></button>
                      <button onClick={() => deleteBlog(blog._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer" title="Delete"><Trash2 size={16} /></button>
                      <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer" title="View"><ExternalLink size={16} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-400 text-sm">No articles found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-dashboard-border flex items-center justify-between bg-slate-50/50">
          <p className="text-xs text-slate-500 font-medium">Page <span className="text-slate-900">{page}</span> of <span className="text-slate-900">{totalPages}</span></p>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 border border-dashboard-border rounded-lg hover:bg-white disabled:opacity-50 transition-all cursor-pointer bg-white shadow-sm"><ChevronLeft size={16} /></button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 border border-dashboard-border rounded-lg hover:bg-white disabled:opacity-50 transition-all cursor-pointer bg-white shadow-sm"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Blog" : "Write Article"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Title</label>
              <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Slug</label>
              <input type="text" required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
              <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Author</label>
              <input type="text" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Excerpt</label>
              <textarea value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} rows={2} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500 resize-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Intro Content (HTML/Markdown)</label>
              <textarea value={formData.intro} onChange={e => setFormData({...formData, intro: e.target.value})} rows={4} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500 resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-dashboard-border mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition-colors disabled:opacity-50 cursor-pointer">
              {isSaving ? 'Saving...' : 'Save Article'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
