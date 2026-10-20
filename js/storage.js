const KEY = 'loup-garou-v1';
export function loadPreferences() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
export function savePreferences(value) {
  try { localStorage.setItem(KEY, JSON.stringify(value)); return true; } catch { return false; }
}
let database;
function openDatabase() {
  if (database) return database;
  database = new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(new Error('Stockage local indisponible.'));
    const request = indexedDB.open('loup-garou-audio', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('sounds', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Stockage bloqué : fermez les autres onglets du site.'));
  });
  return database;
}
async function transaction(mode, action) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sounds', mode);
    const request = action(tx.objectStore('sounds'));
    tx.oncomplete = () => resolve(request.result);
    tx.onabort = tx.onerror = () => reject(tx.error || new Error('Écriture impossible.'));
  });
}
export const customStore = {
  all: () => transaction('readonly', s => s.getAll()),
  put: sound => transaction('readwrite', s => s.put(sound)),
  remove: id => transaction('readwrite', s => s.delete(id))
};
