import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, BookOpen, ExternalLink, CheckCircle2, XCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';
import Modal from '../components/Modal';

export default function Schemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState(null);
  const [formData, setFormData] = useState({
    schemeTitle: '', slug: '', schemetype: '', state: '', aboutScheme: '', officialSourceUrl: '', isActive: true
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchSchemes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/schemes/', {
        params: { page, limit: 10, search }
      });
      setSchemes(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err) {
      setError('Unable to load schemes. Please check your network connection.');
      setSchemes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSchemes();
  };

  const toggleStatus = async (scheme) => {
    try {
      const response = await api.put(`/schemes/slug/${scheme.slug}`, {
        data: { isActive: !scheme.isActive }
      });
      if (response.data.success) {
        setSchemes(schemes.map(s => s._id === scheme._id ? { ...s, isActive: !s.isActive } : s));
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const deleteScheme = async (slug) => {
    if (!window.confirm('Are you sure you want to delete this scheme?')) return;
    try {
      const response = await api.delete(`/schemes/slug/${slug}`);
      if (response.data.success) {
        setSchemes(schemes.filter(s => s.slug !== slug));
      }
    } catch (error) {
      console.error('Failed to delete scheme:', error);
    }
  };

  const openModal = (scheme = null) => {
    if (scheme) {
      setEditingSlug(scheme.slug);
      setFormData({
        schemeTitle: scheme.schemeTitle || '', slug: scheme.slug || '',
        schemetype: scheme.schemetype || '', state: scheme.state || '',
        aboutScheme: scheme.aboutScheme || '', officialSourceUrl: scheme.officialSourceUrl || '',
        isActive: scheme.isActive ?? true
      });
    } else {
      setEditingSlug(null);
      setFormData({
        schemeTitle: '', slug: '', schemetype: '', state: '', aboutScheme: '', officialSourceUrl: '', isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingSlug) {
        await api.put(`/schemes/slug/${editingSlug}`, { data: formData });
      } else {
        await api.post('/schemes/add', { data: formData });
      }
      setIsModalOpen(false);
      fetchSchemes();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save scheme');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Schemes Manager</h2>
          <p className="text-sm text-slate-500 mt-1">Manage government schemes and yojanas.</p>
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer">
          <Plus size={18} />
          Add Scheme
        </button>
      </div>

      <div className="sa-table-container">
        <div className="p-4 border-b border-dashboard-border bg-slate-50/50">
          <form onSubmit={handleSearch} className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search schemes..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-dashboard-border rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
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
                <th>Scheme Title</th>
                <th>State</th>
                <th>Type</th>
                <th>Status</th>
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
              ) : schemes.length > 0 ? schemes.map((scheme) => (
                <tr key={scheme._id} className="group">
                  <td className="min-w-[300px] max-w-md">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
                        <BookOpen size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate" title={scheme.schemeTitle}>{scheme.schemeTitle}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{scheme.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap font-bold text-slate-700">{scheme.state || 'All India'}</td>
                  <td className="whitespace-nowrap">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                      {scheme.schemetype || 'General'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">
                    <button 
                      onClick={() => toggleStatus(scheme)}
                      className={cn(
                        "flex items-center gap-1.5 w-max px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer border transition-all",
                        scheme.isActive !== false 
                          ? "bg-green-100 text-green-700 border-green-200 shadow-sm shadow-green-100" 
                          : "bg-red-100 text-red-700 border-red-200 shadow-sm shadow-red-100"
                      )}
                    >
                      {scheme.isActive !== false ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {scheme.isActive !== false ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(scheme)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer" title="Edit"><Edit2 size={16} /></button>
                      <button onClick={() => deleteScheme(scheme.slug)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer" title="Delete"><Trash2 size={16} /></button>
                      <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer" title="View"><ExternalLink size={16} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-400 text-sm font-medium">No schemes found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-dashboard-border flex items-center justify-between bg-slate-50/50">
          <p className="text-xs text-slate-500 font-bold">Page <span className="text-slate-900">{page}</span> of <span className="text-slate-900">{totalPages}</span></p>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 border border-dashboard-border rounded-xl hover:bg-white disabled:opacity-50 transition-all cursor-pointer bg-white shadow-sm"><ChevronLeft size={16} /></button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 border border-dashboard-border rounded-xl hover:bg-white disabled:opacity-50 transition-all cursor-pointer bg-white shadow-sm"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSlug ? "Edit Scheme" : "Add Scheme"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Scheme Title</label>
              <input type="text" required value={formData.schemeTitle} onChange={e => setFormData({...formData, schemeTitle: e.target.value})} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Slug</label>
              <input type="text" required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Type</label>
              <input type="text" value={formData.schemetype} onChange={e => setFormData({...formData, schemetype: e.target.value})} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">State</label>
              <input type="text" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Official Source URL</label>
              <input type="url" value={formData.officialSourceUrl} onChange={e => setFormData({...formData, officialSourceUrl: e.target.value})} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">About Scheme</label>
              <textarea value={formData.aboutScheme} onChange={e => setFormData({...formData, aboutScheme: e.target.value})} rows={3} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500 resize-none" />
            </div>
            <div className="md:col-span-2 flex items-center gap-2 mt-2">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">Scheme is Active</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-dashboard-border mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition-colors disabled:opacity-50 cursor-pointer">
              {isSaving ? 'Saving...' : 'Save Scheme'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
