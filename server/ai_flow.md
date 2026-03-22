# AI Flow

Yeh file current AI system ka practical flow batati hai, exactly us logic ke hisaab se jo tumne describe kiya:

1. Pehle DB ke saare `JobDetails` docs uthao
2. Har doc ke changeable fields ka snapshot banao
3. Snapshot + hash DB me save karo
4. Daily AI title + vacancy/details based search kare
5. Search se mili latest info ko DB snapshot se compare kare
6. Agar update ho to mail bheje aur DB patch kar de

## Core Idea

AI ka primary kaam source-link crawling nahi hai.

AI ka primary kaam hai:

- DB ke existing job detail ko baseline maana
- uske changeable fields ka hash rakhna
- daily title aur vacancy/details based search chalana
- latest public info ko DB detail se compare karna
- change milne par safe patch apply karna

Agar kisi document me source links hon to wo optional helper ho sakte hain, lekin flow un par dependent nahi hai.

## Files Involved

- AI runtime: `ai/ai.js`
- Job API save/update integration: `controller/jobs.controller.mjs`
- Job schema: `models/jobdetails.model.mjs`
- Shared job normalization: `utils/job-normalize.mjs`
- Email sender reuse: `job-notification/notification.mjs`

## Step 1: DB Se Saare Job Documents Lena

AI monitoring flow DB se `JobDetails` documents read karta hai.

Yeh do situations me hota hai:

### A. Save/Update time

Jab naya job create hota hai ya existing job update hota hai, usi time monitoring snapshot attach hota hai.

### B. Daily monitoring time

Cron DB se jobs load karta hai aur unko AI se verify karta hai.

## Step 2: Changeable Fields Ka Snapshot Banana

Har job ka pura document monitor nahi hota.

Sirf changeable / extendable fields ka snapshot banta hai, jaise:

- `important_dates`
- `official_links`
- `vacancy_details`
- `important_links`
- `applyLastDate`
- `application_fee`
- `age_limit`
- `eligibility_criteria`
- `selection_process`
- `how_to_apply`
- `admit_card`
- `salary`
- `pay_scale`
- `exam_pattern`
- `result_dates`
- `notification_details`
- `advertisement_number`

Aur agar kisi job me aur aisi keys ho jinme update-type words ho, system unko bhi dynamically track kar sakta hai.

Example:

- `exam_schedule`
- `vacancy_breakup`
- `important_notice`
- `result_link`

## Step 3: Snapshot Ka Hash Banana

Har tracked field ke liye alag hash banta hai.

Phir pura tracked snapshot ka combined hash bhi banta hai.

DB me `aiMonitoring` ke andar yeh values store hoti hain:

- `trackedFieldPaths`
- `trackedFieldHashes`
- `trackedSnapshot`
- `currentHash`
- `lastCheckedAt`
- `lastDetectionStatus`
- `lastSummary`
- `lastConfidence`
- `lastSources`
- `lastPatchedAt`
- `lastMailSentAt`
- `lastMailStatus`
- `lastError`

Important point:

- AI state JSON file me nahi rakha ja raha
- baseline directly `JobDetails` ke document ke andar hi save hota hai

## Step 4: Initial Snapshot Backfill

Tumhare desired flow ke hisaab se pehla kaam ye hona chahiye:

1. DB ke saare existing docs load karo
2. Har doc ke changeable fields ka snapshot banao
3. Snapshot + hashes ko `aiMonitoring` me save karo
4. Saare docs update kar do

Current implementation me ye backfill practical way se do tarah se ho sakta hai:

### Option 1

Jab koi job API se create/update hota hai, us time snapshot attach hota hai.

### Option 2

Server start hone ke baad AI cron auto run karega.

Manual/forced run chalao:

```bash
npm run ai:jobs
```

Ye command optional hai. Normal production flow me AI cron se automatically chalega. Agar `aiMonitoring` missing hai ya hash stale hai to cron run bhi usko refresh/repair kar dega.

## Step 5: Daily AI Search Flow

Daily cron ka main logic ye hai:

1. DB se jobs load karo
2. Har job ke liye title, advertisement number, authority, vacancy/details context nikalo
3. Gemini ko bolo ki in search hints ke basis par latest information dhoondo
4. Jo latest info mile usko DB ke snapshot se compare karo
5. Agar meaningful change ho to patch return karo

Current auto-cron config:

- AI cron server startup par auto start hota hai
- startup ke turant baad initial run hota hai
- uske baad AI har 10 ghante me auto run hota hai
- schedule `.env` me: `JOB_AI_MONITOR_SCHEDULE=0 */10 * * *`

## AI Search Kis Basis Par Hoti Hai

AI ko search ke liye ye signals diye jaate hain:

- `jobtitle`
- `advertisement_number`
- `conducting_authority`
- `vacancy_details`
- `important_dates`
- `official_links`
- `application_fee`
- `eligibility_criteria`

Matlab daily check ka primary mode ye hai:

- title based search
- vacancy/details based search
- notification/ad number based search

Ye isliye useful hai kyunki har DB doc me source link hona zaruri nahi hai.

## Optional Source Links Ka Role

Agar kisi doc me `official_links` ya koi valid URLs mil jayein, to AI unko helper context ki tarah use kar sakta hai.

Lekin yeh mandatory nahi hai.

System ka intended behavior:

- source URL ho to achha
- source URL na ho tab bhi title + vacancy search se kaam chale

## Gemini Ko Kya Prompt Diya Jata Hai

Gemini ko broadly yeh bola jata hai:

- current DB snapshot ko baseline truth mano
- job title, ad number, authority, vacancy context se search karo
- public/authoritative updates verify karo
- only safe structured patch do
- dotted path patch mat do
- low-confidence case me `needs_review` do

Expected structured response:

```json
{
  "status": "no_change | change_detected | needs_review",
  "summary": "short summary",
  "confidence": "low | medium | high",
  "changedFields": ["important_dates"],
  "changes": [
    {
      "field": "important_dates",
      "before": "old value summary",
      "after": "new value summary",
      "reason": "why this changed"
    }
  ],
  "patch": {},
  "sources": [
    {
      "url": "https://...",
      "title": "source title",
      "reason": "why relevant"
    }
  ]
}
```

## Step 6: DB Detail Se Match Karna

Gemini ke response ke baad system:

1. patch ko sanitize karta hai
2. sirf allowed tracked fields rakhta hai
3. patched version ka naya snapshot banata hai
4. old snapshot vs new snapshot ka diff nikalta hai

Yeh important hai, kyunki AI ne jo patch diya wo blindly trust nahi hota.

Actual DB update tabhi hota hai jab:

- patch allowed ho
- patch me real tracked change ho
- confidence low na ho

## Step 7: Update Mile To Kya Hota Hai

Agar update detect hota hai:

1. before/after diff generate hota hai
2. email bheji jaati hai
3. DB document patch hota hai
4. naya snapshot save hota hai
5. naya hash save hota hai
6. monitoring metadata update hota hai

Matlab ek successful update ke baad DB me:

- latest values
- latest snapshot
- latest hash
- last checked status
- mail status

Sab update ho jata hai.

## Email Me Kya Jata Hai

Email me typically ye jata hai:

- job title
- job URL ya reference URL agar available ho
- changed fields
- before values
- after values

Example:

- before: `Last Date to Apply = 26 April 2026`
- after: `Last Date to Apply = 10 May 2026`

## Status Meanings

- `pending`: initial state
- `no_change`: search se koi meaningful update confirm nahi hua
- `change_detected`: update mila aur patch apply hua
- `needs_review`: kuch signal mila but confidence low tha ya patch unsafe tha
- `error`: run fail hua
- `skipped`: same day already checked tha

## Exact Intended Flow In One Line

Exact intended flow:

`DB docs fetch -> tracked snapshot build -> hash save in DB -> daily title/vacancy search -> AI compare with DB snapshot -> before/after mail -> DB patch -> new hash save`

## Example

Suppose DB me UPTET job hai.

### Initial snapshot

DB me save hota hai:

- `important_dates`
- `official_links`
- `vacancy_details`
- `applyLastDate`

In sab ka snapshot aur hash `aiMonitoring` me save hota hai.

### Daily run

Next day AI search karta hai:

- `UPTET 2026`
- `01/UPTET/2026`
- authority name
- vacancy/details context

AI ko public web par nayi notice milti hai ki apply last date extend ho gayi.

### Compare

AI DB snapshot se compare karke patch return karta hai:

- `important_dates`
- `applyLastDate`

### Result

System:

1. old/new diff banata hai
2. mail bhejta hai
3. DB update karta hai
4. new hash save karta hai

## Current Practical Notes

### What is already aligned

Current implementation me yeh cheezein already hain:

- DB-based snapshot state
- per-field hash
- combined hash
- auto AI cron
- search-based Gemini verification
- safe patch sanitization
- before/after email
- DB update

### What to keep in mind

`officialSourceUrls` field ab optional helper metadata hai, core dependency nahi.

Main comparison logic ka baseline DB snapshot hi hai.

## In Short

AI ka kaam ab simple words me:

- saare jobs ka changeable snapshot DB me maintain karna
- hash store karna
- auto cron se title aur vacancy based search karna
- latest info ko DB se compare karna
- update mile to notify + patch + rehash karna
