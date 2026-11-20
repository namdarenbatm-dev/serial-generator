# قواعد استخراج‌شده از پچ (PATCH_RULES)

منبع: BrandPAX.xlam › vbaProject.bin

> تولیدشده خودکار با `tools/gen_docs.mjs` از `src/rules/patch-rules.js` (که خود با `tools/extract_rules.py` از متن VBA ساخته شده). دستی ویرایش نکنید.

## توابع بررسی‌شده

| تابع | ماژول | تعداد قاعده | خط تفسیرنشده |
|---|---|---|---|
| Brand_SerialCartKhan | Module79 | 82 | 0 |
| Model_SerialCartKhan | Module3 | 87 | 0 |

توابع `Model_PartCartKhan` (شماره‌ی قطعه) و `x_Model_Noskheh` (نسخه) روی ورودی‌هایی غیر از سریال کار می‌کنند و خارج از دامنه‌اند. تابع‌های دیگر ماژول‌ها (فرم‌ها و ابزارهای SharePoint/بانک) به تشخیص سریال ربطی ندارند.

## معناشناسی دقیق (مطابق متن VBA)

- `s = Trim(Ceil)`: فقط فاصله‌ی U+0020 از دو سر حذف می‌شود، نه tab یا NBSP.
- `L = Len(s)`؛ سپس ۲ نویسه‌ی اول (`s`)، ۳ نویسه‌ی اول (در Brand متغیر `s2`) و ۴ نویسه‌ی اول (در Model متغیر `s3`).
- قانون‌ها پشت‌سرهم اجرا می‌شوند و **آخرین مطابقت برنده است** (بازنویسی). برند اگر چیزی جور نشود Empty (`null`)، مدل `""` است.
- مقایسه حساس به حروف (در هیچ ماژولی `Option Compare Text` نیست): `2K` و `2k` دو کلید جدا هستند.
- هیچ نرمال‌سازی (ارقام فارسی، تمام‌عرض، حذف نویسه‌ی کنترلی) در پچ نیست و این برنامه هم انجام نمی‌دهد.
- قانون سراسری برند: ۳ نویسه‌ی اول برابر `124` ⇒ `Pax` برای هر طولی.

## الگوهای مشتق‌شده و وضعیت

هر ردیف یک «الگو» (طول + پیشوند) است. وضعیت از اجرای خودِ دو تابع روی نمونه‌ی کاوشی همان الگو به دست آمده، نه از حدس.

| شناسه | طول | پیشوند | برند | مدل | وضعیت | اولویت | مرجع VBA |
|---|---|---|---|---|---|---|---|
| L7:124 | 7 | `124` | Pax | — | فقط برند در پچ | 82 | Brand_SerialCartKhan Module79:139 |
| L7:26 | 7 | `26` | Pax | S80 | تأیید‌شده | 4 | Brand_SerialCartKhan Module79:16<br>Model_SerialCartKhan Module3:16 |
| L7:2K | 7 | `2K` | — | S80 | فقط مدل در پچ | 1 | Model_SerialCartKhan Module3:15 |
| L7:30 | 7 | `30` | Pax | S90 | تأیید‌شده | 4 | Brand_SerialCartKhan Module79:13<br>Model_SerialCartKhan Module3:18 |
| L7:37 | 7 | `37` | Pax | S90 | تأیید‌شده | 5 | Brand_SerialCartKhan Module79:14<br>Model_SerialCartKhan Module3:19 |
| L7:38 | 7 | `38` | Pax | S90 | تأیید‌شده | 6 | Brand_SerialCartKhan Module79:15<br>Model_SerialCartKhan Module3:20 |
| L7:3D | 7 | `3D` | — | S90 | فقط مدل در پچ | 7 | Model_SerialCartKhan Module3:21 |
| L7:54 | 7 | `54` | — | S800 | فقط مدل در پچ | 3 | Model_SerialCartKhan Module3:17 |
| L7:55 | 7 | `55` | — | S900 | فقط مدل در پچ | 8 | Model_SerialCartKhan Module3:22 |
| L8:03 | 8 | `03` | Pax | S90 | تأیید‌شده | 31 | Brand_SerialCartKhan Module79:46<br>Model_SerialCartKhan Module3:58 |
| L8:124 | 8 | `124` | Pax | — | فقط برند در پچ | 82 | Brand_SerialCartKhan Module79:139 |
| L8:21 | 8 | `21` | Pax | Verifone | ناسازگار در پچ | 61 | Brand_SerialCartKhan Module79:47<br>Model_SerialCartKhan Module3:93 |
| L8:23 | 8 | `23` | Pax | D210 | تأیید‌شده | 64 | Brand_SerialCartKhan Module79:87<br>Model_SerialCartKhan Module3:99 |
| L8:25 | 8 | `25` | Pax | S80 | تأیید‌شده | 14 | Brand_SerialCartKhan Module79:32<br>Model_SerialCartKhan Module3:36 |
| L8:26 | 8 | `26` | Pax | — | فقط برند در پچ | 69 | Brand_SerialCartKhan Module79:92 |
| L8:29 | 8 | `29` | Pax | S80 | تأیید‌شده | 13 | Brand_SerialCartKhan Module79:21<br>Model_SerialCartKhan Module3:37 |
| L8:2A | 8 | `2A` | Pax | D210 | تأیید‌شده | 63 | Brand_SerialCartKhan Module79:86<br>Model_SerialCartKhan Module3:98 |
| L8:2C | 8 | `2C` | Pax | S80 | تأیید‌شده | 72 | Brand_SerialCartKhan Module79:95<br>Model_SerialCartKhan Module3:102 |
| L8:2D | 8 | `2D` | Pax | S90 | تأیید‌شده | 32 | Brand_SerialCartKhan Module79:48<br>Model_SerialCartKhan Module3:59 |
| L8:2E | 8 | `2E` | Pax | S80 | تأیید‌شده | 71 | Brand_SerialCartKhan Module79:94<br>Model_SerialCartKhan Module3:103 |
| L8:2H | 8 | `2H` | Pax | S80 | تأیید‌شده | 67 | Brand_SerialCartKhan Module79:90<br>Model_SerialCartKhan Module3:104 |
| L8:2k | 8 | `2k` | Pax | — | فقط برند در پچ | 21 | Brand_SerialCartKhan Module79:39 |
| L8:2K | 8 | `2K` | Pax | S80 | تأیید‌شده | 14 | Brand_SerialCartKhan Module79:23<br>Model_SerialCartKhan Module3:38 |
| L8:2l | 8 | `2l` | Pax | — | فقط برند در پچ | 22 | Brand_SerialCartKhan Module79:40 |
| L8:2L | 8 | `2L` | Pax | S80 | تأیید‌شده | 15 | Brand_SerialCartKhan Module79:31<br>Model_SerialCartKhan Module3:39 |
| L8:2M | 8 | `2M` | Pax | S80 | تأیید‌شده | 33 | Brand_SerialCartKhan Module79:41<br>Model_SerialCartKhan Module3:40<br>Model_SerialCartKhan Module3:60 |
| L8:2N | 8 | `2N` | Pax | S80 | تأیید‌شده | 24 | Brand_SerialCartKhan Module79:42<br>Model_SerialCartKhan Module3:41 |
| L8:2P | 8 | `2P` | Pax | S80 | تأیید‌شده | 67 | Brand_SerialCartKhan Module79:89<br>Model_SerialCartKhan Module3:105 |
| L8:2Q | 8 | `2Q` | Pax | S80 | تأیید‌شده | 70 | Brand_SerialCartKhan Module79:93<br>Model_SerialCartKhan Module3:106 |
| L8:2R | 8 | `2R` | Pax | S80 | تأیید‌شده | 69 | Brand_SerialCartKhan Module79:88<br>Model_SerialCartKhan Module3:107 |
| L8:2Z | 8 | `2Z` | Pax | S80 | تأیید‌شده | 70 | Brand_SerialCartKhan Module79:91<br>Model_SerialCartKhan Module3:108 |
| L8:30 | 8 | `30` | Pax | S90 | تأیید‌شده | 34 | Brand_SerialCartKhan Module79:49<br>Model_SerialCartKhan Module3:61 |
| L8:32 | 8 | `32` | Pax | S90 | تأیید‌شده | 35 | Brand_SerialCartKhan Module79:22<br>Model_SerialCartKhan Module3:62 |
| L8:36 | 8 | `36` | Pax | S90 | تأیید‌شده | 36 | Brand_SerialCartKhan Module79:50<br>Model_SerialCartKhan Module3:63 |
| L8:38 | 8 | `38` | Pax | S90 | تأیید‌شده | 37 | Brand_SerialCartKhan Module79:51<br>Model_SerialCartKhan Module3:64 |
| L8:3A | 8 | `3A` | Pax | S90 | تأیید‌شده | 38 | Brand_SerialCartKhan Module79:52<br>Model_SerialCartKhan Module3:65 |
| L8:3C | 8 | `3C` | Pax | S90 | تأیید‌شده | 39 | Brand_SerialCartKhan Module79:35<br>Model_SerialCartKhan Module3:66 |
| L8:3D | 8 | `3D` | Pax | S90 | تأیید‌شده | 40 | Brand_SerialCartKhan Module79:34<br>Model_SerialCartKhan Module3:67 |
| L8:3E | 8 | `3E` | Pax | S90 | تأیید‌شده | 41 | Brand_SerialCartKhan Module79:53<br>Model_SerialCartKhan Module3:68 |
| L8:3F | 8 | `3F` | Pax | S90 | تأیید‌شده | 42 | Brand_SerialCartKhan Module79:54<br>Model_SerialCartKhan Module3:69 |
| L8:3G | 8 | `3G` | Pax | S90 | تأیید‌شده | 43 | Brand_SerialCartKhan Module79:55<br>Model_SerialCartKhan Module3:70 |
| L8:3H | 8 | `3H` | Pax | S90 | تأیید‌شده | 44 | Brand_SerialCartKhan Module79:56<br>Model_SerialCartKhan Module3:71 |
| L8:3J | 8 | `3J` | Pax | S90 | تأیید‌شده | 45 | Brand_SerialCartKhan Module79:57<br>Model_SerialCartKhan Module3:72 |
| L8:3K | 8 | `3K` | Pax | S90 | تأیید‌شده | 46 | Brand_SerialCartKhan Module79:58<br>Model_SerialCartKhan Module3:73 |
| L8:3L | 8 | `3L` | Pax | S90 | تأیید‌شده | 18 | Brand_SerialCartKhan Module79:33<br>Model_SerialCartKhan Module3:42 |
| L8:3M | 8 | `3M` | Pax | S90 | تأیید‌شده | 47 | Brand_SerialCartKhan Module79:59<br>Model_SerialCartKhan Module3:74 |
| L8:3Q | 8 | `3Q` | Pax | S90 | تأیید‌شده | 48 | Brand_SerialCartKhan Module79:60<br>Model_SerialCartKhan Module3:75 |
| L8:3W | 8 | `3W` | Pax | S90 | تأیید‌شده | 49 | Brand_SerialCartKhan Module79:61<br>Model_SerialCartKhan Module3:76 |
| L8:45 | 8 | `45` | Pax | S90 | تأیید‌شده | 73 | Brand_SerialCartKhan Module79:96<br>Model_SerialCartKhan Module3:110 |
| L8:4A | 8 | `4A` | Pax | S90 | تأیید‌شده | 50 | Brand_SerialCartKhan Module79:62<br>Model_SerialCartKhan Module3:77 |
| L8:4C | 8 | `4C` | Pax | S90 | تأیید‌شده | 51 | Brand_SerialCartKhan Module79:63<br>Model_SerialCartKhan Module3:78 |
| L8:4D | 8 | `4D` | Pax | S90 | تأیید‌شده | 52 | Brand_SerialCartKhan Module79:64<br>Model_SerialCartKhan Module3:79 |
| L8:4H | 8 | `4H` | Pax | S90 | تأیید‌شده | 53 | Brand_SerialCartKhan Module79:65<br>Model_SerialCartKhan Module3:80 |
| L8:4K | 8 | `4K` | Pax | S90 | تأیید‌شده | 54 | Brand_SerialCartKhan Module79:66<br>Model_SerialCartKhan Module3:81 |
| L8:4Z | 8 | `4Z` | Pax | S90 | تأیید‌شده | 55 | Brand_SerialCartKhan Module79:67<br>Model_SerialCartKhan Module3:82 |
| L8:51 | 8 | `51` | Pax | D210 | تأیید‌شده | 9 | Brand_SerialCartKhan Module79:26<br>Model_SerialCartKhan Module3:28 |
| L8:54 | 8 | `54` | Pax | S800 | تأیید‌شده | 24 | Brand_SerialCartKhan Module79:30<br>Model_SerialCartKhan Module3:50 |
| L8:55 | 8 | `55` | Pax | S900 | تأیید‌شده | 57 | Brand_SerialCartKhan Module79:28<br>Model_SerialCartKhan Module3:85 |
| L8:5C | 8 | `5C` | Pax | D210 | تأیید‌شده | 10 | Brand_SerialCartKhan Module79:25<br>Model_SerialCartKhan Module3:29 |
| L8:5D | 8 | `5D` | Pax | S90 | تأیید‌شده | 56 | Brand_SerialCartKhan Module79:68<br>Model_SerialCartKhan Module3:83 |
| L8:5F | 8 | `5F` | Pax | D210 | تأیید‌شده | 50 | Brand_SerialCartKhan Module79:69<br>Model_SerialCartKhan Module3:30 |
| L8:68 | 8 | `68` | Pax | S920 | تأیید‌شده | 60 | Brand_SerialCartKhan Module79:38<br>Model_SerialCartKhan Module3:90 |
| L8:6P | 8 | `6P` | Pax | S80 | تأیید‌شده | 51 | Brand_SerialCartKhan Module79:70<br>Model_SerialCartKhan Module3:43 |
| L8:72 | 8 | `72` | Pax | S910 | تأیید‌شده | 58 | Brand_SerialCartKhan Module79:29<br>Model_SerialCartKhan Module3:87 |
| L8:76 | 8 | `76` | Pax | S910 | تأیید‌شده | 72 | Brand_SerialCartKhan Module79:43<br>Model_SerialCartKhan Module3:112 |
| L8:7A | 8 | `7A` | Pax | S910 | تأیید‌شده | 59 | Brand_SerialCartKhan Module79:37<br>Model_SerialCartKhan Module3:88 |
| L8:7D | 8 | `7D` | Pax | S80 | تأیید‌شده | 52 | Brand_SerialCartKhan Module79:71<br>Model_SerialCartKhan Module3:44 |
| L8:7L | 8 | `7L` | Pax | — | فقط برند در پچ | 18 | Brand_SerialCartKhan Module79:36 |
| L8:88 | 8 | `88` | Pax | S90 | تأیید‌شده | 53 | Brand_SerialCartKhan Module79:72<br>Model_SerialCartKhan Module3:52 |
| L8:89 | 8 | `89` | Pax | S80 | تأیید‌شده | 54 | Brand_SerialCartKhan Module79:73<br>Model_SerialCartKhan Module3:45 |
| L8:8C | 8 | `8C` | Pax | S90 | تأیید‌شده | 55 | Brand_SerialCartKhan Module79:74<br>Model_SerialCartKhan Module3:53 |
| L8:8E | 8 | `8E` | Pax | S80 | تأیید‌شده | 56 | Brand_SerialCartKhan Module79:75<br>Model_SerialCartKhan Module3:46 |
| L8:9A | 8 | `9A` | Pax | — | فقط برند در پچ | 26 | Brand_SerialCartKhan Module79:44 |
| L8:D0 | 8 | `D0` | Pax | S90 | تأیید‌شده | 57 | Brand_SerialCartKhan Module79:76<br>Model_SerialCartKhan Module3:54 |
| L8:H0 | 8 | `H0` | Pax | S90 | تأیید‌شده | 58 | Brand_SerialCartKhan Module79:77<br>Model_SerialCartKhan Module3:55 |
| L8:H1 | 8 | `H1` | Pax | S90 | تأیید‌شده | 59 | Brand_SerialCartKhan Module79:78<br>Model_SerialCartKhan Module3:56 |
| L8:M0 | 8 | `M0` | Pax | S80 | تأیید‌شده | 60 | Brand_SerialCartKhan Module79:79<br>Model_SerialCartKhan Module3:47 |
| L8:P3 | 8 | `P3` | Pax | S90 | تأیید‌شده | 62 | Brand_SerialCartKhan Module79:80<br>Brand_SerialCartKhan Module79:81<br>Model_SerialCartKhan Module3:57 |
| L10:08 | 10 | `08` | Pax | Q80 | تأیید‌شده | 75 | Brand_SerialCartKhan Module79:104<br>Model_SerialCartKhan Module3:132 |
| L10:0800 | 10 | `0800` | Pax | Q80 | تأیید‌شده (زیرمجموعه‌ی L10:08) | 76 | Model_SerialCartKhan Module3:137 |
| L10:11 | 10 | `11` | Pax | — | فقط برند در پچ | 74 | Brand_SerialCartKhan Module79:103 |
| L10:12 | 10 | `12` | — | A80 | فقط مدل در پچ | 73 | Model_SerialCartKhan Module3:130 |
| L10:124 | 10 | `124` | Pax | A80 | تأیید‌شده | 82 | Brand_SerialCartKhan Module79:139 |
| L10:20 | 10 | `20` | — | Verifone | فقط مدل در پچ | 75 | Model_SerialCartKhan Module3:134 |
| L10:23 | 10 | `23` | Pax | D230 | تأیید‌شده | 77 | Brand_SerialCartKhan Module79:108<br>Model_SerialCartKhan Module3:144 |
| L11:124 | 11 | `124` | Pax | — | فقط برند در پچ | 82 | Brand_SerialCartKhan Module79:139 |
| L11:20 | 11 | `20` | Verifone | Verifone | تأیید‌شده | 78 | Brand_SerialCartKhan Module79:117<br>Model_SerialCartKhan Module3:156 |
| L11:21 | 11 | `21` | Verifone | Verifone | تأیید‌شده | 79 | Brand_SerialCartKhan Module79:118<br>Model_SerialCartKhan Module3:157 |
| L11:28 | 11 | `28` | Verifone | Verifone | تأیید‌شده | 80 | Brand_SerialCartKhan Module79:119<br>Model_SerialCartKhan Module3:158 |
| L11:31 | 11 | `31` | Verifone | Verifone | تأیید‌شده | 81 | Brand_SerialCartKhan Module79:121<br>Model_SerialCartKhan Module3:159 |
| L11:32 | 11 | `32` | Verifone | Verifone | تأیید‌شده | 82 | Brand_SerialCartKhan Module79:120<br>Model_SerialCartKhan Module3:160 |
| L12:124 | 12 | `124` | Pax | — | فقط برند در پچ | 82 | Brand_SerialCartKhan Module79:139 |
| L12:J7 | 12 | `J7` | Newland | SP600 | اعلام‌شده توسط کاربر | 83 | Model_SerialCartKhan Module3:170 |
| L17:124 | 17 | `124` | Pax | — | فقط برند در پچ | 82 | Brand_SerialCartKhan Module79:139 |
| L17:51 | 17 | `51` | — | D210 | فقط مدل در پچ | 84 | Model_SerialCartKhan Module3:186 |
| L18:124 | 18 | `124` | Pax | — | فقط برند در پچ | 82 | Brand_SerialCartKhan Module79:139 |
| L18:51 | 18 | `51` | — | D210 | فقط مدل در پچ | 85 | Model_SerialCartKhan Module3:190 |
| L20:124 | 20 | `124` | Pax | — | فقط برند در پچ | 82 | Brand_SerialCartKhan Module79:139 |
| L20:51 | 20 | `51` | — | D210 | فقط مدل در پچ | 86 | Model_SerialCartKhan Module3:194 |
| L22:124 | 22 | `124` | Pax | — | فقط برند در پچ | 82 | Brand_SerialCartKhan Module79:139 |
| L22:51 | 22 | `51` | — | D210 | فقط مدل در پچ | 87 | Model_SerialCartKhan Module3:198 |

## ترکیب‌های برند/مدل

| برند | مدل | در دسترس | الگوهای تأییدشده |
|---|---|---|---|
| Pax | S80 | بله | 7:26 8:25 8:29 8:2C 8:2E 8:2H 8:2K 8:2L 8:2M 8:2N 8:2P 8:2Q 8:2R 8:2Z 8:6P 8:7D 8:89 8:8E 8:M0 |
| Pax | S90 | بله | 7:30 7:37 7:38 8:03 8:2D 8:30 8:32 8:36 8:38 8:3A 8:3C 8:3D 8:3E 8:3F 8:3G 8:3H 8:3J 8:3K 8:3L 8:3M 8:3Q 8:3W 8:45 8:4A 8:4C 8:4D 8:4H 8:4K 8:4Z 8:5D 8:88 8:8C 8:D0 8:H0 8:H1 8:P3 |
| Pax | D210 | بله | 8:23 8:2A 8:51 8:5C 8:5F |
| Pax | S800 | بله | 8:54 |
| Pax | S900 | بله | 8:55 |
| Pax | S920 | بله | 8:68 |
| Pax | S910 | بله | 8:72 8:76 8:7A |
| Pax | Q80 | بله | 10:08 |
| Pax | A80 | بله | 10:124 |
| Pax | D230 | بله | 10:23 |
| Verifone | Verifone | بله | 11:20 11:21 11:28 11:31 11:32 |
| Newland | SP600 | بله | 12:J7 |
| Pax | — | خیر: پچ برای این الگو فقط برند برمی‌گرداند و مدل تعریف نکرده است؛ تولید بر پایه‌ی مدل ممکن نیست. |  |
| — | S80 | خیر: پچ برای این الگو مدل برمی‌گرداند ولی تابع برند چیزی نمی‌دهد؛ رابطه‌ی برند و مدل در پچ ثابت نشده و ساخته نمی‌شود. |  |
| — | S90 | خیر: پچ برای این الگو مدل برمی‌گرداند ولی تابع برند چیزی نمی‌دهد؛ رابطه‌ی برند و مدل در پچ ثابت نشده و ساخته نمی‌شود. |  |
| — | S800 | خیر: پچ برای این الگو مدل برمی‌گرداند ولی تابع برند چیزی نمی‌دهد؛ رابطه‌ی برند و مدل در پچ ثابت نشده و ساخته نمی‌شود. |  |
| — | S900 | خیر: پچ برای این الگو مدل برمی‌گرداند ولی تابع برند چیزی نمی‌دهد؛ رابطه‌ی برند و مدل در پچ ثابت نشده و ساخته نمی‌شود. |  |
| Pax | Verifone | خیر: تابع برند و تابع مدل جواب‌های ناسازگار می‌دهند (مدل برگشتی نام برند دیگری است)؛ تولید مسدود است. |  |
| — | A80 | خیر: پچ برای این الگو مدل برمی‌گرداند ولی تابع برند چیزی نمی‌دهد؛ رابطه‌ی برند و مدل در پچ ثابت نشده و ساخته نمی‌شود. |  |
| — | Verifone | خیر: پچ برای این الگو مدل برمی‌گرداند ولی تابع برند چیزی نمی‌دهد؛ رابطه‌ی برند و مدل در پچ ثابت نشده و ساخته نمی‌شود. |  |
| — | D210 | خیر: پچ برای این الگو مدل برمی‌گرداند ولی تابع برند چیزی نمی‌دهد؛ رابطه‌ی برند و مدل در پچ ثابت نشده و ساخته نمی‌شود. |  |

## موارد UNRESOLVED / مسدود

- **L8:21** (`Pax` از تابع برند، ولی مدل «Verifone» از تابع مدل): ناسازگار؛ تولید مسدود.
- الگوهای «فقط مدل» (مثل SP600 با `J7` و طول ۱۲، S80/S90/S800/S900 در طول ۷) برند ندارند ⇒ رابطه‌ی برند و مدل در پچ ثابت نشده و ساخته نمی‌شود. SP600 استثناست: مالک پروژه صریحاً اعلام کرده «SP600 = Newland» و این اعلام در لایه‌ی جدا `src/rules/declarations.js` ثبت شده و با وضعیت «اعلام‌شده توسط کاربر» علامت می‌خورد؛ در پچ نیست و وارد golden نمی‌شود.
- الگوهای «فقط برند» مدل ندارند ⇒ تولید بر پایه‌ی مدل ممکن نیست.
- بخش متغیر سریال (نویسه‌های بعد از پیشوند) در پچ تعریف نشده است ⇒ «تصمیم مهندسی خارج از پچ»، در UI صریحاً از کاربر گرفته می‌شود.
