/* اعلام‌های کاربر: رابطه‌ی برند ↔ مدل که «در پچ نیست» ولی مالک پروژه صریحاً اعلام کرده است.
   این لایه جدا از پچ است و هیچ‌وقت در patch-rules.js یا golden وارد نمی‌شود. ترکیب‌های ساخته‌شده از آن
   با وضعیت USER_DECLARED علامت می‌خورند و در جدول‌ها و خروجی‌ها دیده می‌شوند.
   شرط پذیرش: پچ برای آن الگو «مدل» را می‌شناسد (MODEL_ONLY) و تابع برند پچ هیچ برند دیگری برنمی‌گرداند. */
export const DECLARATIONS = Object.freeze([
  Object.freeze({ model: 'SP600', brand: 'Newland', declaredBy: 'USER', declaredAt: '2026-11-14',
    note: 'اعلام صریح مالک پروژه: SP600 محصول Newland است. پچ فقط مدل SP600 را برمی‌گرداند و برند را نمی‌شناسد.' })
]);
export const declaredBrandOf = model => DECLARATIONS.find(d => d.model === model) || null;
