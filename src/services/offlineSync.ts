import { supabase } from "@/integrations/supabase/client";
import {
  cacheCourse,
  cacheAssignment,
  cacheSubmission,
  getSyncQueue,
  removeSyncQueueItem,
  addToSyncQueue,
} from "./indexedDB";
import { toast } from "sonner";

let isOnline = navigator.onLine;
let isSyncing = false;

// Monitor online/offline status
export function initializeOfflineSync() {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Check online status periodically
  setInterval(checkOnlineStatus, 30000); // Every 30 seconds
}

function handleOnline() {
  isOnline = true;
  toast.success("Back online! Syncing data...");
  syncOfflineData();
}

function handleOffline() {
  isOnline = false;
  toast.info("You're offline. Changes will be saved locally and synced when you're back online.");
}

function checkOnlineStatus() {
  const wasOnline = isOnline;
  isOnline = navigator.onLine;
  
  if (!wasOnline && isOnline) {
    handleOnline();
  } else if (wasOnline && !isOnline) {
    handleOffline();
  }
}

export function getOnlineStatus() {
  return isOnline;
}

// Sync offline data when back online
export async function syncOfflineData() {
  if (isSyncing || !isOnline) return;
  
  isSyncing = true;
  const queue = await getSyncQueue();
  
  if (queue.length === 0) {
    isSyncing = false;
    return;
  }

  toast.loading("Syncing offline changes...", { id: 'offline-sync' });
  
  let successCount = 0;
  let failCount = 0;

  for (const item of queue) {
    try {
      switch (item.table) {
        case 'submissions':
          if (item.operation === 'insert') {
            const { error } = await supabase
              .from('submissions')
              .insert(item.data);
            if (error) throw error;
          } else if (item.operation === 'update') {
            const { error } = await supabase
              .from('submissions')
              .update(item.data)
              .eq('id', item.data.id);
            if (error) throw error;
          }
          break;
        
        case 'student_progress':
          if (item.operation === 'update') {
            const { error } = await supabase
              .from('student_progress')
              .upsert(item.data);
            if (error) throw error;
          }
          break;
      }
      
      await removeSyncQueueItem(item.id!);
      successCount++;
    } catch (error) {
      console.error('Sync error for item:', item, error);
      failCount++;
    }
  }

  isSyncing = false;
  
  if (failCount === 0) {
    toast.success(`Successfully synced ${successCount} changes`, { id: 'offline-sync' });
  } else {
    toast.error(`Synced ${successCount} changes, ${failCount} failed`, { id: 'offline-sync' });
  }
}

// Wrapper functions for offline-aware operations
export async function saveSubmissionOffline(submission: any) {
  await cacheSubmission(submission);
  
  if (isOnline) {
    try {
      const { error } = await supabase
        .from('submissions')
        .upsert(submission);
      
      if (error) throw error;
      toast.success("Submission saved successfully");
    } catch (error) {
      console.error('Error saving submission online:', error);
      await addToSyncQueue('submissions', 'insert', submission);
      toast.info("Saved locally. Will sync when back online.");
    }
  } else {
    await addToSyncQueue('submissions', 'insert', submission);
    toast.info("Saved offline. Will sync when back online.");
  }
}

export async function fetchAndCacheCourses(userId: string) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*');

    if (error) throw error;

    if (data) {
      for (const course of data) {
        await cacheCourse(course);
      }
    }
  } catch (error) {
    console.error('Error fetching courses:', error);
  }
}

export async function fetchAndCacheAssignments(courseId: string) {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', courseId);

    if (error) throw error;

    if (data) {
      for (const assignment of data) {
        await cacheAssignment(assignment);
      }
    }
  } catch (error) {
    console.error('Error fetching assignments:', error);
  }
}
