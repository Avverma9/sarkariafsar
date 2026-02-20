export function buildRecruitmentExtractionPrompt(scrapedData) {
  const sd = String(scrapedData || "").trim();

  return (
    "TASK: Extract ALL recruitment data into STRICT JSON format.\n\n" +
    "CORE SCHEMA (MANDATORY STRUCTURE):\n" +
    "{\n" +
    '  "recruitment": {\n' +
    '    "title": "Exact title of recruitment",\n' +
    '    "advertisementNumber": "Advt. No. from notification",\n' +
    '    "organization": {\n' +
    '      "name": "Full official name",\n' +
    '      "shortName": "Abbreviation (e.g., UPPRPB)",\n' +
    '      "website": "Official website URL",\n' +
    '      "type": "Government|Bank|PSU|Other"\n' +
    "    },\n" +
    '    "importantDates": {\n' +
    '      "notificationDate": "Date notification released",\n' +
    '      "postDate": "Date posted on portal",\n' +
    '      "applicationStartDate": "When application form opens",\n' +
    '      "applicationLastDate": "Final date to apply",\n' +
    '      "feePaymentLastDate": "Last day for fee payment",\n' +
    '      "correctionDate": "Date to correct application",\n' +
    '      "preExamDate": "Pre-exam/preliminary exam date",\n' +
    '      "mainsExamDate": "Main exam date",\n' +
    '      "examDate": "Single/general exam date",\n' +
    '      "admitCardDate": "When admit card releases",\n' +
    '      "resultDate": "Result declaration date",\n' +
    '      "answerKeyReleaseDate": "Provisional answer key date",\n' +
    '      "finalAnswerKeyDate": "Final answer key date",\n' +
    '      "documentVerificationDate": "Document verification dates",\n' +
    '      "counsellingDate": "Counselling/interview date",\n' +
    '      "meritListDate": "Merit list declaration date"\n' +
    "    },\n" +
    '    "vacancyDetails": {\n' +
    '      "totalPosts": 0,\n' +
    '      "positions": [\n' +
    "        {\n" +
    '          "postName": "Position name",\n' +
    '          "numberOfPosts": 0,\n' +
    '          "category": "General/OBC/SC/ST/EWS",\n' +
    '          "areaType": "TSP/Non-TSP/General",\n' +
    '          "discipline": "If applicable"\n' +
    "        }\n" +
    "      ],\n" +
    '      "categoryWise": {\n' +
    '        "general": 0,\n' +
    '        "obc": 0,\n' +
    '        "sc": 0,\n' +
    '        "st": 0,\n' +
    '        "ewsExemption": 0,\n' +
    '        "ph": 0,\n' +
    '        "other": {}\n' +
    "      },\n" +
    '      "districtWise": [\n' +
    '        { "districtName": "", "numberOfPosts": 0 }\n' +
    "      ]\n" +
    "    },\n" +
    '    "applicationFee": {\n' +
    '      "general": 0,\n' +
    '      "ewsObc": 0,\n' +
    '      "scSt": 0,\n' +
    '      "female": 0,\n' +
    '      "ph": 0,\n' +
    '      "correctionCharge": 0,\n' +
    '      "currency": "INR",\n' +
    '      "paymentMode": ["Debit Card", "Credit Card", "Internet Banking", "IMPS", "Mobile Wallet"],\n' +
    '      "exemptions": "If any"\n' +
    "    },\n" +
    '    "ageLimit": {\n' +
    '      "minimumAge": 0,\n' +
    '      "maximumAge": 0,\n' +
    '      "asOn": "DD-MM-YYYY format of age calculation date",\n' +
    '      "ageRelaxation": {\n' +
    '        "scSt": 0,\n' +
    '        "obc": 0,\n' +
    '        "ph": 0,\n' +
    '        "exServicemen": 0,\n' +
    '        "other": {}\n' +
    "      },\n" +
    '      "categoryWise": {\n' +
    '        "ur": { "male": 0, "female": 0 },\n' +
    '        "obc": { "male": 0, "female": 0 },\n' +
    '        "sc": { "male": 0, "female": 0 },\n' +
    '        "st": { "male": 0, "female": 0 }\n' +
    "      }\n" +
    "    },\n" +
    '    "eligibility": {\n' +
    '      "educationQualification": "Graduate/12th/10th etc",\n' +
    '      "streamRequired": "Science/Commerce/Arts",\n' +
    '      "minimumPercentage": 0,\n' +
    '      "experienceRequired": "X years if applicable",\n' +
    '      "specialRequirements": ["List any specific requirements"]\n' +
    "    },\n" +
    '    "physicalStandards": {\n' +
    '      "male": {\n' +
    '        "height": "in CM",\n' +
    '        "chest": "Relaxed/Expanded",\n' +
    '        "weight": "in KG",\n' +
    '        "eyesight": "Vision requirements"\n' +
    "      },\n" +
    '      "female": {\n' +
    '        "height": "",\n' +
    '        "weight": "",\n' +
    '        "eyesight": ""\n' +
    "      }\n" +
    "    },\n" +
    '    "physicalEfficiencyTest": {\n' +
    '      "male": { "distance": "", "duration": "" },\n' +
    '      "female": { "distance": "", "duration": "" }\n' +
    "    },\n" +
    '    "selectionProcess": [\n' +
    '      "Written Exam",\n' +
    '      "Physical Efficiency Test",\n' +
    '      "Physical Standards Test",\n' +
    '      "Document Verification",\n' +
    '      "Medical Examination",\n' +
    '      "Interview",\n' +
    '      "Counselling"\n' +
    "    ],\n" +
    '    "importantLinks": {\n' +
    '      "applyOnline": "Direct apply link",\n' +
    '      "officialNotification": "Notification PDF/document",\n' +
    '      "officialWebsite": "Organization website",\n' +
    '      "syllabus": "Exam syllabus link",\n' +
    '      "examPattern": "Exam pattern document",\n' +
    '      "admitCard": "Admit card download link",\n' +
    '      "resultLink": "Result declaration link",\n' +
    '      "answerKey": "Answer key link",\n' +
    '      "documentVerificationNotice": "",\n' +
    '      "faq": "FAQ page",\n' +
    '      "other": {}\n' +
    "    },\n" +
    '    "documentation": [\n' +
    '      "List of required documents (ID proof, education certificates, etc)"\n' +
    "    ],\n" +
    '    "status": "Active|Closed|Upcoming",\n' +
    '    "sourceUrl": "URL where data was scraped",\n' +
    '    "additionalInfo": "Any special notes or important information",\n' +
    '    "extraFields": {\n' +
    '      "unmappedKeyValues": {},\n' +
    '      "links": [],\n' +
    '      "keyValues": []\n' +
    "    },\n" +
    '    "content": {\n' +
    '      "originalSummary": "60-90 words, original wording only, no copied sentences",\n' +
    '      "whoShouldApply": ["Who this recruitment is suited for, in your own words"],\n' +
    '      "keyHighlights": ["3-7 concise, non-duplicate highlights"],\n' +
    '      "applicationSteps": ["Step-by-step application flow, in order"],\n' +
    '      "selectionProcessSummary": "Short paragraph summarizing selection stages",\n' +
    '      "documentsChecklist": ["Only documents explicitly mentioned"],\n' +
    '      "feeSummary": "Short summary of fees and payment modes",\n' +
    '      "importantNotes": ["Critical deadlines, corrections, warnings"],\n' +
    '      "faq": [\n' +
    '        { "q": "", "a": "" }\n' +
    "      ]\n" +
    "    }\n" +
    "  }\n" +
    "}\n\n" +
    "CRITICAL EXTRACTION RULES:\n" +
    "1. DATES:\n" +
    "   - Use format: YYYY-MM-DD (ISO) or DD-MM-YYYY (Indian)\n" +
    "   - Empty string if not found\n" +
    "   - Example: '2026-04-18' or '18-04-2026'\n\n" +
    "2. VACANCY DETAILS:\n" +
    "   - Break down by position, category, and district if available\n" +
    "   - totalPosts must be sum of all positions\n" +
    "   - List all positions separately\n\n" +
    "3. FEES:\n" +
    "   - Extract all applicable fee categories\n" +
    "   - List payment methods explicitly mentioned\n\n" +
    "4. AGE LIMITS:\n" +
    "   - Include category-wise age limits if available\n" +
    "   - Always include 'asOn' date for age calculation\n" +
    "   - Include relaxation for SC/ST/OBC/PH\n\n" +
    "5. PHYSICAL STANDARDS (for Police/Army):\n" +
    "   - Extract height, chest, weight for male and female separately\n" +
    "   - Include both relaxed and expanded chest measurements if given\n\n" +
    "6. LINKS:\n" +
    "   - Extract ALL official links mentioned\n" +
    "   - Include download links for documents\n\n" +
    "7. SELECTION PROCESS:\n" +
    "   - List all stages in order\n" +
    "   - Include exam details if mentioned\n\n" +
    "8. STATUS:\n" +
    "   - Set to 'Closed' if applicationLastDate has passed\n" +
    "   - Set to 'Upcoming' if applicationStartDate is in future\n" +
    "   - Set to 'Active' if currently accepting applications\n\n" +
    "9. DOCUMENTATION:\n" +
    "   - List ONLY documents explicitly mentioned\n" +
    "   - Include citizenship, educational certificates, identity proofs\n\n" +
    "10. OUTPUT FORMAT:\n" +
    "    - Return ONLY valid JSON\n" +
    "    - No markdown, no extra explanations\n\n" +
    "11. ORIGINAL CONTENT QUALITY:\n" +
    "    - Write summaries in original wording; do NOT copy sentences from the source\n" +
    "    - No promotional claims, no guarantees, no clickbait\n" +
    "    - Base content ONLY on scraped data; do not invent details\n" +
    "    - If data is missing, use 'Not specified' or empty arrays\n" +
    "    - Avoid repetition across summary, highlights, and notes\n\n" +
    "12. NON-FITTING DATA:\n" +
    "    - If any source value does not fit fixed schema fields, keep it under recruitment.extraFields\n" +
    "    - Preserve key/value meaning in extraFields.unmappedKeyValues\n\n" +
    "SCRAPED DATA:\n" +
    sd +
    "\n\nRETURN VALID JSON ONLY - NO MARKDOWN, NO EXTRA TEXT."
  );
}

export function buildRecruitmentVerificationPrompt(draftJson) {
  const rawDraft = typeof draftJson === "string" ? draftJson : JSON.stringify(draftJson || {}, null, 2);

  return (
    "TASK: Read the draft recruitment JSON and convert it into fully formatted final JSON using the full schema.\n\n" +
    "CONSTRAINTS:\n" +
    "1. Keep root structure exactly: { \"recruitment\": { ... } }\n" +
    "2. Follow the full schema keys from prompt template. Every key must be present in output.\n" +
    "3. Map draft values to correct fields and types (dates/number/arrays/objects).\n" +
    "4. Preserve factual values from draft; if missing, keep safe defaults (\"\", 0, [], {}).\n" +
    "5. Keep unknown/unmapped values inside extraFields.\n" +
    "6. CONTENT fields are mandatory: write original content for summary/highlights/steps/notes/faq from available draft data.\n" +
    "7. Content must be unique wording (not copied lines), non-promotional, factual.\n" +
    "8. Return ONLY valid JSON (no markdown, no explanation).\n\n" +
    "DRAFT JSON:\n" +
    rawDraft +
    "\n\nRETURN VALID JSON ONLY."
  );
}
