/* شاخص تفاوت (Diversity Index).
   تعریف دقیق: دو سریال هم‌الگو (هم‌طول و هم‌پیشوند) «بیش از حد شبیه‌اند» اگر فاصله‌ی همینگ بخش متغیرشان کمتر از minDistance باشد.
   فاصله‌ی همینگ = تعداد جایگاه‌هایی که نویسه‌ی دو سریال در آن‌ها فرق دارد.
   روش (بدون مقایسه‌ی دوبه‌دو): برای k = minDistance-1، همه‌ی زیرمجموعه‌های k‌تایی از جایگاه‌ها «پوشانده» می‌شوند و کلید باقی‌مانده هش می‌شود.
   دو سریال با فاصله ≤ k دست‌کم یک پوشش مشترک دارند، پس برخورد کلید ⇔ شباهت. کلید ۶۴ بیتی (دو هش ۳۲بیتی) است؛
   احتمال برخورد کاذب (رد اضافی یک کاندید سالم) ناچیز است و فقط به‌سمت محافظه‌کارانه خطا می‌کند. */
const C1 = 0x811C9DC5, P = 0x01000193;
function combos(n, k) { // همه‌ی زیرمجموعه‌های k‌تایی از {0..n-1}
  const out = [], cur = [];
  (function rec(s) { if (cur.length === k) { out.push(cur.slice()); return; } for (let i = s; i < n; i++) { cur.push(i); rec(i + 1); cur.pop(); } })(0);
  return out;
}
export class DiversityIndex {
  /** @param n طول بخش متغیر  @param minDistance ۱ = فقط یکتایی، ۲ و ۳ = فاصله‌ی بیشتر */
  constructor(n, minDistance = 1, expected = 1024) {
    this.n = n; this.d = Math.max(1, Math.min(minDistance, Math.max(1, n)));
    this.k = this.d - 1; this.masks = this.k > 0 ? combos(n, this.k) : [];
    this.size = 0; this._alloc(Math.max(1024, 1 << Math.ceil(Math.log2(Math.max(8, expected * Math.max(1, this.masks.length) * 2)))));
  }
  _alloc(cap) { this.cap = cap; this.a = new Uint32Array(cap); this.b = new Uint32Array(cap); }
  _hash(v, m) {
    let h1 = C1 ^ (m * 0x9E3779B1), h2 = 0x1B873593 + m, skip = this.masks[m] || [], si = 0;
    for (let i = 0; i < v.length; i++) {
      if (si < skip.length && skip[si] === i) { si++; continue; }
      const c = v.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, P) >>> 0; h2 = Math.imul(h2 + c + 0x7F4A7C15, 0x85EBCA6B) >>> 0; h2 ^= h2 >>> 13;
    }
    return [h1 >>> 0, (h2 | 1) >>> 0];
  }
  _find(h1, h2) { let i = h1 & (this.cap - 1); for (;;) { if (this.b[i] === 0) return -1 - i; if (this.a[i] === h1 && this.b[i] === h2) return i; i = (i + 1) & (this.cap - 1); } }
  _put(h1, h2) {
    const i = this._find(h1, h2); if (i >= 0) return;
    if ((this.size + 1) * 2 > this.cap) { this._grow(); return this._put(h1, h2); }
    const j = -1 - i; this.a[j] = h1; this.b[j] = h2; this.size++;
  }
  _grow() { const oa = this.a, ob = this.b; this.size = 0; this._alloc(this.cap * 2); for (let i = 0; i < oa.length; i++) if (ob[i] !== 0) { const j = -1 - this._find(oa[i], ob[i]); this.a[j] = oa[i]; this.b[j] = ob[i]; this.size++; } }
  _keys(v) { const n = Math.max(1, this.masks.length), out = []; for (let m = 0; m < n; m++) out.push(this._hash(v, this.masks.length ? m : 0)); return out; }
  /** آیا کاندید با یکی از سریال‌های ثبت‌شده فاصله‌ی کمتر از minDistance دارد؟ (برای d=1 فقط برابری) */
  tooClose(v) { for (const [h1, h2] of this._keys(v)) if (this._find(h1, h2) >= 0) return true; return false; }
  add(v) { for (const [h1, h2] of this._keys(v)) this._put(h1, h2); }
}
/** فاصله‌ی همینگ دو رشته‌ی هم‌طول */
export function hamming(a, b) { let d = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++; return d; }
