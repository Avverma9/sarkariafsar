import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, MoreVertical, Edit2, Trash2, ExternalLink,
  CheckCircle2, XCircle, ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import { cn, formatDate } from '../lib/utils';
import Modal from '../components/Modal';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sections, setSections] = useState([]);
  const [sectionCanonicalUrl, setSectionCanonicalUrl] = useState('');
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', slug: '', jobtitle: '', dedupeKey: '', sourceUrl: '',
    sectionName: '', category: '', totalVacancies: '', applyLastDate: '', isActive: true,
    postData: '', importantDates: '', applicationFee: '', ageLimit: '', vacancyDetails: '', someUsefulImportantLinks: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await api.get('/post-section/');
        setSections(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch sections:', err);
      }
    };
    fetchSections();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = '/post/';
      let params = { page, limit: 10, search };
      
      if (sectionCanonicalUrl) {
        endpoint = `/post/section/${sectionCanonicalUrl}`;
      }

      const response = await api.get(endpoint, { params });
      setJobs(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err) {
      setError('Unable to load jobs. Please check your network connection or try again later.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, sectionCanonicalUrl]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const toggleStatus = async (job) => {
    try {
      const response = await api.put(`/post/id/${job._id}`, {
        data: { isActive: !job.isActive }
      });
      if (response.data.success) {
        setJobs(jobs.map(j => j._id === job._id ? { ...j, isActive: !j.isActive } : j));
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const deleteJob = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job post?')) return;
    try {
      const response = await api.delete(`/post/id/${id}`);
      if (response.data.success) {
        setJobs(jobs.filter(j => j._id !== id));
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const openModal = (job = null) => {
    if (job) {
      setEditingId(job._id);
      setFormData({
        title: job.title || '', slug: job.slug || '', jobtitle: job.jobtitle || '',
        dedupeKey: job.dedupeKey || '', sourceUrl: job.sourceUrl || '',
        sectionName: job.sectionName || '', category: job.category || '',
        totalVacancies: job.totalVacancies || '', 
        applyLastDate: job.applyLastDate ? job.applyLastDate.split('T')[0] : '', 
        isActive: job.isActive ?? true,
        postData: job.postData ? JSON.stringify(job.postData, null, 2) : '',
        importantDates: job.importantDates ? JSON.stringify(job.importantDates, null, 2) : '',
        applicationFee: job.applicationFee ? JSON.stringify(job.applicationFee, null, 2) : '',
        ageLimit: job.ageLimit ? JSON.stringify(job.ageLimit, null, 2) : '',
        vacancyDetails: job.vacancyDetails ? JSON.stringify(job.vacancyDetails, null, 2) : '',
        someUsefulImportantLinks: job.someUsefulImportantLinks ? JSON.stringify(job.someUsefulImportantLinks, null, 2) : ''
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '', slug: '', jobtitle: '', dedupeKey: '', sourceUrl: '',
        sectionName: '', category: '', totalVacancies: '', applyLastDate: '', isActive: true,
        postData: '', importantDates: '', applicationFee: '', ageLimit: '', vacancyDetails: '', someUsefulImportantLinks: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...formData };
      if (payload.applyLastDate) payload.applyLastDate = new Date(payload.applyLastDate).toISOString();
      
      // Parse JSON fields
      const jsonFields = ['postData', 'importantDates', 'applicationFee', 'ageLimit', 'vacancyDetails', 'someUsefulImportantLinks'];
      for (const field of jsonFields) {
        if (payload[field]) {
          try {
            payload[field] = JSON.parse(payload[field]);
          } catch (e) {
            alert(`Invalid JSON in ${field}`);
            setIsSaving(false);
            return;
          }
        } else {
          delete payload[field];
        }
      }
      
      if (editingId) {
        await api.put(`/post/id/${editingId}`, { data: payload });
      } else {
        await api.post('/post/add', { data: payload });
      }
      setIsModalOpen(false);
      fetchJobs();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save job');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Job Posts Manager</h2>
          <p className="text-sm text-slate-500 mt-1">Manage and monitor all government job listings.</p>
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer">
          <Plus size={18} />
          Add New Job
        </button>
      </div>

      <div className="sa-table-container">
        <div className="p-4 border-b border-dashboard-border flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <form onSubmit={handleSearch} className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by title or slug..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-dashboard-border rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
            />
          </form>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white border border-dashboard-border rounded-xl px-3 py-2 shadow-sm">
              <Filter size={14} className="text-slate-400" />
              <select 
                value={sectionCanonicalUrl}
                onChange={(e) => { setSectionCanonicalUrl(e.target.value); setPage(1); }}
                className="text-sm outline-none bg-transparent text-slate-600 font-bold cursor-pointer"
              >
                <option value="">All Sections</option>
                {sections.map(sec => <option key={sec._id} value={sec.slug}>{sec.name}</option>)}
              </select>
            </div>
          </div>
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
                <th>Job Details</th>
                <th>Section / Category</th>
                <th>Last Date</th>
                <th>Vacancies</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="p-4"><div className="h-12 bg-slate-100 rounded-lg"></div></td>
                  </tr>
                ))
              ) : jobs.length > 0 ? jobs.map((job) => (
                <tr key={job._id} className="group">
                  <td className="min-w-[250px] max-w-xs">
                    <div className="font-bold text-slate-900 truncate" title={job.title}>{job.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider truncate">{job.slug}</div>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">{job.sectionName}</span>
                      <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-0.5">{job.category}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap font-bold text-slate-600">
                    {formatDate(job.applyLastDate)}
                  </td>
                  <td className="whitespace-nowrap font-mono text-slate-600 font-bold">
                    {job.totalVacancies || 'N/A'}
                  </td>
                  <td className="whitespace-nowrap">
                    <button 
                      onClick={() => toggleStatus(job)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border",
                        job.isActive 
                          ? "bg-green-100 text-green-700 border-green-200 shadow-sm shadow-green-100" 
                          : "bg-red-100 text-red-700 border-red-200 shadow-sm shadow-red-100"
                      )}
                    >
                      {job.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {job.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(job)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteJob(job._id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer" 
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer" title="View on Site">
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-400 text-sm font-medium">No job posts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-dashboard-border flex items-center justify-between bg-slate-50/50">
          <p className="text-xs text-slate-500 font-bold">
            Page <span className="text-slate-900">{page}</span> of <span className="text-slate-900">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 border border-dashboard-border rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer bg-white shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 border border-dashboard-border rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer bg-white shadow-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Job Post" : "Add New Job Post"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Title</label>
              <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Slug</label>
              <input type="text" required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Job Title</label>
              <input type="text" value={formData.jobtitle} onChange={e => setFormData({...formData, jobtitle: e.target.value})} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Dedupe Key</label>
              <input type="text" value={formData.dedupeKey} onChange={e => setFormData({...formData, dedupeKey: e.target.value})} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Section Name</label>
              <input type="text" value={formData.sectionName} onChange={e => setFormData({...formData, sectionName: e.target.value})} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
              <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Vacancies</label>
              <input type="text" value={formData.totalVacancies} onChange={e => setFormData({...formData, totalVacancies: e.target.value})} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Apply Last Date</label>
              <input type="date" value={formData.applyLastDate} onChange={e => setFormData({...formData, applyLastDate: e.target.value})} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Source URL</label>
              <input type="url" value={formData.sourceUrl} onChange={e => setFormData({...formData, sourceUrl: e.target.value})} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Post Data (JSON)</label>
              <textarea value={formData.postData} onChange={e => setFormData({...formData, postData: e.target.value})} rows={3} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500 font-mono" placeholder='{"key": "value"}' />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Important Dates (JSON)</label>
              <textarea value={formData.importantDates} onChange={e => setFormData({...formData, importantDates: e.target.value})} rows={3} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500 font-mono" placeholder='[{"event": "Start", "date": "2023-01-01"}]' />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Application Fee (JSON)</label>
              <textarea value={formData.applicationFee} onChange={e => setFormData({...formData, applicationFee: e.target.value})} rows={3} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500 font-mono" placeholder='[{"category": "General", "amount": "100"}]' />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Age Limit (JSON)</label>
              <textarea value={formData.ageLimit} onChange={e => setFormData({...formData, ageLimit: e.target.value})} rows={3} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500 font-mono" placeholder='[{"detail": "Min Age: 18"}]' />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vacancy Details (JSON)</label>
              <textarea value={formData.vacancyDetails} onChange={e => setFormData({...formData, vacancyDetails: e.target.value})} rows={3} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500 font-mono" placeholder='[{"postName": "Clerk", "total": "100"}]' />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Important Links (JSON)</label>
              <textarea value={formData.someUsefulImportantLinks} onChange={e => setFormData({...formData, someUsefulImportantLinks: e.target.value})} rows={3} className="w-full bg-slate-50 border border-dashboard-border rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500 font-mono" placeholder='[{"linkName": "Apply Online", "url": "https..."}]' />
            </div>
            <div className="md:col-span-2 flex items-center gap-2 mt-2">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">Post is Active</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-dashboard-border mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition-colors disabled:opacity-50 cursor-pointer">
              {isSaving ? 'Saving...' : 'Save Job Post'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
