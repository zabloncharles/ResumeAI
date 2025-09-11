import { useState, useEffect, useCallback } from 'react';

interface OfflineQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  docId?: string;
  data: any;
  timestamp: number;
  retries: number;
}

interface OfflineSupport {
  isOnline: boolean;
  isOfflineMode: boolean;
  queueLength: number;
  syncPendingChanges: () => Promise<void>;
  addToOfflineQueue: (item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retries'>) => void;
  clearOfflineQueue: () => void;
}

const OFFLINE_QUEUE_KEY = 'offline_queue';
const MAX_RETRIES = 3;
// const RETRY_DELAY = 5000; // 5 seconds - for future use

export const useOfflineSupport = (): OfflineSupport => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [queueLength, setQueueLength] = useState(0);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsOfflineMode(false);
      // Auto-sync when coming back online
      syncPendingChanges();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsOfflineMode(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial queue length
    const queue = getOfflineQueue();
    setQueueLength(queue.length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get offline queue from localStorage
  const getOfflineQueue = useCallback((): OfflineQueueItem[] => {
    try {
      const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error reading offline queue:', error);
      return [];
    }
  }, []);

  // Save offline queue to localStorage
  const saveOfflineQueue = useCallback((queue: OfflineQueueItem[]) => {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      setQueueLength(queue.length);
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }, []);

  // Add item to offline queue
  const addToOfflineQueue = useCallback((item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retries'>) => {
    const queue = getOfflineQueue();
    const newItem: OfflineQueueItem = {
      ...item,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };
    
    queue.push(newItem);
    saveOfflineQueue(queue);
  }, [getOfflineQueue, saveOfflineQueue]);

  // Sync pending changes when online
  const syncPendingChanges = useCallback(async () => {
    if (!isOnline) return;

    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    console.log(`Syncing ${queue.length} offline changes...`);

    const { db } = await import('../firebase');
    const { doc, setDoc, updateDoc, deleteDoc, collection, addDoc } = await import('firebase/firestore');

    const successfulItems: string[] = [];
    const failedItems: OfflineQueueItem[] = [];

    for (const item of queue) {
      try {
        switch (item.type) {
          case 'create':
            if (item.docId) {
              await setDoc(doc(db, item.collection, item.docId), item.data);
            } else {
              await addDoc(collection(db, item.collection), item.data);
            }
            break;
          case 'update':
            if (item.docId) {
              await updateDoc(doc(db, item.collection, item.docId), item.data);
            }
            break;
          case 'delete':
            if (item.docId) {
              await deleteDoc(doc(db, item.collection, item.docId));
            }
            break;
        }
        successfulItems.push(item.id);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        
        // Retry logic
        if (item.retries < MAX_RETRIES) {
          item.retries++;
          failedItems.push(item);
        } else {
          console.error(`Max retries exceeded for item ${item.id}, removing from queue`);
        }
      }
    }

    // Update queue with failed items
    if (failedItems.length > 0) {
      saveOfflineQueue(failedItems);
    } else {
      saveOfflineQueue([]);
    }

    console.log(`Synced ${successfulItems.length} items successfully`);
  }, [isOnline, getOfflineQueue, saveOfflineQueue]);

  // Clear offline queue
  const clearOfflineQueue = useCallback(() => {
    saveOfflineQueue([]);
  }, [saveOfflineQueue]);

  return {
    isOnline,
    isOfflineMode,
    queueLength,
    syncPendingChanges,
    addToOfflineQueue,
    clearOfflineQueue,
  };
};
