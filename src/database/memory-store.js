/* پیاده‌سازی درون‌حافظه‌ای همان قرارداد SerialStore؛ برای تست‌های خودکار و حالت بدون IndexedDB (که تولید را مجاز نمی‌کند). */
export class MemoryStore {
  constructor() { this.kind = 'memory'; this.serials = new Map(); this.exclusions = new Map(); this.jobs = new Map(); this.audit = []; this.failNext = null; }
  async init() { return this; }
  /** رزرو اتمیک یک دسته: هر سریال یا اضافه می‌شود یا به‌عنوان برخورد برمی‌گردد */
  async reserveMany(records) {
    if (this.failNext) { const e = this.failNext; this.failNext = null; throw e; }
    const added = [], collisions = [];
    for (const r of records) {
      if (this.exclusions.has(r.serial)) collisions.push({ serial: r.serial, reason: 'EXCLUSION' });
      else if (this.serials.has(r.serial)) collisions.push({ serial: r.serial, reason: 'HISTORY' });
      else { this.serials.set(r.serial, { ...r, status: 'reserved' }); added.push(r.serial); }
    }
    return { added, collisions };
  }
  async commitJob(jobId) { let n = 0; for (const r of this.serials.values()) if (r.jobId === jobId && r.status === 'reserved') { r.status = 'committed'; n++; } return n; }
  async rollbackJob(jobId) { let n = 0; for (const [k, r] of this.serials) if (r.jobId === jobId && r.status === 'reserved') { this.serials.delete(k); n++; } return n; }
  async all() { return [...this.serials.values()].filter(r => r.status === 'committed'); }
  async count() { let n = 0; for (const r of this.serials.values()) if (r.status === 'committed') n++; return n; }
  async lookup(list) { const out = new Map(); for (const s of list) { if (this.exclusions.has(s)) out.set(s, 'EXCLUSION'); else if (this.serials.has(s)) out.set(s, 'HISTORY'); } return out; }
  async addExclusions(listName, serials) { let added = 0, dup = 0; for (const s of serials) { if (this.exclusions.has(s)) dup++; else { this.exclusions.set(s, { serial: s, list: listName, addedAt: Date.now() }); added++; } } return { added, dup }; }
  async exclusionCount() { return this.exclusions.size; }
  async clearExclusions() { this.exclusions.clear(); }
  async deleteAllSerials() { this.serials.clear(); }
  async putJob(job) { this.jobs.set(job.id, { ...job }); }
  async jobs_() { return [...this.jobs.values()].sort((a, b) => b.startedAt - a.startedAt); }
  async addAudit(entry) { this.audit.push({ id: this.audit.length + 1, ts: Date.now(), ...entry }); }
  async auditList() { return [...this.audit].reverse(); }
}
