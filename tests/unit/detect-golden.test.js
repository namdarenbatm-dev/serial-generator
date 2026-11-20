import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { detect } from '../../src/core/vba.js';
const g = JSON.parse(fs.readFileSync(new URL('../golden/golden.json', import.meta.url)));
test(`golden: ${g.cases.length} مورد، پورت JS برابر مفسر متن VBA`, () => {
  const diffs = [];
  for (const [s, b, m] of g.cases) { const d = detect(s); if ((d.brand ?? null) !== (b ?? null) || d.model !== m) diffs.push({ s, expected: [b, m], got: [d.brand, d.model] }); }
  assert.equal(diffs.length, 0, 'اختلاف: ' + JSON.stringify(diffs.slice(0, 5)));
});
