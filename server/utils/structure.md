{
  // ═══════════════════════════════════════════════════════
  // IDENTITY — URL aur dedup ke liye
  // ═══════════════════════════════════════════════════════
  "_id": { "$oid": "..." },
  "slug": "up-tgt-pgt-exam-date-2026",
  "dedupeKey": "exam-date:upsessb-tgt-pgt-2022",
  "titleSignature": "up tgt pgt exam date 2026 upsessb",
  "version": 1,

  // ═══════════════════════════════════════════════════════
  // CONTENT — Page ka core data
  // ═══════════════════════════════════════════════════════
  "title": "UP TGT PGT Exam Date 2026 — UPSESSB Schedule Out",
  "shortTitle": "UP TGT PGT Exam Date 2026",
  "jobtitle": "Trained Graduate Teacher / Post Graduate Teacher",
  "summary": "UPSESSB ne UP TGT PGT 2022 ki new exam date jaari kar di hai. PGT exam 09-10 May 2026 aur TGT exam 03-04 June 2026 ko hoga. Total 4163 vacancies ke liye admit card exam se pehle official website par available hoga.",

  // ═══════════════════════════════════════════════════════
  // CLASSIFICATION
  // ═══════════════════════════════════════════════════════
  "sectionName": "Exam Date",
  "sectionCanonicalUrl": "exam-date",
  "category": "Teaching Jobs",
  "subCategory": "State Government",
  "schemaType": "Article",       // Exam date = Article (JobPosting nahi)
  "pageType": "exam-date",       // custom renderer decide karne ke liye
  "language": "hi",
  "status": "active",
  "isActive": true,
  "noIndex": false,
  "isFeatured": false,

  // ═══════════════════════════════════════════════════════
  // AUTHORITY & CLASSIFICATION
  // ═══════════════════════════════════════════════════════
  "conductingAuthority": "UPSESSB",
  "conductingAuthorityFull": "Uttar Pradesh Secondary Education Service Selection Board",
  "advertisementNumber": "01/2022 & 02/2022",
  "location": "Uttar Pradesh, India",
  "state": "Uttar Pradesh",
  "officialWebsite": "https://www.upessc.up.gov.in/",

  // ═══════════════════════════════════════════════════════
  // ALL DATES — ISO 8601, top-level (renderer + schema.org)
  // ═══════════════════════════════════════════════════════
  "dates": {
    "applyStart":      "2022-06-09",
    "regLastDate":     "2022-07-10",
    "feeLastDate":     "2022-07-13",
    "applyEnd":        "2022-07-16",
    "examDatePGT":     "2026-05-09",   // PGT: 09-10 May 2026
    "examDatePGTEnd":  "2026-05-10",
    "examDateTGT":     "2026-06-03",   // TGT: 03-04 June 2026
    "examDateTGTEnd":  "2026-06-04",
    "admitCard":       null,           // "Before Exam" — null rakho, string nahi
    "result":          null,
    "lastUpdated":     "2026-04-02"
  },

  // Fast filter queries ke liye top-level bhi rakho
  "applyLastDate":  { "$date": "2022-07-16T00:00:00.000Z" },
  "examDate":       { "$date": "2026-05-09T00:00:00.000Z" }, // earliest exam

  // ═══════════════════════════════════════════════════════
  // JOB DETAILS — structured, queryable
  // ═══════════════════════════════════════════════════════
  "totalVacancies": 4163,             // number — string nahi
  "vacancySummary": {
    "tgt": { "men": 3213, "women": 326,  "total": 3539 },
    "pgt": { "men": 549,  "women": 75,   "total": 624  },
    "grand": 4163
  },

  "ageLimit": {
    "min": 21,
    "max": null,
    "asOn": "2022-07-01",
    "relaxation": true,
    "note": "UPSESSB norms ke anusar chhoot milegi"
  },

  "applicationFee": {
    "general": 750, "obc": 750, "ews": 650,
    "sc": 450, "st": 250, "ph": 375,
    "currency": "INR",
    "paymentModes": ["Debit Card", "Credit Card", "Internet Banking", "IMPS", "Mobile Wallet"]
  },

  "selectionProcess": ["Written Examination", "Interview"],

  "eligibility": [
    { "post": "TGT Teacher", "qualification": "Bachelor's Degree in relevant subject + B.Ed." },
    { "post": "PGT Teacher", "qualification": "Master's Degree in relevant subject" }
  ],

  "salary": null,   // TGT/PGT salary fill karo agar known ho — SEO ke liye valuable

  // ═══════════════════════════════════════════════════════
  // SEO — har field ka role hai
  // ═══════════════════════════════════════════════════════
  "seo": {
    "metaTitle": "UP TGT PGT Exam Date 2026 — UPSESSB Schedule, Admit Card Download",
    "metaDescription": "UP TGT PGT New Exam Date 2026: PGT exam 09-10 May, TGT exam 03-04 June. UPSESSB 4163 posts. Admit card, result aur official notification link yahan dekho.",
    "canonicalUrl": "https://sarkariafsar.com/jobs/up-tgt-pgt-exam-date-2026",
    "ogTitle": "UP TGT PGT New Exam Date 2026 — PGT: 9 May | TGT: 3 June",
    "ogDescription": "UPSESSB ne UP TGT PGT 2022 ki new exam date jaari ki. 4163 posts. Admit card aur result ka update yahan milega.",
    "ogImage": "https://sarkariafsar.com/og/up-tgt-pgt-exam-date-2026.jpg",
    "keywords": ["UP TGT exam date 2026", "UP PGT exam date 2026", "UPSESSB exam schedule", "TGT PGT admit card 2026"],
    "focusKeyword": "UP TGT PGT exam date 2026"
  },

  // ═══════════════════════════════════════════════════════
  // AUTHOR / E-E-A-T — AdSense approval ke liye critical
  // ═══════════════════════════════════════════════════════
  "author": {
    "name": "Sarkari Afsar Editorial Team",
    "bio": "UP aur central government recruitment cover karne wale experts — UPSESSB, SSC, Railway aur banking jobs mein 5+ saal ka experience.",
    "profileUrl": "https://sarkariafsar.com/about"
  },

  // ═══════════════════════════════════════════════════════
  // TAGS — topical clusters ke liye
  // ═══════════════════════════════════════════════════════
  "tags": [
    "UP TGT", "UP PGT", "UPSESSB", "Teacher Recruitment",
    "Exam Date 2026", "Uttar Pradesh", "Admit Card", "Teaching Jobs"
  ],

  // ═══════════════════════════════════════════════════════
  // STRUCTURED CONTENT — renderer + schema.org dono ke liye
  // ═══════════════════════════════════════════════════════
  "structured": {

    "vacancyTable": [
      { "post": "TGT-Teacher", "gender": "Men",   "ur": 1840, "obc": 866, "sc": 503, "st": 4,  "total": 3213 },
      { "post": "TGT-Teacher", "gender": "Women", "ur": 212,  "obc": 83,  "sc": 31,  "st": 0,  "total": 326  },
      { "post": "PGT-Teacher", "gender": "Men",   "ur": 332,  "obc": 153, "sc": 64,  "st": 0,  "total": 549  },
      { "post": "PGT-Teacher", "gender": "Women", "ur": 56,   "obc": 11,  "sc": 8,   "st": 0,  "total": 75   }
    ],

    // Google FAQPage rich result ke liye
    "faq": [
      { "q": "UP TGT exam date 2026 kya hai?",
        "a": "UP TGT exam 03-04 June 2026 ko hoga. UPSESSB ne official notification jaari kar di hai." },
      { "q": "UP PGT exam date 2026 kya hai?",
        "a": "UP PGT exam 09-10 May 2026 ko scheduled hai." },
      { "q": "UP TGT PGT admit card kab aayega?",
        "a": "Admit card exam se kuch din pehle UPSESSB official website par available hoga." },
      { "q": "UPSESSB TGT PGT 2022 mein total kitni vacancies hain?",
        "a": "Total 4163 vacancies hain — TGT ke liye 3539 aur PGT ke liye 624." },
      { "q": "UP TGT PGT official website kya hai?",
        "a": "Official website https://www.upessc.up.gov.in/ hai." }
    ],

    // Sirf official links — koi competitor nahi
    "importantLinks": [
      { "label": "Apply Online",          "url": "https://pariksha.up.nic.in/Agencies.aspx?uTVe3S4xVOs1PaOekpDaJg==", "type": "apply" },
      { "label": "Date Extend Notice",    "url": "http://www.upsessb.org/content/Vigyapti_02_07_2022.pdf",             "type": "notification" },
      { "label": "UPSESSB Official Site", "url": "https://www.upessc.up.gov.in/",                                       "type": "official" }
    ],

    "howToCheck": [
      "UPSESSB website https://upsessb.pariksha.nic.in/ par jaao",
      "Homepage par 'Exam Dates' ya 'Notification' section dhundho",
      "TGT / PGT exam date notification PDF download karo",
      "Admit card link exam date release ke baad activate hoga",
      "Application number aur date of birth enter karke admit card download karo"
    ]
  },

  // ═══════════════════════════════════════════════════════
  // RAW SCRAPED — fallback only
  // ═══════════════════════════════════════════════════════
  "scrapedContent": {
    "contentHtml": "...",   // deduplicated — tripling fix karo scraper mein
    "extractedAt": { "$date": "2026-04-02T03:11:00.000Z" }
  },
  "sourceUrl": "https://sarkariresult.com.cm/up-tgt-pgt-new-exam-date-2026/",
  "scrapedMeta": {
    "sourceSiteName": "Sarkari Result",
    "sourceSectionName": "Admit Cards",
    "sourceSectionUrl": "http://sarkariresult.com.cm/admit-card/"
  },

  // ═══════════════════════════════════════════════════════
  // COMPUTED — save time pe calculate karo
  // ═══════════════════════════════════════════════════════
  "wordCount": 0,           // save pe calculate — content length se
  "readingTimeMin": 0,      // Math.ceil(wordCount / 200)
  "completenessScore": 0,   // 0-100: kitne fields filled hain — quality gate

  // ═══════════════════════════════════════════════════════
  // MISC
  // ═══════════════════════════════════════════════════════
  "disclaimer": "Yeh page sirf informational purpose ke liye hai. Dates aur details ke liye UPSESSB official website confirm karein.",
  "htmlSnapshot": "up tgt pgt exam date 2026 upsessb pgt 09 may tgt 03 june 4163 vacancies...",
  "titleSignature": "up tgt pgt exam date 2026",
  "lastPatchedAt": { "$date": "2026-04-02T03:11:00.000Z" },
  "createdAt":     { "$date": "2026-04-02T00:00:00.000Z" },
  "updatedAt":     { "$date": "2026-04-02T03:11:00.000Z" },
  "__v": 0
}