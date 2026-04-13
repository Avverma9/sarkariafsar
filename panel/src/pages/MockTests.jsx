import React, { useState, useEffect } from 'react';
import {
  Upload, Trash2, ClipboardCheck, AlertTriangle,
  ChevronLeft, ChevronRight, CheckCircle, Lock, Unlock, Search
} from 'lucide-react';
import api from '../services/api';
import { cn, formatDate } from '../lib/utils';
import Modal from '../components/Modal';

const STATUS_COLOR = {
  published: 'bg-green-100 text-green-700 border-green-200',
  draft:     'bg-slate-100 text-slate-600 border-slate-200',
  review:    'bg-orange-100 text-orange-700 border-orange-200',
  archived:  'bg-red-100 text-red-600 border-red-200',
};
const DIFF_COLOR = {
  easy:   'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  hard:   'bg-red-100 text-red-700',
  mixed:  'bg-indigo-100 text-indigo-700',
};

const EMPTY_FORM = {
  title: '', conductingAuthorityFull: '', jobPostId: '',
  durationMin: '60', difficulty: 'mixed',
  examYear: '', examStage: '',
  isFree: true, price: '', discountedPrice: '',
  pdf: null,
};

export default function MockTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploadResult, setUploadResult] = useState(null);

  const fetchTests = async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get('/mock-tests', {
        params: { page, limit: 15, ...(statusFilter && { status: statusFilter }), ...(search && { search }) }
      });
      setTests(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      setError('Unable to load mock tests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTests(); }, [page, statusFilter]);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.pdf) return alert('Please select a PDF file');
    setIsSaving(true); setUploadResult(null);
    try {
      const fd = new FormData();
      fd.append('pdf', form.pdf);
      fd.append('title', form.title);
      fd.append('conductingAuthorityFull', form.conductingAuthorityFull);
      if (form.jobPostId) fd.append('jobPostId', form.jobPostId);
      fd.append('durationMin', form.durationMin);
      fd.append('difficulty', form.difficulty);
      if (form.examYear) fd.append('examYear', form.examYear);
      if (form.examStage) fd.append('examStage', form.examStage);
      fd.append('isFree', String(form.isFree));
      if (!form.isFree) {
        fd.append('price', form.price);
        if (form.discountedPrice) fd.append('discountedPrice', form.discountedPrice);
      }
      const res = await api.post('/mock-tests/upload-pdf', fd);
      setUploadResult(res.data);
      setForm(EMPTY_FORM);
      fetchTests();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setIsSaving(false);
    }
  };

  const publishTest = async (id) => {
    try {
      await api.post(`/mock-tests/${id}/publish`);
      setTests(prev => prev.map(t => t._id === id ? { ...t, status: 'published' } : t));
    } catch (err) {
      alert(err.response?.data?.message || 'Publish failed');
    }
  };

  const deleteTest = async (id) => {
    if (!window.confirm('Delete this mock test permanently?')) return;
    try {
      await api.delete(`/mock-tests/${id}`);
      setTests(prev => prev.filter(t => t._id !== id));
    } catch {
      alert('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mock Tests Manager</h2>
          <p className="text-sm text-slate-500 mt-1">Upload PDFs, set pricing and difficulty, publish tests.</p>
        </div>
        <button onClick={() => { setIsModalOpen(true); setUploadResult(null); }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer">
          <Upload size={18} /> Upload PDF Test
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-dashboard-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-dashboard-border flex flex-wrap gap-3 items-center justify-between bg-slate-50/50">
          <div className="flex gap-2">
            {[['','All'],['draft','Draft'],['review','Review'],['published','Published'],['archived','Archived']].map(([val,lbl])=>(
              <button key={val} onClick={()=>{setStatusFilter(val);setPage(1);}}
                className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border transition-all cursor-pointer whitespace-nowrap",
                  statusFilter===val?"bg-slate-900 text-white border-slate-900":"bg-white text-slate-500 border-dashboard-border hover:border-slate-400")}>
                {lbl}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-52">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input type="text" placeholder="Search tests…" value={search} onChange={e=>setSearch(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&fetchTests()}
              className="w-full pl-8 pr-3 py-2 text-sm border border-dashboard-border rounded-xl outline-none focus:border-blue-500"/>
          </div>
        </div>

        <div className="overflow-x-auto">
          {error && <div className="p-4 m-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 text-sm flex items-center gap-2"><AlertTriangle size={15}/>{error}</div>}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="col-header">Test Title</th>
                <th className="col-header">Authority</th>
                <th className="col-header">Difficulty</th>
                <th className="col-header">Qs</th>
                <th className="col-header">Price</th>
                <th className="col-header">Status</th>
                <th className="col-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashboard-border">
              {loading ? [1,2,3].map(i=>(
                <tr key={i} className="animate-pulse"><td colSpan="7" className="p-4"><div className="h-10 bg-slate-100 rounded-lg"/></td></tr>
              )) : tests.length > 0 ? tests.map(t => (
                <tr key={t._id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="data-cell max-w-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                        <ClipboardCheck size={15}/>
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate max-w-[200px]">{t.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{t.durationMin} mins</div>
                      </div>
                    </div>
                  </td>
                  <td className="data-cell">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">{t.authorityKey || 'General'}</span>
                  </td>
                  <td className="data-cell">
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", DIFF_COLOR[t.difficulty] || DIFF_COLOR.mixed)}>
                      {t.difficulty || 'mixed'}
                    </span>
                  </td>
                  <td className="data-cell font-mono text-slate-600 text-sm">{t.totalQuestions || 0}</td>
                  <td className="data-cell">
                    {t.isFree
                      ? <span className="flex items-center gap-1 text-green-700 text-xs font-bold"><Unlock size={11}/>Free</span>
                      : <span className="flex items-center gap-1 text-amber-700 text-xs font-bold"><Lock size={11}/>₹{t.discountedPrice ?? t.price}</span>}
                  </td>
                  <td className="data-cell">
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border", STATUS_COLOR[t.status] || STATUS_COLOR.draft)}>
                      {t.status || 'draft'}
                    </span>
                  </td>
                  <td className="data-cell text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {t.status !== 'published' && (
                        <button onClick={()=>publishTest(t._id)} title="Publish"
                          className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all cursor-pointer">
                          <CheckCircle size={15}/>
                        </button>
                      )}
                      <button onClick={()=>deleteTest(t._id)} title="Delete"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer">
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="p-12 text-center text-slate-400 text-sm">No mock tests found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-dashboard-border flex items-center justify-between bg-slate-50/50">
          <p className="text-xs text-slate-500">Page <b className="text-slate-900">{page}</b> of <b className="text-slate-900">{totalPages}</b></p>
          <div className="flex items-center gap-2">
            <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="p-2 border border-dashboard-border rounded-lg hover:bg-white disabled:opacity-40 transition-all cursor-pointer"><ChevronLeft size={15}/></button>
            <button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)} className="p-2 border border-dashboard-border rounded-lg hover:bg-white disabled:opacity-40 transition-all cursor-pointer"><ChevronRight size={15}/></button>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={()=>{setIsModalOpen(false);setUploadResult(null);setForm(EMPTY_FORM);}} title="Upload PDF Mock Test">
        {uploadResult ? (
          <div className="text-center py-6">
            <CheckCircle size={48} className="mx-auto mb-4 text-green-500"/>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Upload Successful!</h3>
            <p className="text-slate-500 text-sm mb-1">{uploadResult.data?.totalQuestions || 0} questions extracted</p>
            <p className="text-slate-400 text-xs">{uploadResult.message}</p>
            <div className="flex gap-3 justify-center mt-6">
              <button onClick={()=>setUploadResult(null)} className="px-5 py-2.5 text-sm font-bold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 cursor-pointer">Upload Another</button>
              <button onClick={()=>{setIsModalOpen(false);setUploadResult(null);}} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 cursor-pointer">Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label-xs">Test Title *</label>
                <input required value={form.title} onChange={e=>setField('title',e.target.value)} placeholder="e.g. SSC CGL Tier-1 Mock Test 2026" className="input-field"/>
              </div>
              <div>
                <label className="label-xs">Conducting Authority</label>
                <input value={form.conductingAuthorityFull} onChange={e=>setField('conductingAuthorityFull',e.target.value)} placeholder="e.g. Staff Selection Commission" className="input-field"/>
              </div>
              <div>
                <label className="label-xs">Job Post ID (optional)</label>
                <input value={form.jobPostId} onChange={e=>setField('jobPostId',e.target.value)} placeholder="MongoDB ObjectId" className="input-field"/>
              </div>
              <div>
                <label className="label-xs">Duration (minutes) *</label>
                <input required type="number" min="5" value={form.durationMin} onChange={e=>setField('durationMin',e.target.value)} className="input-field"/>
              </div>
              <div>
                <label className="label-xs">Difficulty *</label>
                <select required value={form.difficulty} onChange={e=>setField('difficulty',e.target.value)} className="input-field cursor-pointer">
                  <option value="easy">🟢 Easy</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="hard">🔴 Hard</option>
                  <option value="mixed">🔀 Mixed</option>
                </select>
              </div>
              <div>
                <label className="label-xs">Exam Year</label>
                <input type="number" min="2000" max="2030" value={form.examYear} onChange={e=>setField('examYear',e.target.value)} placeholder="e.g. 2025" className="input-field"/>
              </div>
              <div>
                <label className="label-xs">Exam Stage</label>
                <input value={form.examStage} onChange={e=>setField('examStage',e.target.value)} placeholder="e.g. Tier-1, Prelims" className="input-field"/>
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
                    <input required type="number" min="1" value={form.price} onChange={e=>setField('price',e.target.value)} placeholder="e.g. 99" className="input-field"/>
                  </div>
                  <div>
                    <label className="label-xs">Discounted Price (₹)</label>
                    <input type="number" min="1" value={form.discountedPrice} onChange={e=>setField('discountedPrice',e.target.value)} placeholder="e.g. 79 (optional)" className="input-field"/>
                  </div>
                </>
              )}
              <div className="col-span-2">
                <label className="label-xs">PDF File * <span className="text-slate-400 normal-case font-normal">(text-based, not scanned)</span></label>
                <input type="file" accept=".pdf" required onChange={e=>setField('pdf',e.target.files[0])}
                  className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer"/>
                <p className="text-[10px] text-slate-400 mt-1">Questions must be numbered (1. / Q1. etc.) with A) B) C) D) options and Answer: line.</p>
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-dashboard-border">
              <button type="button" onClick={()=>{setIsModalOpen(false);setForm(EMPTY_FORM);}}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">Cancel</button>
              <button type="submit" disabled={isSaving}
                className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer">
                {isSaving ? 'Uploading & Extracting…' : 'Upload PDF'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
