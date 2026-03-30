import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X, Eye, Code, Layout } from 'lucide-react';
import api from '@/src/lib/api';
import { JobPost, ApiResponse } from '@/src/types';
import { toast } from 'sonner';
import { cn } from '@/src/lib/utils';

import { JsonEditorModal } from './JsonEditorModal';
import { Terminal } from 'lucide-react';

export function PostForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [currentPost, setCurrentPost] = useState<JobPost | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const { register, handleSubmit, setValue, getValues, watch, formState: { errors, isSubmitting } } = useForm<JobPost>();

  const contentHtml = watch('scrapedContent.contentHtml');

  useEffect(() => {
    if (isEdit) {
      const fetchPost = async () => {
        try {
          const res = await api.get<ApiResponse<JobPost>>(`/post/id/${id}`);
          if (res.data.success) {
            const post = res.data.data;
            setCurrentPost(post);
            Object.keys(post).forEach((key) => {
              setValue(key as keyof JobPost, post[key as keyof JobPost]);
            });
            if (post.tags) {
              setValue('tags', post.tags);
            }
            if (post.scrapedContent?.contentHtml) {
              setValue('scrapedContent.contentHtml', post.scrapedContent.contentHtml);
            }
          }
        } catch (error) {
          toast.error('Failed to fetch post details');
        }
      };
      fetchPost();
    }
  }, [id, isEdit, setValue]);

  const handleJsonSave = async (data: any) => {
    try {
      // Update form values with the edited JSON
      Object.keys(data).forEach((key) => {
        setValue(key as keyof JobPost, data[key]);
      });
      toast.success('Form updated from JSON. Click Save to apply changes.');
      setIsJsonModalOpen(false);
    } catch (error) {
      toast.error('Failed to parse JSON data');
      throw error;
    }
  };

  const onSubmit = async (data: JobPost) => {
    try {
      const payload = { data };
      if (isEdit) {
        await api.put(`/post/id/${id}`, payload);
        toast.success('Post updated successfully');
      } else {
        await api.post('/post/add', payload);
        toast.success('Post created successfully');
      }
      navigate('/posts');
    } catch (error) {
      toast.error(isEdit ? 'Failed to update post' : 'Failed to create post');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/posts')}
            className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-zinc-100">{isEdit ? 'Edit Job Post' : 'Create Job Post'}</h2>
            <p className="text-zinc-400 mt-1">Fill in the details for the recruitment post</p>
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
        title={isEdit ? "Edit Post as JSON" : "Create Post from JSON"}
        description="Edit the raw JSON data for this job post. Changes will update the form."
        initialData={getValues()}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Post Title *</label>
            <input
              {...register('title', { required: 'Title is required' })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              placeholder="e.g. Assistant Engineer Recruitment 2026"
            />
            {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Slug (Optional)</label>
            <input
              {...register('slug')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              placeholder="auto-generated if blank"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Job Title</label>
            <input
              {...register('jobtitle')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Category</label>
            <input
              {...register('category')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Section Name</label>
            <input
              {...register('sectionName')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Section Canonical URL</label>
            <input
              {...register('sectionCanonicalUrl')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Apply Last Date</label>
            <input
              type="datetime-local"
              {...register('applyLastDate')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
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
        </div>

        <div className="pt-6 border-t border-zinc-800">
          <h3 className="text-xl font-bold text-white mb-6">Job Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Salary</label>
              <input
                {...register('salary')}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Location</label>
              <input
                {...register('location')}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Total Vacancies</label>
              <input
                {...register('totalVacancies')}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Age Limit</label>
              <input
                {...register('ageLimit')}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Application Fee</label>
              <input
                {...register('applicationFee')}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-800">
          <h3 className="text-xl font-bold text-white mb-6">SEO Content (1000+ Words)</h3>
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Selection Process</label>
              <textarea
                {...register('selectionProcess')}
                rows={4}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Exam Preparation Strategy</label>
              <textarea
                {...register('examPreparationStrategy')}
                rows={4}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Syllabus Breakdown</label>
              <textarea
                {...register('syllabusBreakdown')}
                rows={4}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Physical Test Details (PET/PST)</label>
              <textarea
                {...register('physicalTestDetails')}
                rows={4}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-800">
          <h3 className="text-xl font-bold text-white mb-6">Author & Meta (YMYL)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
              <div className="flex items-center gap-2">
                <Layout className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Post Content (HTML)</h3>
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
            {isSubmitting ? 'Saving...' : 'Save Post'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/posts')}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-8 py-3 rounded-xl font-bold transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
