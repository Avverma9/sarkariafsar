import React, { useState } from 'react';
import { Search as SearchIcon, FileText, BookOpen, ShieldCheck, ArrowRight } from 'lucide-react';
import api from '@/src/lib/api';
import { ApiResponse } from '@/src/types';
import { cn } from '@/src/lib/utils';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length < 3) return;

    setLoading(true);
    try {
      const res = await api.get<ApiResponse<any[]>>(`/search/search-with-title?title=${query}`);
      if (res.data.success) {
        setResults(res.data.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'post': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'blog': return <BookOpen className="w-4 h-4 text-purple-500" />;
      case 'scheme': return <ShieldCheck className="w-4 h-4 text-green-500" />;
      default: return <FileText className="w-4 h-4 text-zinc-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-white tracking-tight">Global Search</h2>
        <p className="text-zinc-500">Find anything across posts, blogs, and schemes</p>
      </div>

      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <SearchIcon className="ml-6 w-6 h-6 text-zinc-500" />
          <input
            type="text"
            placeholder="Type at least 3 characters to search..."
            className="w-full bg-transparent py-6 px-4 text-xl text-white focus:outline-none placeholder:text-zinc-700"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || query.length < 3}
            className="mr-4 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white px-8 py-3 rounded-xl font-bold transition-all active:scale-95"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {results.length > 0 ? (
          results.map((item, i) => (
            <div 
              key={i} 
              className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-950 rounded-lg">
                  {getTypeIcon(item.type)}
                </div>
                <div>
                  <h4 className="text-zinc-100 font-medium group-hover:text-orange-500 transition-colors">{item.title}</h4>
                  <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">{item.type}</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          ))
        ) : query.length >= 3 && !loading ? (
          <div className="text-center py-20 text-zinc-600">
            <p>No results found for "{query}"</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
