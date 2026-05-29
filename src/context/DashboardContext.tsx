/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Topic, 
  CodingProblem, 
  Project, 
  TimetableSlot, 
  Habit, 
  Note, 
  Flashcard,
  UserStats, 
  StudySession, 
  AchievementBadge 
} from '../types';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface DashboardContextType {
  user: FirebaseUser | null;
  authLoading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
  topics: Topic[];
  problems: CodingProblem[];
  projects: Project[];
  timetable: TimetableSlot[];
  habits: Habit[];
  notes: Note[];
  flashcards: Flashcard[];
  stats: UserStats;
  addTopic: (topic: Omit<Topic, 'id' | 'order' | 'completed'>) => Promise<void>;
  updateTopic: (id: string, updates: Partial<Topic>) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;
  completeTopic: (id: string) => Promise<void>;
  reorderTopics: (startIndex: number, endIndex: number) => Promise<void>;
  addProblem: (problem: Omit<CodingProblem, 'id' | 'solvedAt'>) => Promise<void>;
  updateProblem: (id: string, updates: Partial<CodingProblem>) => Promise<void>;
  deleteProblem: (id: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'progress'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  toggleProjectSubtask: (projectId: string, subtaskId: string) => Promise<void>;
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id'>) => Promise<void>;
  updateTimetableSlot: (id: string, updates: Partial<TimetableSlot>) => Promise<void>;
  deleteTimetableSlot: (id: string) => Promise<void>;
  addHabit: (name: string, description: string, frequency: 'daily' | 'weekly') => Promise<void>;
  toggleHabitDate: (habitId: string, dateStr: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'bookmarked'>) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  addFlashcard: (card: Omit<Flashcard, 'id' | 'easeFactor' | 'intervalDays' | 'reviewsCount' | 'nextReviewAt'>) => Promise<void>;
  deleteFlashcard: (id: string) => Promise<void>;
  logStudyMinutes: (minutes: number, pomodoros?: number) => Promise<void>;
  addXp: (amount: number) => Promise<void>;
  resetApp: () => Promise<void>;
  timerMode: 'pomodoro' | 'short_break' | 'long_break';
  setTimerMode: (mode: 'pomodoro' | 'short_break' | 'long_break') => void;
  minutes: number;
  seconds: number;
  isTimerRunning: boolean;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  pomodorosCount: number;
  setPomodorosCount: Dispatch<SetStateAction<number>>;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  checkExpiredTopics: () => Promise<void>;
}

const defaultBadges: AchievementBadge[] = [
  { id: 'first_topic', title: 'Task Crusher', description: 'Complete your first study topic.', icon: 'CheckSquare', unlocked: false },
  { id: 'study_1_hour', title: 'Deep Work Pioneer', description: 'Study for a total of 1 hour.', icon: 'Clock', unlocked: false },
  { id: 'pomodoro_3', title: 'Focus Champion', description: 'Complete 3 complete Pomodoro sessions.', icon: 'Flame', unlocked: false },
  { id: 'first_problem', title: 'Bug Slayer', description: 'Solve your first coding problem.', icon: 'Code', unlocked: false },
  { id: 'problem_expert', title: 'Leet Master', description: 'Solve 10 problems on LeetCode/GFG.', icon: 'Award', unlocked: false },
  { id: 'habit_5_day', title: 'Identity Builder', description: 'Track a habit for 5 days.', icon: 'CheckCircle', unlocked: false },
  { id: 'project_completed', title: 'Creator Supreme', description: 'Mark a project as completed.', icon: 'FolderGit', unlocked: false },
  { id: 'level_5', title: 'Scholar King', description: 'Reach Scholar Level 5.', icon: 'Sparkles', unlocked: false }
];

const defaultTimetableSlots: TimetableSlot[] = [
  { id: '1', day: 'Monday', startTime: '07:00', endTime: '09:00', subject: 'DSA & Coding', description: 'Solve 3 medium Leetcode problems', color: '#8b5cf6' },
  { id: '2', day: 'Monday', startTime: '10:00', endTime: '12:00', subject: 'Machine Learning', description: 'Practice Linear Regression code', color: '#3b82f6' },
  { id: '3', day: 'Wednesday', startTime: '14:00', endTime: '16:00', subject: 'Web Dev Projects', description: 'Build productivity app layout', color: '#10b981' },
  { id: '4', day: 'Friday', startTime: '18:00', endTime: '19:30', subject: 'System Revision', description: 'Flashcards study & key metrics review', color: '#f59e0b' }
];

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  // Current logged in Firebase user states
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = crypto.randomUUID();
    const newToast: Toast = { id, message, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // States initialized from local storage as local offline caches
  const [topics, setTopicsState] = useState<Topic[]>(() => {
    const data = localStorage.getItem('study_topics');
    return data ? JSON.parse(data) : [];
  });

  const [problems, setProblemsState] = useState<CodingProblem[]>(() => {
    const data = localStorage.getItem('study_problems');
    return data ? JSON.parse(data) : [];
  });

  const [projects, setProjectsState] = useState<Project[]>(() => {
    const data = localStorage.getItem('study_projects');
    return data ? JSON.parse(data) : [];
  });

  const [timetable, setTimetableState] = useState<TimetableSlot[]>(() => {
    const data = localStorage.getItem('study_timetable');
    return data ? JSON.parse(data) : defaultTimetableSlots;
  });

  const [habits, setHabitsState] = useState<Habit[]>(() => {
    const data = localStorage.getItem('study_habits');
    if (data) return JSON.parse(data);
    return [
      { id: 'h1', name: 'Solve 2 DSA Problems', description: 'Keep the streak on LeetCode', createdAt: '2026-05-20', frequency: 'daily', history: {} },
      { id: 'h2', name: 'Study 5 Hours', description: 'Target daily focus time', createdAt: '2026-05-20', frequency: 'daily', history: {} },
      { id: 'h3', name: 'Standard Workout', description: 'Maintain overall energy and flow', createdAt: '2026-05-20', frequency: 'daily', history: {} }
    ];
  });

  const [notes, setNotesState] = useState<Note[]>(() => {
    const data = localStorage.getItem('study_notes');
    if (data) return JSON.parse(data);
    return [
      {
        id: 'n1',
        title: 'Study Guide: Spaced Repetition Tips',
        subject: 'General',
        content: `# Welcome to your Study & Revision Notes!\n\nUse this Markdown editor to keep structured research. Here is some core motivation:\n\n- **Interval 1**: Review topic 1 day later.\n- **Interval 2**: Review 3 days later.\n- **Interval 3**: Review 7 days later.\n\n### Code snippet block example:\n\`\`\`typescript\nfunction activeRecall() {\n  console.log("No passive re-reading. Test yourself!");\n}\n\`\`\n`,
        bookmarked: true,
        createdAt: new Date().toISOString().split('T')[0],
        flashcards: [
          { id: 'f1', category: 'General', question: 'What is temporal spacing?', answer: 'Leaving structured time delays between study sessions to strengthen synapse storage.', easeFactor: 2.5, intervalDays: 1, reviewsCount: 0, nextReviewAt: new Date().toISOString().split('T')[0] }
        ]
      }
    ];
  });

  const [stats, setStatsState] = useState<UserStats>(() => {
    const data = localStorage.getItem('study_stats');
    if (data) return JSON.parse(data);
    return {
      level: 1,
      xp: 0,
      streakDays: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
      badges: defaultBadges,
      sessions: []
    };
  });

  const [flashcards, setFlashcardsState] = useState<Flashcard[]>(() => {
    const data = localStorage.getItem('study_flashcards');
    if (data) return JSON.parse(data);
    return [
      { id: 'f1', category: 'General', question: 'What is temporal spacing?', answer: 'Leaving structured time delays between study sessions to strengthen synapse storage.', easeFactor: 2.5, intervalDays: 1, reviewsCount: 0, nextReviewAt: new Date().toISOString().split('T')[0] }
    ];
  });

  // Automatically save state updates to local storage (acts as offline local cache)
  useEffect(() => {
    localStorage.setItem('study_topics', JSON.stringify(topics));
  }, [topics]);

  useEffect(() => {
    localStorage.setItem('study_problems', JSON.stringify(problems));
  }, [problems]);

  useEffect(() => {
    localStorage.setItem('study_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('study_timetable', JSON.stringify(timetable));
  }, [timetable]);

  useEffect(() => {
    localStorage.setItem('study_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('study_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('study_flashcards', JSON.stringify(flashcards));
  }, [flashcards]);

  useEffect(() => {
    localStorage.setItem('study_stats', JSON.stringify(stats));
  }, [stats]);

  // Auth Listener and Merging flow
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      if (currentUser) {
        // One-time merge of local records to Cloud Firestore on first sign-in
        const statsDocRef = doc(db, 'users', currentUser.uid);
        try {
          const statsDocSnapshot = await getDoc(statsDocRef);

          if (!statsDocSnapshot.exists()) {
            console.log("Empty cloud database detected. Syncing local cache to Cloud...");
            
            // Sync stats
            await setDoc(statsDocRef, stats);

            // Sync topics
            for (const item of topics) {
              await setDoc(doc(db, 'users', currentUser.uid, 'topics', item.id), item);
            }
            // Sync problems
            for (const item of problems) {
              await setDoc(doc(db, 'users', currentUser.uid, 'problems', item.id), item);
            }
            // Sync projects
            for (const item of projects) {
              await setDoc(doc(db, 'users', currentUser.uid, 'projects', item.id), item);
            }
            // Sync timetable
            for (const item of timetable) {
              await setDoc(doc(db, 'users', currentUser.uid, 'timetable', item.id), item);
            }
            // Sync habits
            for (const item of habits) {
              await setDoc(doc(db, 'users', currentUser.uid, 'habits', item.id), item);
            }
            // Sync notes
            for (const item of notes) {
              await setDoc(doc(db, 'users', currentUser.uid, 'notes', item.id), item);
            }
            // Sync flashcards
            for (const item of flashcards) {
              await setDoc(doc(db, 'users', currentUser.uid, 'flashcards', item.id), item);
            }
            console.log("Initial state successfully synchronized to Cloud Firestore.");
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
        }
      }
    });
    return unsubscribe;
  }, []);

  // Real-time Firestore Synchronizers
  useEffect(() => {
    if (!user) return;

    const unsubscribes: (() => void)[] = [];

    // 1. Stats Subscription
    const statsUnsub = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setStatsState(snapshot.data() as UserStats);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`));
    unsubscribes.push(statsUnsub);

    // 2. Topics Subscription
    const topicsUnsub = onSnapshot(collection(db, 'users', user.uid, 'topics'), (snapshot) => {
      const items: Topic[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Topic);
      });
      items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setTopicsState(items);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/topics`));
    unsubscribes.push(topicsUnsub);

    // 3. Problems Subscription
    const problemsUnsub = onSnapshot(collection(db, 'users', user.uid, 'problems'), (snapshot) => {
      const items: CodingProblem[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as CodingProblem);
      });
      setProblemsState(items);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/problems`));
    unsubscribes.push(problemsUnsub);

    // 4. Projects Subscription
    const projectsUnsub = onSnapshot(collection(db, 'users', user.uid, 'projects'), (snapshot) => {
      const items: Project[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Project);
      });
      setProjectsState(items);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/projects`));
    unsubscribes.push(projectsUnsub);

    // 5. Timetable Subscription
    const timetableUnsub = onSnapshot(collection(db, 'users', user.uid, 'timetable'), (snapshot) => {
      const items: TimetableSlot[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as TimetableSlot);
      });
      setTimetableState(items);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/timetable`));
    unsubscribes.push(timetableUnsub);

    // 6. Habits Subscription
    const habitsUnsub = onSnapshot(collection(db, 'users', user.uid, 'habits'), (snapshot) => {
      const items: Habit[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Habit);
      });
      setHabitsState(items);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/habits`));
    unsubscribes.push(habitsUnsub);

    // 7. Notes Subscription
    const notesUnsub = onSnapshot(collection(db, 'users', user.uid, 'notes'), (snapshot) => {
      const items: Note[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Note);
      });
      setNotesState(items);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/notes`));
    unsubscribes.push(notesUnsub);

    // 8. Flashcards Subscription
    const flashcardsUnsub = onSnapshot(collection(db, 'users', user.uid, 'flashcards'), (snapshot) => {
      const items: Flashcard[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Flashcard);
      });
      setFlashcardsState(items);
    }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/flashcards`));
    unsubscribes.push(flashcardsUnsub);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user]);

  // Auth Operations
  const clearAuthError = () => {
    setAuthError(null);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setAuthError(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Sign-in error: ", err);
      let errMsg = err?.message || String(err);
      if (err?.code === 'auth/popup-closed-by-user') {
        errMsg = "Sign-in popup was closed before completing. If you are inside the AI Studio preview pane, browser security guidelines restrict authentication popup cookies inside nested iframes. Please click 'Open in New Tab' to sign in successfully.";
      } else if (err?.code === 'auth/cancelled-popup-request') {
        errMsg = "Only one sign-in popup can be opened at a time. The previous popup request was cancelled.";
      } else if (err?.code === 'auth/popup-blocked') {
        errMsg = "The sign-in popup was blocked by your browser. Please allow popups for this site, or open this application in a new tab.";
      } else if (err?.code === 'auth/restricted-resources' || err?.code === 'auth/operation-not-allowed') {
        errMsg = "Google sign-in is not configured properly in Firebase. Please enable the Google authentication provider in your Firebase project console.";
      } else if (window.self !== window.top) {
        errMsg = "Google sign-in popup was blocked or closed. Because browser security guidelines block nested verification popup cookies inside iframe preview windows, you must open this app in a new tab to complete cloud sync.";
      }
      setAuthError(errMsg);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Reset state variables to whatever is in local storage (or default fallbacks)
      setTopicsState(JSON.parse(localStorage.getItem('study_topics') || '[]'));
      setProblemsState(JSON.parse(localStorage.getItem('study_problems') || '[]'));
      setProjectsState(JSON.parse(localStorage.getItem('study_projects') || '[]'));
      setTimetableState(JSON.parse(localStorage.getItem('study_timetable') || JSON.stringify(defaultTimetableSlots)));
      setHabitsState(JSON.parse(localStorage.getItem('study_habits') || '[]'));
      setNotesState(JSON.parse(localStorage.getItem('study_notes') || '[]'));
      setStatsState(JSON.parse(localStorage.getItem('study_stats') || 'null'));
      setFlashcardsState(JSON.parse(localStorage.getItem('study_flashcards') || '[]'));
    } catch (err) {
      console.error("Sign-out error: ", err);
    }
  };

  // Check for active date and streak checks on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (stats.lastActiveDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      let newStreak = stats.streakDays;
      if (stats.lastActiveDate === yesterdayStr) {
        // Active yesterday, maintain streak
      } else if (stats.lastActiveDate !== today) {
        // Reset streak (keep starting streak logic)
        newStreak = 1;
      }
      
      const updatedStats = { ...stats, lastActiveDate: today, streakDays: newStreak };
      if (user) {
        setDoc(doc(db, 'users', user.uid), updatedStats)
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      } else {
        setStatsState(updatedStats);
      }
    }
  }, [user]);

  // Shared Helper: XP Incrementor & Badge Unlocker
  const addXp = async (amount: number) => {
    const currentXp = stats.xp + amount;
    const targetXpForLevel = stats.level * 500;
    let newLevel = stats.level;
    let tempXp = currentXp;

    if (tempXp >= targetXpForLevel) {
      newLevel += 1;
      tempXp = tempXp - targetXpForLevel;
    }

    const updatedBadges = stats.badges.map(b => {
      if (b.unlocked) return b;
      let shouldUnlock = false;

      if (b.id === 'level_5' && newLevel >= 5) shouldUnlock = true;
      if (b.id === 'study_1_hour') {
        const totalMinutes = stats.sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
        if (totalMinutes >= 60) shouldUnlock = true;
      }

      if (shouldUnlock) {
        return { ...b, unlocked: true, unlockedAt: new Date().toISOString().split('T')[0] };
      }
      return b;
    });

    const updatedStats: UserStats = {
      ...stats,
      level: newLevel,
      xp: tempXp,
      badges: updatedBadges
    };

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), updatedStats);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    } else {
      setStatsState(updatedStats);
    }
  };

  const triggerBadgeUnlock = async (badgeId: string) => {
    const updatedBadges = stats.badges.map(b => {
      if (b.id === badgeId && !b.unlocked) {
        return { ...b, unlocked: true, unlockedAt: new Date().toISOString().split('T')[0] };
      }
      return b;
    });
    
    const updatedStats = { ...stats, badges: updatedBadges };

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), updatedStats);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    } else {
      setStatsState(updatedStats);
    }
  };

  // --- 1. Topic Mutations ---
  const addTopic = async (newTopic: Omit<Topic, 'id' | 'order' | 'completed'>) => {
    const id = crypto.randomUUID();
    const order = topics.length;
    const topicDoc: Topic = { ...newTopic, id, order, completed: false };

    if (user) {
      const path = `users/${user.uid}/topics/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'topics', id), topicDoc);
        await addXp(20);
        showToast("✨ Topic added successfully!", "success");
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setTopicsState(prev => [...prev, topicDoc]);
      addXp(20);
      showToast("✨ Topic added successfully!", "success");
    }
  };

  const updateTopic = async (id: string, updates: Partial<Topic>) => {
    const target = topics.find(t => t.id === id);
    if (!target) return;
    const updatedTopic = { ...target, ...updates };

    if (user) {
      const path = `users/${user.uid}/topics/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'topics', id), updatedTopic);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setTopicsState(prev => prev.map(t => t.id === id ? updatedTopic : t));
    }
  };

  const deleteTopic = async (id: string) => {
    if (user) {
      const path = `users/${user.uid}/topics/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'topics', id));
        showToast("🗑️ Topic deleted successfully.", "info");
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      setTopicsState(prev => prev.filter(t => t.id !== id));
      showToast("🗑️ Topic deleted successfully.", "info");
    }
  };

  const completeTopic = async (id: string) => {
    const target = topics.find(t => t.id === id);
    if (!target) return;
    const isCompleting = !target.completed;

    if (user) {
      const path = `users/${user.uid}/topics/${id}`;
      try {
        if (isCompleting) {
          await addXp(50);
          await triggerBadgeUnlock('first_topic');
          showToast("🎯 Study topic completed! Awesome progress!", "success");
        } else {
          showToast("📝 Topic set back to active status.", "info");
        }
        await setDoc(doc(db, 'users', user.uid, 'topics', id), { ...target, completed: isCompleting });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      if (isCompleting) {
        addXp(50);
        triggerBadgeUnlock('first_topic');
        showToast("🎯 Study topic completed! Awesome progress!", "success");
      } else {
        showToast("📝 Topic set back to active status.", "info");
      }
      setTopicsState(prev => prev.map(t => t.id === id ? { ...t, completed: isCompleting } : t));
    }
  };

  const reorderTopics = async (startIndex: number, endIndex: number) => {
    const result = Array.from(topics);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    const updated = result.map((item, index) => ({ ...item, order: index }));

    if (user) {
      try {
        for (const item of updated) {
          await setDoc(doc(db, 'users', user.uid, 'topics', item.id), item);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/topics`);
      }
    } else {
      setTopicsState(updated);
    }
  };

  const checkExpiredTopics = async () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // Find all expired topics
    const expired = topics.filter(t => !t.completed && t.deadline && t.deadline < todayStr);
    
    if (expired.length === 0) return;

    // Check if auto-delete is enabled
    const autoDeleteStr = localStorage.getItem('auto_delete_expired_topics') || 'false';
    const autoDelete = autoDeleteStr === 'true';

    if (autoDelete) {
      for (const topic of expired) {
        await deleteTopic(topic.id);
      }
      showToast(`🗑️ ${expired.length} expired topic${expired.length > 1 ? 's' : ''} auto-deleted.`, 'info');
    } else {
      const notifiedStr = localStorage.getItem('notified_expired_topics') || '[]';
      let notifiedIds: string[] = [];
      try {
        notifiedIds = JSON.parse(notifiedStr);
      } catch (e) {
        notifiedIds = [];
      }

      const newlyExpired = expired.filter(t => !notifiedIds.includes(t.id));

      if (newlyExpired.length > 0) {
        showToast(`⚠️ ${newlyExpired.length} study topic${newlyExpired.length > 1 ? 's have' : ' has'} expired!`, 'warning');
        const nextNotified = Array.from(new Set([...notifiedIds, ...newlyExpired.map(t => t.id)]));
        localStorage.setItem('notified_expired_topics', JSON.stringify(nextNotified));
      }
    }
  };

  // Run when the app loads
  useEffect(() => {
    const timer = setTimeout(() => {
      checkExpiredTopics();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Run at midnight each day (check every minute if calendar date shifts)
  useEffect(() => {
    const getTodayString = () => {
      const date = new Date();
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    
    let lastCheckedDate = getTodayString();
    
    const interval = setInterval(() => {
      const currentDateString = getTodayString();
      if (currentDateString !== lastCheckedDate) {
        lastCheckedDate = currentDateString;
        console.log("Midnight shift identified! Re-evaluating study loops expiration state...");
        checkExpiredTopics();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [topics]);

  // --- 2. Coding Problem Mutations ---
  const addProblem = async (prob: Omit<CodingProblem, 'id' | 'solvedAt'>) => {
    const id = crypto.randomUUID();
    const solvedAt = new Date().toISOString().split('T')[0];
    const problemDoc: CodingProblem = { ...prob, id, solvedAt };

    if (user) {
      const path = `users/${user.uid}/problems/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'problems', id), problemDoc);
        const nextProblems = [...problems, problemDoc];
        if (nextProblems.length >= 10) {
          await triggerBadgeUnlock('problem_expert');
        }
        await addXp(80);
        await triggerBadgeUnlock('first_problem');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setProblemsState(prev => {
        const updated = [...prev, problemDoc];
        if (updated.length >= 10) {
          setTimeout(() => triggerBadgeUnlock('problem_expert'), 0);
        }
        return updated;
      });
      addXp(80);
      triggerBadgeUnlock('first_problem');
    }
  };

  const updateProblem = async (id: string, updates: Partial<CodingProblem>) => {
    const target = problems.find(p => p.id === id);
    if (!target) return;
    const updatedProblem = { ...target, ...updates };

    if (user) {
      const path = `users/${user.uid}/problems/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'problems', id), updatedProblem);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setProblemsState(prev => prev.map(p => p.id === id ? updatedProblem : p));
    }
  };

  const deleteProblem = async (id: string) => {
    if (user) {
      const path = `users/${user.uid}/problems/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'problems', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      setProblemsState(prev => prev.filter(p => p.id !== id));
    }
  };

  // --- 3. Project Mutations ---
  const addProject = async (proj: Omit<Project, 'id' | 'progress'>) => {
    const id = crypto.randomUUID();
    const projectDoc: Project = { ...proj, id, progress: 0 };

    if (user) {
      const path = `users/${user.uid}/projects/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'projects', id), projectDoc);
        await addXp(100);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setProjectsState(prev => [...prev, projectDoc]);
      addXp(100);
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const target = projects.find(p => p.id === id);
    if (!target) return;
    const updatedProject = { ...target, ...updates };

    if (user) {
      const path = `users/${user.uid}/projects/${id}`;
      try {
        if (updates.status === 'Completed' && target.status !== 'Completed') {
          await triggerBadgeUnlock('project_completed');
          await addXp(150);
        }
        await setDoc(doc(db, 'users', user.uid, 'projects', id), updatedProject);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setProjectsState(prev => prev.map(p => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates };
        if (updates.status === 'Completed' && p.status !== 'Completed') {
          setTimeout(() => triggerBadgeUnlock('project_completed'), 0);
          addXp(150);
        }
        return updated;
      }));
    }
  };

  const deleteProject = async (id: string) => {
    if (user) {
      const path = `users/${user.uid}/projects/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'projects', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      setProjectsState(prev => prev.filter(p => p.id !== id));
    }
  };

  const toggleProjectSubtask = async (projectId: string, subtaskId: string) => {
    const target = projects.find(p => p.id === projectId);
    if (!target) return;

    const subtasks = target.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
    const completedCount = subtasks.filter(s => s.completed).length;
    const progress = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 105) : 0;
    const boundedProgress = Math.min(100, progress);
    const status = boundedProgress === 100 ? 'Completed' : target.status;

    const updatedProject = {
      ...target,
      subtasks,
      progress: boundedProgress,
      status
    };

    if (user) {
      const path = `users/${user.uid}/projects/${projectId}`;
      try {
        if (status === 'Completed' && target.status !== 'Completed') {
          await triggerBadgeUnlock('project_completed');
          await addXp(150);
        }
        await setDoc(doc(db, 'users', user.uid, 'projects', projectId), updatedProject);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setProjectsState(prev => prev.map(p => {
        if (p.id !== projectId) return p;
        if (status === 'Completed' && p.status !== 'Completed') {
          setTimeout(() => triggerBadgeUnlock('project_completed'), 0);
          addXp(150);
        }
        return updatedProject;
      }));
    }
  };

  // --- 4. Timetable Mutations ---
  const addTimetableSlot = async (slot: Omit<TimetableSlot, 'id'>) => {
    const id = crypto.randomUUID();
    const slotDoc: TimetableSlot = { ...slot, id };

    if (user) {
      const path = `users/${user.uid}/timetable/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'timetable', id), slotDoc);
        await addXp(30);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setTimetableState(prev => [...prev, slotDoc]);
      addXp(30);
    }
  };

  const updateTimetableSlot = async (id: string, updates: Partial<TimetableSlot>) => {
    const target = timetable.find(s => s.id === id);
    if (!target) return;
    const updatedSlot = { ...target, ...updates };

    if (user) {
      const path = `users/${user.uid}/timetable/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'timetable', id), updatedSlot);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setTimetableState(prev => prev.map(s => s.id === id ? updatedSlot : s));
    }
  };

  const deleteTimetableSlot = async (id: string) => {
    if (user) {
      const path = `users/${user.uid}/timetable/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'timetable', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      setTimetableState(prev => prev.filter(s => s.id !== id));
    }
  };

  // --- 5. Habit Mutations ---
  const addHabit = async (name: string, description: string, frequency: 'daily' | 'weekly') => {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString().split('T')[0];
    const habitDoc: Habit = { id, name, description, createdAt, frequency, history: {} };

    if (user) {
      const path = `users/${user.uid}/habits/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'habits', id), habitDoc);
        await addXp(40);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setHabitsState(prev => [...prev, habitDoc]);
      addXp(40);
    }
  };

  const toggleHabitDate = async (habitId: string, dateStr: string) => {
    const target = habits.find(h => h.id === habitId);
    if (!target) return;

    const history = { ...target.history };
    const wasCompleted = !!history[dateStr];
    if (wasCompleted) {
      delete history[dateStr];
    } else {
      history[dateStr] = true;
      await addXp(20);
    }

    const totLogged = Object.keys(history).length;
    const updatedHabit = { ...target, history };

    if (user) {
      const path = `users/${user.uid}/habits/${habitId}`;
      try {
        if (totLogged >= 5) {
          await triggerBadgeUnlock('habit_5_day');
        }
        await setDoc(doc(db, 'users', user.uid, 'habits', habitId), updatedHabit);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setHabitsState(prev => prev.map(h => {
        if (h.id !== habitId) return h;
        if (totLogged >= 5) {
          setTimeout(() => triggerBadgeUnlock('habit_5_day'), 0);
        }
        return updatedHabit;
      }));
    }
  };

  const deleteHabit = async (id: string) => {
    if (user) {
      const path = `users/${user.uid}/habits/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'habits', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      setHabitsState(prev => prev.filter(h => h.id !== id));
    }
  };

  // --- 6. Notes Mutations ---
  const addNote = async (note: Omit<Note, 'id' | 'createdAt' | 'bookmarked'>) => {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString().split('T')[0];
    const noteDoc: Note = { ...note, id, createdAt, bookmarked: false };

    if (user) {
      const path = `users/${user.uid}/notes/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'notes', id), noteDoc);
        await addXp(50);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setNotesState(prev => [...prev, noteDoc]);
      addXp(50);
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    const target = notes.find(n => n.id === id);
    if (!target) return;
    const updatedNote = { ...target, ...updates };

    if (user) {
      const path = `users/${user.uid}/notes/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'notes', id), updatedNote);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setNotesState(prev => prev.map(n => n.id === id ? updatedNote : n));
    }
  };

  const deleteNote = async (id: string) => {
    if (user) {
      const path = `users/${user.uid}/notes/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'notes', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      setNotesState(prev => prev.filter(n => n.id !== id));
    }
  };

  // --- 6.5 Flashcard Mutations ---
  const addFlashcard = async (card: Omit<Flashcard, 'id' | 'easeFactor' | 'intervalDays' | 'reviewsCount' | 'nextReviewAt'>) => {
    const id = crypto.randomUUID();
    const nextReviewAt = new Date().toISOString().split('T')[0];
    const flashDoc: Flashcard = { ...card, id, easeFactor: 2.5, intervalDays: 1, reviewsCount: 0, nextReviewAt };

    if (user) {
      const path = `users/${user.uid}/flashcards/${id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'flashcards', id), flashDoc);
        await addXp(30);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setFlashcardsState(prev => [...prev, flashDoc]);
      addXp(30);
    }
  };

  const deleteFlashcard = async (id: string) => {
    if (user) {
      const path = `users/${user.uid}/flashcards/${id}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'flashcards', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    } else {
      setFlashcardsState(prev => prev.filter(c => c.id !== id));
    }
  };

  // --- 7. Study Session Timer Logs ---
  const logStudyMinutes = async (minutes: number, pomodoros = 0) => {
    if (minutes <= 0) return;
    const today = new Date().toISOString().split('T')[0];
    const newSession: StudySession = {
      id: crypto.randomUUID(),
      date: today,
      durationMinutes: minutes,
      pomodorosCompleted: pomodoros,
      createdAt: new Date().toISOString()
    };

    const newSessions = [...stats.sessions, newSession];
    const xpEarned = Math.round(minutes * 2) + (pomodoros * 30);
    
    const totMins = newSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    let updatedBadges = [...stats.badges];

    if (totMins >= 60) {
      updatedBadges = updatedBadges.map(b => b.id === 'study_1_hour' ? { ...b, unlocked: true, unlockedAt: today } : b);
    }
    if (pomodoros >= 3) {
      updatedBadges = updatedBadges.map(b => b.id === 'pomodoro_3' ? { ...b, unlocked: true, unlockedAt: today } : b);
    }

    const activeDaysSet = new Set(newSessions.map(s => s.date));
    let streak = stats.streakDays;
    if (activeDaysSet.has(today) && streak === 0) {
      streak = 1;
    }

    const currentXp = stats.xp + xpEarned;
    const targetXpForLevel = stats.level * 500;
    let newLevel = stats.level;
    let tempXp = currentXp;

    if (tempXp >= targetXpForLevel) {
      newLevel += 1;
      tempXp = tempXp - targetXpForLevel;
    }

    const updatedStatsByTimer: UserStats = {
      ...stats,
      sessions: newSessions,
      level: newLevel,
      xp: tempXp,
      badges: updatedBadges,
      streakDays: streak
    };

    if (user) {
      const path = `users/${user.uid}`;
      try {
        await setDoc(doc(db, 'users', user.uid), updatedStatsByTimer);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      }
    } else {
      setStatsState(updatedStatsByTimer);
    }
  };

  // --- 8. Persistent Pomodoro Timer & Background Logic ---
  const [timerMode, setTimerModeState] = useState<'pomodoro' | 'short_break' | 'long_break'>(() => {
    const stored = localStorage.getItem('pomodoro_timer_mode');
    return (stored as 'pomodoro' | 'short_break' | 'long_break') || 'pomodoro';
  });

  const [isTimerRunning, setIsTimerRunningState] = useState<boolean>(() => {
    const stored = localStorage.getItem('pomodoro_timer_running');
    return stored === 'true';
  });

  const modeDurations = {
    pomodoro: 25,
    short_break: 5,
    long_break: 15
  };

  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const storedMode = localStorage.getItem('pomodoro_timer_mode') || 'pomodoro';
    const def = (modeDurations[storedMode as 'pomodoro' | 'short_break' | 'long_break'] || 25) * 60;
    const stored = localStorage.getItem('pomodoro_timer_remaining_seconds');
    return stored ? parseInt(stored, 10) : def;
  });

  const [expectedEndTime, setExpectedEndTime] = useState<number | null>(() => {
    const stored = localStorage.getItem('pomodoro_timer_expected_end');
    return stored ? parseInt(stored, 10) : null;
  });

  const [pomodorosCount, setPomodorosCount] = useState<number>(() => {
    const stored = localStorage.getItem('pomodoros_count');
    return stored ? parseInt(stored, 10) : 0;
  });

  const [minutes, setDisplayMinutes] = useState(25);
  const [seconds, setDisplaySeconds] = useState(0);

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

        gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      }
    } catch (e) {
      console.warn("Audio Context chime failed:", e);
    }
  };

  const setTimerMode = (mode: 'pomodoro' | 'short_break' | 'long_break') => {
    setIsTimerRunningState(false);
    setTimerModeState(mode);
    const secs = (modeDurations[mode] || 25) * 60;
    setRemainingSeconds(secs);
    setExpectedEndTime(null);

    localStorage.setItem('pomodoro_timer_mode', mode);
    localStorage.setItem('pomodoro_timer_running', 'false');
    localStorage.setItem('pomodoro_timer_remaining_seconds', String(secs));
    localStorage.removeItem('pomodoro_timer_expected_end');
  };

  const startTimer = () => {
    if (isTimerRunning) return;
    
    const exp = Date.now() + remainingSeconds * 1000;
    setIsTimerRunningState(true);
    setExpectedEndTime(exp);

    localStorage.setItem('pomodoro_timer_running', 'true');
    localStorage.setItem('pomodoro_timer_expected_end', String(exp));
  };

  const pauseTimer = () => {
    if (!isTimerRunning || !expectedEndTime) return;

    const left = Math.max(0, Math.round((expectedEndTime - Date.now()) / 1000));
    setIsTimerRunningState(false);
    setRemainingSeconds(left);
    setExpectedEndTime(null);

    localStorage.setItem('pomodoro_timer_running', 'false');
    localStorage.setItem('pomodoro_timer_remaining_seconds', String(left));
    localStorage.removeItem('pomodoro_timer_expected_end');
  };

  const resetTimer = () => {
    setIsTimerRunningState(false);
    const secs = (modeDurations[timerMode] || 25) * 60;
    setRemainingSeconds(secs);
    setExpectedEndTime(null);

    localStorage.setItem('pomodoro_timer_running', 'false');
    localStorage.setItem('pomodoro_timer_remaining_seconds', String(secs));
    localStorage.removeItem('pomodoro_timer_expected_end');
  };

  useEffect(() => {
    const updateTimer = () => {
      if (isTimerRunning && expectedEndTime) {
        const now = Date.now();
        const left = Math.max(0, Math.round((expectedEndTime - now) / 1000));
        
        if (left <= 0) {
          setIsTimerRunningState(false);
          setExpectedEndTime(null);
          
          localStorage.setItem('pomodoro_timer_running', 'false');
          localStorage.removeItem('pomodoro_timer_expected_end');
          localStorage.setItem('pomodoro_timer_remaining_seconds', '0');

          playChime();
          if (timerMode === 'pomodoro') {
            const nextCount = pomodorosCount + 1;
            setPomodorosCount(nextCount);
            localStorage.setItem('pomodoros_count', String(nextCount));
            logStudyMinutes(25, 1);
            alert("🎯 Focus Session Complete! Time to take a break.");
            setTimerMode('short_break');
          } else {
            alert("☕ Break finished! Back to study.");
            setTimerMode('pomodoro');
          }
        } else {
          setDisplayMinutes(Math.floor(left / 60));
          setDisplaySeconds(left % 60);
          localStorage.setItem('pomodoro_timer_remaining_seconds', String(left));
        }
      } else {
        setDisplayMinutes(Math.floor(remainingSeconds / 60));
        setDisplaySeconds(remainingSeconds % 60);
      }
    };

    updateTimer();

    const interval = setInterval(updateTimer, 200);

    return () => clearInterval(interval);
  }, [isTimerRunning, expectedEndTime, remainingSeconds, timerMode, pomodorosCount]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (isTimerRunning && expectedEndTime) {
          const now = Date.now();
          const left = Math.max(0, Math.round((expectedEndTime - now) / 1000));
          setDisplayMinutes(Math.floor(left / 60));
          setDisplaySeconds(left % 60);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isTimerRunning, expectedEndTime]);

  const resetApp = async () => {
    // pristine starting states
    const initialStats: UserStats = {
      level: 1,
      xp: 0,
      streakDays: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
      badges: defaultBadges.map(b => ({ ...b, unlocked: false, unlockedAt: undefined })),
      sessions: []
    };

    setTopicsState([]);
    setProblemsState([]);
    setProjectsState([]);
    setTimetableState(defaultTimetableSlots);
    
    const initialHabits: Habit[] = [
      { id: 'h1', name: 'Solve 2 DSA Problems', description: 'Keep the streak on LeetCode', createdAt: new Date().toISOString().split('T')[0], frequency: 'daily', history: {} },
      { id: 'h2', name: 'Study 5 Hours', description: 'Target daily focus time', createdAt: new Date().toISOString().split('T')[0], frequency: 'daily', history: {} },
      { id: 'h3', name: 'Standard Workout', description: 'Maintain overall energy and flow', createdAt: new Date().toISOString().split('T')[0], frequency: 'daily', history: {} }
    ];
    setHabitsState(initialHabits);

    const initialNotes: Note[] = [
      {
        id: 'n1',
        title: 'Study Guide: Spaced Repetition Tips',
        subject: 'General',
        content: `# Welcome to your Study & Revision Notes!\n\nUse this Markdown editor to keep structured research. Here is some core motivation:\n\n- **Interval 1**: Review topic 1 day later.\n- **Interval 2**: Review 3 days later.\n- **Interval 3**: Review 7 days later.\n\n### Code snippet block example:\n\`\`\`typescript\nfunction activeRecall() {\n  console.log("No passive re-reading. Test yourself!");\n}\n\`\`\n`,
        bookmarked: true,
        createdAt: new Date().toISOString().split('T')[0],
        flashcards: [
          { id: 'f1', category: 'General', question: 'What is temporal spacing?', answer: 'Leaving structured time delays between study sessions to strengthen synapse storage.', easeFactor: 2.5, intervalDays: 1, reviewsCount: 0, nextReviewAt: new Date().toISOString().split('T')[0] }
        ]
      }
    ];
    setNotesState(initialNotes);

    const initialFlashcards: Flashcard[] = [
      { id: 'f1', category: 'General', question: 'What is temporal spacing?', answer: 'Leaving structured time delays between study sessions to strengthen synapse storage.', easeFactor: 2.5, intervalDays: 1, reviewsCount: 0, nextReviewAt: new Date().toISOString().split('T')[0] }
    ];
    setFlashcardsState(initialFlashcards);
    setStatsState(initialStats);

    // clear caches
    localStorage.removeItem('study_topics');
    localStorage.removeItem('study_problems');
    localStorage.removeItem('study_projects');
    localStorage.removeItem('study_timetable');
    localStorage.removeItem('study_habits');
    localStorage.removeItem('study_notes');
    localStorage.removeItem('study_flashcards');
    localStorage.removeItem('study_stats');

    // overwrite FireStore values if logged in
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), initialStats);
        // Overwrite standard collections since listeners are active,
        // or let user populate new clean data
      } catch (err) {
        console.error("Firebase cloud reset error:", err);
      }
    }
  };

  return (
    <DashboardContext.Provider value={{
      user,
      authLoading,
      authError,
      signInWithGoogle,
      logout,
      clearAuthError,
      topics,
      problems,
      projects,
      timetable,
      habits,
      notes,
      flashcards,
      stats,
      addTopic,
      updateTopic,
      deleteTopic,
      completeTopic,
      reorderTopics,
      addProblem,
      updateProblem,
      deleteProblem,
      addProject,
      updateProject,
      deleteProject,
      toggleProjectSubtask,
      addTimetableSlot,
      updateTimetableSlot,
      deleteTimetableSlot,
      addHabit,
      toggleHabitDate,
      deleteHabit,
      addNote,
      updateNote,
      deleteNote,
      addFlashcard,
      deleteFlashcard,
      logStudyMinutes,
      addXp,
      resetApp,
      timerMode,
      setTimerMode,
      minutes,
      seconds,
      isTimerRunning,
      startTimer,
      pauseTimer,
      resetTimer,
      pomodorosCount,
      setPomodorosCount,
      toasts,
      showToast,
      checkExpiredTopics
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
