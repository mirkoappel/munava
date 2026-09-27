const STORAGE_PREFIX = 'holodeck:program-draft:';
const LEGACY_IDS = { 'sherlock-holmes': 'hello-world', 'wild-west': 'testfeld' };

function storageKey(programId) {
  return `${STORAGE_PREFIX}${programId}`;
}

export class LocalProgramStore {
  constructor() {
    this.fallback = new Map();
  }

  async load(programId) {
    let raw = this.fallback.get(programId) || null;
    try {
      raw = localStorage.getItem(storageKey(programId)) || raw;
      const legacyId = LEGACY_IDS[programId];
      const migrationKey = `holodeck:migrated:${programId}`;
      if (!raw && legacyId && !localStorage.getItem(migrationKey)) {
        const legacyRaw = localStorage.getItem(storageKey(legacyId));
        if (legacyRaw) {
          const legacy = JSON.parse(legacyRaw);
          if (legacy.programId === legacyId && legacy.scene) {
            raw = JSON.stringify({ ...legacy, programId });
            localStorage.setItem(storageKey(programId), raw);
            localStorage.setItem(migrationKey, '1');
          }
        }
      }
    } catch (error) {
      console.warn('Local storage is unavailable; using an in-memory draft.', error);
    }
    if (!raw) return null;

    try {
      const record = JSON.parse(raw);
      if (!record || record.programId !== programId || !record.scene) return null;
      return record;
    } catch (error) {
      console.warn(`Could not read saved program ${programId}:`, error);
      return null;
    }
  }

  async save(programId, scene) {
    const savedAt = new Date().toISOString();
    const record = {
      format: 'three-object-scene',
      formatVersion: 1,
      programId,
      revision: savedAt,
      savedAt,
      scene,
    };

    const serialized = JSON.stringify(record);
    this.fallback.set(programId, serialized);
    try {
      localStorage.setItem(storageKey(programId), serialized);
      if (LEGACY_IDS[programId]) localStorage.setItem(`holodeck:migrated:${programId}`, '1');
    } catch (error) {
      console.warn('Local storage is unavailable; the draft lasts only for this page session.', error);
    }
    return record;
  }

  async clear(programId) {
    this.fallback.delete(programId);
    try {
      if (LEGACY_IDS[programId]) localStorage.setItem(`holodeck:migrated:${programId}`, '1');
      localStorage.removeItem(storageKey(programId));
    } catch (error) {
      console.warn('Local storage is unavailable; only the in-memory draft was cleared.', error);
    }
  }
}

export function createProgramStore() {
  return new LocalProgramStore();
}
