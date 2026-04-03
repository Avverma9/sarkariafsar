function formatDate(v) {
  if (!v) return "जल्द ही";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "जल्द ही";
  return d.toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" });
}

function buildVars(p) {
  const sel = Array.isArray(p.selectionProcess)
    ? p.selectionProcess.join(" → ")
    : p.selectionProcess || "लिखित परीक्षा → दस्तावेज़ सत्यापन";
  return {
    "{{title}}": p.title || "",
    "{{shortTitle}}": p.shortTitle || p.title || "",
    "{{conductingAuthority}}": p.conductingAuthority || "",
    "{{conductingAuthorityFull}}": p.conductingAuthorityFull || p.conductingAuthority || "",
    "{{officialWebsite}}": p.officialWebsite || "official website",
    "{{totalVacancies}}": String(p.totalVacancies || ""),
    "{{salary}}": p.salary || "government pay scale",
    "{{ageLimitMin}}": String(p.ageLimit?.min ?? ""),
    "{{ageLimitMax}}": String(p.ageLimit?.max ?? ""),
    "{{applicationFeeGeneral}}": String(p.applicationFee?.general ?? ""),
    "{{examDate}}": formatDate(p.dates?.examDate || p.examDate),
    "{{admitCardDate}}": formatDate(p.dates?.admitCard),
    "{{applyLastDate}}": formatDate(p.dates?.applyEnd || p.dates?.regLastDate || p.applyLastDate),
    "{{selectionProcess}}": sel,
    "{{state}}": p.state || "",
    "{{location}}": p.location || "India",
  };
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pick(blocks, count, seed) {
  if (!blocks.length) return [];
  const n = Math.min(count, blocks.length);
  if (seed !== undefined && seed !== null) {
    const s = typeof seed === "string" ? hash(seed) : seed;
    const sorted = [...blocks].sort((a, b) => {
      const sa = (hash(a.blockId + s) % 100) * (a.weight || 1);
      const sb = (hash(b.blockId + s) % 100) * (b.weight || 1);
      return sb - sa;
    });
    return sorted.slice(0, n);
  }
  const pool = blocks.flatMap((b) => Array(b.weight || 1).fill(b));
  const picked = [];
  const used = new Set();
  while (picked.length < n && pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    const b = pool[idx];
    if (!used.has(b.blockId)) { picked.push(b); used.add(b.blockId); }
    pool.splice(0, pool.length, ...pool.filter((x) => x.blockId !== b.blockId));
  }
  return picked;
}

function pickAndInject(post, blockCount = 4) {
  const pt = post.pageType || "job-posting";
  const pool = BLOCKS[pt] || BLOCKS["job-posting"] || [];
  if (!pool.length) return null;

  const seed = post._id ? String(post._id) : post.slug || post.title;
  const selected = pick(pool, blockCount, seed);
  const vars = buildVars(post);

  const injected = selected.map((b) => {
    let c = b.content;
    for (const [ph, val] of Object.entries(vars)) c = c.replaceAll(ph, val);
    return { blockId: b.blockId, type: b.type, content: c };
  });

  return {
    blocks: injected,
    wordCount: injected.reduce((s, b) => s + b.content.split(/\s+/).length, 0),
    generatedAt: new Date().toISOString(),
  };
}

const BLOCKS = {
  "admit-card": [
    {
      blockId: "ac-intro-urgency",
      type: "introduction",
      weight: 10,
      content: "{{conductingAuthorityFull}} ne {{title}} jaari kar diya hai. Jo candidates {{totalVacancies}} posts ke liye apply kar chuke hain, unhe yaad dilana chahte hain ki admit card {{admitCardDate}} se official website {{officialWebsite}} par available hai. Exam {{examDate}} ko hoga isliye abhi apna admit card download kar lo aur ek printout rakh lo taaki koi last minute pareshani na ho.",
    },
    {
      blockId: "ac-exam-reporting-time",
      type: "guidelines",
      weight: 8,
      content: "Admit card par mention kiya gaya reporting time bahut critical hai. {{conductingAuthority}} ke rules ke mutabik agar aap reporting time ke baad exam center pahunchte hain, to entry nahi milegi. Isliye koshish karein ki exam center par kam se kam 1 ghanta pehle pahunche taaki frisking aur biometric verification smoothly ho sake. {{examDate}} ko hone wali pariksha ke liye apne raste aur transport ka intezam pehle se kar lein.",
    },
    {
      blockId: "ac-id-proof-mandatory",
      type: "guidelines",
      weight: 9,
      content: "Sirf admit card lekar jaana kaafi nahi hai. Candidates ko ek valid photo ID proof (Aadhar Card, PAN Card, Voter ID, ya Passport) ki original copy aur ek photocopy saath rakhni hogi. Yaad rakhein ki ID proof par aapka naam aur photo wahi honi chahiye jo {{shortTitle}} application form mein thi. Agar mismatch hua to invigilator aapko exam dene se rok sakta hai.",
    },
    {
      blockId: "ac-technical-troubleshoot",
      type: "how-to",
      weight: 7,
      content: "Kai baar server load ki wajah se {{officialWebsite}} open nahi hoti ya login error aata hai. Aise mein ghabrayein nahi. Browser ki cache clear karein ya incognito mode mein try karein. Agar phir bhi {{title}} download nahi ho raha, to thodi der baad koshish karein. Raat ke waqt traffic kam hota hai, tab download karna aasaan rahega. Registration number aur password sahi se enter karna na bhoolein.",
    },
    {
      blockId: "ac-dress-code-policy",
      type: "guidelines",
      weight: 6,
      content: "{{conductingAuthority}} ne exam center ke liye strict dress code rakha hai. Candidates ko advise kiya jaata hai ki wo bade buttons wale kapde, shoes, ya koi bhi metal jewellery na pehnein. Simple sandals aur comfortable kapde pehen kar jaana sabse behtar hai. Purse, mobile phone, calculator, aur bluetooth devices exam hall ke andar prohibited hain. In sab cheezon ko rakhne ke liye center par koi official locker nahi hota, isliye behtar hai ki inhe ghar par hi chhodein.",
    },
    {
      blockId: "ac-photo-mismatch-solution",
      type: "how-to",
      weight: 5,
      content: "Agar aapke {{shortTitle}} admit card par photo clear nahi hai ya signature missing hai, to turant {{conductingAuthority}} ke helpline number par contact karein. Aise cases mein aapko exam center par do extra passport size photos aur ek gazetted officer se attested identity certificate lekar jaana pad sakta hai. Risk mat lein aur pehle hi mail karke confirmation le lein.",
    },
    {
      blockId: "ac-center-navigation-tip",
      type: "guidelines",
      weight: 7,
      content: "{{state}} mein kai baar ek hi naam ke do ya teen exam centers hote hain. Admit card par diye gaye address aur center code ko Google Maps par dhyan se check karein. Agar ho sake to exam se ek din pehle center visit kar lein taaki {{examDate}} ki subah aapko rasta dhundhne mein koi tension na ho. {{totalVacancies}} posts ki is race mein har minute keemti hai.",
    },
    {
      blockId: "ac-forgot-password-help",
      type: "how-to",
      weight: 6,
      content: "Agar aap apna registration number ya password bhool gaye hain, to {{officialWebsite}} par 'Forgot Password' link ka use karein. Wahan aapko apna registered mobile number aur email ID enter karni hogi. {{conductingAuthority}} aapko ek OTP ya reset link bhejega. Iske baad aap naya password generate karke apna {{title}} asani se download kar payenge. Mail ka spam folder check karna na bhoolein.",
    },
    {
      blockId: "ac-last-minute-checklist",
      type: "preparation",
      weight: 8,
      content: "Exam se ek din pehle yeh checklist verify karein: 1. {{title}} ka clear printout, 2. Original Photo ID, 3. Do blue/black ballpoint pens, 4. Passport size photos, 5. Transparent water bottle. {{shortTitle}} ke liye negative marking hai ya nahi, yeh ek baar phir se instruction manual mein padh lein jo admit card ke saath attach hota hai.",
    },
    {
      blockId: "ac-covid-health-protocols",
      type: "guidelines",
      weight: 5,
      content: "Halaanki ab conditions normal hain, lekin {{conductingAuthority}} abhi bhi basic health protocols follow kar sakta hai. Mask pehenna aur social distancing maintain karna safe rehta hai. Agar aapko fever ya cold hai, to center par invigilator ko inform karein. Woh aapke liye alag seating arrangement kar sakte hain. Aapki health aur exam dono important hain.",
    },
    {
      blockId: "ac-scrib-guide",
      type: "guidelines",
      weight: 4,
      content: "PwD candidates jo scribe facility use kar rahe hain, unhe scribe ka admit card aur relevant certificates saath laane honge. Scribe ki educational qualification post ki eligibility se kam honi chahiye. Iska detailed proforma {{officialWebsite}} par notification ke saath diya gaya hai. Isse verify karwa ke hi exam center pahunche.",
    },
    {
      blockId: "ac-biometric-verification",
      type: "process-info",
      weight: 6,
      content: "Exam start hone se pehle biometric data jaise ki fingerprints aur IRIS scan liya ja sakta hai. Apne hathon par mehendi, ink, ya color na lagayein, warna scanner aapka thumb print read nahi kar payega. Agar biometric match nahi hota, to candidate ka paper cancel kiya ja sakta hai. Yeh system fraud rokne ke liye {{conductingAuthority}} dwara implement kiya gaya hai.",
    },
  ],
  "result": [
    {
      blockId: "res-intro-announcement",
      type: "introduction",
      weight: 10,
      content: "{{conductingAuthorityFull}} ne {{title}} ghoshit kar diya hai. Jo candidates ne is exam mein hissa liya tha wo ab apna result {{officialWebsite}} par check kar sakte hain. Total {{totalVacancies}} posts ke liye yeh recruitment chal rahi thi aur ab final merit list ke basis par aage ki process shuru hogi.",
    },
    {
      blockId: "res-server-crash-advice",
      type: "how-to",
      weight: 8,
      content: "Result release hote hi {{officialWebsite}} par traffic bahut badh jaata hai, jisse site slow ya crash ho sakti hai. Agar page load nahi ho raha, to baar-baar refresh na karein. Thoda patience rakhein aur 15-20 minutes baad try karein. Aap result direct link se ya PDF file download karke bhi apna roll number search kar sakte hain (Ctrl+F shortcut use karein).",
    },
    {
      blockId: "res-tie-breaking-rule",
      type: "process-info",
      weight: 6,
      content: "Kai baar do candidates ke marks bilkul same hote hain. Aise mein {{conductingAuthority}} tie-breaking rules apply karta hai. Pehle wo candidate dekha jaata hai jiski age zyada hai, ya fir alphabetical order mein naam check hota hai. Kuch exams mein section-wise marks bhi dekhe jaate hain. Yeh saari details {{shortTitle}} ke official notification mein mention hoti hain.",
    },
    {
      blockId: "res-waitlist-clarification",
      type: "context",
      weight: 7,
      content: "Main merit list ke saath-saath {{conductingAuthority}} ek waitlist ya reserve list bhi jaari kar sakta hai. Agar selected candidates joining nahi karte ya documents mein fail ho jaate hain, to waitlist wale candidates ko mauka diya jaata hai. Isliye agar aapka naam main list mein nahi hai par waitlist mein upar hai, to hope mat chhodiye aur regular updates check karte rahiye.",
    },
    {
      blockId: "res-reevaluation-process",
      type: "how-to",
      weight: 7,
      content: "Agar aap apne marks se satisfied nahi hain, to {{conductingAuthority}} re-evaluation ya scrutiny ka option de sakta hai. Iske liye aapko official website par ek fixed fee pay karni hogi aur specified time limit ke andar apply karna hoga. Yaad rakhein ki mostly exams mein sirf total calculation check hoti hai, poora answer sheet dobara check nahi kiya jaata.",
    },
    {
      blockId: "res-marksheet-download",
      type: "how-to",
      weight: 8,
      content: "Result ke kuch din baad candidates apni individual marksheet download kar payenge. Isme aapko pata chalega ki aapne kis subject mein kitna score kiya aur cutoff se kitna door rahe. Marksheet download karne ke liye aapko login credentials (User ID/Password) ki zaroorat padegi. Yeh future reference aur dusre exams ke preparation analysis ke liye bahut kaam aati hai.",
    },
    {
      blockId: "res-dv-call-letter",
      type: "process-info",
      weight: 9,
      content: "Qualified candidates ko ab Document Verification (DV) ke liye taiyar rehna chahiye. {{conductingAuthority}} jald hi DV ka schedule aur call letters official website par upload karega. Aapko apne saare original certificates (Educational, Caste, Domicile) aur unki self-attested copies ka set ready rakhna chahiye. Ek bhi galat document aapki poori mehnat par pani pher sakta hai.",
    },
    {
      blockId: "res-failure-motivation",
      type: "motivation",
      weight: 6,
      content: "Agar result negative raha, to udaas hona natural hai. Lekin yaad rakhein ki ek exam aapka future decide nahi karta. {{totalVacancies}} seats ke liye hazaron applicants the, competition tough hona hi tha. Analysis karein ki kahan kami reh gayi — kya speed kam thi ya accuracy? Next notification ka wait karein aur apni taiyari ko aur mazboot banayein. Agli baar safalta zaroor milegi.",
    },
    {
      blockId: "res-verification-of-marks",
      type: "process-info",
      weight: 5,
      content: "{{shortTitle}} result mein agar koi discrepancy dikhti hai jaise ki naam ki spelling ya category galat hai, तो turant controller of examination ko email karein. Kabhi-kabhi technical glitch ki wajah se data mismatch ho jata hai. Sahi time par action lene se aapka candidature safe rahega.",
    },
    {
      blockId: "res-interview-prep",
      type: "preparation",
      weight: 7,
      content: "Agar aapka selection written exam mein ho gaya hai aur aage Interview ya Personality Test hai, to abhi se apni communication skills par kaam shuru kar dein. {{conductingAuthority}} ke baare mein basic knowledge aur current affairs par pakad honi chahiye. Mock interviews dene se confidence build hota hai aur darr khatam hota hai.",
    },
  ],
  "job-posting": [
    {
      blockId: "rec-intro-opportunity",
      type: "introduction",
      weight: 10,
      content: "{{conductingAuthorityFull}} ne {{title}} ke liye official notification jaari kar di hai. Is recruitment mein total {{totalVacancies}} posts ke liye bharti hogi. Jo candidates sarkari naukri ki talash mein hain unke liye yeh ek bahut achha mauka hai. Online application {{officialWebsite}} par ki ja sakti hai aur last date {{applyLastDate}} hai.",
    },
    {
      blockId: "rec-work-culture",
      type: "motivation",
      weight: 7,
      content: "{{conductingAuthority}} mein kaam karna ek garv ki baat hai. Yahan ka work culture professional aur supportive hai. Aapko senior officers se seekhne ka mauka milega aur desh ki seva karne ka direct platform milega. {{shortTitle}} post par aapko society mein ek alag respect milti hai. Career growth ke liye department exams bhi hote hain jinse aap fast-track promotion le sakte hain.",
    },
    {
      blockId: "rec-probation-period",
      type: "process-info",
      weight: 6,
      content: "Selection ke baad candidates ko ek specified probation period par rakha jayega, jo aam taur par 2 saal ka hota hai. Is dauran aapki performance aur conduct monitor kiya jata hai. Probation successfully complete hone ke baad hi aapko permanent employee ke benefits aur perks milna shuru hote hain. Training phase mein aapko job ki intricacies samjhayi jayengi.",
    },
    {
      blockId: "rec-transfer-policy",
      type: "context",
      weight: 5,
      content: "{{shortTitle}} ek transferable job hai. {{state}} ke kisi bhi district mein ya conducting authority ke jurisdictional area mein aapki posting ho sakti hai. Initial posting aam taur par rural areas ya headquarters mein hoti hai. Transfers strictly department norms aur vacancy availability par depend karte hain. Isliye join karne se pehle mentally prepare rahein.",
    },
    {
      blockId: "rec-women-benefits",
      type: "eligibility-reminder",
      weight: 8,
      content: "{{conductingAuthority}} women candidates ko encourage karne ke liye special provisions deta hai. Application fee mein choot ke saath-saath, pregnancy aur child care leaves ki facility bhi milti hai. Kuch cases mein women candidates ko unke home district ya nearest city mein posting milne ki priority di jaati hai. Agar aap ek mahila hain aur {{totalVacancies}} posts mein apna naam dekhna chahti hain, to bina dare apply karein.",
    },
    {
      blockId: "rec-medical-fitness-standard",
      type: "eligibility-reminder",
      weight: 7,
      content: "Final selection se pehle medical fitness test clear karna zaroori hai. Aapki eyesight, hearing ability, aur physical health parameters check kiye jayenge. Agar post police ya security services ki hai, to vision 6/6 honi chahiye bina specs ke (mostly). Notification mein diye gaye medical standards ko dhyan se padhein taaki baad mein koi surprise na mile.",
    },
    {
      blockId: "rec-character-certificate",
      type: "process-info",
      weight: 6,
      content: "Recruitment process ka ek ahem hissa hai character aur antecedent verification. Police verification ke waqt aapke upar koi criminal case pending nahi hona chahiye. Aapko do gazetted officers se character certificates bhi banwane honge. Agar koi jhoothi jaankari di gayi to recruitment cancel kar di jayegi aur legal action liya ja sakta hai.",
    },
    {
      blockId: "rec-promotion-ladder",
      type: "motivation",
      weight: 7,
      content: "{{shortTitle}} mein joining ke baad promotion ke bahut scope hain. Aap lower grade se start karke higher administrative positions tak pahunch sakte hain. 5-7 saal ki service ke baad regular increments aur grade pay upgrade hota rehta hai. Yeh job sirf ek salary check nahi hai, balki long-term career security hai.",
    },
    {
      blockId: "rec-how-to-fill-form-correctly",
      type: "how-to",
      weight: 9,
      content: "Form bharte waqt sabse zyada galti documents upload karne mein hoti hai. Signature hamesha white paper par black ink se karein. Photo ka background plain light color ka rakhein. Documents ka size (KB) aur format (JPEG/PDF) wahi hona chahiye jo instruction manual mein likha hai. Sabmit karne se pehle 'Preview' button click karke har detail re-check karein.",
    },
    {
      blockId: "rec-historical-cutoff-trend",
      type: "context",
      weight: 6,
      content: "Last year ke trends dekhe jayein to {{conductingAuthority}} ke exams mein competition har saal 15-20% badh raha hai. Pichli baar ka cutoff General category ke liye kafi high tha. Is saal {{totalVacancies}} vacancies hone ki wajah se chances behtar hain, lekin target hamesha safe score se 10-15 marks upar rakhna chahiye. Analysis ke bina taiyari adhuri hai.",
    },
    {
      blockId: "rec-syllabus-strategy",
      type: "preparation",
      weight: 8,
      content: "{{shortTitle}} ka syllabus vishal ho sakta hai. Focus karein core subjects par jaise Math, Reasoning, aur General Studies. Current Affairs ke liye last 6-8 months ki news cover karein. Daily ek section padhein aur weekend par uska revision karein. Jitna zyada revise karenge, utni hi kam galtiyan exam hall mein hongi.",
    },
    {
      blockId: "rec-extra-curricular-weightage",
      type: "process-info",
      weight: 5,
      content: "Kuch posts mein NCC 'C' certificate, sports quota, ya ex-servicemen candidates ko bonus marks diye jaate hain. Agar aapke paas aisi koi qualification hai, to form mein uska mention zaroor karein. Yeh extra marks final merit list mein aapka rank kafi upar le ja sakte hain.",
    },
  ],
  "admission": [
    {
      blockId: "adm-intro-notification",
      type: "introduction",
      weight: 10,
      content: "{{conductingAuthorityFull}} ne {{title}} ke liye official notification jaari kar di hai. Jo students admission lena chahte hain wo {{officialWebsite}} par jaake online application kar sakte hain. Last date {{applyLastDate}} hai isliye jaldi apply karo — last moment mein website slow ho jaati hai aur bahut pareshani hoti hai.",
    },
    {
      blockId: "adm-campus-life",
      type: "motivation",
      weight: 8,
      content: "{{conductingAuthority}} ka campus state-of-the-art facilities se less hai. Yahan aapko modern labs, high-speed internet aur ek vishal library milegi. Padhai ke saath-saath cultural fests, sports competitions aur clubs mein participate karne ka mauka milta hai. Yeh environment aapki overall personality development ke liye best hai. {{shortTitle}} ke students ke liye hostels aur mess ki facility bhi available hai.",
    },
    {
      blockId: "adm-scholarship-info",
      type: "context",
      weight: 7,
      content: "Meritorious aur zarooratmand students ke liye kai tarah ki scholarships available hain. Central government aur state government ki schemes jaise Post-Matric Scholarship ka labh aap le sakte hain. SC/ST aur minority candidates ke liye fee reimbursement ka provision bhi hai. Admission ke waqt hi scholarship portal par register karna na bhoolein.",
    },
    {
      blockId: "adm-hostel-accommodation",
      type: "process-info",
      weight: 6,
      content: "Hostel allotment strictly merit aur distance ke basis par hota hai. Bahar ke states ya districts se aane wale students ko priority di jaati hai. Hostels mein 24/7 security, drinking water, aur wifi ki suvidha hai. Mess ka menu students ki committee decide karti hai. Admission confirm hone ke turant baad hostel form bharna zaroori hai kyunki limited seats ({{totalVacancies}}) hoti hain.",
    },
    {
      blockId: "adm-anti-ragging-policy",
      type: "guidelines",
      weight: 9,
      content: "{{conductingAuthority}} mein ragging sakht mana hai. Zero-tolerance policy follow ki jaati hai aur ragging mein involved paaye jaane par turant expulsion aur legal action liya jata hai. Har student ko admission ke waqt ek anti-ragging affidavit submit karna hota hai. Campus safe aur friendly hai, isliye naye students ko darne ki koi zaroorat nahi hai.",
    },
    {
      blockId: "adm-refund-rules",
      type: "fee-info",
      weight: 5,
      content: "Agar aap admission cancel karwana chahte hain, तो UGC ke guidelines ke mutabik ek specific time frame mein fee refund ki ja sakti hai. Kuch administrative charges katne ke baad baaki amount aapke account mein waapas aa jayega. Refund process online portal ke through hi initiate hoti hai. Admission letter mein refund ki detailed policy zaroor padhein.",
    },
    {
      blockId: "adm-stream-change-option",
      type: "process-info",
      weight: 6,
      content: "First year ke baad, agar aapka CGPA/marks achhe hain, to aap apni stream ya branch change karne ke liye apply kar sakte hain. Yeh seats ki availability aur aapki rank par depend karta hai. Isliye first year mein mehnat karein taaki aap apne pasandida subject mein switch kar sakein. Iska poora process {{officialWebsite}} ke academic section mein diya gaya hai.",
    },
    {
      blockId: "adm-industry-tieups",
      type: "motivation",
      weight: 7,
      content: "{{conductingAuthority}} ka kai badi companies aur organizations ke saath tie-up hai. Isse students ko internship aur placement mein bahut help milti hai. Academic session ke dauran industry experts aakar seminars aur workshops conduct karte hain. Graduation khatam hote hi aapke paas ek achha job offer hone ke chances kafi badh jaate hain.",
    },
    {
      blockId: "adm-alumni-network",
      type: "context",
      weight: 6,
      content: "Hamaara alumni network bahut strong hai. Yahan se padhe hue students aaj IAS, IPS, Scientists, aur MNCs ke CEO positions par hain. Admission lene se aap is powerful community ka hissa ban jaate hain jo aapko career guidance aur networking mein life-long help karte hain. Har saal alumni meet hoti hai jisme naye aur puraane students interact karte hain.",
    },
    {
      blockId: "adm-entrance-exam-pattern",
      type: "preparation",
      weight: 8,
      content: "{{shortTitle}} entrance exam online (CBT) mode mein ho sakta hai. Question paper objective type hota hai jisme Multiple Choice Questions (MCQs) hote hain. Maths, Science, Reasoning aur Language proficiency par focus karein. Sample papers aur mock tests se practice karein taaki aapko time management ka andaza ho jaye. Admission lene ke liye entrance exam clear karna mandatory hai.",
    },
    {
      blockId: "adm-counselling-process",
      type: "process-info",
      weight: 9,
      content: "Entrance exam ke baad rank list jaari hoti hai aur qualified candidates ko counselling ke liye bulaya jaata hai. Counselling online ya offline ho sakti hai jisme aapko apne college aur course ki preference bharni hoti hai. Choice filling dhyan se karein kyunki ek baar lock hone ke baad options change nahi hote. Seat allotment ke baad specified time mein fee bhar kar admission confirm karna hota hai.",
    },
    {
      blockId: "adm-library-digital-access",
      type: "motivation",
      weight: 5,
      content: "Students ko physical library ke saath-saath digital library ka access bhi milta hai. Aap hazaron e-books, journals, aur research papers kahin se bhi access kar sakte hain. Yeh facility research work aur competitive exams ki taiyari mein bahut helpful hai. Reading room ka mahool shant hai aur padhai ke liye perfect hai.",
    },
    {
      blockId: "adm-extra-curricular-credit",
      type: "process-info",
      weight: 4,
      content: "Padhai ke saath-saath sports, NSS, aur NCC mein involvement ke liye extra credits milte hain. Yeh credits aapki final marksheet mein reflect hote hain aur higher studies ya jobs mein advantage dete hain. Hum holisitc development mein believe karte hain, isliye students ko har field mein excel karne ka mauka dete hain.",
    },
    {
      blockId: "adm-language-of-instruction",
      type: "context",
      weight: 5,
      content: "Instruction ki language mostly English aur Hindi dono rehti hai taaki kisi bhi background ke student ko samajhne mein pareshani na ho. Professors supportive hain aur agar koi language barrier hai to extra classes bhi arrange ki ja sakti hain. Hum inclusive education ko promote karte hain.",
    },
  ],
};

module.exports = { pickAndInject, BLOCKS };