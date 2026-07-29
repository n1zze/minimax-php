import { openDB } from 'idb'

const DB_NAME = 'mimimax-db'
const DB_VERSION = 1

const STORE_PROJECTS = 'projects'
const STORE_FILES = 'files'

/**
 * Initialize the database with stores:
 *  - projects: project metadata (keyed by id)
 *  - files: uploaded files as Blob (keyed by id)
 */
async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES, { keyPath: 'id' })
      }
    },
  })
}

// ─── Projects ───────────────────────────────────────

export async function dbGetProject(id) {
  const db = await getDB()
  return db.get(STORE_PROJECTS, id)
}

export async function dbGetAllProjects() {
  const db = await getDB()
  return db.getAll(STORE_PROJECTS)
}

export async function dbSaveProject(project) {
  const db = await getDB()
  await db.put(STORE_PROJECTS, project)
}

export async function dbDeleteProject(id) {
  const db = await getDB()
  await db.delete(STORE_PROJECTS, id)
}

// ─── Files ──────────────────────────────────────────

/**
 * Save a file (Blob or base64) to the database.
 * Returns the stored file record { id, projectId, section, name, blob, data }
 */
export async function dbSaveFile({ id, projectId, section, name, blob, data }) {
  const db = await getDB()
  const record = { id, projectId, section, name, blob, data, createdAt: Date.now() }
  await db.put(STORE_FILES, record)
  return record
}

/**
 * Get all files for a project section.
 */
export async function dbGetFiles(projectId, section) {
  const db = await getDB()
  const all = await db.getAll(STORE_FILES)
  return all.filter((f) => f.projectId === projectId && f.section === section)
}

/**
 * Get a single file by id.
 */
export async function dbGetFile(id) {
  const db = await getDB()
  return db.get(STORE_FILES, id)
}

/**
 * Delete a file by id.
 */
export async function dbDeleteFile(id) {
  const db = await getDB()
  await db.delete(STORE_FILES, id)
}

/**
 * Delete all files for a project section.
 */
export async function dbDeleteFilesBySection(projectId, section) {
  const db = await getDB()
  const all = await db.getAll(STORE_FILES)
  const tx = db.transaction(STORE_FILES, 'readwrite')
  for (const f of all) {
    if (f.projectId === projectId && f.section === section) {
      tx.store.delete(f.id)
    }
  }
  await tx.done
}

// ─── Seed ───────────────────────────────────────────

/**
 * Seed the database with mock projects if empty.
 * Called on app startup.
 */
export async function dbSeedIfNeeded(mockProjects) {
  const existing = await dbGetAllProjects()
  if (existing.length > 0) return

  for (const project of mockProjects) {
    await dbSaveProject(project)
  }
}
