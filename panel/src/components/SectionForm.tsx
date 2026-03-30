import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Code, Layout } from 'lucide-react';
import api from '@/src/lib/api';
import { PostSection, ApiResponse } from '@/src/types';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

import { JsonEditorModal } from './JsonEditorModal';
import { Terminal } from 'lucide-react';

export function SectionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [currentSection, setCurrentSection] = useState<PostSection | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const { register, handleSubmit, setValue, getValues, watch, formState: { errors, isSubmitting } } = useForm<PostSection>();

  const contentHtml = watch('scrapedContent.contentHtml');

  useEffect(() => {
    if (isEdit) {
      const fetchSection = async () => {
        try {
          const res = await api.get<ApiResponse<PostSection>>(`/postsection/id/${id}`);
          if (res.data.success) {
            const section = res.data.data;
            setCurrentSection(section);
            Object.keys(section).forEach((key) => {
              setValue(key as keyof PostSection, section[key as keyof PostSection]);
            });
            if (section.scrapedContent?.contentHtml) {
              setValue('scrapedContent.contentHtml', section.scrapedContent.contentHtml);
            }
          }
        } catch (error) {
          toast.error('Failed to fetch section details');
        }
      };
      fetchSection();
    }
  }, [id, isEdit, setValue]);

  const handleJsonSave = async (data: any) => {
    try {
      Object.keys(data).forEach((key) => {
        setValue(key as keyof PostSection, data[key]);
      });
      toast.success('Form updated from JSON. Click Save to apply changes.');
      setIsJsonModalOpen(false);
    } catch (error) {
      toast.error('Failed to parse JSON data');
      throw error;
    }
  };

  const onSubmit = async (data: PostSection) => {
    try {
      const payload = { data };
      if (isEdit) {
        await api.put(`/postsection/id/${id}`, payload);
        toast.success('Section updated successfully');
      } else {
        await api.post('/postsection/add', payload);
        toast.success('Section created successfully');
      }
      navigate('/sections');
    } catch (error) {
      toast.error(isEdit ? 'Failed to update section' : 'Failed to create section');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/sections')}
            className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-zinc-100">{isEdit ? 'Edit Section' : 'Create Section'}</h2>
            <p className="text-zinc-400 mt-1">Define a new job recruitment section</p>
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
        title={isEdit ? "Edit Section as JSON" : "Create Section from JSON"}
        description="Edit the raw JSON data for this section. Changes will update the form."
        initialData={getValues()}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Section Name *</label>
            <input
              {...register('name', { required: 'Name is required' })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Canonical URL</label>
            <input
              {...register('canonicalUrl')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              placeholder="auto-generated if blank"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Status</label>
            <select
              {...register('status')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Source Section Name</label>
            <input
              {...register('sourceSectionName')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Source Section URL</label>
            <input
              {...register('sourceSectionUrl')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>
        </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
              <div className="flex items-center gap-2">
                <Layout className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Section Content (HTML)</h3>
              </div>
              <div className="flex bg-zinc-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewMode('edit')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2",
                    viewMode === 'edit' ? "bg-orange-500 text-white shadow-lg" : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <Code className="w-3.5 h-3.5" />
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2",
                    viewMode === 'preview' ? "bg-orange-500 text-white shadow-lg" : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
              </div>
            </div>

            <div className="p-0 min-h-[500px] flex flex-col">
              {viewMode === 'edit' ? (
                <textarea
                  {...register('scrapedContent.contentHtml')}
                  className="flex-1 w-full min-h-[600px] bg-zinc-950 p-6 font-mono text-sm text-zinc-300 focus:outline-none resize-none custom-scrollbar border-none"
                  placeholder="Paste or write HTML content here..."
                  spellCheck={false}
                />
              ) : (
                <div className="flex-1 bg-white p-8 overflow-auto custom-scrollbar min-h-[600px]">
                  <div 
                    className="prose prose-zinc max-w-none sarkari-content"
                    dangerouslySetInnerHTML={{ __html: contentHtml || '<p class="text-zinc-400 italic">No content to preview</p>' }}
                  />
                </div>
              )}
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
            {isSubmitting ? 'Saving...' : 'Save Section'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/sections')}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-8 py-3 rounded-xl font-bold transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
