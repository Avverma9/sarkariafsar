import PortalApp from "./component/PortalApp";
import { buildPageMetadata } from "./lib/seo";

export const metadata = buildPageMetadata({
  title: "SarkariAfsar - Home",
  description:
    "Sarkari jobs, results, admit cards aur pramukh yojnayein. Real-time search ke saath latest updates dekhein.",
  path: "/",
  keywords: [
    "latest sarkari jobs 2026",
    "new govt job vacancies",
    "sarkari college admissions 2026",
    "sarkari exam results 2026",
    "admit card download online",
    "latest sarkari yojana 2026 list",

    "ayushman bharat yojana apply online",
    "pm jay ayushman card download",
    "pan card apply online 2026",
    "aadhaar card new enrollment update",
    "ignoaps vridha pension yojana apply",
    "caste certificate jati pramaan patra online",
    "residential domicile certificate apply",
    "income certificate aay pramaan patra",
    "udid card viklang certificate online",
    "jeevan pramaan digital life certificate",
    "igndps viklang pension scheme apply",

    "e kalyan jharkhand scholarship 2026",
    "jharkhand abua awas yojana list",
    "mukhyamantri maiyya samman yojana jharkhand",
    "savitribai phule kishori samridhi yojana",
    "jharkhand guruji student credit card scheme",
    "jharkhand 200 unit free electricity scheme",
    "mukhyamantri rozgar srijan yojana jharkhand",

    "up kanya sumangala yojana online apply",
    "up free smartphone tablet yojana digishakti",
    "up free scooty rani laxmibai yojana",
    "vishwakarma shram samman yojana up",
    "up ganna parchi calendar online",
    "up bc sakhi yojana registration",
    "mukhyamantri samuhik vivah yojana up",
    "up divyang pension yojana status",
    "up vridhavastha pension yojana 2026",
    "mukhyamantri yuva swarozgar yojana up",

    "bihar student credit card yojana apply",
    "mukhyamantri kanya utthan yojana bihar",
    "bihar post matric scholarship 2026",
    "mukhyamantri udyami yojana bihar online",
    "har ghar nal ka jal yojana bihar",
    "bihar krishi yantra subsidy yojana",
    "mukhyamantri gram parivahan yojana bihar",
    "bihar rajya fasal sahayata yojana online",
    "bihar murgi palan poultry farm subsidy",
    "mukhyamantri vriddhjan pension yojana bihar",

    "gujarat ration card nfsa list",
    "ma vatsalya yojana gujarat hospital list",
    "mukhyamantri amrutum ma yojana gujarat",
    "i khedut portal gujarat scheme apply",
    "gujarat vruddha pension yojana online",
    "kuvarbai nu mameru yojana gujarat",
    "gujarat vidhva sahay yojana application",
    "digital gujarat scholarship 2026",
    "mukhyamantri kisan sahay yojana gujarat",
    "shramik parivahan yojana gujarat",

    "jee mains session 2 online form 2026",
    "nta cuet ug 2026 apply online",
    "nta cuet pg 2026 notification",
    "up polytechnic jeecup online form 2026",
    "ctet february 2026 application form",
    "bcece online mop up counselling 2025",
    "updeled 2024 online counseling",

    "railway rrb alp revised exam date 2026",
    "rrb ntpc graduate level admit card 2026",
    "railway rrb technician exam date 2026",
    "rrb junior engineer je application status",
    "rrb paramedical staff exam date 2026",

    "ssc exam calendar 2026-27 download",
    "ssc stenographer skill test exam city",
    "ssc junior engineer je option form",
    "upsc civil services ias 2026 online form",
    "upsc nda na 1 exam date 2026",
    "upsc cds 1 exam date 2026",

    "up police si exam date 2025 2026",
    "up police si asi typing test date",
    "bpsc 71th mains exam date 2026",
    "bpsc 70th interview letter download",
    "bihar police driver pet exam date",
    "bpssc bihar police enforcement exam",
    "jharkhand jssc anm recruitment 2025",

    "bihar board 10th 12th time table 2026",
    "cbse board 10th 12th exam date sheet 2026",
    "haryana hbse board 10th 12th time table",
    "rbse class 10th 12th time table 2026"
  ]
  ,
});

export const revalidate = 3600;

export default function Home() {
  return <PortalApp />;
}
