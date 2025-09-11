import { StudySet, StudySession } from '../types/study';

interface OfflineStorageOptions {
  prefix?: string;
  version?: string;
}

class OfflineStorage {
  private prefix: string;
  private version: string;

  constructor(options: OfflineStorageOptions = {}) {
    this.prefix = options.prefix || 'resumeai_study';
    this.version = options.version || '1.0';
  }

  private getKey(key: string): string {
    return `${this.prefix}_${this.version}_${key}`;
  }

  // Study Sets
  saveStudySets(userId: string, studySets: StudySet[]): void {
    const key = this.getKey(`studySets_${userId}`);
    const data = {
      studySets,
      timestamp: Date.now(),
      version: this.version,
    };
    localStorage.setItem(key, JSON.stringify(data));
  }

  getStudySets(userId: string): StudySet[] | null {
    const key = this.getKey(`studySets_${userId}`);
    const data = localStorage.getItem(key);
    
    if (!data) return null;
    
    try {
      const parsed = JSON.parse(data);
      
      // Check if data is from current version
      if (parsed.version !== this.version) {
        console.warn('Study sets data version mismatch, clearing cache');
        this.clearStudySets(userId);
        return null;
      }
      
      // Revive dates
      return parsed.studySets.map((set: any) => ({
        ...set,
        createdAt: new Date(set.createdAt),
        lastStudied: set.lastStudied ? new Date(set.lastStudied) : undefined,
        flashcards: set.flashcards.map((card: any) => ({
          ...card,
          createdAt: new Date(card.createdAt),
          lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : undefined,
        })),
      }));
    } catch (error) {
      console.error('Error parsing cached study sets:', error);
      this.clearStudySets(userId);
      return null;
    }
  }

  clearStudySets(userId: string): void {
    const key = this.getKey(`studySets_${userId}`);
    localStorage.removeItem(key);
  }

  // Study Sessions
  saveStudySession(session: StudySession): void {
    const key = this.getKey(`session_${session.id}`);
    const data = {
      ...session,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  }

  getStudySession(sessionId: string): StudySession | null {
    const key = this.getKey(`session_${sessionId}`);
    const data = localStorage.getItem(key);
    
    if (!data) return null;
    
    try {
      const parsed = JSON.parse(data);
      return {
        ...parsed,
        startTime: new Date(parsed.startTime),
        endTime: parsed.endTime ? new Date(parsed.endTime) : undefined,
      };
    } catch (error) {
      console.error('Error parsing cached study session:', error);
      return null;
    }
  }

  // User Stats
  saveUserStats(userId: string, stats: any): void {
    const key = this.getKey(`stats_${userId}`);
    const data = {
      ...stats,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  }

  getUserStats(userId: string): any | null {
    const key = this.getKey(`stats_${userId}`);
    const data = localStorage.getItem(key);
    
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing cached user stats:', error);
      return null;
    }
  }

  // Study Progress
  saveStudyProgress(userId: string, studySetId: string, progress: any): void {
    const key = this.getKey(`progress_${userId}_${studySetId}`);
    const data = {
      ...progress,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
  }

  getStudyProgress(userId: string, studySetId: string): any | null {
    const key = this.getKey(`progress_${userId}_${studySetId}`);
    const data = localStorage.getItem(key);
    
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing cached study progress:', error);
      return null;
    }
  }

  // Clear all offline data
  clearAll(userId?: string): void {
    const keys = Object.keys(localStorage);
    const prefix = this.prefix;
    
    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        if (userId && !key.includes(userId)) {
          return; // Skip if userId specified and key doesn't contain it
        }
        localStorage.removeItem(key);
      }
    });
  }

  // Get storage usage info
  getStorageInfo(): { used: number; available: number; percentage: number } {
    let used = 0;
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        used += localStorage.getItem(key)?.length || 0;
      }
    });
    
    // Estimate available space (most browsers have ~5-10MB limit)
    const estimatedLimit = 5 * 1024 * 1024; // 5MB
    const available = Math.max(0, estimatedLimit - used);
    const percentage = (used / estimatedLimit) * 100;
    
    return { used, available, percentage };
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage();

// Export class for testing
export { OfflineStorage };
