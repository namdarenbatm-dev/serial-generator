/* رجیستری پایدار روی IndexedDB. یکتایی را خود پایگاه‌داده با کلید اصلی «serial» تضمین می‌کند (ConstraintError)،
   نه فقط کد برنامه. رزرو هر دسته در یک تراکنش readwrite انجام می‌شود (exclusions + serials). */
const DB_NAME = 'pos-serial-generator', DB_VERSION = 1;
const req = r => new Promise((ok, no) => { r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
const done = tx => new Promise((ok, no) => { tx.oncomplete = () => ok(); tx.onerror = () => no(tx.error); tx.onabort = () => no(tx.error || new Error('تراکنش لغو شد')); });

export class IdbStore {
  constructor() { this.kind = 'indexeddb'; this.db = null; }
  async init() {
    if (typeof indexedDB === 'undefined') throw new Error('IndexedDB در این مرورگر در دسترس نیست.');
    this.db = await new Promise((ok, no) => {
      const o = indexedDB.open(DB_NAME, DB_VERSION);
      o.onupgradeneeded = () => {
        const d = o.result;
        const s = d.createObjectStore('serials', { keyPath: 'serial' }); s.createIndex('byJob', 'jobId'); s.createIndex('byModel', 'model');
        d.createObjectStore('exclusions', { keyPath: 'serial' });
        d.createObjectStore('jobs', { keyPath: 'id' });
        d.createObjectStore('audit', { keyPath: 'id', autoIncrement: true });
      };
      o.onsuccess = () => ok(o.result); o.onerror = () => no(o.error); o.onblocked = () => no(new Error('پایگاه‌داده توسط تب دیگری قفل است.'));
    });
    this.db.onversionchange = () => this.db.close();
    // آزمون واقعی نوشتن/خواندن؛ اگر حالت خصوصی/سهمیه مانع باشد همین‌جا معلوم می‌شود
    const tx = this.db.transaction('audit', 'readwrite'); tx.objectStore('audit').add({ ts: Date.now(), action: 'self-check' }); await done(tx);
    return this;
  }
  _tx(stores, mode = 'readonly') { return this.db.transaction(stores, mode); }
  async reserveMany(records) {
    const tx = this._tx(['serials', 'exclusions'], 'readwrite'), ss = tx.objectStore('serials'), ex = tx.objectStore('exclusions');
    const added = [], collisions = [];
    for (const r of records) {
      ex.get(r.serial).onsuccess = e => {
        if (e.target.result) { collisions.push({ serial: r.serial, reason: 'EXCLUSION' }); return; }
        const a = ss.add({ ...r, status: 'reserved' });
        a.onsuccess = () => added.push(r.serial);
        a.onerror = ev => { ev.preventDefault(); ev.stopPropagation(); collisions.push({ serial: r.serial, reason: 'HISTORY' }); };   // ConstraintError: تکراری
      };
    }
    await done(tx); return { added, collisions };
  }
  async _eachJob(jobId, fn) {
    const tx = this._tx('serials', 'readwrite'); let n = 0;
    await new Promise((ok, no) => {
      const c = tx.objectStore('serials').index('byJob').openCursor(IDBKeyRange.only(jobId));
      c.onsuccess = () => { const cur = c.result; if (!cur) return ok(); if (fn(cur)) n++; cur.continue(); }; c.onerror = () => no(c.error);
    });
    await done(tx); return n;
  }
  commitJob(jobId) { return this._eachJob(jobId, cur => { if (cur.value.status === 'reserved') { cur.update({ ...cur.value, status: 'committed' }); return true; } return false; }); }
  rollbackJob(jobId) { return this._eachJob(jobId, cur => { if (cur.value.status === 'reserved') { cur.delete(); return true; } return false; }); }
  async all() { const v = await req(this._tx('serials').objectStore('serials').getAll()); return v.filter(r => r.status === 'committed'); }
  async count() { return (await this.all()).length; }
  async lookup(list) {
    const out = new Map(), tx = this._tx(['serials', 'exclusions']), ss = tx.objectStore('serials'), ex = tx.objectStore('exclusions');
    for (const s of list) { ex.getKey(s).onsuccess = e => { if (e.target.result !== undefined) out.set(s, 'EXCLUSION'); else ss.getKey(s).onsuccess = e2 => { if (e2.target.result !== undefined) out.set(s, 'HISTORY'); }; }; }
    await done(tx); return out;
  }
  async addExclusions(listName, serials) {
    let added = 0, dup = 0; const tx = this._tx('exclusions', 'readwrite'), os = tx.objectStore('exclusions');
    for (const s of serials) { const a = os.add({ serial: s, list: listName, addedAt: Date.now() }); a.onsuccess = () => added++; a.onerror = ev => { ev.preventDefault(); ev.stopPropagation(); dup++; }; }
    await done(tx); return { added, dup };
  }
  async exclusionCount() { return req(this._tx('exclusions').objectStore('exclusions').count()); }
  async clearExclusions() { const tx = this._tx('exclusions', 'readwrite'); tx.objectStore('exclusions').clear(); await done(tx); }
  async deleteAllSerials() { const tx = this._tx('serials', 'readwrite'); tx.objectStore('serials').clear(); await done(tx); }
  async putJob(job) { const tx = this._tx('jobs', 'readwrite'); tx.objectStore('jobs').put(JSON.parse(JSON.stringify(job))); await done(tx); }
  async jobs_() { return (await req(this._tx('jobs').objectStore('jobs').getAll())).sort((a, b) => b.startedAt - a.startedAt); }
  async addAudit(entry) { const tx = this._tx('audit', 'readwrite'); tx.objectStore('audit').add({ ts: Date.now(), ...JSON.parse(JSON.stringify(entry)) }); await done(tx); }
  async auditList() { return (await req(this._tx('audit').objectStore('audit').getAll())).reverse(); }
  async estimate() { try { return await navigator.storage.estimate(); } catch { return null; } }
}
