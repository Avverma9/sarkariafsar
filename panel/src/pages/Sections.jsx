import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, CheckCircle2,
  XCircle, Hash, AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../lib/utils';
import Modal from '../components/Modal';

export default function Sections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', status: 'active' });
  const [isSaving, setIsSaving] = useState(false);

  const fetchSections = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/post-section/', {
        params: { search }
      });
      setSections(response.data.data || []);
    } catch (err) {
      setError('Unable to load sections. Please check your network connection or try again later.');
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSections();
  };

  const toggleStatus = async (section) => {
    try {
      const newStatus = section.status === 'active' ? 'inactive' : 'active';
      const response = await api.put(`/post-section/id/${section._id}`, {
        data: { status: newStatus }
      });
      if (response.data.success) {
        setSections(sections.map(s => s._id === section._id ? { ...s, status: newStatus } : s));
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const deleteSection = async (id) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    try {
      const response = await api.delete(`/post-section/id/${id}`);
      if (response.data.success) {
        setSections(sections.filter(s => s._id !== id));
      }
    } catch (error) {
      console.error('Failed to delete section:', error);
    }
  };

  const openModal = (section = null) => {
    if (section) {
      setEditingId(section._id);
      setFormData({ name: section.name || '', status: section.status || 'active' });
    } else {
      setEditingId(null);
      setFormData({ name: '', status: 'active' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/post-section/id/${editingId}`, { data: formData });
      } else {
        await api.post('/post-section/add', { data: formData });
      }
      setIsModalOpen(false);
      fetchSections();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save section');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Sections Manager</h2>
          <p className="text-sm text-slate-500 mt-1">Organize job posts into categories and sections.</p>
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer">
          <Plus size={18} />
          Create Section
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-dashboard-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-dashboard-border bg-slate-50/50">
          <form onSubmit={handleSearch} className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search sections..." 
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
                <th>Section Name</th>
                <th>Slug / Canonical</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="4" className="p-4"><div className="h-12 bg-slate-100 rounded-lg"></div></td>
                  </tr>
                ))
              ) : sections.length > 0 ? sections.map((section) => (
                <tr key={section._id} className="group">
                  <td className="whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
                        <Hash size={18} />
                      </div>
                      <span className="font-bold text-slate-900">{section.name}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <code className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg text-slate-600 font-mono font-bold">/{section.slug}</code>
                  </td>
                  <td className="whitespace-nowrap">
                    <button 
                      onClick={() => toggleStatus(section)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border",
                        section.status === 'active' 
                          ? "bg-green-100 text-green-700 border-green-200 shadow-sm shadow-green-100" 
                          : "bg-red-100 text-red-700 border-red-200 shadow-sm shadow-red-100"
                      )}
                    >
                      {section.status === 'active' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {section.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(section)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer" title="Edit"><Edit2 size={16} /></button>
                      <button onClick={() => deleteSection(section._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-slate-400 text-sm font-medium">No sections found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Section" : "Create Section"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Section Name</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500" placeholder="e.g. Admit Card" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500 cursor-pointer">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-dashboard-border mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition-colors disabled:opacity-50 cursor-pointer">
              {isSaving ? 'Saving...' : 'Save Section'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
