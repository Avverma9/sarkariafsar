import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShieldCheck, MapPin, Calendar, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import api from '@/src/lib/api';
import { Scheme, ApiResponse } from '@/src/types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

import { useNavigate } from 'react-router-dom';

import { JsonEditorModal } from './JsonEditorModal';
import { Copy, RefreshCw } from 'lucide-react';

export function SchemeList() {
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

  const handleBulkAdd = async (data: any) => {
    try {
      await api.post('/schemes/add', { data });
      toast.success('Schemes imported successfully');
      fetchSchemes();
    } catch (error) {
      toast.error('Failed to import schemes');
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
  const [state, setState] = useState('');
  const [states, setStates] = useState<string[]>([]);

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Scheme[]>>('/schemes', {
        params: { page, limit: 10, state }
      });
      if (res.data.success) {
        setSchemes(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      toast.error('Failed to fetch schemes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const res = await api.get<ApiResponse<string[]>>('/schemes/getSchemeStateNameOnly');
      if (res.data.success) {
        setStates(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch states');
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  useEffect(() => {
    fetchSchemes();
  }, [page, state]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scheme?')) return;
    try {
      await api.delete(`/schemes/${id}`);
      toast.success('Scheme deleted successfully');
      fetchSchemes();
    } catch (error) {
      toast.error('Failed to delete scheme');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-zinc-100">Govt Schemes</h2>
          <p className="text-zinc-400 mt-1">Manage central and state government welfare schemes</p>
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
            onClick={() => navigate('/schemes/add')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add New Scheme
          </button>
        </div>
      </div>

      <JsonEditorModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        onSave={handleBulkAdd}
        title="Bulk Import Schemes"
        description="Paste a JSON object or array of schemes to import them."
        initialData={{ schemeTitle: "Sample Scheme", state: "Bihar" }}
      />

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search schemes..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <select
            className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-4 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            <option value="">All States</option>
            {states.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-x divide-y divide-zinc-800">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-6 h-48 animate-pulse bg-zinc-950/20"></div>
            ))
          ) : schemes.map((scheme) => (
            <div key={scheme._id} className="p-6 hover:bg-zinc-800/30 transition-all group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => copyToClipboard(scheme)}
                    title="Copy JSON"
                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => navigate(`/schemes/edit/${scheme._id}`)}
                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => scheme._id && handleDelete(scheme._id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white line-clamp-2 mb-3 group-hover:text-orange-500 transition-colors">
                {scheme.schemeTitle}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <MapPin className="w-3 h-3" />
                  {scheme.state || 'Central'}, {scheme.city || 'All Cities'}
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Calendar className="w-3 h-3" />
                  {scheme.schemeLastDate ? format(new Date(scheme.schemeLastDate), 'MMM dd, yyyy') : 'No deadline'}
                </div>
              </div>
            </div>
          ))}
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
