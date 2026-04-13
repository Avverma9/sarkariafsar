import React from 'react';

export default function PlaceholderPage({ title }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-12">
      <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mb-6">
        <span className="text-3xl font-bold">?</span>
      </div>
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      <p className="text-slate-500 mt-2 max-w-md">
        This module is currently under development. We are working hard to bring you the full experience.
      </p>
      <button 
        onClick={() => window.history.back()}
        className="mt-8 px-6 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all"
      >
        Go Back
      </button>
    </div>
  );
}
