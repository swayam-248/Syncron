import React, { useState } from 'react';
import { Note } from '../types';
import { 
  Eye, 
  Edit3, 
  Columns, 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Quote, 
  Code, 
  Hash, 
  Clock, 
  FileText,
  Copy,
  Check,
  HardDrive,
  CloudUpload
} from 'lucide-react';
import { cn } from '../lib/utils';

interface EditorProps {
  note: Note | null;
  onUpdateNote: (updated: Partial<Note>) => void;
}

type ViewMode = 'write' | 'preview' | 'split';

const EMOJI_OPTIONS = ['⚡', '📐', '💡', '📝', '🚀', '🧠', '🎯', '🌿', '✨', '🔥', '📚', '🛠️'];

function formatEditorTime(timestamp: number): string {
  if (!timestamp) return 'Just now';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const Editor: React.FC<EditorProps> = ({ note, onUpdateNote }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('write');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  if (!note) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-8">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-soft flex items-center justify-center mb-4 text-slate-300 border border-slate-100">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-slate-700 mb-1">No note selected</h3>
        <p className="text-xs text-slate-400 max-w-sm text-center">
          Select a note from the sidebar or click 'New Note' to create a local UUID document in IndexedDB.
        </p>
      </div>
    );
  }

  const wordCount = note.content.trim() ? note.content.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(note.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('syncron-markdown-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const replacement = prefix + (selected || 'text') + suffix;

    const newContent = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    onUpdateNote({ content: newContent });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 0);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const currentTags = note.tags || [];
      if (!currentTags.includes(newTagInput.trim())) {
        onUpdateNote({ tags: [...currentTags, newTagInput.trim()] });
      }
      setNewTagInput('');
      setIsAddingTag(false);
    } else if (e.key === 'Escape') {
      setIsAddingTag(false);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = note.tags || [];
    onUpdateNote({ tags: currentTags.filter(t => t !== tagToRemove) });
  };

  return (
    <main className="flex-1 h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Editor Context Toolbar */}
      <div className="px-6 py-2.5 bg-white/70 backdrop-blur-sm border-b border-slate-200/60 flex items-center justify-between">
        {/* Left Toolbar formatting actions */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleInsertMarkdown('**', '**')}
            title="Bold (Ctrl+B)"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleInsertMarkdown('*', '*')}
            title="Italic (Ctrl+I)"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <div className="h-3.5 w-[1px] bg-slate-200 mx-1" />
          <button
            onClick={() => handleInsertMarkdown('# ')}
            title="Heading 1"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleInsertMarkdown('## ')}
            title="Heading 2"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <div className="h-3.5 w-[1px] bg-slate-200 mx-1" />
          <button
            onClick={() => handleInsertMarkdown('- ')}
            title="Bullet list"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleInsertMarkdown('1. ')}
            title="Numbered list"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleInsertMarkdown('- [ ] ')}
            title="Task list item"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleInsertMarkdown('> ')}
            title="Blockquote"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleInsertMarkdown('```\n', '\n```')}
            title="Code block"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Toolbar: View mode toggles & Copy */}
        <div className="flex items-center space-x-2">
          {/* Copy Markdown Button */}
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* View mode switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setViewMode('write')}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                viewMode === 'write'
                  ? "bg-white text-slate-900 shadow-sm font-semibold"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Edit3 className="w-3 h-3" />
              <span>Write</span>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                viewMode === 'preview'
                  ? "bg-white text-slate-900 shadow-sm font-semibold"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={cn(
                "hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                viewMode === 'split'
                  ? "bg-white text-slate-900 shadow-sm font-semibold"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Columns className="w-3 h-3" />
              <span>Split</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Body Canvas */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex justify-center">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-card border border-slate-100 p-6 sm:p-10 flex flex-col min-h-[calc(100vh-140px)] transition-all">
          {/* Document Header & Icon */}
          <div className="mb-6 space-y-4">
            {/* Emoji / Icon Selector */}
            <div className="relative inline-block">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-4xl hover:scale-110 active:scale-95 transition-transform p-1 rounded-xl hover:bg-slate-50 cursor-pointer"
                title="Change icon"
              >
                {note.icon || '📝'}
              </button>

              {showEmojiPicker && (
                <div className="absolute top-full left-0 mt-2 p-2 bg-white rounded-2xl shadow-xl border border-slate-200/80 z-20 flex flex-wrap gap-1 w-52">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onUpdateNote({ icon: emoji });
                        setShowEmojiPicker(false);
                      }}
                      className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-lg transition-colors cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Document Title Input */}
            <div>
              <input
                type="text"
                value={note.title}
                onChange={(e) => onUpdateNote({ title: e.target.value })}
                placeholder="Untitled document..."
                className="w-full text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 placeholder:text-slate-300 focus:outline-none bg-transparent"
              />
            </div>

            {/* Metadata & Tag Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-b border-slate-100 pb-4 text-xs text-slate-500">
              {/* IndexedDB Auto-save status */}
              <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/50">
                {note.syncStatus === 'pending_push' ? (
                  <>
                    <HardDrive className="w-3 h-3 text-amber-600" />
                    <span className="text-amber-700 font-medium">Saved to Dexie DB</span>
                  </>
                ) : (
                  <>
                    <HardDrive className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700 font-medium">IndexedDB Synced</span>
                  </>
                )}
              </div>

              {/* Timestamp */}
              <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/50">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Modified {formatEditorTime(note.updatedAt)}</span>
              </div>

              {/* Word count */}
              <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/50 font-mono text-[11px]">
                <span>{wordCount} words</span>
                <span className="text-slate-300">•</span>
                <span>{readingTime} min read</span>
              </div>

              {/* UUID Tooltip Badge */}
              <div 
                className="hidden lg:flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/50 font-mono text-[10px] text-slate-400"
                title={`UUID: ${note.id}`}
              >
                <span>ID: {note.id.substring(0, 8)}...</span>
              </div>

              {/* Tags */}
              {note.tags?.map((tag) => (
                <span
                  key={tag}
                  className="group inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Hash className="w-3 h-3 text-slate-400" />
                  <span>{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}

              {isAddingTag ? (
                <input
                  type="text"
                  autoFocus
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  onBlur={() => setIsAddingTag(false)}
                  placeholder="tag name + enter"
                  className="bg-slate-50 text-slate-700 text-xs px-2.5 py-1 rounded-lg border border-slate-300 focus:outline-none focus:border-slate-500 w-28"
                />
              ) : (
                <button
                  onClick={() => setIsAddingTag(true)}
                  className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  + Add Tag
                </button>
              )}
            </div>
          </div>

          {/* Editor & Preview Area */}
          <div className="flex-1 flex flex-col">
            {viewMode === 'write' && (
              <textarea
                id="syncron-markdown-textarea"
                value={note.content}
                onChange={(e) => onUpdateNote({ content: e.target.value })}
                placeholder="Start typing in Markdown... (e.g. # Heading, - list item, > quote)"
                className="editor-textarea w-full flex-1 min-h-[450px] bg-transparent text-slate-800 text-base leading-relaxed placeholder:text-slate-300 focus:outline-none resize-none font-sans"
              />
            )}

            {viewMode === 'preview' && (
              <div className="flex-1 min-h-[450px]">
                <RenderedMarkdown content={note.content} />
              </div>
            )}

            {viewMode === 'split' && (
              <div className="flex-1 grid grid-cols-2 gap-8 min-h-[450px]">
                <textarea
                  id="syncron-markdown-textarea"
                  value={note.content}
                  onChange={(e) => onUpdateNote({ content: e.target.value })}
                  placeholder="Start typing in Markdown..."
                  className="editor-textarea w-full h-full bg-transparent text-slate-800 text-sm leading-relaxed placeholder:text-slate-300 focus:outline-none resize-none font-mono pr-4 border-r border-slate-100"
                />
                <div className="overflow-y-auto pl-2">
                  <RenderedMarkdown content={note.content} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

/* Notion-style lightweight Markdown renderer */
const RenderedMarkdown: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');

  return (
    <div className="space-y-3.5 text-slate-800 leading-relaxed">
      {lines.map((line, idx) => {
        // Heading 1
        if (line.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-2xl font-bold tracking-tight text-slate-900 pt-3 pb-1 border-b border-slate-100">
              {line.replace('# ', '')}
            </h1>
          );
        }
        // Heading 2
        if (line.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-xl font-semibold tracking-tight text-slate-900 pt-2">
              {line.replace('## ', '')}
            </h2>
          );
        }
        // Heading 3
        if (line.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base font-semibold text-slate-800 pt-1">
              {line.replace('### ', '')}
            </h3>
          );
        }
        // Blockquote
        if (line.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-4 border-slate-300 pl-4 py-1 italic text-slate-600 bg-slate-50/50 rounded-r-lg">
              {line.replace('> ', '')}
            </blockquote>
          );
        }
        // Checklist checkbox checked
        if (line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
          return (
            <div key={idx} className="flex items-start gap-2.5 text-slate-500 line-through">
              <input type="checkbox" checked readOnly className="mt-1 rounded text-slate-800 focus:ring-0" />
              <span>{line.replace(/- \[[xX]\] /, '')}</span>
            </div>
          );
        }
        // Checklist checkbox unchecked
        if (line.startsWith('- [ ] ')) {
          return (
            <div key={idx} className="flex items-start gap-2.5 text-slate-700">
              <input type="checkbox" checked={false} readOnly className="mt-1 rounded text-slate-800 focus:ring-0" />
              <span>{line.replace(/- \[ \] /, '')}</span>
            </div>
          );
        }
        // Bullet list
        if (line.startsWith('- ')) {
          return (
            <div key={idx} className="flex items-start gap-2 text-slate-700 ml-2">
              <span className="text-slate-400 mt-1">•</span>
              <span>{line.replace('- ', '')}</span>
            </div>
          );
        }
        // Horizontal rule
        if (line.trim() === '---') {
          return <hr key={idx} className="my-4 border-slate-200" />;
        }
        // Code fence or block
        if (line.startsWith('```')) {
          return (
            <div key={idx} className="text-xs font-mono text-slate-400 py-0.5">
              {line}
            </div>
          );
        }
        // Empty lines
        if (!line.trim()) {
          return <div key={idx} className="h-2" />;
        }

        return (
          <p key={idx} className="text-slate-700">
            {line}
          </p>
        );
      })}
    </div>
  );
};
