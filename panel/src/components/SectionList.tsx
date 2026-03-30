import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Layers, ChevronLeft, ChevronRight, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '@/src/lib/api';
import { PostSection, ApiResponse } from '@/src/types';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

import { useNavigate } from 'react-router-dom';

import { JsonEditorModal } from './JsonEditorModal';
import { Copy, RefreshCw } from 'lucide-react';

export function SectionList() {
  const navigate = useNavigate();
  const [sections, setSections] = useState<PostSection[]>([]);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

  const handleBulkAdd = async (data: any) => {
    try {
      await api.post('/postsection/add', { data });
      toast.success('Sections imported successfully');
      fetchSections();
    } catch (error) {
      toast.error('Failed to import sections');
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

  const fetchSections = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<PostSection[]>>('/postsection', {
        params: { page, limit: 10 }
      });
      if (res.data.success) {
        setSections(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      toast.error('Failed to fetch sections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [page]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    try {
      await api.delete(`/postsection/id/${id}`);
      toast.success('Section deleted successfully');
      fetchSections();
    } catch (error) {
      toast.error('Failed to delete section');
    }
  };

  const toggleStatus = async (section: PostSection) => {
    try {
      const newStatus = section.status === 'active' ? 'inactive' : 'active';
      await api.put(`/postsection/id/${section._id}`, {
        data: { status: newStatus }
      });
      toast.success(`Section ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchSections();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-zinc-100">Post Sections</h2>
          <p className="text-zinc-400 mt-1">Organize job posts into logical categories and sections</p>
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
            onClick={() => navigate('/sections/add')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Create Section
          </button>
        </div>
      </div>

      <JsonEditorModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        onSave={handleBulkAdd}
        title="Bulk Import Sections"
        description="Paste a JSON object or array of sections to import them."
        initialData={{ name: "Sample Section", canonicalUrl: "sample-section" }}
      />

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search sections..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 text-zinc-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Section Name</th>
                <th className="px-6 py-4">Canonical URL</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-6">
                      <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
                    </td>
                  </tr>
                ))
              ) : (
                sections.map((section) => (
                  <tr key={section._id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-800 rounded-lg">
                          <Layers className="w-4 h-4 text-orange-500" />
                        </div>
                        <span className="text-zinc-100 font-medium">{section.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs text-zinc-500 bg-zinc-950 px-2 py-1 rounded">
                        /{section.canonicalUrl}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleStatus(section)}
                        className="flex items-center gap-2 transition-colors"
                      >
                        {section.status === 'active' ? (
                          <ToggleRight className="w-6 h-6 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-zinc-600" />
                        )}
                        <span className={cn(
                          "text-xs font-bold uppercase",
                          section.status === 'active' ? "text-green-500" : "text-zinc-600"
                        )}>
                          {section.status}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => copyToClipboard(section)}
                          title="Copy JSON"
                          className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/sections/edit/${section._id}`)}
                          className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => section._id && handleDelete(section._id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
    </div>
  );
}
