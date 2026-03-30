import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Eye, Code, Layout } from 'lucide-react';
import api from '@/src/lib/api';
import { Blog, ApiResponse } from '@/src/types';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

import { JsonEditorModal } from './JsonEditorModal';
import { Terminal } from 'lucide-react';

export function BlogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [currentBlog, setCurrentBlog] = useState<Blog | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const { register, control, handleSubmit, setValue, getValues, watch, formState: { errors, isSubmitting } } = useForm<Blog>({
    defaultValues: {
      sections: [{ heading: '', paragraphs: [''], bullets: [''] }]
    }
  });

  const contentHtml = watch('scrapedContent.contentHtml');

  const { fields, append, remove } = useFieldArray({
    control,
    name: "sections"
  });

  useEffect(() => {
    if (isEdit) {
      const fetchBlog = async () => {
        try {
          const res = await api.get<ApiResponse<Blog>>(`/blog/id/${id}`);
          if (res.data.success) {
            const blog = res.data.data;
            setCurrentBlog(blog);
            Object.keys(blog).forEach((key) => {
              setValue(key as keyof Blog, blog[key as keyof Blog]);
            });
            if (blog.scrapedContent?.contentHtml) {
              setValue('scrapedContent.contentHtml', blog.scrapedContent.contentHtml);
            }
          }
        } catch (error) {
          toast.error('Failed to fetch blog details');
        }
      };
      fetchBlog();
    }
  }, [id, isEdit, setValue]);

  const handleJsonSave = async (data: any) => {
    try {
      Object.keys(data).forEach((key) => {
        setValue(key as keyof Blog, data[key]);
      });
      toast.success('Form updated from JSON. Click Save to apply changes.');
      setIsJsonModalOpen(false);
    } catch (error) {
      toast.error('Failed to parse JSON data');
      throw error;
    }
  };

  const onSubmit = async (data: Blog) => {
    try {
      const payload = { data };
      if (isEdit) {
        await api.put(`/blog/id/${id}`, payload);
        toast.success('Blog updated successfully');
      } else {
        await api.post('/blog/add', payload);
        toast.success('Blog created successfully');
      }
      navigate('/blogs');
    } catch (error) {
      toast.error(isEdit ? 'Failed to update blog' : 'Failed to create blog');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/blogs')}
            className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-zinc-100">{isEdit ? 'Edit Blog' : 'Write New Blog'}</h2>
            <p className="text-zinc-400 mt-1">Create engaging content for your audience</p>
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
        title={isEdit ? "Edit Blog as JSON" : "Create Blog from JSON"}
        description="Edit the raw JSON data for this blog post. Changes will update the form."
        initialData={getValues()}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6 shadow-2xl">
          <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-4 mb-6">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Blog Title *</label>
              <input
                {...register('title', { required: 'Title is required' })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Slug *</label>
              <input
                {...register('slug', { required: 'Slug is required' })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Author *</label>
              <input
                {...register('author', { required: 'Author is required' })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Category *</label>
              <input
                {...register('category', { required: 'Category is required' })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Excerpt *</label>
              <textarea
                {...register('excerpt', { required: 'Excerpt is required' })}
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Introduction *</label>
              <textarea
                {...register('intro', { required: 'Intro is required' })}
                rows={5}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-800">
          <h3 className="text-xl font-bold text-white mb-6">Author & Meta (YMYL)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Author Profile URL</label>
              <input
                {...register('authorProfileUrl')}
                type="url"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Author Credentials</label>
              <input
                {...register('authorCredentials')}
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

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
              <div className="flex items-center gap-2">
                <Layout className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Blog Content (HTML)</h3>
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

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Content Sections</h3>
            <button
              type="button"
              onClick={() => append({ heading: '', paragraphs: [''], bullets: [''] })}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6 relative group">
              <button
                type="button"
                onClick={() => remove(index)}
                className="absolute top-6 right-6 p-2 text-zinc-600 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Section Heading</label>
                <input
                  {...register(`sections.${index}.heading` as const)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Paragraphs (One per line)</label>
                <textarea
                  rows={4}
                  onChange={(e) => setValue(`sections.${index}.paragraphs`, e.target.value.split('\n'))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  defaultValue={field.paragraphs.join('\n')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Bullets (One per line)</label>
                <textarea
                  rows={4}
                  onChange={(e) => setValue(`sections.${index}.bullets`, e.target.value.split('\n'))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  defaultValue={field.bullets.join('\n')}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 pt-6 border-t border-zinc-800">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
          >
            <Save className="w-5 h-5" />
            {isSubmitting ? 'Publishing...' : 'Publish Blog'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/blogs')}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-8 py-3 rounded-xl font-bold transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
