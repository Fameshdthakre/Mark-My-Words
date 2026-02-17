import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit2, X, Settings, 
  Eye, Palette, CaseSensitive, WholeWord, 
  Regex, Check, Save, Zap, ChevronLeft,
  Search, Layers, MoreVertical, Loader2,
  Wand2, Power
} from 'lucide-react';

// Constants & Defaults
const PRESETS = [
  { bg: '#4f46e5', text: '#ffffff', name: 'Indigo' },
  { bg: '#10b981', text: '#ffffff', name: 'Emerald' },
  { bg: '#f59e0b', text: '#ffffff', name: 'Amber' },
  { bg: '#ef4444', text: '#ffffff', name: 'Rose' },
  { bg: '#8b5cf6', text: '#ffffff', name: 'Violet' },
  { bg: '#ec4899', text: '#ffffff', name: 'Pink' },
  { bg: '#06b6d4', text: '#ffffff', name: 'Cyan' },
  { bg: '#ffffff', text: '#000000', name: 'Pure White' },
];

const DEFAULT_LIST = {
  id: 'default-1',
  name: 'Important Terms',
  words: ['React', 'Extension', 'highlight', 'code'],
  styles: { backgroundColor: '#4f46e5', color: '#ffffff' },
  enabled: true,
  options: {
    caseSensitive: false,
    wholeWord: true,
    isRegex: false
  }
};

export default function App() {
  const [lists, setLists] = useState([DEFAULT_LIST]);
  const [activeView, setActiveView] = useState('dashboard'); // dashboard | editor | settings
  const [editingListId, setEditingListId] = useState(null);
  const [extensionEnabled, setExtensionEnabled] = useState(true);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['highlighter_lists_v3', 'extension_enabled'], (result) => {
        if (result.highlighter_lists_v3) {
          setLists(result.highlighter_lists_v3);
        }
        if (result.extension_enabled !== undefined) {
          setExtensionEnabled(result.extension_enabled);
        }
      });
    } else {
      const savedLists = localStorage.getItem('highlighter_lists_v3');
      if (savedLists) setLists(JSON.parse(savedLists));
      const savedEnabled = localStorage.getItem('extension_enabled');
      if (savedEnabled) setExtensionEnabled(JSON.parse(savedEnabled));
    }
  }, []);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        'highlighter_lists_v3': lists,
        'extension_enabled': extensionEnabled
      });
    }
    localStorage.setItem('highlighter_lists_v3', JSON.stringify(lists));
    localStorage.setItem('extension_enabled', JSON.stringify(extensionEnabled));
  }, [lists, extensionEnabled]);

  const handleCreateList = () => {
    const newList = {
      id: crypto.randomUUID(),
      name: 'New List',
      words: [],
      styles: { backgroundColor: '#4f46e5', color: '#ffffff' },
      enabled: true,
      options: { caseSensitive: false, wholeWord: true, isRegex: false }
    };
    setLists([...lists, newList]);
    setEditingListId(newList.id);
    setActiveView('editor');
  };

  const handleUpdateList = (id, updates) => {
    setLists(lists.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleDeleteList = (id) => {
    setLists(lists.filter(l => l.id !== id));
  };

  const activeList = lists.find(l => l.id === editingListId);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30 w-[400px]">
      <div className="flex flex-col h-full bg-[#020617] border-x border-slate-800/50 shadow-2xl">
        
        <header className="px-6 py-5 flex justify-between items-center border-b border-slate-800 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-colors ${extensionEnabled ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-slate-700'}`}>
              <Zap className={`w-5 h-5 text-white fill-current ${!extensionEnabled && 'opacity-50'}`} />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-widest text-white uppercase">
                Highlight Pro
              </h1>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${extensionEnabled ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                <span className="text-[10px] text-slate-500 font-medium tracking-tight uppercase">
                  {extensionEnabled ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {activeView === 'dashboard' ? (
              <button
                onClick={() => setActiveView('settings')}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <Settings size={18} />
              </button>
            ) : (
              <button 
                onClick={() => setActiveView('dashboard')}
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md transition-all border border-slate-700"
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {activeView === 'dashboard' && (
            <Dashboard 
              lists={lists} 
              onCreate={handleCreateList} 
              onEdit={(id) => { setEditingListId(id); setActiveView('editor'); }} 
              onDelete={handleDeleteList}
              onToggle={(id) => {
                const list = lists.find(l => l.id === id);
                handleUpdateList(id, { enabled: !list.enabled });
              }}
            />
          )}
          {activeView === 'editor' && (
            <div className="p-6">
               <ListEditor 
                list={activeList} 
                onChange={(updates) => handleUpdateList(activeList.id, updates)}
              />
            </div>
          )}
          {activeView === 'settings' && (
            <div className="p-6">
              <SettingsView
                enabled={extensionEnabled}
                onToggle={() => setExtensionEnabled(!extensionEnabled)}
              />
            </div>
          )}
        </main>

        <PreviewArea lists={lists} globalEnabled={extensionEnabled} />
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
}

function Dashboard({ lists, onCreate, onEdit, onDelete, onToggle }) {
  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-white">Library</h2>
          <p className="text-xs text-slate-500 mt-1">Manage your highlighting rules</p>
        </div>
        <div className="flex flex-col gap-2">
          <button 
            onClick={onCreate}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-indigo-600/10 font-semibold text-xs uppercase tracking-wider"
          >
            <Plus size={16} /> New Rule
          </button>
        </div>
      </div>

      {lists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-slate-800 border-dashed rounded-2xl bg-slate-900/20">
          <Layers className="w-10 h-10 text-slate-700 mb-4" />
          <p className="text-slate-500 text-sm">Your library is empty</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {lists.map(list => (
            <div 
              key={list.id} 
              className={`group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
                list.enabled 
                  ? 'bg-slate-900/40 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/60' 
                  : 'bg-slate-950 border-slate-900 opacity-50'
              }`}
            >
              <button 
                onClick={() => onToggle(list.id)}
                className={`relative w-10 h-5 flex items-center rounded-full px-1 transition-colors duration-300 ${
                  list.enabled ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <div className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform duration-300 ${
                  list.enabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>

              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(list.id)}>
                <div className="flex items-center gap-2">
                   <h3 className="font-medium text-sm text-slate-200 truncate">{list.name}</h3>
                   {list.options.isRegex && <Regex size={12} className="text-pink-500" />}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">
                    {list.words.length} items
                  </span>
                  <div 
                    className="w-3 h-3 rounded-full border border-white/10"
                    style={{ backgroundColor: list.styles.backgroundColor }}
                  />
                </div>
              </div>

              <div className="flex gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(list.id); }}
                  className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(list.id); }}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ListEditor({ list, onChange }) {
  const [wordInput, setWordInput] = useState('');

  if (!list) return null;

  const handleAddWord = (e) => {
    e.preventDefault();
    if (!wordInput.trim()) return;
    
    let newWords = list.options.isRegex 
      ? [wordInput.trim()] 
      : wordInput.split(/[,\n]/).map(w => w.trim()).filter(w => w);

    onChange({ words: [...new Set([...list.words, ...newWords])] });
    setWordInput('');
  };

  const removeWord = (wordToRemove) => {
    onChange({ words: list.words.filter(w => w !== wordToRemove) });
  };

  const toggleOption = (key) => {
    onChange({ options: { ...list.options, [key]: !list.options[key] }});
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-400">
      
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">List Title</label>
        <div className="relative group">
          <input 
            type="text" 
            value={list.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="bg-transparent text-2xl font-semibold text-white focus:outline-none placeholder-slate-700 w-full border-b border-slate-800 pb-2 focus:border-indigo-500 transition-colors"
            placeholder="New Highlight List"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
          <StrategyBtn 
              active={list.options.caseSensitive} 
              onClick={() => toggleOption('caseSensitive')}
              icon={CaseSensitive}
              label="Match Case"
          />
          <StrategyBtn 
              active={list.options.wholeWord} 
              onClick={() => toggleOption('wholeWord')}
              icon={WholeWord}
              label="Whole Word"
              disabled={list.options.isRegex}
          />
          <StrategyBtn 
              active={list.options.isRegex} 
              onClick={() => toggleOption('isRegex')}
              icon={Regex}
              label="Regex"
              isRegex
          />
      </div>

      <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
          <Palette size={12} /> Visual Style
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => onChange({ styles: { backgroundColor: p.bg, color: p.text } })}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 relative ${
                list.styles.backgroundColor === p.bg ? 'ring-2 ring-indigo-500 ring-offset-4 ring-offset-[#020617]' : ''
              }`}
              style={{ backgroundColor: p.bg }}
            >
              <span className="text-[10px] font-bold" style={{ color: p.text }}>Aa</span>
            </button>
          ))}
          <div className="w-[1px] h-8 bg-slate-800 mx-1" />
          <div className="relative w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center cursor-pointer">
             <input 
              type="color" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              value={list.styles.backgroundColor}
              onChange={(e) => onChange({ styles: { ...list.styles, backgroundColor: e.target.value } })}
             />
             <div className="w-4 h-4 rounded-full" style={{ backgroundColor: list.styles.backgroundColor }} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Search size={12} /> Patterns
            </h3>
        </div>
        
        <form onSubmit={handleAddWord} className="flex gap-2">
          <input 
            type="text" 
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 text-sm text-white rounded-xl px-4 py-3 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
            placeholder={list.options.isRegex ? "Regex pattern..." : "Add words (comma separated)..."}
          />
          <button 
            type="submit" 
            className="bg-slate-100 text-slate-900 px-5 rounded-xl hover:bg-white transition-all font-bold text-xs uppercase"
          >
            Add
          </button>
        </form>

        <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto custom-scrollbar p-1">
          {list.words.map((word, idx) => (
            <span 
              key={idx} 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/5"
              style={{ 
                backgroundColor: list.styles.backgroundColor + '20', 
                color: list.styles.backgroundColor,
                borderColor: list.styles.backgroundColor + '30'
              }}
            >
              {word}
              <button 
                onClick={() => removeWord(word)}
                className="hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsView({ enabled, onToggle }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div>
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <p className="text-xs text-slate-500 mt-1">Global extension preferences</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${enabled ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                <Power size={20} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Extension Enabled</h3>
                <p className="text-[10px] text-slate-500">Toggle highlighting on all pages</p>
              </div>
           </div>

           <button
                onClick={onToggle}
                className={`relative w-12 h-6 flex items-center rounded-full px-1 transition-colors duration-300 ${
                  enabled ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${
                  enabled ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
        </div>
    </div>
  );
}

function StrategyBtn({ active, onClick, icon: Icon, label, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-[10px] font-bold uppercase tracking-tighter transition-all duration-200 ${
                disabled ? 'opacity-20 cursor-not-allowed bg-slate-900 border-slate-800' :
                active ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400'
            }`}
        >
            <Icon size={16} />
            {label}
        </button>
    );
}

function PreviewArea({ lists, globalEnabled }) {
  const sampleText = `Hello! Highlight Pro is now active.
Manage your lists in the library.
React makes Chrome Extension state updates easy!`;

  const getHighlightedText = () => {
    if (!globalEnabled) return sampleText;

    let fragments = [{ text: sampleText, style: null }];

    lists.filter(l => l.enabled).forEach(list => {
      const nextFragments = [];
      fragments.forEach(frag => {
        if (frag.style) { nextFragments.push(frag); return; }

        let patternSource;
        if (list.options.isRegex) {
            const valid = list.words.filter(w => { try { new RegExp(w); return true; } catch { return false; } });
            if (valid.length === 0) { nextFragments.push(frag); return; }
            patternSource = `(${valid.join('|')})`;
        } else {
            if (list.words.length === 0) { nextFragments.push(frag); return; }
            const escaped = list.words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
            patternSource = list.options.wholeWord ? `\\b(${escaped})\\b` : `(${escaped})`;
        }

        const regex = new RegExp(patternSource, list.options.caseSensitive ? 'g' : 'gi');
        const splitParts = frag.text.split(regex); 
        
        for (let i = 0; i < splitParts.length; i++) {
            const part = splitParts[i];
            const isMatch = list.options.isRegex 
                ? new RegExp(`^${patternSource}$`, list.options.caseSensitive ? '' : 'i').test(part)
                : list.words.some(w => list.options.caseSensitive ? w === part : w?.toLowerCase() === part?.toLowerCase());

            if (isMatch && part !== undefined) {
                 nextFragments.push({ text: part, style: list.styles });
            } else if (part !== undefined && part !== "") {
                 nextFragments.push({ text: part, style: null });
            }
        }
      });
      fragments = nextFragments;
    });

    return fragments.map((f, i) => (
      f.style ? (
        <span key={i} className="px-1 rounded-sm mx-0.5" style={f.style}>
          {f.text}
        </span>
      ) : f.text
    ));
  };

  return (
    <div className="border-t border-slate-800 p-6 bg-[#020617]">
      <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3">
        <Eye size={12} /> Real-time Preview
      </div>
      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-slate-400 leading-relaxed text-sm font-medium min-h-[100px] whitespace-pre-wrap">
        {getHighlightedText()}
      </div>
    </div>
  );
}
