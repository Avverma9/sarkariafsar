/**
 * content.js — Dynamic post-specific content generator v2.
 *
 * Each generator builds 150-200 word unique paragraphs from real post data.
 * 4 blocks = 600-800 words per post.
 * TEMPLATE_VERSION bump → re-run backfill to regenerate all posts.
 */

const TEMPLATE_ID = "dynamic-hi-v4";
const TEMPLATE_VERSION = 4;

// ── Helpers ──────────────────────────────────────────────────
function fmtDate(v) {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("hi-IN", { day: "numeric", month: "long", year: "numeric" });
}
function fmtMoney(n) { return n ? `₹${Number(n).toLocaleString("en-IN")}` : null; }

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pick(arr, count, seed) {
  if (!arr.length) return [];
  const n = Math.min(count, arr.length);
  const s = typeof seed === "string" ? hash(seed) : (seed || 0);
  const sorted = [...arr].sort((a, b) => {
    const sa = (hash(a.id + s) % 100) * (a.weight || 1);
    const sb = (hash(b.id + s) % 100) * (b.weight || 1);
    return sb - sa;
  });
  return sorted.slice(0, n);
}

// ══════════════════════════════════════════════════════════════
//  GENERATOR FUNCTIONS — each takes (post) → string | null
// ══════════════════════════════════════════════════════════════

function genFeeTips(p) {
  const f = p.applicationFee;
  if (!f || typeof f !== "object" || (!f.general && !f.sc && !f.obc)) return null;
  const ca = p.conductingAuthority || p.shortTitle || "Authority";
  const payModes = f.paymentModes && f.paymentModes.length
    ? f.paymentModes.join(", ")
    : "Debit Card, Credit Card, Net Banking, ya UPI";
  const ld = fmtDate(p.dates?.applyEnd || p.dates?.regLastDate || p.applyLastDate);
  return `Application fee successfully pay karne ke baad bhi candidates kaafi common mistakes karte hain — yeh guide unhe avoid karne mein help karegi. ` +
    `Sabse badi galti: payment complete hoti hai lekin final 'Submit' button press nahi kiya jaata. ` +
    `Fee deducted ka matlab form submitted nahi hota — dono steps separately complete karne hote hain. ` +
    `Payment ke baad acknowledgement/confirmation page ka screenshot ya PDF hamesha save karo — iska transaction ID aur date note karo. ` +
    `${ld ? `Last date ${ld} hai —` : "Last date ke"} 3-4 din pehle apply karo. ` +
    `Deadline wale din ${ca} server par itna load hota hai ki payment gateway timeout ho jaati hai, pages refresh nahi hote, aur paise kat kar form pending reh jaata hai. ` +
    `Agar double payment ho gayi to ghabrao mat — ek payment automatically 7-10 working days mein refund ho jaati hai bank ke rules ke mutabik. ` +
    `Payment failure aane par turant dobara try mat karo — pehle bank statement check karo, agar amount debit hua to 2-3 ghante baad portal par revisit karo. ` +
    `${payModes} payment modes available hain — agar ek fail ho to dusra try karo. ` +
    `OTP ke liye registered mobile number available rakho — UPI payments mein OTP ya PIN zaroori hota hai. ` +
    `Fee receipt ko joining tak safe rakho — document verification mein bhi kabhie kabhie maanga jaata hai.`;
}

function genAgeInfo(p) {
  const a = p.ageLimit;
  if (!a || typeof a !== "object" || (!a.min && !a.max)) return null;
  const ca = p.conductingAuthority || p.shortTitle || "is recruitment";
  let text = `Age limit ke baare mein candidates ke man mein kaafi confusion rehti hai — kuch important clarifications. `;
  // relaxation details
  text += `Reservation category ke mutabik age relaxation milti hai: SC/ST candidates ko 5 saal, OBC (Non-Creamy Layer) candidates ko 3 saal, ` +
    `PwD/Divyangjan candidates ko 10 saal, aur PwD+SC/ST ko 15 saal ki relaxation milti hai — yeh Central Government norms hain. `;
  if (a.asOn) {
    const d = fmtDate(a.asOn);
    if (d) text += `Is recruitment mein age cut-off date ${d} rakhi gayi thi — is date ke hisaab se apni date of birth verify karo, na ki aaj ki date se. `;
  } else {
    text += `Age cut-off date notification mein clearly mention hoti hai — wahi date use karo apni eligibility calculate karne ke liye. `;
  }
  if (a.note) text += `Important note: ${a.note} `;
  text += `Age proof ke liye sirf 10th board certificate (Date of Birth as per SSC) ya Birth Certificate valid hota hai — Aadhaar card mein DOB mismatch hone par bhi 10th certificate final maana jaata hai. ` +
    `Agar aap borderline age par hain (max se 1-2 saal zyada), to OBC/EWS certificate check karo — relaxation se eligible ho sakte ho. ` +
    `Ex-servicemen candidates ke liye alag relaxation norms hain jo service length ke hisaab se decide hoti hai. ` +
    `Age bar par reject hone ke baad second chance sirf upper age waali posts mein milti hai — isliye time par identify karo aur apply karo.`;
  return text;
}

function genWhoShouldApply(p) {
  const eli = p.eligibility;
  if (!eli || !eli.length) return null;
  const ca = p.conductingAuthority || p.shortTitle || "is bharti";
  const posts = eli.map(e => e.post).filter(Boolean).slice(0, 4);
  const hasTyping  = eli.some(e => /typing/i.test(e.qualification || ""));
  const hasDegree  = eli.some(e => /graduat|b\.?tech|b\.?a|b\.?sc|b\.?com|degree/i.test(e.qualification || ""));
  const has10th    = eli.some(e => /10th|matric|ssc/i.test(e.qualification || ""));
  const has12th    = eli.some(e => /12th|inter|higher secondary/i.test(e.qualification || ""));
  let text = `Kaun ${ca} ke liye apply kar sakta hai — plain language mein:\n\n`;
  if (has10th) text += `✅ 10th pass candidates: Matric level posts ke liye eligible.\n`;
  if (has12th) text += `✅ 12th (Intermediate) pass: 12th level posts apply kar sakte hain.\n`;
  if (hasDegree) text += `✅ Graduate (Any stream): Degree holders ke liye most posts open hain.\n`;
  if (hasTyping) text += `✅ Typing skill required: Hindi/English typing certificate valid institute se.\n`;
  if (posts.length) text += `✅ Posts ke naam: ${posts.join(", ")}\n`;
  text += `\nKaun apply NAHI kar sakta:\n`;
  text += `❌ Jo abhi final year mein hain aur result awaited hai — kuch recruitments allow karti hain, official notification check karo.\n`;
  text += `❌ Jinka percentage prescribed minimum se kam hai — cutoff marks clear karna alag baat hai, eligibility marks different hote hain.\n`;
  if (hasTyping) text += `❌ Bina recognized typing certificate ke — personal practice enough nahi hai, official certificate zaroori hai.\n`;
  text += `\n${p.officialWebsite ? `Poori eligibility detail ${p.officialWebsite} par PDF notification mein milegi.` : "Poori eligibility official notification PDF mein clearly mention hai."} ` +
    `Equivalency clause ke baare mein — agar aapki degree equivalent hai to university ka equivalency certificate zaroor rakhein, document verification mein kaam aayega.`;
  return text;
}

function genVacancyInsight(p) {
  const vt = (p.structured || {}).vacancyTable;
  const ca = p.conductingAuthority || p.shortTitle || "Board";
  const total = p.totalVacancies;
  if (!total && (!vt || !vt.length)) return null;
  let text = `${ca} vacancy analysis — competition aur strategy:\n\n`;
  if (total) {
    const isLarge = total >= 1000;
    const isMedium = total >= 200 && total < 1000;
    text += isLarge
      ? `✅ ${total} posts ek bahut badi recruitment hai. Itni seats mein selection probability naturally better hoti hai, lekin applicants bhi lakho mein hote hain — preparation strong rakhna zaroori hai.\n`
      : isMedium
        ? `📊 ${total} posts — medium size recruitment. Selection ratio tight hoga, top 30% mein rehna target karo.\n`
        : `⚠️ ${total} posts — relatively kam seats. Competition kaafi tight hogi, unjhon candidates ke comparison mein jo sirf last-minute parhte hain, consistent preparation advantage degi.\n`;
  }
  if (vt && vt.length) {
    const maxVacPost = vt.slice().sort((a, b) => (Number(b.count)||0) - (Number(a.count)||0))[0];
    if (maxVacPost?.post) {
      text += `📌 Sabse zyada seats: "${maxVacPost.post}" post (${maxVacPost.count || "?"}) — agar eligible ho to is post ko priority mein rakho, chances better hain.\n`;
    }
  }
  text += `\nCategory strategy:\n`;
  text += `• UR/General: Cutoff sabse upar hoga — scoring section (Math, Reasoning) mein koi mistake afford mat karo.\n`;
  text += `• OBC/EWS: UR se 3-7 marks ka buffer hota hai typically — comfort zone mein mat raho, UR level preparation karo.\n`;
  text += `• SC/ST: Cutoff relatively low hota hai lekin passing marks compulsory hain — har section mein minimum qualify karna zaroori hai.\n`;
  text += `\nExpected cutoff predict karna mushkil hai — isliye target hamesha expected cutoff se 10-15 marks upar rakhna smart strategy hai.`;
  return text;
}

function genExamStrategy(p) {
  const sp = p.selectionProcess || [];
  if (!sp.length) return null;
  const ca = p.conductingAuthority || p.shortTitle || "is exam";
  let text = `${ca} mein select hone ki smart preparation strategy — stage-by-stage:\n\n`;
  if (sp.some(s => /written|likhit|cbt|online exam/i.test(s))) {
    text += `📝 Written/CBT Exam:\n`;
    text += `• Syllabus pehle download karo — bina syllabus ke padhai direction-less hoti hai.\n`;
    text += `• GK/GS, Reasoning, Maths — yeh 3 sections most exams mein common hain. Reasoning aur Maths scoring hote hain — inhe daily 1-2 ghante do.\n`;
    text += `• Previous 3-5 saal ke papers solve karo — questions ka pattern samajh aata hai aur time management improve hoti hai.\n`;
    text += `• Weekly mock tests, fir weak areas analysis — yeh cycle repeat karo.\n\n`;
  }
  if (sp.some(s => /physical|PET|fitness|running/i.test(s))) {
    text += `🏃 Physical Test:\n`;
    text += `• Running time target achieve karne ke liye abhi se daily practice shuru karo — last month mein body adapt nahi hoti.\n`;
    text += `• Standard: 1600m run ke liye 6-7 min target typical hai, lekin notification se confirm karo.\n\n`;
  }
  if (sp.some(s => /typing/i.test(s))) {
    text += `⌨️ Typing Test:\n`;
    text += `• Required WPM se 10-15 WPM zyada speed target karo — exam day nervousness se speed naturally 10% drop hoti hai.\n`;
    text += `• Accuracy typing speed se zyada important hai — errors se effective WPM niche aata hai.\n\n`;
  }
  if (sp.some(s => /interview|viva/i.test(s))) {
    text += `🎙️ Interview:\n`;
    text += `• ${ca} ke history aur current work ke baare mein basic research zaroor karo.\n`;
    text += `• "Tell me about yourself" ka structured 2-minute answer ready karo.\n`;
    text += `• Pehle 3 months ke current affairs regularly padhna shuru karo.\n\n`;
  }
  text += `📌 Universal Tips: Negative marking wale exam mein 60-70% attempts karo — sab guess karna score gira deta hai. Consistent 45-50 days preparation > last 2 weeks crash course.`;
  return text;
}

function genDatesTimeline(p) {
  const d = p.dates;
  if (!d) return null;
  const hasDates = d.applyStart || d.applyEnd || d.examDate || d.admitCard;
  if (!hasDates) return null;
  const tips = [];
  if (d.applyEnd || d.regLastDate) tips.push(`• Last date se 2-3 din pehle apply karo — deadline ke din server crash hota hai aur payment fail ho jaati hai.`);
  if (d.feeLastDate) tips.push(`• Fee payment ki deadline alag hoti hai — form submit karne ke BAAD bhi fee payment karna zaroori hai, warna form reject hoga.`);
  if (d.correctionDate) tips.push(`• Correction window mein naam, DOB, aur category ek baar zaroor verify karo — yeh galti baad mein fix nahi hoti.`);
  if (d.admitCard) tips.push(`• Admit card release ke din hi download karo aur colour printout nikaalo — exam ke din website bandwidth issue karti hai.`);
  tips.push(`• Sabhi dates apne phone calendar mein reminder set karke save karo — notification band mat rakho.`);
  tips.push(`• Result ke baad doosre recruitments ki taiyari bhi chalate raho — sirf ek exam par depend nahi rehna chahiye.`);
  return tips.join("\n");
}

function genSalaryBenefits(p) {
  if (!p.salary) return null;
  const ca = p.conductingAuthority || p.shortTitle;
  const st = p.state || "is state";
  return `${ca} mein job milne par salary ${p.salary} milegi. ` +
    `Lekin yeh sirf basic pay hai — government job ka asli financial benefit allowances mein hota hai. ` +
    `Dearness Allowance (DA) inflation ke saath har 6 mahine update hota hai — ` +
    `iska matlab salary automatically badhti rehti hai bina promotion ke. ` +
    `House Rent Allowance (HRA) city ke tier ke hisaab se 8-24% basic pay tak hota hai. ` +
    `Medical reimbursement, Leave Travel Concession (LTC), ` +
    `aur ${st} mein state-specific allowances bhi milte hain jo total in-hand amount significantly badhate hain. ` +
    `Job security itni strong hai ki apni marzi ke bina kisi ko nikaala nahi ja sakta — ` +
    `yeh private sector mein possible hi nahi hai. ` +
    `Annual increment guaranteed hai, aur performance-based fast-track promotions bhi hote hain. ` +
    `Retirement ke baad pension milti hai jo lifelong financial security deti hai. ` +
    `Total package compare karo to same qualification ke liye private sector se kaafi zyada value milti hai — ` +
    `isliye is mauke ko seriously lo aur poori preparation karo.`;
}

function genExpertFaq(p) {
  const ca = p.conductingAuthority || p.shortTitle || "authority";
  const ld = fmtDate(p.dates?.applyEnd || p.dates?.regLastDate || p.applyLastDate);
  const ed = fmtDate(p.dates?.examDate || p.examDate);
  const generalFee = p.applicationFee?.general;
  const maxAge = p.ageLimit?.max;
  const total = p.totalVacancies;
  const site = p.officialWebsite || "official website";
  const faqs = [];
  if (ld) {
    faqs.push(
      `Q: Online application ki last date kya hai?\n` +
      `A: Last date ${ld} hai — lekin server rush se bachne ke liye 3-4 din pehle apply karna best hai. ` +
      `${ld} ko deadline par site slow ya down ho sakti hai.`
    );
  }
  if (generalFee) {
    faqs.push(
      `Q: Kya application fee refundable hai?\n` +
      `A: Nahi — ek baar pay ki gayi application fee (General: ₹${generalFee}/-) refund nahi hoti. ` +
      `Isliye apply karne se pehle eligibility carefully check karo. ` +
      `Double payment agar ho jaaye to bank ke through dispute raise karo — 7-10 working days mein auto-refund hoti hai.`
    );
  }
  if (maxAge) {
    faqs.push(
      `Q: Kya upper age limit mein relaxation milti hai?\n` +
      `A: Haan — SC/ST: +5 saal, OBC (NCL): +3 saal, PwD: +10 saal, Government employees ke liye bhi relaxation applicable hai. ` +
      `Age cut-off date official notification mein clearly mention hai — usi date se apni DOB calculate karo.`
    );
  }
  if (ed) {
    faqs.push(
      `Q: Exam date kab hai aur admit card kab aayega?\n` +
      `A: Exam ${ed} ko scheduled hai. ` +
      `Admit card exam se generally 10-15 din pehle ${site} par available ho jaata hai. ` +
      `Apna registration number aur DOB saath rakhna — wahi login kaam aata hai admit card download mein.`
    );
  }
  if (total) {
    faqs.push(
      `Q: Total kitni seats hain aur selection chance kitna hai?\n` +
      `A: Total ${total} posts hain. ` +
      `Government bharti mein generally lakho candidates apply karte hain — competition tight hoti hai. ` +
      `Best strategy: consistent daily preparation + previous year papers practice.`
    );
  }
  // fallback from structured FAQ
  if (faqs.length < 2) {
    const structFaq = (p.structured || {}).faq;
    if (structFaq && structFaq.length) {
      structFaq.slice(0, 3 - faqs.length).forEach(f => faqs.push(`Q: ${f.q}\nA: ${f.a}`));
    }
  }
  if (faqs.length < 2) return null;
  return `Expert Answers — ${ca} ke baare mein top questions:\n\n` + faqs.join("\n\n");
}

function genOfficialSourceWarning(p) {
  const site = p.officialWebsite || "official website";
  const ca = p.conductingAuthority || "conducting authority";
  return `${ca} se related updates ke liye sirf ${site} ko trust karo. ` +
    `WhatsApp groups, Telegram channels, aur social media posts mein bahut baar galat exam dates, ` +
    `fake admit card links, aur wrong cut-off lists share hoti hain — unpar act karne se selection cancel ho sakta hai. ` +
    `Kuch websites spoof links share karti hain jo exactly official website jaisi dikhti hain — ` +
    `URL bar mein address zaroor check karo pehle. ` +
    `${ca} kabhi bhi third-party website ya private number se notifications nahi bhejta. ` +
    `Personal information — registration number, password, OTP — ` +
    `kisi ke saath share mat karo, yeh phishing attacks hote hain. ` +
    `Hum bhi apni information directly ${site} se verify karke yahan update karte hain — ` +
    `hum koi fee nahi lete aur sirf verified sources use karte hain. ` +
    `Agar koi news suspicious lage to directly official website check karo — ` +
    `ek minute ka effort aapko bade nuksaan se bacha sakta hai. ` +
    `Recruitment fraud ke cases bhi aate hain — koi agent agar selection guarantee de to woh fraud hai, report karo.`;
}

function genDocumentChecklist(p) {
  const ca = p.conductingAuthority || p.shortTitle;
  const items = [
    "10th marksheet (date of birth proof)",
    "12th ya equivalent certificate + marksheet",
  ];
  const eli = p.eligibility;
  if (eli && eli.some(e => /graduat|degree|b\.?tech|b\.?a|b\.?sc|b\.?com/i.test(e.qualification || ""))) {
    items.push("Graduation degree certificate + all year marksheets");
  }
  items.push("Caste Certificate — SC/ST/OBC ke liye (agar applicable)");
  items.push("Income Certificate — EWS category ke liye");
  if (p.state) items.push(`${p.state} domicile / residence certificate`);
  else items.push("Domicile ya Residence Certificate");
  items.push("Passport size color photos (white background, latest)");
  items.push("Valid Government Photo ID — Aadhaar/PAN/Voter ID");
  if (eli && eli.some(e => /experience|anubhav|work/i.test(e.qualification || ""))) {
    items.push("Experience Certificate (relevant posts ke liye)");
  }
  items.push("Character Certificate (gazetted officer se attested)");
  return `${ca} Document Verification ke liye ready rakhein:\n${items.map((x, i) => `${i + 1}. ${x}`).join("\n")}\n\n` +
    `Originals + self-attested photocopy ka ek complete set banao. ` +
    `Self-attestation mein apna naam, Roll Number, aur date likhna zaroori hota hai. ` +
    `Ek bhi document missing ya expired hua to candidature turant cancel ho sakti hai — ` +
    `is process mein koi second chance nahi milta. ` +
    `OBC ya EWS certificate mein issue date check karo — ` +
    `adhiktar recruitments mein 1 saal purana certificate reject ho jaata hai. ` +
    `Documents ko ek clear plastic folder mein index ke saath arrange karo — ` +
    `verification officer ka kaam asaan hoga aur aapka impression bhi achha padega.`;
}

// ── pageType-specific intro generators ──────────────────────

function genIntroJobPosting(p) {
  const ca = p.conductingAuthorityFull || p.conductingAuthority || "";
  const ld = fmtDate(p.dates?.applyEnd || p.dates?.regLastDate || p.applyLastDate);
  let text = `${ca || p.title} ne official recruitment notification jaari ki hai`;
  if (p.advertisementNumber) text += ` (Advt. No. ${p.advertisementNumber})`;
  text += `. `;
  if (p.totalVacancies) text += `Total ${p.totalVacancies} posts ke liye yeh bharti hogi. `;
  if (ld) text += `Online application ki last date ${ld} hai — deadline miss mat karo. `;
  if (p.officialWebsite) text += `Apply: ${p.officialWebsite}. `;
  if (p.salary) text += `Salary: ${p.salary}. `;
  text += `Jo candidates sarkari naukri ki talash mein hain unke liye yeh ek important mauka hai. ` +
    `Government job sirf salary nahi deti — ` +
    `job security, pension, allowances, aur social respect bhi saath aata hai. ` +
    `Aaj ke competitive market mein yeh package private sector se kaafi better hai. ` +
    `Form bharne se pehle official notification PDF zaroor padhein — ` +
    `eligibility, age limit, selection process aur document list wahan clearly mention hoti hai. ` +
    `Koi bhi step skip mat karo — adhoori information se form reject ho sakta hai ya candidature cancel ho sakti hai baad mein.`;
  return text;
}

function genIntroAdmitCard(p) {
  const ca = p.conductingAuthorityFull || p.conductingAuthority || "";
  const ed = fmtDate(p.dates?.examDate || p.examDate);
  let text = `${ca || p.title} ne admit card jaari kar diya hai. `;
  if (ed) text += `Exam ${ed} ko conduct hogi — isliye aaj hi admit card download karo. `;
  if (p.totalVacancies) text += `${p.totalVacancies} posts ke liye yeh recruitment hai — competition tight hai. `;
  text += `${p.officialWebsite || "Official website"} par apna registration number aur date of birth enter karke download karo. ` +
    `Admit card mein aapka naam, roll number, exam center ka address, reporting time, aur shift detail hogi — ` +
    `inhe carefully verify karo kisi bhi discrepancy ke liye. ` +
    `Agar koi detail galat hai to turant official helpdesk mein contact karo. ` +
    `Admit card ke bina exam hall mein entry nahi milegi — yeh most important document hai. ` +
    `A4 size white paper par print karo — color ya glossy paper ki zaroorat nahi. ` +
    `Ek extra copy rakhna smart hai — original khone par backup kaam aata hai. ` +
    `Exam se ek din pehle center ka address Google Maps par check karo, ` +
    `taaki exam day ki subah koi confusion na ho aur time par pahuncho.`;
  return text;
}

function genIntroResult(p) {
  const ca = p.conductingAuthorityFull || p.conductingAuthority || "";
  let text = `${ca || p.title} ka result aa chuka hai. `;
  if (p.totalVacancies) text += `${p.totalVacancies} posts ke liye exam hua tha. `;
  text += `${p.officialWebsite || "Official website"} par apna roll number enter karke apna result check karo. ` +
    `Result mein aapke marks, rank, aur selection status clearly mention hoga. ` +
    `Agar naam merit list mein hai to document verification ke liye ready rehna — ` +
    `sabhi original certificates aur their self-attested copies ka set taiyar rakho. ` +
    `Agar selection nahi hua to disappointed mat hona — ` +
    `yeh ek exam tha, career nahi. Analyze karo ki kahan kami rahi — ` +
    `accuracy, speed, ya particular section mein — aur next attempt better karo. ` +
    `Qualified candidates ke liye agla step document verification ya physical test hoga — ` +
    `us schedule ke liye ${p.officialWebsite || "official website"} regularly check karte raho.`;
  return text;
}

function genIntroAdmission(p) {
  const ca = p.conductingAuthorityFull || p.conductingAuthority || "";
  const ld = fmtDate(p.dates?.applyEnd || p.dates?.regLastDate || p.applyLastDate);
  let text = `${ca || p.title} ka admission process shuru ho gaya hai. `;
  if (p.totalVacancies) text += `Total ${p.totalVacancies} seats available hain. `;
  if (ld) text += `Registration ki last date ${ld} hai — `;
  text += `jaldi apply karo taaki last minute server issues se bachein. ` +
    `${p.officialWebsite || "Official website"} par jaao, new registration karo, ` +
    `sari details carefully fill karo, documents upload karo, aur fee pay karo. ` +
    `Admission ke baad jo opportunities milti hain — campus placement, alumni network, government tie-ups — ` +
    `woh future career ke liye bahut valuable hain. ` +
    `Scholarship bhi available ho sakti hai — admission ke baad scholarship portal par register zaroor karo. ` +
    `Koi bhi doubt ho to official helpdesk contact number se directly poochho — ` +
    `sarkari institutions generally helpful hote hain aur queries properly address karte hain.`;
  return text;
}

// ── More generators ──────────────────────────────────────────

function genExamDayTips(p) {
  const ed = fmtDate(p.dates?.examDate || p.examDate);
  if (!ed) return null;
  const sp = p.selectionProcess || [];
  const ca = p.conductingAuthority || "Authority";
  let text = `Exam Day Checklist (${ed}):\n` +
    `1. Admit card ka clear printout\n` +
    `2. Original Government Photo ID (Aadhaar/Voter ID)\n` +
    `3. 2-3 Blue aur Black ballpoint pens\n` +
    `4. Transparent water bottle\n` +
    `5. 2 extra passport size photos\n\n` +
    `Reporting time se kam se kam 45 minute pehle center par pahunchein — ` +
    `${ca} ke rules ke mutabik late entry bilkul allow nahi hoti. ` +
    `Mobile phone, Bluetooth device, smart watch, calculator — ` +
    `yeh sab strictly prohibited hain. ` +
    `Exam hall mein entry se pehle frisking hoti hai — ` +
    `metal objects, earrings, heavy jewellery ghar par chhod aao. `;
  if (sp.some(s => /typing/i.test(s))) {
    text += `Typing test wali post ke liye keyboard par fingers ki position aur speed practice exam se ek raat pehle zaroor karo. `;
  }
  text += `Paper mein pehle woh questions solve karo jo confidently aate hain — ` +
    `difficult questions par zyada time waste mat karo. ` +
    `Negative marking hoti hai to guess karne se bachein. ` +
    `Poori taiyari ke saath jaao, calm rahein, aur apna best performance do.`;
  return text;
}

function genCutoffAnalysis(p) {
  if (!p.totalVacancies) return null;
  const ca = p.conductingAuthority || p.shortTitle;
  const vt = (p.structured || {}).vacancyTable;
  let text = `${ca} cutoff analysis — total ${p.totalVacancies} posts ke liye competition ka andaza lagaana zaroori hai. `;
  if (vt && vt.length) {
    const postNames = vt.map(r => r.post).filter(Boolean).slice(0, 3);
    text += `Posts include ${postNames.join(", ")}${vt.length > 3 ? " aur others" : ""}. `;
  }
  text += `General/UR category ka cutoff hamesha sabse upar hota hai kyunki is category mein competition maximum hoti hai. ` +
    `EWS category ka cutoff UR ke kareeb ya thoda niche hota hai. ` +
    `OBC cutoff generally 3-8 marks kam hota hai UR se. ` +
    `SC/ST cutoff sabse niche hota hai lekin passing marks compulsory hain. ` +
    `Target hamesha expected cutoff se 10-15 marks upar rakhno — ` +
    `buffer marks final merit mein fayda dete hain. ` +
    `Previous year ke papers analyze karo — section-wise difficulty aur question pattern samjho. ` +
    `Mock tests mein apna estimated rank check karo taaki real exam se pehle realistic expectation bane. ` +
    `Cutoff predict karna hard hota hai — isliye overconfident na ho aur poori preparation ke saath exam do.`;
  return text;
}

function genHowToApply(p) {
  const site = p.officialWebsite || "official website";
  const fee = p.applicationFee?.general;
  const ld = fmtDate(p.dates?.applyEnd || p.dates?.regLastDate);
  let text = `Step-by-step apply karne ka process:\n` +
    `1. ${site} par jaao\n` +
    `2. 'New Registration' ya 'Apply Online' link dhundho\n` +
    `3. Naam, mobile number, email ID enter karo — yahi login credentials banenge\n` +
    `4. Login karo aur personal details, education details carefully fill karo\n` +
    `5. Photo aur signature scan karke upload karo (correct size aur format mein)\n`;
  if (fee) text += `6. Application fee ${fmtMoney(fee)} online pay karo\n`;
  text += `7. Final submit karo aur acknowledgement page ka printout lo\n\n`;
  if (ld) text += `Deadline: ${ld}. `;
  text += `Photo requirements: white background, JPEG format, recent clicked. ` +
    `Signature: white paper par blue/black pen se, JPEG format. ` +
    `Photo aur signature ka size form par mentioned hoga — exact size maintain karo. ` +
    `Submit karne ke baad koi edit nahi hoti sirf designated correction window mein — ` +
    `isliye pehle sab kuch check karke hi submit karo. ` +
    `Agar form session timeout ho jaaye to logout karke dobara login karo — data save rehta hai.`;
  return text;
}

function genPreparationStrategy(p) {
  const sp = p.selectionProcess || [];
  const ca = p.conductingAuthority || p.shortTitle;
  let text = `${ca} exam ki smart preparation strategy:\n\n` +
    `Pehle official syllabus download karo aur ek realistic study plan banao — syllabus ke bina padhai direction-less hoti hai. `;
  if (sp.some(s => /written|likhit/i.test(s))) {
    text += `Written exam mein GK/GS, Reasoning, Quantitative Aptitude, aur Language common sections hain. ` +
      `In mein se Reasoning aur Math scoring hote hain — inhe daily 1-2 ghante do. `;
  }
  if (sp.some(s => /physical|PET/i.test(s))) {
    text += `Physical test ke liye abhi se running aur fitness routine start karo — last minute mein body prepare nahi hoti. `;
  }
  if (sp.some(s => /typing/i.test(s))) {
    text += `Typing test ke liye daily 30 minute ka dedicated practice — target speed se 10-15 WPM upar achieve karo exam ke liye. `;
  }
  text += `Previous year question papers solve karna compulsory hai — trend samjhoge to marks improve honge. ` +
    `Weekly mock tests do aur performance analyze karo. `;
  if (p.totalVacancies) text += `${p.totalVacancies} posts ke liye competition tough hai — `;
  text += `consistency aur daily practice hi selection ki guarantee deti hai. ` +
    `Distractions kam karo, phone usage time-limit karo, ` +
    `aur study group join karo — group study mein concepts zyada clear hote hain.`;
  return text;
}

function genResultNextSteps(p) {
  const sp = p.selectionProcess;
  if (!sp || sp.length < 2) return null;
  const after = sp.slice(1);
  const ca = p.conductingAuthority || p.shortTitle;
  let text = `${ca} result ke baad aage ka process: ${after.join(" → ")}.\n\n` +
    `Written exam qualify karne ke baad yeh stages clear karne honge. ` +
    `Document Verification (DV) mein original certificates mandatory hain — ` +
    `10th, 12th, graduation, caste certificate, domicile — ek bhi missing hua to candidature cancel. ` +
    `DV mein certificates ki authenticity verify hoti hai — koi bhi forged document mat lagana, ` +
    `yeh criminal offense hai aur permanent ban laga sakta hai. `;
  if (sp.some(s => /medical/i.test(s))) {
    text += `Medical examination mein eyesight, hearing, blood pressure aur general fitness check hogi. ` +
      `Agar koi existing medical condition hai to pehle se doctor se consult karo. `;
  }
  if (sp.some(s => /interview/i.test(s))) {
    text += `Interview ke liye ${ca} ke baare mein research karo, current affairs updated rakho, ` +
      `aur mock interviews karo — confidence aur clarity dono zaroor badhegi. `;
  }
  text += `Joining ke waqt verified document copies submit karni hongi. ` +
    `Process transparent hai — ${p.officialWebsite || "official website"} par merit list aur schedule publish hota hai.`;
  return text;
}

function genAdmissionCounselling(p) {
  const ca = p.conductingAuthority || "authority";
  let text = `${ca} rank-wise counselling conduct karega. ` +
    `Online choice filling process mein aapko preferred colleges aur courses select karne hote hain — ` +
    `yeh step bahut carefully karo kyunki ek baar lock hone ke baad options change nahi hote. ` +
    `Seat allotment ke baad specific deadline mein fee pay karke admission confirm karna hota hai — ` +
    `deadline miss karne par seat next candidate ko chali jaati hai. `;
  if (p.officialWebsite) text += `Counselling schedule aur seat matrix ${p.officialWebsite} par available hoga. `;
  text += `Choice filling mein realistic choices rakho — ` +
    `apni rank ke hisaab se safe, moderate, aur ambitious choices ka mix baithao. ` +
    `Counselling ke dino mein official website regularly check karo — ` +
    `schedule changes bina advance notice ke bhi ho sakte hain. ` +
    `Physical reporting ke liye required documents ka poora set saath lo — ` +
    `original certificates, photos, fee receipt, aur allotment letter. ` +
    `Kisi agent ko fee mat do jo selection guarantee karne ka claim kare — yeh fraud hai.`;
  return text;
}

function genCommonMistakes(p) {
  const ca = p.conductingAuthority || p.shortTitle || "is recruitment";
  const hasTyping = (p.eligibility || []).some(e => /typing/i.test(e.qualification || ""));
  const hasFee = !!(p.applicationFee?.general || p.applicationFee?.sc);
  let text = `${ca} mein common mistakes jo candidates karte hain — aur kaise bachein:\n\n`;
  text += `1. ❌ Galat Photo/Signature Upload: Photo background white nahi hai, ya size requirement match nahi karti. ` +
    `Fix: Form open karne se pehle JPEG photo 20-50KB, signature 10-30KB taiyar rakho.\n\n`;
  text += `2. ❌ Category Mismatch: OBC certificate general ke liye use karna ya SC/ST column mein wrong entry. ` +
    `Fix: Certificate aur form dono mein ek hi category honi chahiye.\n\n`;
  text += `3. ❌ Wrong Date of Birth: 10th marksheet ki DOB se alag date bharna. ` +
    `Fix: Sirf board certificate ki DOB use karo — Aadhaar ya other document nahi.\n\n`;
  if (hasFee) {
    text += `4. ❌ Fee Pay Karna But Form Submit Nahi Karna: Payment hoti hai lekin final Submit button press nahi hota. ` +
      `Fix: Payment ke baad form status check karo — 'Submitted' status confirm hona chahiye.\n\n`;
  }
  if (hasTyping) {
    text += `5. ❌ Typing Certificate Missing Ya Unrecognized Institute: Self-practice ya kisi unrecognized center ka certificate. ` +
      `Fix: Sirf NIELIT, DOEACC, ya state government-recognized institute ka certificate valid hota hai.\n\n`;
  }
  text += `6. ❌ Last Day Par Apply: Server slow, payment gateway timeout. Fix: 3-4 din pehle apply karo.\n\n`;
  text += `7. ❌ Expired Caste/Domicile Certificate: OBC/EWS certificate 1 saal se purana. Fix: Document verification se pehle renewal karo.`;
  return text;
}

function genImportantLinks(p) {
  const links = (p.structured || {}).importantLinks;
  if (!links || links.length < 2) return null;
  const useful = links.filter(l => l.label && l.url).slice(0, 5);
  if (!useful.length) return null;
  const lines = useful.map(l => `• ${l.label}: ${l.url}`);
  return `Important Official Links:\n${lines.join("\n")}\n\n` +
    `In links se directly admit card download, notification PDF, ya result check karna sabse fast aur safe tarika hai. ` +
    `Sirf yahi official links use karo — ` +
    `Google search mein similar naam ki fake websites bhi aa jaati hain jo personal data steal karti hain. ` +
    `URL par dhyan do — official government sites generally .gov.in ya .nic.in par hoti hain. ` +
    `Links bookmark karo taaki bar bar search na karna pade. ` +
    `Agar koi link kaam na kare to browser ki cache clear karke try karo ya incognito mode use karo — ` +
    `peak traffic times mein sites slow hoti hain lekin unavailable nahi rehti.`;
}

// ══════════════════════════════════════════════════════════════
//  GENERATOR REGISTRY
// ══════════════════════════════════════════════════════════════

const GENERATORS = {
  "job-posting": [
    { id: "jp-intro",       type: "introduction",    weight: 10, fn: genIntroJobPosting },
    { id: "jp-vacancy",     type: "vacancy-insight", weight: 9,  fn: genVacancyInsight },
    { id: "jp-who",         type: "who-should-apply",weight: 9,  fn: genWhoShouldApply },
    { id: "jp-fee",         type: "fee-tips",        weight: 8,  fn: genFeeTips },
    { id: "jp-age",         type: "age-info",        weight: 7,  fn: genAgeInfo },
    { id: "jp-strategy",    type: "exam-strategy",   weight: 8,  fn: genExamStrategy },
    { id: "jp-dates",       type: "dates-tips",      weight: 8,  fn: genDatesTimeline },
    { id: "jp-salary",      type: "salary",          weight: 7,  fn: genSalaryBenefits },
    { id: "jp-howto",       type: "how-to",          weight: 9,  fn: genHowToApply },
    { id: "jp-prep",        type: "preparation",     weight: 6,  fn: genPreparationStrategy },
    { id: "jp-docs",        type: "documents",       weight: 7,  fn: genDocumentChecklist },
    { id: "jp-mistakes",    type: "mistakes",        weight: 8,  fn: genCommonMistakes },
    { id: "jp-faq",         type: "expert-faq",      weight: 8,  fn: genExpertFaq },
    { id: "jp-links",       type: "links",           weight: 6,  fn: genImportantLinks },
    { id: "jp-trust",       type: "trust",           weight: 5,  fn: genOfficialSourceWarning },
    { id: "jp-cutoff",      type: "analysis",        weight: 6,  fn: genCutoffAnalysis },
  ],
  "admit-card": [
    { id: "ac-intro",       type: "introduction",    weight: 10, fn: genIntroAdmitCard },
    { id: "ac-dates",       type: "dates-tips",      weight: 9,  fn: genDatesTimeline },
    { id: "ac-examday",     type: "exam-tips",       weight: 9,  fn: genExamDayTips },
    { id: "ac-strategy",    type: "exam-strategy",   weight: 8,  fn: genExamStrategy },
    { id: "ac-vacancy",     type: "vacancy-insight", weight: 7,  fn: genVacancyInsight },
    { id: "ac-age",         type: "age-info",        weight: 5,  fn: genAgeInfo },
    { id: "ac-salary",      type: "salary",          weight: 6,  fn: genSalaryBenefits },
    { id: "ac-prep",        type: "preparation",     weight: 8,  fn: genPreparationStrategy },
    { id: "ac-faq",         type: "expert-faq",      weight: 6,  fn: genExpertFaq },
    { id: "ac-docs",        type: "documents",       weight: 6,  fn: genDocumentChecklist },
    { id: "ac-trust",       type: "trust",           weight: 7,  fn: genOfficialSourceWarning },
    { id: "ac-cutoff",      type: "analysis",        weight: 5,  fn: genCutoffAnalysis },
  ],
  "result": [
    { id: "rs-intro",       type: "introduction",    weight: 10, fn: genIntroResult },
    { id: "rs-next",        type: "exam-strategy",   weight: 9,  fn: genResultNextSteps },
    { id: "rs-vacancy",     type: "vacancy-insight", weight: 7,  fn: genVacancyInsight },
    { id: "rs-cutoff",      type: "analysis",        weight: 8,  fn: genCutoffAnalysis },
    { id: "rs-salary",      type: "salary",          weight: 7,  fn: genSalaryBenefits },
    { id: "rs-docs",        type: "documents",       weight: 9,  fn: genDocumentChecklist },
    { id: "rs-dates",       type: "dates-tips",      weight: 6,  fn: genDatesTimeline },
    { id: "rs-faq",         type: "expert-faq",      weight: 6,  fn: genExpertFaq },
    { id: "rs-links",       type: "links",           weight: 5,  fn: genImportantLinks },
    { id: "rs-trust",       type: "trust",           weight: 7,  fn: genOfficialSourceWarning },
    { id: "rs-who",         type: "who-should-apply",weight: 5,  fn: genWhoShouldApply },
  ],
  "admission": [
    { id: "ad-intro",       type: "introduction",    weight: 10, fn: genIntroAdmission },
    { id: "ad-who",         type: "who-should-apply",weight: 9,  fn: genWhoShouldApply },
    { id: "ad-fee",         type: "fee-tips",        weight: 8,  fn: genFeeTips },
    { id: "ad-dates",       type: "dates-tips",      weight: 8,  fn: genDatesTimeline },
    { id: "ad-vacancy",     type: "vacancy-insight", weight: 7,  fn: genVacancyInsight },
    { id: "ad-age",         type: "age-info",        weight: 7,  fn: genAgeInfo },
    { id: "ad-strategy",    type: "exam-strategy",   weight: 8,  fn: genExamStrategy },
    { id: "ad-counsel",     type: "counselling",     weight: 8,  fn: genAdmissionCounselling },
    { id: "ad-howto",       type: "how-to",          weight: 9,  fn: genHowToApply },
    { id: "ad-docs",        type: "documents",       weight: 7,  fn: genDocumentChecklist },
    { id: "ad-mistakes",    type: "mistakes",        weight: 7,  fn: genCommonMistakes },
    { id: "ad-faq",         type: "expert-faq",      weight: 6,  fn: genExpertFaq },
    { id: "ad-links",       type: "links",           weight: 5,  fn: genImportantLinks },
    { id: "ad-trust",       type: "trust",           weight: 5,  fn: genOfficialSourceWarning },
  ],
};

// ══════════════════════════════════════════════════════════════
//  calcCompletenessScore — recalculate on every save
// ══════════════════════════════════════════════════════════════

function calcCompletenessScore(post) {
  const checks = [
    { pass: !!post.title,                                                                  points: 10 },
    { pass: !!post.slug,                                                                   points: 10 },
    { pass: !!post.seo?.metaDescription,                                                   points: 10 },
    { pass: !!post.conductingAuthority,                                                    points: 10 },
    { pass: !!post.totalVacancies,                                                         points: 10 },
    { pass: Object.keys(post.scrapedContent?.contentJson?.importantDates || {}).length > 0, points: 10 },
    { pass: (post.structured?.vacancyTable || []).length > 0,                              points: 10 },
    { pass: (post.structured?.faq || []).length >= 3,                                      points: 10 },
    { pass: (post.eligibility || []).length > 0,                                           points: 10 },
    { pass: (post.humanContent?.wordCount || 0) >= 500,                                    points: 10 },
  ];
  return checks.reduce((sum, c) => sum + (c.pass ? c.points : 0), 0);
}

// ══════════════════════════════════════════════════════════════
//  MAIN API
// ══════════════════════════════════════════════════════════════

function pickAndInject(post, blockCount = 4) {
  const pt = post.pageType || "job-posting";
  const gens = GENERATORS[pt] || GENERATORS["job-posting"];
  const seed = post._id ? String(post._id) : post.slug || post.title;

  const available = [];
  for (const g of gens) {
    try {
      const content = g.fn(post);
      if (content && content.trim().length > 40) {
        available.push({ ...g, content });
      }
    } catch (_) { /* skip broken generator */ }
  }

  if (!available.length) return null;

  const selected = pick(available, blockCount, seed);
  const blocks = selected.map((g) => ({
    blockId: g.id,
    type: g.type,
    content: g.content,
  }));

  const wordCount = blocks.reduce((s, b) => s + b.content.split(/\s+/).length, 0);

  return {
    templateId: TEMPLATE_ID,
    templateVersion: TEMPLATE_VERSION,
    seed,
    blocks,
    wordCount,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { pickAndInject, calcCompletenessScore, GENERATORS, TEMPLATE_VERSION };
