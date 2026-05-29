/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Topic {
  id: string;
  title: string;
  subject: string;
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  completed: boolean;
  notes: string;
  order: number;
}

export interface CodingProblem {
  id: string;
  title: string;
  platform: 'LeetCode' | 'GeeksforGeeks' | 'CodeStudio' | 'Other';
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  notes: string;
  solvedAt: string; // YYYY-MM-DD
  revisionMarked: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  deadline: string;
  status: 'Planned' | 'In Progress' | 'Completed';
  progress: number; // 0-100
  githubLink?: string;
  demoLink?: string;
  subtasks: Subtask[];
}

export interface TimetableSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' | 'All Days';
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  subject: string;
  description?: string;
  color: string; // Hex color or tailwind name
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  createdAt: string; // YYYY-MM-DD
  frequency: 'daily' | 'weekly';
  history: Record<string, boolean>; // date string -> completed
}

export interface Flashcard {
  id: string;
  category: string;
  question: string;
  answer: string;
  easeFactor: number;
  intervalDays: number;
  reviewsCount: number;
  nextReviewAt: string; // YYYY-MM-DD
}

export interface Note {
  id: string;
  title: string;
  subject: string;
  content: string; // Markdown text
  bookmarked: boolean;
  createdAt: string;
  revisionDue?: string; // YYYY-MM-DD spaced-repetition logic
  flashcards?: Flashcard[];
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  unlocked: boolean;
  unlockedAt?: string;
}

export interface StudySession {
  id: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  pomodorosCompleted: number;
  createdAt: string;
}

export interface UserStats {
  level: number;
  xp: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  badges: AchievementBadge[];
  sessions: StudySession[];
}
