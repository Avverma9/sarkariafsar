import React, { useState, useEffect } from 'react';
import {
  Upload, Search, FileText, Trash2, ExternalLink,
  Plus, AlertTriangle, Grid, List, Copy, Check,
  BookOpen, Tag, Globe, Lock, Unlock
} from 'lucide-react';
import api from '../services/api';
import { cn, formatDate } from '../lib/utils';
import Modal from '../components/Modal';

const TYPE_META = {
  book:         { label: 'Book',     color: 'bg-blue-100 text-blue-700 border-blue-200' },
  pyq:          { label: 'PYQ',      color: 'bg-purple-100 text-purple-700 border-purple-200' },
  notes:        { label: 'Notes',    color: 'bg-green-100 text-green-700 border-green-200' },
  syllabus:     { label: 'Syllabus', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  video:        { label: 'Video',    color: 'bg-red-100 text-red-700 border-red-200' },
  mock_test_ref:{ label: 'Mock Test',color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  other:        { label: 'Other',    color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

const EMPTY_FORM = {
  title: '', description: '',
  type: 'book', scopeType: 'global',
  conductingAuthorityFull: '', jobPostId: '',
  url: '', isFree: true, price: '', discountedPrice: '',
  samplePages: 5, file: null,
};

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [allResources, setAllResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchResources = async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/resources', { params: { limit: 100 } });
      setAllResources(res.data.data || []);
    } catch {
      setError('Unable to load resources.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResources(); }, []);

  useEffect(() => {
    let filtered = allResources;
    if (typeFilter) filtered = filtered.filter(r => r.type === typeFilter);
    if (search.trim()) filtered = filtered.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));
    setResources(filtered);
  }, [allResources, typeFilter, search]);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('type', form.type);
      fd.append('scopeType', form.scopeType);
      if (form.scopeType === 'authority') fd.append('conductingAuthorityFull', form.conductingAuthorityFull);
      if (form.scopeType === 'post') fd.append('jobPostId', form.jobPostId);
      fd.append('isFree', String(form.isFree));
      if (!form.isFree) {
        fd.append('price', form.price);
        if (form.discountedPrice) fd.append('discountedPrice', form.discountedPrice);
      }
      if (form.url) fd.append('url', form.url);
      if (form.file) fd.append('file', form.file);
      fd.append('samplePages', String(form.samplePages || 5));

      const accessType = form.file ? 'uploaded_file' : (form.url ? 'external' : 'external');
      fd.append('accessType', accessType);

      await api.post('/resources', fd);
      setIsModalOpen(false);
      setForm(EMPTY_FORM);
      fetchResources();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add resource');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteResource = async (id) => {
    if (!window.confirm('Delete this resource permanently?')) return;
    try {
      await api.delete(`/resources/${id}`);
      setAllResources(prev => prev.filter(r => r._id !== id));
    } catch {
      alert('Failed to delete resource');
    }
  };

  const copyLink = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Resources Library</h2>
          <p className="text-sm text-slate-500 mt-1">Books, PYQs, Notes, Syllabus, Videos — free &amp; paid.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer">
          <Plus size={18} /> Add Resource
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-dashboard-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-dashboard-border flex flex-col lg:flex-row gap-3 items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 w-full lg:w-auto">
            {[['', 'All'], ['book','Book'], ['pyq','PYQ'], ['notes','Notes'], ['syllabus','Syllabus'], ['video','Video'], ['other','Other']].map(([val, lbl]) => (
              <button key={val} onClick={() => setTypeFilter(val)}
                className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border",
                  typeFilter === val ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-dashboard-border hover:border-slate-400")}>
                {lbl}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search title..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-dashboard-border rounded-xl text-sm outline-none focus:border-blue-500 transition-all" />
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-dashboard-border">
              <button onClick={() => setViewMode('grid')} className={cn("p-1.5 rounded-lg transition-all cursor-pointer", viewMode==='grid'?"bg-white text-blue-600 shadow-sm":"text-slate-400")}><Grid size={16}/></button>
              <button onClick={() => setViewMode('list')} className={cn("p-1.5 rounded-lg transition-all cursor-pointer", viewMode==='list'?"bg-white text-blue-600 shadow-sm":"text-slate-400")}><List size={16}/></button>
            </div>
          </div>
        </div>

        <div className="p-5">
          {error && <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-800 text-sm flex items-center gap-2"><AlertTriangle size={15}/>{error}</div>}

          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i=><div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse"/>)}</div>
          ) : resources.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-dashboard-border rounded-2xl">
              <BookOpen size={36} className="mx-auto mb-3 text-slate-200"/>
              <p className="font-bold text-slate-700">No resources found</p>
              <button onClick={() => setIsModalOpen(true)} className="mt-3 text-blue-600 text-sm font-semibold hover:underline cursor-pointer">+ Add first resource</button>
            </div>
          ) : viewMode === 'list' ? (
            <div className="sa-table-container">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Title</th><th>Type</th><th>Scope / Authority</th><th>Price</th><th>Date</th><th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map(r => {
                    const tm = TYPE_META[r.type] || TYPE_META.other;
                    const link = r.fileUrl || r.url || '';
                    return (
                      <tr key={r._id} className="group hover:bg-slate-50/80">
                        <td className="min-w-[200px]">
                          <div className="font-semibold text-slate-900 truncate max-w-[220px]">{r.title}</div>
                          {r.description && <div className="text-[10px] text-slate-400 truncate max-w-[220px]">{r.description}</div>}
                        </td>
                        <td><span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border uppercase", tm.color)}>{tm.label}</span></td>
                        <td className="text-slate-600 text-sm">
                          {r.scopeType === 'authority' ? <span className="flex items-center gap-1"><Tag size={12}/>{r.authorityKey}</span>
                           : r.scopeType === 'post' ? <span className="text-[10px] text-indigo-600">Post-specific</span>
                           : <span className="flex items-center gap-1 text-slate-400"><Globe size={12}/>Global</span>}
                        </td>
                        <td>
                          {r.isFree
                            ? <span className="flex items-center gap-1 text-green-700 text-xs font-bold"><Unlock size={12}/>Free</span>
                            : <span className="flex items-center gap-1 text-amber-700 text-xs font-bold"><Lock size={12}/>₹{r.discountedPrice ?? r.price}</span>}
                        </td>
                        <td className="text-slate-400 text-sm whitespace-nowrap">{formatDate(r.createdAt)}</td>
                        <td className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
                            {link && <button onClick={() => copyLink(link, r._id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer">{copiedId===r._id?<Check size={14}/>:<Copy size={14}/>}</button>}
                            {link && <a href={link} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"><ExternalLink size={14}/></a>}
                            <button onClick={() => deleteResource(r._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"><Trash2 size={14}/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {resources.map(r => {
                const tm = TYPE_META[r.type] || TYPE_META.other;
                const link = r.fileUrl || r.url || '';
                return (
                  <div key={r._id} className="group bg-white border border-dashboard-border rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    <div className="bg-slate-50 h-24 flex flex-col items-center justify-center gap-2 border-b border-dashboard-border">
                      <FileText size={28} className="text-blue-400"/>
                      <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded border uppercase", tm.color)}>{tm.label}</span>
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-slate-900 text-sm truncate">{r.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-slate-400">{r.authorityKey || 'Global'}</span>
                        {r.isFree
                          ? <span className="text-[10px] text-green-600 font-bold">Free</span>
                          : <span className="text-[10px] text-amber-600 font-bold">₹{r.discountedPrice ?? r.price}</span>}
                      </div>
                      <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {link && <button onClick={() => copyLink(link, r._id)} className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer">{copiedId===r._id?<Check size={13}/>:<Copy size={13}/>}</button>}
                        {link && <a href={link} target="_blank" rel="noopener noreferrer" className="p-1 text-slate-400 hover:text-slate-700 rounded"><ExternalLink size={13}/></a>}
                        <button onClick={() => deleteResource(r._id)} className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"><Trash2 size={13}/></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setForm(EMPTY_FORM); }} title="Add New Resource">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label-xs">Title *</label>
              <input required value={form.title} onChange={e=>setField('title',e.target.value)} placeholder="e.g. SSC CGL Complete Notes 2026"
                className="input-field"/>
            </div>

            <div>
              <label className="label-xs">Content Type *</label>
              <select required value={form.type} onChange={e=>setField('type',e.target.value)} className="input-field cursor-pointer">
                <option value="book">📚 Book</option>
                <option value="pyq">📄 PYQ Paper</option>
                <option value="notes">🗒️ Notes</option>
                <option value="syllabus">📋 Syllabus</option>
                <option value="video">🎥 Video Course</option>
                <option value="mock_test_ref">✏️ Mock Test (ref)</option>
                <option value="other">📦 Other</option>
              </select>
            </div>

            <div>
              <label className="label-xs">Scope *</label>
              <select required value={form.scopeType} onChange={e=>setField('scopeType',e.target.value)} className="input-field cursor-pointer">
                <option value="global">🌐 Global (all users)</option>
                <option value="authority">🏛️ Authority (SSC/UPSC…)</option>
                <option value="post">📌 Job Post (specific post)</option>
              </select>
            </div>

            {form.scopeType === 'authority' && (
              <div className="col-span-2">
                <label className="label-xs">Conducting Authority Full Name *</label>
                <input required value={form.conductingAuthorityFull} onChange={e=>setField('conductingAuthorityFull',e.target.value)}
                  placeholder="e.g. Staff Selection Commission" className="input-field"/>
              </div>
            )}
            {form.scopeType === 'post' && (
              <div className="col-span-2">
                <label className="label-xs">Job Post ID *</label>
                <input required value={form.jobPostId} onChange={e=>setField('jobPostId',e.target.value)}
                  placeholder="MongoDB ObjectId of the job post" className="input-field"/>
              </div>
            )}

            <div className="col-span-2">
              <label className="label-xs">Resource URL (optional)</label>
              <input value={form.url} onChange={e=>setField('url',e.target.value)} type="url"
                placeholder="https://example.com/file.pdf" className="input-field"/>
            </div>

            <div className="col-span-2">
              <label className="label-xs">Upload File (optional — PDF, Video, etc.)</label>
              <input type="file" onChange={e=>setField('file',e.target.files[0])}
                accept=".pdf,.mp4,.mp3,.webm,.png,.jpg,.jpeg"
                className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer"/>
            </div>

            <div>
              <label className="label-xs">Pricing</label>
              <div className="flex items-center gap-3 mt-1 h-10">
                <button type="button" onClick={()=>setField('isFree',!form.isFree)}
                  className={cn("relative w-11 h-6 rounded-full transition-colors cursor-pointer", form.isFree?"bg-green-500":"bg-slate-300")}>
                  <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform", form.isFree?"translate-x-5":"translate-x-0")}/>
                </button>
                <span className={cn("text-sm font-semibold", form.isFree?"text-green-600":"text-amber-600")}>{form.isFree?'Free':'Paid'}</span>
              </div>
            </div>

            {!form.isFree && (
              <>
                <div>
                  <label className="label-xs">Price (₹) *</label>
                  <input required type="number" min="1" value={form.price} onChange={e=>setField('price',e.target.value)}
                    placeholder="e.g. 299" className="input-field"/>
                </div>
                <div>
                  <label className="label-xs">Discounted Price (₹)</label>
                  <input type="number" min="1" value={form.discountedPrice} onChange={e=>setField('discountedPrice',e.target.value)}
                    placeholder="e.g. 199 (optional)" className="input-field"/>
                </div>
                <div>
                  <label className="label-xs">Sample Pages (Free Preview)</label>
                  <input type="number" min="0" value={form.samplePages} onChange={e=>setField('samplePages',e.target.value)}
                    placeholder="5" className="input-field"/>
                  <p className="text-xs text-slate-400 mt-1">0 = no sample preview</p>
                </div>
              </>
            )}

            <div className="col-span-2">
              <label className="label-xs">Description</label>
              <textarea rows={2} value={form.description} onChange={e=>setField('description',e.target.value)}
                placeholder="Brief description of this resource" className="input-field resize-none"/>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-dashboard-border">
            <button type="button" onClick={()=>{setIsModalOpen(false);setForm(EMPTY_FORM);}}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">Cancel</button>
            <button type="submit" disabled={isSaving}
              className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer">
              {isSaving ? 'Saving…' : 'Add Resource'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
