import { validate, VSTATUS_FA, DUP_FA } from '../validator/validator.js';
/** ردیف جدول نتایج: همه‌ی ستون‌های خواسته‌شده + توضیح فارسی. اعتبارسنجی دوباره با پچ انجام می‌شود (نه اعتماد به مقدار ذخیره‌شده). */
export function resultRows(records, dupMap = new Map()) {
  return records.map((r, i) => {
    const dup = dupMap.get(r.serial) || 'NONE', v = validate(r.serial, r.brand, r.model, { dup });
    return { n: i + 1, serial: r.serial, brand: r.brand, model: r.model, length: r.length ?? r.serial.length, prefix: r.prefix ?? '', vstatus: v.status, validation: VSTATUS_FA[v.status], dup, dupFa: DUP_FA[dup], srcFa: r.ruleSource === 'USER_DECLARED' ? 'اعلام کاربر' : 'پچ', explanation: v.explanation, ruleId: r.ruleId || '', jobId: r.jobId || '', partId: r.partId || '—', part: r.part || 0, src: r.ruleSource === 'USER_DECLARED' ? 'USER_DECLARED' : 'PATCH', minDistance: r.minDistance || 0, createdAt: r.createdAt || 0, classification: r.classification || '' };
  });
}
export const RESULT_COLUMNS = (pill) => [
  { key: 'n', label: 'ردیف', width: 7, sortVal: r => r.n },
  { key: 'serial', label: 'شماره سریال', cls: 'mono', width: 24 }, { key: 'partId', label: 'پارت', cls: 'mono', width: 12, sortVal: r => r.partId },
  { key: 'brand', label: 'برند', width: 12 }, { key: 'model', label: 'مدل', width: 12 },
  { key: 'length', label: 'طول', width: 7, sortVal: r => r.length }, { key: 'prefix', label: 'پیشوند', cls: 'mono', width: 10 },
  { key: 'validation', label: 'اعتبارسنجی', width: 18, html: r => pill(r.vstatus === 'VALID' ? 'p-ok' : 'p-bad', r.validation), text: r => r.validation + (r.vstatus === 'VALID' ? '' : ': ' + r.explanation) },
  { key: 'srcFa', label: 'منبع قاعده', width: 18, html: r => pill(r.src === 'USER_DECLARED' ? 'p-info' : 'p-ok', r.src === 'USER_DECLARED' ? 'اعلام کاربر' : 'پچ'), text: r => r.src === 'USER_DECLARED' ? 'اعلام کاربر (نه پچ)' : 'پچ' },
  { key: 'dupFa', label: 'وضعیت تکرار', width: 20, html: r => pill(r.dup === 'NONE' ? 'p-ok' : 'p-warn', r.dupFa) }
];
