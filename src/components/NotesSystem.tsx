/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { 
  Plus, 
  Trash2, 
  BookOpen, 
  FileText, 
  Search, 
  HelpCircle, 
  RotateCw, 
  Sparkles, 
  CheckCircle,
  X,
  Bookmark
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Note, Flashcard } from '../types';

export default function NotesSystem() {
  const { notes, flashcards, addNote, deleteNote, addFlashcard, deleteFlashcard, logStudyMinutes } = useDashboard();
  const [subTab, setSubTab] = useState<'notes' | 'flashcards'>('notes');

  // Notes forms
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteSubject, setNoteSubject] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Flashcards forms
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardCategory, setCardCategory] = useState('');
  const [cardQuestion, setCardQuestion] = useState('');
  const [cardAnswer, setCardAnswer] = useState('');

  // Sorter / Filter trackers
  const [searchQuery, setSearchQuery] = useState('');
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  // Trigger flipper toggle
  const toggleFlip = (id: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteSubject.trim()) return;

    addNote({
      title: noteTitle,
      subject: noteSubject,
      content: noteContent
    });

    setNoteTitle('');
    setNoteSubject('');
    setNoteContent('');
    setIsAddingNote(false);
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardQuestion.trim() || !cardAnswer.trim()) return;

    addFlashcard({
      category: cardCategory || 'General',
      question: cardQuestion,
      answer: cardAnswer
    });

    setCardCategory('');
    setCardQuestion('');
    setCardAnswer('');
    setIsAddingCard(false);
  };

  // Claiming points when guessed correctly
  const claimGuessPoints = () => {
    logStudyMinutes(0, 5); // Synthesize +5 XP rewards!
    alert("🎴 Flashcard recalled perfectly! +5 XP points awarded.");
  };

  // Searching notes or flashcards
  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCards = flashcards.filter(c => 
    c.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 text-white min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <span className="text-xs font-mono text-purple-400 uppercase tracking-widest font-semibold font-bold font-sans">Cognitive reinforcement</span>
          <h2 className="text-2xl md:text-3.5xl font-extrabold tracking-tight mt-1 text-slate-100 font-sans leading-none">
            Notes & Revision Hub
          </h2>
          <p className="text-sm text-slate-400 mt-2 font-sans">
            Deploy deep retention methodologies. Compose Markdown formulas or flip active spacing flashcards.
          </p>
        </div>

        {/* Dynamic sub tab selectors */}
        <div className="flex bg-slate-950 p-1 border border-slate-900 rounded-xl max-w-xs shrink-0 font-sans">
          <button
            onClick={() => setSubTab('notes')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${subTab === 'notes' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            📘 Subject Notes
          </button>
          <button
            onClick={() => setSubTab('flashcards')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${subTab === 'flashcards' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            🎴 Flashcard Deck
          </button>
        </div>
      </div>

      {/* Sorter and search block */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-[#0c1020]/95 border border-slate-900 rounded-2xl shadow">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={subTab === 'notes' ? "Search notebook files..." : "Search flashcard decks..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/35 border border-slate-900 text-white focus:border-indigo-505 outline-none text-xs font-sans"
          />
        </div>

        <button
          onClick={() => subTab === 'notes' ? setIsAddingNote(true) : setIsAddingCard(true)}
          className="w-full md:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{subTab === 'notes' ? 'New Markdown Note' : 'Register Flashcard'}</span>
        </button>
      </div>

      {/* Subtab Form Drawers */}
      {subTab === 'notes' && isAddingNote && (
        <form onSubmit={handleNoteSubmit} className="p-6 bg-[#0c1020]/95 border border-slate-900 rounded-2xl shadow-xl space-y-4 animate-slideIn">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <h3 className="text-base font-bold text-slate-200">📘 Compose Markdown Study Note</h3>
            <button type="button" onClick={() => setIsAddingNote(false)} className="text-slate-500 hover:text-white transition">X</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Note Title</label>
              <input 
                type="text" 
                placeholder="e.g. LLM Attention Mechanisms, Linear Regression Models"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-white focus:border-indigo-500 outline-none text-xs font-sans"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Subject Folder</label>
              <input 
                type="text" 
                placeholder="e.g. Deep Learning, Applied Math"
                value={noteSubject}
                onChange={(e) => setNoteSubject(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-white focus:border-indigo-500 outline-none text-xs font-sans"
                required
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Note Content (Full Markdown Supported)</label>
              <textarea 
                rows={8} 
                placeholder="## Summary of findings
- Key component: Q, K, V vectors.
- Math formula: $$Softmax(QK^T / \sqrt{d_k})V$$..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-white focus:border-indigo-500 outline-none text-xs font-mono resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsAddingNote(false)} className="px-5 py-2 bg-slate-950 text-slate-500 rounded-xl text-xs">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs">Publish Note</button>
          </div>
        </form>
      )}

      {subTab === 'flashcards' && isAddingCard && (
        <form onSubmit={handleCardSubmit} className="p-6 bg-[#0c1020]/95 border border-slate-900 rounded-2xl shadow-xl space-y-4 animate-slideIn">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <h3 className="text-base font-bold text-slate-200">🎴 Construct Active Recall Flashcard</h3>
            <button type="button" onClick={() => setIsAddingCard(false)} className="text-slate-500 hover:text-white transition">X</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Course Subject</label>
              <input 
                type="text" 
                placeholder="e.g. Machine Learning, Compiler Design"
                value={cardCategory}
                onChange={(e) => setCardCategory(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-white focus:border-indigo-500 outline-none text-xs font-sans animate-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Front: Flashcard Question / Formula Prompt</label>
              <textarea 
                rows={3}
                placeholder="What is the difference between overfitting and underfitting?"
                value={cardQuestion}
                onChange={(e) => setCardQuestion(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-white focus:border-indigo-500 outline-none text-xs font-sans resize-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase tracking-wider">Back: Factual Answer Detail</label>
              <textarea 
                rows={3}
                placeholder="Overfitting has high variance and low bias (memorized training data noise). Underfitting has high bias..."
                value={cardAnswer}
                onChange={(e) => setCardAnswer(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-white focus:border-indigo-500 outline-none text-xs font-sans resize-none"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsAddingCard(false)} className="px-5 py-2 bg-slate-950 text-slate-500 rounded-xl text-xs">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs">Inject Flashcard</button>
          </div>
        </form>
      )}

      {/* Main tab layouts rendering */}
      {subTab === 'notes' ? (
        <div className="space-y-5">
          {filteredNotes.length === 0 ? (
            <div className="p-12 text-center bg-[#0c1020]/50 border border-slate-900 rounded-3xl">
              <FileText className="w-12 h-12 text-slate-600 mx-auto stroke-thin mb-3" />
              <h4 className="text-base font-bold text-slate-400">Subject notebook empty</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                Log formulas or draft algorithms. Rich markdown rendering handles equations, listings, and text tables easily.
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              return (
                <div 
                  key={note.id}
                  className="p-6 bg-[#0c1020]/95 border border-slate-900 rounded-2xl flex flex-col gap-4 shadow"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-start gap-3">
                      <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-indigo-400 uppercase font-bold tracking-wider leading-none">
                        📁 {note.subject}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-200 mt-1">{note.title}</h4>
                        <p className="text-[10px] text-slate-500 font-mono">Published: {note.createdAt}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => deleteNote(note.id)}
                      className="p-2 border border-slate-900 text-slate-500 hover:text-rose-400 rounded-lg hover:border-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {note.content && (
                    <div className="p-5 rounded-xl bg-slate-950/45 border border-slate-900/60 text-xs md:text-sm text-slate-300 leading-relaxed max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-900 prose prose-invert prose-xs">
                      <div className="markdown-body">
                        <Markdown>{note.content}</Markdown>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      ) : (
        // Flashcards view
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.length === 0 ? (
            <div className="p-12 text-center bg-[#0c1020]/50 border border-slate-900 rounded-3xl md:col-span-3">
              <HelpCircle className="w-12 h-12 text-slate-600 mx-auto stroke-thin mb-3" />
              <h4 className="text-base font-bold text-slate-400">Flashcard deck empty</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                Configure recall queries above. Flip cards using satisfying click actions to recall structural metrics.
              </p>
            </div>
          ) : (
            filteredCards.map((card) => {
              const isFlipped = !!flippedCards[card.id];

              return (
                <div 
                  key={card.id}
                  className="h-56 bg-slate-950/20 border border-slate-900/80 rounded-2xl relative flex flex-col justify-between p-5 shadow overflow-hidden group hover:border-indigo-500/25 transition duration-150"
                >
                  {/* Category overlay */}
                  <div className="flex justify-between items-center pb-2 border-b border-slate-950">
                    <span className="px-2 py-0.5 rounded bg-[#1e1b4b]/50 border border-[#2e266f]/40 text-[9px] font-mono uppercase text-indigo-400">
                      🔖 {card.category}
                    </span>
                    <button 
                      onClick={() => deleteFlashcard(card.id)}
                      className="text-slate-600 hover:text-rose-400 border border-transparent hover:border-slate-900 rounded-lg p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Body Text representing Flip States */}
                  <div className="flex-1 flex items-center justify-center p-2 text-center select-none font-sans">
                    {!isFlipped ? (
                      <p className="text-xs md:text-sm text-slate-200 font-bold leading-relaxed">
                        {card.question}
                      </p>
                    ) : (
                      <p className="text-xs text-indigo-300 leading-relaxed font-semibold">
                        {card.answer}
                      </p>
                    )}
                  </div>

                  {/* Flipper bar controller */}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-950">
                    <button 
                      type="button"
                      onClick={() => toggleFlip(card.id)}
                      className="p-1.5 px-3.5 rounded-lg border border-slate-900 bg-slate-950/20 hover:text-white transition cursor-pointer text-[10px] font-mono flex items-center gap-1 text-slate-400"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>{isFlipped ? 'Show Prompt' : 'Reveal Answer'}</span>
                    </button>

                    {isFlipped && (
                      <button 
                        onClick={claimGuessPoints}
                        className="px-2 py-1 bg-emerald-600 text-white rounded text-[9px] font-mono leading-none transition cursor-pointer hover:bg-emerald-500 shrink-0"
                      >
                        ✔ Recalled Properly (+5 XP)
                      </button>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
}
