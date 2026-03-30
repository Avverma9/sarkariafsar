import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import api from '@/src/lib/api';
import { Scheme, ApiResponse } from '@/src/types';
import { toast } from 'sonner';

import { JsonEditorModal } from './JsonEditorModal';
import { Terminal } from 'lucide-react';

export function SchemeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [currentScheme, setCurrentScheme] = useState<Scheme | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const { register, handleSubmit, setValue, getValues, formState: { errors, isSubmitting } } = useForm<Scheme>();

  useEffect(() => {
    if (isEdit) {
      const fetchScheme = async () => {
        try {
          const res = await api.get<ApiResponse<Scheme>>(`/schemes/${id}`);
          if (res.data.success) {
            const scheme = res.data.data;
            setCurrentScheme(scheme);
            Object.keys(scheme).forEach((key) => {
              setValue(key as keyof Scheme, scheme[key as keyof Scheme]);
            });
          }
        } catch (error) {
          toast.error('Failed to fetch scheme details');
        }
      };
      fetchScheme();
    }
  }, [id, isEdit, setValue]);

  const handleJsonSave = async (data: any) => {
    try {
      Object.keys(data).forEach((key) => {
        setValue(key as keyof Scheme, data[key]);
      });
      toast.success('Form updated from JSON. Click Save to apply changes.');
      setIsJsonModalOpen(false);
    } catch (error) {
      toast.error('Failed to parse JSON data');
      throw error;
    }
  };

  const onSubmit = async (data: Scheme) => {
    try {
      const payload = { data };
      if (isEdit) {
        await api.put(`/schemes/${id}`, payload);
        toast.success('Scheme updated successfully');
      } else {
        await api.post('/schemes/add', payload);
        toast.success('Scheme created successfully');
      }
      navigate('/schemes');
    } catch (error) {
      toast.error(isEdit ? 'Failed to update scheme' : 'Failed to create scheme');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/schemes')}
            className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-zinc-100">{isEdit ? 'Edit Scheme' : 'Add New Scheme'}</h2>
            <p className="text-zinc-400 mt-1">Provide government scheme details</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsJsonModalOpen(true)}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all border border-zinc-700"
        >
          <Terminal className="w-4 h-4 text-orange-500" />
          Edit as JSON
        </button>
      </div>

      <JsonEditorModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        onSave={handleJsonSave}
        title={isEdit ? "Edit Scheme as JSON" : "Create Scheme from JSON"}
        description="Edit the raw JSON data for this scheme. Changes will update the form."
        initialData={getValues()}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Scheme Title *</label>
            <input
              {...register('schemeTitle', { required: 'Title is required' })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Scheme Type</label>
            <input
              {...register('schemetype')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">State</label>
            <input
              {...register('state')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">City</label>
            <input
              {...register('city')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Apply Link</label>
            <input
              {...register('applyLink')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Start Date</label>
            <input
              type="date"
              {...register('schemeStartDate')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Last Date</label>
            <input
              type="date"
              {...register('schemeLastDate')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">About Scheme</label>
            <textarea
              {...register('aboutScheme')}
              rows={5}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-800">
          <h3 className="text-xl font-bold text-white mb-6">Author & Meta (YMYL)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Official Source URL *</label>
              <input
                {...register('officialSourceUrl', { 
                  required: 'Official Source URL is required',
                  pattern: {
                    value: /^https?:\/\/[a-zA-Z0-9.-]+\.(gov\.in|nic\.in)(\/.*)?$/,
                    message: 'Must be a valid .gov.in or .nic.in URL'
                  }
                })}
                type="url"
                placeholder="https://example.gov.in"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
              {errors.officialSourceUrl && <p className="text-red-500 text-xs">{errors.officialSourceUrl.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Author Name</label>
              <input
                {...register('authorName')}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Author Profile URL</label>
              <input
                {...register('authorProfileUrl')}
                type="url"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Author Bio</label>
              <textarea
                {...register('authorBio')}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Word Count (Auto)</label>
              <input
                {...register('wordCount')}
                readOnly
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-500 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2 flex items-center gap-3 pt-8">
              <input
                type="checkbox"
                {...register('noIndex')}
                disabled
                className="w-5 h-5 rounded border-zinc-800 bg-zinc-950 text-orange-500 focus:ring-orange-500/20 cursor-not-allowed"
              />
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">No Index (Auto-set if thin content)</label>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-6 border-t border-zinc-800">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
          >
            <Save className="w-5 h-5" />
            {isSubmitting ? 'Saving...' : 'Save Scheme'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/schemes')}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-8 py-3 rounded-xl font-bold transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
