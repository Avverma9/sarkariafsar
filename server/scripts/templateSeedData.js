/**
 * Seed data for all 5 content templates.
 * Each template has 10 human-written blocks with {{placeholders}}.
 * pageTypes: admit-card, result, job-posting, answer-key, exam-date
 */

module.exports = [
  // ═══════════════════════════════════════════════════════════
  // 1. ADMIT CARD TEMPLATE
  // ═══════════════════════════════════════════════════════════
  {
    templateId: "admit-card-v1",
    pageType: "admit-card",
    language: "hi",
    version: 1,
    active: true,
    blocks: [
      {
        blockId: "ac-intro-urgency",
        type: "introduction",
        weight: 10,
        content:
          "{{conductingAuthorityFull}} ne {{title}} jaari kar diya hai. Jo candidates {{totalVacancies}} posts ke liye apply kar chuke hain, unhe yaad dilana chahte hain ki admit card {{admitCardDate}} se official website {{officialWebsite}} par available hai. Exam {{examDate}} ko hoga isliye abhi apna admit card download kar lo aur ek printout rakh lo taaki koi last minute pareshani na ho.",
      },
      {
        blockId: "ac-exam-date-highlight",
        type: "exam-info",
        weight: 9,
        content:
          "{{shortTitle}} ki taiyari kar rahe candidates ke liye ek important update — {{conductingAuthority}} ne exam date confirm kar di hai. {{examDate}} ko yeh exam conduct hogi. Admit card mein aapka exam center, reporting time aur shift detail clearly mention hoga. Exam center zyada tar aapke district mein ya nearest city mein assign hota hai.",
      },
      {
        blockId: "ac-download-steps",
        type: "how-to",
        weight: 10,
        content:
          "{{title}} download karna bahut simple hai. Sabse pehle {{officialWebsite}} par jaao. Homepage par 'Recruitment' ya 'Admit Card' section dhundho. Wahan {{shortTitle}} ka link milega. Click karne ke baad ek login page khulega jahan aapko apna registration number aur date of birth fill karni hogi. Submit karte hi aapka admit card screen par aa jayega — usse PDF mein download karo aur A4 size mein print karo.",
      },
      {
        blockId: "ac-vacancy-context",
        type: "context",
        weight: 7,
        content:
          "Yaad karo ki {{conductingAuthority}} ne is recruitment mein total {{totalVacancies}} posts nikali hain. In posts ke liye hazaron candidates ne apply kiya tha. Competition dekha jaye to har seat ke liye average bahut zyada applicants hain isliye exam mein sirf knowledge nahi, time management bhi bahut important hai.",
      },
      {
        blockId: "ac-salary-motivation",
        type: "motivation",
        weight: 6,
        content:
          "{{shortTitle}} ek government job hai jisme {{salary}} milti hai. Iske saath pension, medical, aur dusri government facilities bhi milti hain. Ek stable sarkari naukri ke saath aap apne future ko secure kar sakte ho. Isliye is exam ko seriously lo aur poori taiyari ke saath jaao.",
      },
      {
        blockId: "ac-age-limit-reminder",
        type: "eligibility-reminder",
        weight: 5,
        content:
          "Kuch candidates yeh sochte hain ki unki age sahi thi ya nahi. {{conductingAuthority}} ki is recruitment mein minimum age {{ageLimitMin}} saal aur maximum age {{ageLimitMax}} saal rakhi gayi thi. SC/ST aur OBC candidates ko government norms ke anusar age relaxation milti hai. Agar aapne apply kiya tha to ab sirf exam par focus karo.",
      },
      {
        blockId: "ac-selection-process",
        type: "process-info",
        weight: 8,
        content:
          "{{shortTitle}} mein select hone ke liye candidates ko {{selectionProcess}} se gujarna hoga. Written exam mein qualify karne ke baad document verification hogi jisme aapko original certificates lekar jaana hoga. Medical examination mein basic fitness check hoti hai. Isliye sirf written exam ki taiyari nahi, apne documents bhi ready rakho — 10th, 12th, graduation certificates, caste certificate agar applicable ho, aur ID proof.",
      },
      {
        blockId: "ac-fee-reminder",
        type: "fee-info",
        weight: 4,
        content:
          "Is recruitment mein {{conductingAuthority}} ne application fee {{applicationFeeGeneral}} rupaye rakhi thi. Fee payment online modes se ki ja sakti thi jaise debit card, credit card, aur net banking. Agar aapne successfully fee pay ki thi aur application submit ki thi to aapka admit card zaroor generate hoga.",
      },
      {
        blockId: "ac-official-website-trust",
        type: "trust-signal",
        weight: 8,
        content:
          "Kisi bhi update ke liye sirf {{officialWebsite}} par bharosa karo. Social media ya unofficial sources par kai baar galat dates aur fake links share hote hain. {{conductingAuthority}} ke baare mein koi bhi official notification unki website par hi pehle aati hai. Hum bhi apni information wahi se lete hain aur yahan update karte rehte hain.",
      },
      {
        blockId: "ac-exam-preparation-tips",
        type: "preparation",
        weight: 6,
        content:
          "{{examDate}} mein zyada time nahi bacha. Agar aap {{shortTitle}} ki taiyari kar rahe hain to abhi se previous year papers solve karna shuru karo. {{conductingAuthority}} ke exams mein general knowledge, reasoning, aur Hindi language ke questions zyada aate hain. Daily 4-5 hours ki focused study aur mock tests se aap exam mein achha score kar sakte hain. Admit card ke saath exam hall mein ek valid government ID zaroor lekar jaao.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 2. RESULT TEMPLATE
  // ═══════════════════════════════════════════════════════════
  {
    templateId: "result-v1",
    pageType: "result",
    language: "hi",
    version: 1,
    active: true,
    blocks: [
      {
        blockId: "res-intro-announcement",
        type: "introduction",
        weight: 10,
        content:
          "{{conductingAuthorityFull}} ne {{title}} ghoshit kar diya hai. Jo candidates ne is exam mein hissa liya tha wo ab apna result {{officialWebsite}} par check kar sakte hain. Total {{totalVacancies}} posts ke liye yeh recruitment chal rahi thi aur ab final merit list ke basis par aage ki process shuru hogi.",
      },
      {
        blockId: "res-how-to-check",
        type: "how-to",
        weight: 10,
        content:
          "{{shortTitle}} check karna bahut aasaan hai. Sabse pehle {{officialWebsite}} par jaao. Homepage par 'Result' section dhundho aur {{shortTitle}} ka link click karo. Ek naya page khulega jahan aapko apna roll number ya registration number daalna hoga. Submit karne ke baad aapka result screen par dikhega — screenshot lo ya PDF download karo apne records ke liye.",
      },
      {
        blockId: "res-cutoff-explanation",
        type: "context",
        weight: 9,
        content:
          "{{conductingAuthority}} ke is exam mein cutoff marks category-wise alag hote hain. General category ka cutoff sabse zyada hota hai jabki SC/ST aur OBC candidates ko reservation norms ke anusar thoda relaxation milta hai. Cutoff exam ki difficulty level, total candidates aur available posts par depend karta hai. {{totalVacancies}} posts ke liye competition bahut zyada tha.",
      },
      {
        blockId: "res-next-steps",
        type: "process-info",
        weight: 8,
        content:
          "Result mein qualify karne ke baad candidates ko {{selectionProcess}} ke agle steps follow karne honge. Document verification mein aapko apne original certificates — 10th, 12th, graduation, caste certificate, domicile, aur photo ID lekar jaana hoga. Kisi bhi document mein discrepancy hone par candidature cancel ho sakti hai isliye pehle se sab ready rakh lo.",
      },
      {
        blockId: "res-salary-celebration",
        type: "motivation",
        weight: 7,
        content:
          "Jo candidates qualify kar gaye hain unke liye badhai! {{shortTitle}} ek government position hai jisme {{salary}} milti hai. Iske saath DA, HRA, pension, medical benefits aur dusri sarkari suvidhaayein bhi milti hain. Yeh ek career-defining moment hai — aap apne aur apni family ke liye ek secure future bana rahe ho.",
      },
      {
        blockId: "res-merit-list-info",
        type: "exam-info",
        weight: 7,
        content:
          "{{conductingAuthority}} merit list ko final result ke baath apni website par publish karega. Merit list mein candidates ka naam, roll number, marks aur rank mention hoti hai. Kuch exams mein provisional merit list pehle aati hai aur objections ke baad final list jaari hoti hai. Regular check karte raho {{officialWebsite}} par updates ke liye.",
      },
      {
        blockId: "res-failed-candidates-motivation",
        type: "trust-signal",
        weight: 6,
        content:
          "Agar is baar result mein naam nahi aaya to himmat mat haaro. Government exams mein competition bahut tough hai aur ek baar mein select hona bahut mushkil hai. Apni galtiyon se seekho, weak areas identify karo, aur agle exam ki taiyari shuru karo. {{conductingAuthority}} regularly naye recruitment notifications nikalta hai — next opportunity zaroor aayegi.",
      },
      {
        blockId: "res-official-source-warning",
        type: "trust-signal",
        weight: 8,
        content:
          "Result sirf {{officialWebsite}} se hi check karo. Kai fake websites aur social media pages galat result links share karte hain jisse aapka data chori ho sakta hai. {{conductingAuthority}} kabhi bhi WhatsApp ya Telegram par result share nahi karta. Sirf official sources par bharosa karo.",
      },
      {
        blockId: "res-vacancy-recap",
        type: "context",
        weight: 5,
        content:
          "{{conductingAuthority}} ne is recruitment cycle mein {{totalVacancies}} posts ke liye notification jaari ki thi. Hazaron candidates ne apply kiya aur exam diya. Ab result ke baad final selection process shuru hogi jisme document verification aur medical examination shaamil hai.",
      },
      {
        blockId: "res-joining-tips",
        type: "preparation",
        weight: 6,
        content:
          "Selected candidates ko joining ke waqt kuch important cheezein dhyan mein rakhni chahiye. Joining letter mein mention ki gayi date par report karna mandatory hai. Apne saath original documents, passport size photos, aur bank account details lekar jaao. {{conductingAuthority}} ki probation period ke baare mein bhi joining letter mein jaankari hogi — usse dhyan se padho.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 3. JOB POSTING / RECRUITMENT TEMPLATE
  // ═══════════════════════════════════════════════════════════
  {
    templateId: "recruitment-v1",
    pageType: "job-posting",
    language: "hi",
    version: 1,
    active: true,
    blocks: [
      {
        blockId: "rec-intro-opportunity",
        type: "introduction",
        weight: 10,
        content:
          "{{conductingAuthorityFull}} ne {{title}} ke liye official notification jaari kar di hai. Is recruitment mein total {{totalVacancies}} posts ke liye bharti hogi. Jo candidates sarkari naukri ki talash mein hain unke liye yeh ek bahut achha mauka hai. Online application {{officialWebsite}} par ki ja sakti hai aur last date {{applyLastDate}} hai.",
      },
      {
        blockId: "rec-eligibility-overview",
        type: "eligibility-reminder",
        weight: 9,
        content:
          "{{shortTitle}} ke liye apply karne se pehle apni eligibility zaroor check kar lo. {{conductingAuthority}} ne minimum age {{ageLimitMin}} saal aur maximum age {{ageLimitMax}} saal rakhi hai. Age relaxation SC/ST/OBC/PwD candidates ko government norms ke anusar milti hai. Educational qualification alag-alag posts ke liye alag hai — notification PDF mein detail se diya gaya hai.",
      },
      {
        blockId: "rec-apply-steps",
        type: "how-to",
        weight: 10,
        content:
          "{{title}} ke liye apply karna bahut simple hai. {{officialWebsite}} par jaao aur 'New Registration' par click karo. Apna naam, email, mobile number, aur basic details bharo. Registration hone ke baad login karo aur application form fill karo — personal details, educational qualification, aur photo/signature upload karo. Application fee {{applicationFeeGeneral}} rupaye hai jo online pay karni hogi. Submit karne ke baad confirmation page ka printout le lo.",
      },
      {
        blockId: "rec-vacancy-breakdown",
        type: "context",
        weight: 8,
        content:
          "{{conductingAuthority}} ne is recruitment mein total {{totalVacancies}} posts nikali hain. In posts mein different categories jaise UR, OBC, SC, ST, aur EWS ke liye reservation rules applicable hain. Har post ka selection criteria thoda alag hai — kuch posts mein sirf written exam hai to kuch mein physical test bhi hai. Vacancy ki category-wise detail oopar table mein di gayi hai.",
      },
      {
        blockId: "rec-salary-benefits",
        type: "motivation",
        weight: 8,
        content:
          "{{shortTitle}} mein selected candidates ko {{salary}} milegi. Government job hone ke naate iske saath bahut saari benefits milti hain — Dearness Allowance (DA), House Rent Allowance (HRA), pension scheme, medical insurance, aur annual increments. Job security government sector ka sabse bada fayda hai. Aur agar aap {{state}} ke resident ho to additional state-level benefits bhi mil sakti hain.",
      },
      {
        blockId: "rec-selection-process-detail",
        type: "process-info",
        weight: 9,
        content:
          "{{shortTitle}} ke liye selection process mein {{selectionProcess}} shaamil hai. Written exam ka syllabus aur pattern notification mein diya gaya hai. Exam ke baad merit list banti hai aur qualified candidates ko document verification ke liye bulaya jaata hai. Kuch posts mein skill test ya typing test bhi hota hai. Poori selection process fair aur transparent hoti hai.",
      },
      {
        blockId: "rec-important-dates-reminder",
        type: "exam-info",
        weight: 7,
        content:
          "Is recruitment ki important dates dhyan se yaad rakh lo. Online application {{applyLastDate}} tak karni hai — isilye last moment ka wait mat karo kyunki website par traffic bahut zyada hota hai aur server slow ho sakta hai. Exam tentatively {{examDate}} ko hogi. Admit card exam se kuch din pehle {{officialWebsite}} par available hoga.",
      },
      {
        blockId: "rec-fee-payment-guide",
        type: "fee-info",
        weight: 5,
        content:
          "Application fee {{applicationFeeGeneral}} rupaye hai jo online payment methods se pay karni hogi — debit card, credit card, net banking, ya UPI. Fee successfully pay hone ke baad transaction ID note kar lo aur payment receipt save karo. Agar payment fail ho jaye to dubara try karo — double payment hone par refund automatically aa jaata hai.",
      },
      {
        blockId: "rec-official-notification-cta",
        type: "trust-signal",
        weight: 8,
        content:
          "Apply karne se pehle official notification PDF zaroor padho jo {{officialWebsite}} par available hai. Notification mein detailed eligibility criteria, syllabus, exam pattern, aur important instructions di gayi hain. Hum yahan summary provide karte hain lekin final authority official notification hi hai. Koi bhi doubt ho to {{conductingAuthority}} ki helpline ya email par contact karo.",
      },
      {
        blockId: "rec-preparation-advice",
        type: "preparation",
        weight: 6,
        content:
          "{{shortTitle}} ki taiyari ke liye abhi se planning shuru karo. Previous year question papers solve karo, current affairs daily padho, aur weekly mock tests do. {{conductingAuthority}} ke exams mein mostly reasoning, quantitative aptitude, general awareness, aur Hindi/English language ke questions aate hain. Time management practice karo — exam mein limited time mein maximum questions solve karne hote hain.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 4. ANSWER KEY TEMPLATE
  // ═══════════════════════════════════════════════════════════
  {
    templateId: "answer-key-v1",
    pageType: "answer-key",
    language: "hi",
    version: 1,
    active: true,
    blocks: [
      {
        blockId: "ak-intro-released",
        type: "introduction",
        weight: 10,
        content:
          "{{conductingAuthorityFull}} ne {{title}} jaari kar di hai. Jo candidates ne is exam mein participate kiya tha wo ab apne answers cross-check kar sakte hain. Answer key {{officialWebsite}} par available hai. Iske saath hi candidates ko apne marks ka rough estimate bhi pata lag jayega ki wo cutoff ke aas-paas hain ya nahi.",
      },
      {
        blockId: "ak-how-to-check",
        type: "how-to",
        weight: 10,
        content:
          "{{shortTitle}} check karna simple hai. {{officialWebsite}} par jaao aur 'Answer Key' section dhundho. Wahan exam date aur shift-wise answer key ka PDF milega. Apna question paper booklet series match karo (A/B/C/D) aur har question ka answer verify karo. Apne correct aur incorrect answers count karo — negative marking applicable ho to usse bhi calculate karo.",
      },
      {
        blockId: "ak-objection-process",
        type: "process-info",
        weight: 9,
        content:
          "Agar aapko lagta hai ki kisi question ka answer galat hai to aap objection raise kar sakte ho. {{conductingAuthority}} usually objection window 2-3 din ke liye khulti hai jisme aapko evidence ke saath apna claim submit karna hota hai. Objection fee per question hoti hai jo correct hone par wapas mil jaati hai. Yeh process fair hai — agar bahut saare candidates same question par objection raise karein to wo review hota hai.",
      },
      {
        blockId: "ak-marks-calculation",
        type: "exam-info",
        weight: 8,
        content:
          "{{shortTitle}} se apne expected marks calculate karo. {{conductingAuthority}} ke exam mein agar +2 marks correct answer ke liye milte hain aur -0.5 negative marking hai to formula simple hai: (Correct × 2) - (Wrong × 0.5). Yeh provisional score hai — final score official result ke baad hi pata chalega kyunki answer key mein changes ho sakte hain objections ke basis par.",
      },
      {
        blockId: "ak-cutoff-prediction",
        type: "context",
        weight: 7,
        content:
          "{{totalVacancies}} posts ke liye is exam mein competition bahut zyada tha. Previous year cutoff aur is saal ke exam difficulty level ke basis par expected cutoff estimate ki ja sakti hai. General category ke liye cutoff sabse zyada hogi jabki reserved categories mein thoda relaxation milega. Apne marks ko previous year cutoff se compare karo — agar close hain to achha chance hai.",
      },
      {
        blockId: "ak-provisional-vs-final",
        type: "trust-signal",
        weight: 8,
        content:
          "Yeh abhi provisional answer key hai — final answer key objection window ke baad jaari hogi. {{conductingAuthority}} objections review karta hai aur agar koi answer galat paya jaata hai to usse correct kiya jaata hai. Final answer key ke basis par hi result banta hai. Isliye provisional key se apne marks ka rough idea lo lekin final key ka wait karo result prediction ke liye.",
      },
      {
        blockId: "ak-negative-marking-reminder",
        type: "exam-info",
        weight: 6,
        content:
          "Agar {{conductingAuthority}} ke is exam mein negative marking applicable hai to apne wrong answers bhi count karo. Bahut saare candidates sirf correct answers dekhte hain aur galat answers ignore karte hain — lekin negative marking significantly aapke total marks kam kar sakti hai. Careful calculation karo taaki aapko realistic score pata chale.",
      },
      {
        blockId: "ak-result-timeline",
        type: "context",
        weight: 7,
        content:
          "Answer key release hone ke baad usually 15-30 din mein result aata hai. {{conductingAuthority}} pehle objections review karega, final answer key jaari karega, phir result declare hoga. Is beech aap {{officialWebsite}} regularly check karte raho. Result ke baad document verification ki dates bhi jaldi announce hoti hain.",
      },
      {
        blockId: "ak-salary-reminder",
        type: "motivation",
        weight: 5,
        content:
          "Yaad raho ki {{shortTitle}} mein select hone par {{salary}} milegi. Government job ke benefits — job security, pension, medical facilities — private sector se kahin behtar hain. Agar aapke marks achhe hain to ek bright future aapka wait kar raha hai. Aur agar is baar nahi hua to agle exam ki taiyari shuru karo — consistency hi success ki chaabi hai.",
      },
      {
        blockId: "ak-official-source-only",
        type: "trust-signal",
        weight: 8,
        content:
          "Answer key sirf {{officialWebsite}} se hi download karo. Kayi coaching institutes apni answer key release karte hain jo galat bhi ho sakti hai. Official answer key hi final reference hai. Agar koi website ya Telegram channel aapko dubious links de raha hai to us par click mat karo — apna personal data safe rakho.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // 5. EXAM DATE TEMPLATE
  // ═══════════════════════════════════════════════════════════
  {
    templateId: "exam-date-v1",
    pageType: "exam-date",
    language: "hi",
    version: 1,
    active: true,
    blocks: [
      {
        blockId: "ed-intro-confirmed",
        type: "introduction",
        weight: 10,
        content:
          "{{conductingAuthorityFull}} ne {{title}} ki ghoshna kar di hai. Exam {{examDate}} ko aayojit hogi. Jo candidates ne {{totalVacancies}} posts ke liye apply kiya tha wo ab apni exam preparation tez kar dein. Official notification {{officialWebsite}} par upload ki gayi hai jisme detailed schedule diya gaya hai.",
      },
      {
        blockId: "ed-schedule-details",
        type: "exam-info",
        weight: 9,
        content:
          "{{shortTitle}} ka exam {{examDate}} ko conduct hoga. Exam multiple shifts mein ho sakta hai — morning shift usually 10:00 AM se aur evening shift 2:30 PM se shuru hoti hai. Reporting time shift se 1 ghanta pehle hota hai. Exam center ki details admit card mein mention hogi jo {{officialWebsite}} par jald hi available hoga.",
      },
      {
        blockId: "ed-admit-card-timeline",
        type: "how-to",
        weight: 9,
        content:
          "Exam date confirm hone ke baad {{conductingAuthority}} usually exam se 10-15 din pehle admit card release karta hai. Admit card download karne ke liye {{officialWebsite}} par login karo apne registration number aur password se. Admit card mein aapka naam, photo, exam center address, aur reporting time likha hoga. Print nikaal ke safely rakh lo.",
      },
      {
        blockId: "ed-preparation-strategy",
        type: "preparation",
        weight: 10,
        content:
          "{{examDate}} ko exam hai aur ab har ek din important hai. {{shortTitle}} ki taiyari ke liye ek solid plan banao — subah current affairs, dopahar mein subject-wise study, aur shaam ko mock test do. {{conductingAuthority}} ke previous year papers har jagah available hain — unse pattern samjho. Last 7 din mein naya topic mat padho, jo padha hai wahi revise karo aur confidence build karo.",
      },
      {
        blockId: "ed-exam-pattern",
        type: "exam-info",
        weight: 8,
        content:
          "{{conductingAuthority}} ke is exam mein objective type questions aate hain. Total paper 2-3 ghante ka hota hai jisme multiple sections hote hain — General Knowledge, Reasoning, Hindi/English Language, aur subject-specific questions. Har section mein time divide karke solve karo. {{selectionProcess}} ke anusar jo candidates written exam clear karenge unhe agle round ke liye call kiya jayega.",
      },
      {
        blockId: "ed-vacancy-competition",
        type: "context",
        weight: 7,
        content:
          "{{conductingAuthority}} ne is recruitment mein {{totalVacancies}} posts ke liye bharti nikali hai. Applications lakhs mein aayi hain isliye competition bahut high hai. Average seats-to-candidate ratio bahut zyada hai. Isliye smart study karo — har question ko attempt karna zaroori nahi hai, accuracy maintain karo aur negative marking se bacho.",
      },
      {
        blockId: "ed-exam-day-checklist",
        type: "how-to",
        weight: 8,
        content:
          "Exam Day Checklist: 1) Admit card ka printout (colour ya black & white dono chalega) 2) Valid government photo ID — Aadhaar, PAN, Voter ID, ya Passport 3) Ball point pen (blue/black) 4) Transparent water bottle 5) Center par time se pehle pahuncho — late entry allowed nahi hoti. Mobile phone, smart watch, calculator, aur earphones exam hall mein bilkul allowed nahi hain.",
      },
      {
        blockId: "ed-salary-motivation",
        type: "motivation",
        weight: 6,
        content:
          "Mehnat ka phal zaroor milega. {{shortTitle}} mein select hone par {{salary}} milegi jo ek achhi starting salary hai. Government job ke saath aapko social respect, job security, aur retirement benefits milte hain. Is exam ko apne career ka turning point samjho aur puri taakat lagao. Best of luck!",
      },
      {
        blockId: "ed-postponement-disclaimer",
        type: "trust-signal",
        weight: 5,
        content:
          "Kabhi kabhi exam dates postpone bhi ho sakti hain — yeh {{conductingAuthority}} ke decision par depend karta hai. Agar koi change hota hai to official notification {{officialWebsite}} par sabse pehle aati hai. Hum bhi updates turant yahan publish karte hain. Isliye is page ko bookmark karo aur regular check karte raho.",
      },
      {
        blockId: "ed-age-eligibility-recap",
        type: "eligibility-reminder",
        weight: 5,
        content:
          "Is exam ke liye eligibility mein age limit {{ageLimitMin}} se {{ageLimitMax}} saal thi. Agar aapne successfully apply kar liya tha to ab aapko sirf exam ki taiyari par focus karna chahiye. Educational qualification aur age verification document verification stage mein hoti hai — abhi ke liye sirf padhai par dhyan do.",
      },
    ],
  },
];
