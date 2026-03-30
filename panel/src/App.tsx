/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { PostList } from './components/PostList';
import { SectionList } from './components/SectionList';
import { BlogList } from './components/BlogList';
import { SchemeList } from './components/SchemeList';
import { GlobalSearch } from './components/GlobalSearch';
import { ScrapperControl } from './components/ScrapperControl';

import { PostForm } from './components/PostForm';
import { BlogForm } from './components/BlogForm';
import { SchemeForm } from './components/SchemeForm';
import { SectionForm } from './components/SectionForm';

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-orange-500/30 selection:text-orange-200">
        <Sidebar />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/posts" element={<PostList />} />
              <Route path="/posts/add" element={<PostForm />} />
              <Route path="/posts/edit/:id" element={<PostForm />} />
              <Route path="/sections" element={<SectionList />} />
              <Route path="/sections/add" element={<SectionForm />} />
              <Route path="/sections/edit/:id" element={<SectionForm />} />
              <Route path="/blogs" element={<BlogList />} />
              <Route path="/blogs/add" element={<BlogForm />} />
              <Route path="/blogs/edit/:id" element={<BlogForm />} />
              <Route path="/schemes" element={<SchemeList />} />
              <Route path="/schemes/add" element={<SchemeForm />} />
              <Route path="/schemes/edit/:id" element={<SchemeForm />} />
              <Route path="/search" element={<GlobalSearch />} />
              <Route path="/scrapper" element={<ScrapperControl />} />
            </Routes>
          </div>
        </main>
        
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: '#18181b',
              border: '1px solid #27272a',
              color: '#f4f4f5',
            },
          }}
        />
      </div>
    </Router>
  );
}

