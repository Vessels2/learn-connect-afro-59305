import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface EduAIDB extends DBSchema {
  courses: {
    key: string;
    value: {
      id: string;
      title: string;
      description: string;
      instructor_id: string;
      data: any;
      lastSync: number;
    };
    indexes: { 'by-lastSync': number };
  };
  assignments: {
    key: string;
    value: {
      id: string;
      title: string;
      description: string;
      course_id: string;
      due_date: string;
      data: any;
      lastSync: number;
    };
    indexes: { 'by-lastSync': number; 'by-course': string };
  };
  submissions: {
    key: string;
    value: {
      id: string;
      assignment_id: string;
      student_id: string;
      content: string;
      status: 'draft' | 'pending' | 'submitted';
      data: any;
      lastSync: number;
    };
    indexes: { 'by-lastSync': number; 'by-status': string };
  };
  syncQueue: {
    key: number;
    value: {
      id?: number;
      table: string;
      operation: 'insert' | 'update' | 'delete';
      data: any;
      timestamp: number;
    };
    indexes: { 'by-timestamp': number };
  };
}

let dbInstance: IDBPDatabase<EduAIDB> | null = null;

export async function getDB() {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<EduAIDB>('eduai-offline', 1, {
    upgrade(db) {
      // Courses store
      if (!db.objectStoreNames.contains('courses')) {
        const courseStore = db.createObjectStore('courses', { keyPath: 'id' });
        courseStore.createIndex('by-lastSync', 'lastSync');
      }

      // Assignments store
      if (!db.objectStoreNames.contains('assignments')) {
        const assignmentStore = db.createObjectStore('assignments', { keyPath: 'id' });
        assignmentStore.createIndex('by-lastSync', 'lastSync');
        assignmentStore.createIndex('by-course', 'course_id');
      }

      // Submissions store
      if (!db.objectStoreNames.contains('submissions')) {
        const submissionStore = db.createObjectStore('submissions', { keyPath: 'id' });
        submissionStore.createIndex('by-lastSync', 'lastSync');
        submissionStore.createIndex('by-status', 'status');
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        syncStore.createIndex('by-timestamp', 'timestamp');
      }
    },
  });

  return dbInstance;
}

// Course operations
export async function cacheCourse(course: any) {
  const db = await getDB();
  await db.put('courses', {
    ...course,
    lastSync: Date.now(),
  });
}

export async function getCachedCourses() {
  const db = await getDB();
  return db.getAll('courses');
}

export async function getCachedCourse(id: string) {
  const db = await getDB();
  return db.get('courses', id);
}

// Assignment operations
export async function cacheAssignment(assignment: any) {
  const db = await getDB();
  await db.put('assignments', {
    ...assignment,
    lastSync: Date.now(),
  });
}

export async function getCachedAssignments(courseId?: string) {
  const db = await getDB();
  if (courseId) {
    return db.getAllFromIndex('assignments', 'by-course', courseId);
  }
  return db.getAll('assignments');
}

export async function getCachedAssignment(id: string) {
  const db = await getDB();
  return db.get('assignments', id);
}

// Submission operations
export async function cacheSubmission(submission: any) {
  const db = await getDB();
  await db.put('submissions', {
    ...submission,
    lastSync: Date.now(),
  });
}

export async function getCachedSubmissions(status?: 'draft' | 'pending' | 'submitted') {
  const db = await getDB();
  if (status) {
    return db.getAllFromIndex('submissions', 'by-status', status);
  }
  return db.getAll('submissions');
}

// Sync queue operations
export async function addToSyncQueue(
  table: string,
  operation: 'insert' | 'update' | 'delete',
  data: any
) {
  const db = await getDB();
  await db.add('syncQueue', {
    table,
    operation,
    data,
    timestamp: Date.now(),
  });
}

export async function getSyncQueue() {
  const db = await getDB();
  return db.getAll('syncQueue');
}

export async function clearSyncQueue() {
  const db = await getDB();
  await db.clear('syncQueue');
}

export async function removeSyncQueueItem(id: number) {
  const db = await getDB();
  await db.delete('syncQueue', id);
}

// Clear all cached data
export async function clearAllCache() {
  const db = await getDB();
  await db.clear('courses');
  await db.clear('assignments');
  await db.clear('submissions');
  await db.clear('syncQueue');
}
