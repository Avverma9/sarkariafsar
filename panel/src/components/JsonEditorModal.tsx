import React, { useState } from 'react';
import { X, Copy, Check, AlertCircle, Save, Sparkles, Loader2, SplitSquareHorizontal } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { toast } from 'sonner';
import { enhanceJsonWithGemini } from '@/src/lib/gemini';

interface JsonEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: any;
  title: string;
  description?: string;
}

export function JsonEditorModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData = {}, 
  title,
  description 
}: JsonEditorModalProps) {
  const [jsonText, setJsonText] = useState(JSON.stringify(initialData, null, 2));
  const [originalJsonText, setOriginalJsonText] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync jsonText when modal opens or initialData changes
  React.useEffect(() => {
    if (isOpen) {
      setJsonText(JSON.stringify(initialData, null, 2));
      setOriginalJsonText(null);
      setShowDiff(false);
      setError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    toast.success('JSON copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnhance = async () => {
    setError(null);
    setIsEnhancing(true);
    try {
      // Validate JSON first
      JSON.parse(jsonText);
      
      toast.info('Gemini is rephrasing and enhancing your content...');
      
      // Save current state as original before enhancing
      setOriginalJsonText(jsonText);
      
      const enhancedJsonString = await enhanceJsonWithGemini(jsonText);
      
      // Format the returned JSON nicely
      const parsed = JSON.parse(enhancedJsonString);
      setJsonText(JSON.stringify(parsed, null, 2));
      setShowDiff(true); // Automatically show diff after enhancement
      toast.success('Content successfully enhanced by Gemini!');
    } catch (e: any) {
      setError(e.message || 'Failed to enhance JSON. Please ensure it is valid JSON.');
      toast.error('Failed to enhance content');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    try {
      const parsedData = JSON.parse(jsonText);
      setIsSaving(true);
      await onSave(parsedData);
      onClose();
    } catch (e: any) {
      setError(e.message || 'Invalid JSON format');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={cn(
        "bg-zinc-900 border border-zinc-800 w-full rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-all duration-300",
        showDiff ? "max-w-7xl" : "max-w-4xl"
      )}>
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            {description && <p className="text-zinc-500 text-sm mt-1">{description}</p>}
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-hidden flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              {showDiff ? 'Compare Changes' : 'JSON Editor'}
            </span>
            <div className="flex items-center gap-4">
              {originalJsonText && (
                <button 
                  onClick={() => setShowDiff(!showDiff)}
                  className={cn(
                    "flex items-center gap-2 text-xs font-bold transition-colors",
                    showDiff ? "text-orange-400 hover:text-orange-300" : "text-zinc-400 hover:text-white"
                  )}
                >
                  <SplitSquareHorizontal className="w-4 h-4" />
                  {showDiff ? 'Hide Result' : 'See Result'}
                </button>
              )}
              <button 
                onClick={handleEnhance}
                disabled={isEnhancing}
                className="flex items-center gap-2 text-xs font-bold text-orange-400 hover:text-orange-300 disabled:opacity-50 transition-colors"
              >
                {isEnhancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isEnhancing ? 'Enhancing...' : 'Rephrase with Gemini'}
              </button>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy JSON'}
              </button>
            </div>
          </div>

          <div className="flex-1 relative group min-h-[400px]">
            {showDiff ? (
              <div className="flex gap-4 h-full">
                <div className="flex-1 flex flex-col gap-2">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Before (Original)</span>
                  <textarea
                    readOnly
                    value={originalJsonText || ''}
                    className="w-full h-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 font-mono text-sm text-zinc-500 focus:outline-none resize-none custom-scrollbar min-h-[400px]"
                    spellCheck={false}
                  />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">After (Enhanced)</span>
                  <textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    className={cn(
                      "w-full h-full bg-zinc-950 border rounded-xl p-4 font-mono text-sm text-zinc-300 focus:outline-none focus:ring-2 transition-all resize-none custom-scrollbar min-h-[400px]",
                      error ? "border-red-500/50 focus:ring-red-500/20" : "border-orange-500/50 focus:ring-orange-500/20"
                    )}
                    spellCheck={false}
                  />
                </div>
              </div>
            ) : (
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className={cn(
                  "w-full h-full bg-zinc-950 border rounded-xl p-4 font-mono text-sm text-zinc-300 focus:outline-none focus:ring-2 transition-all resize-none custom-scrollbar min-h-[400px]",
                  error ? "border-red-500/50 focus:ring-red-500/20" : "border-zinc-800 focus:ring-orange-500/20 focus:border-orange-500/50"
                )}
                spellCheck={false}
              />
            )}
            
            {error && (
              <div className="absolute bottom-4 left-4 right-4 bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-3 animate-in slide-in-from-bottom-2">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-xs text-red-400 font-medium">{error}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 flex items-center gap-4 bg-zinc-950/30">
          <button
            onClick={handleSave}
            disabled={isSaving || isEnhancing}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Processing...' : 'Save Changes'}
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
