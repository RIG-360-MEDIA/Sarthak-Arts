import type { PrismaClient } from "@prisma/client";
import { findFestivalDate, type FestivalRule } from "../src/lib/panchang/festivals";

/**
 * Festivals shown on the homepage ("Next festival"). Each date is computed from
 * its tithi rule by the panchang engine (next occurrence from today), then saved.
 * Re-run yearly — or after adding a festival — with `npm run db:festivals`.
 * Only touches the Festival table.
 */
type FestSeed = {
  codeBase: string;
  name: string; nameDeva: string; nameIast: string; tagline: string;
  rule: FestivalRule;
  regions: string[]; productSlugs: string[];
  source: string;
};

export const FESTIVALS: FestSeed[] = [
    {
      codeBase: "guru-purnima", name: "Guru Purnima",
      nameDeva: "गुरु पूर्णिमा", nameIast: "Guru Pūrṇimā",
      tagline: "honouring the teacher",
      rule: { masa: "Āṣāḍha", tithi: "Pūrṇimā", paksha: "śukla" },
      regions: ["north", "south", "bengali", "gaudiya"],
      productSlugs: ["silver-sri-yantra-plate", "brass-ashtadhatu-pyramid"],
      source: "Purāṇic + Pañcarātra tradition · engine-computed, human-verify before publish",
    },
    {
      codeBase: "raksha-bandhan", name: "Raksha Bandhan",
      nameDeva: "रक्षा बन्धन", nameIast: "Rakṣā Bandhana",
      tagline: "the tie of protection",
      rule: { masa: "Śrāvaṇa", tithi: "Pūrṇimā", paksha: "śukla" },
      regions: ["north", "south", "bengali", "gaudiya"],
      productSlugs: ["ashtalakshmi-brass-kalash", "silver-sri-yantra-plate"],
      source: "Bhaviṣya Purāṇa · engine-computed, human-verify before publish",
    },
    {
      codeBase: "janmashtami", name: "Krishna Janmashtami",
      nameDeva: "जन्माष्टमी", nameIast: "Janmāṣṭamī",
      tagline: "the birth of Kṛṣṇa",
      rule: { masa: "Bhādrapada", tithi: "Aṣṭamī", paksha: "kṛṣṇa" },
      regions: ["north", "south", "bengali", "gaudiya"],
      productSlugs: ["silver-sri-yantra-plate"],
      source: "Śrīmad Bhāgavatam 10.3 · engine-computed, human-verify before publish",
    },
    {
      codeBase: "ganesh-chaturthi", name: "Ganesh Chaturthi",
      nameDeva: "गणेश चतुर्थी", nameIast: "Gaṇeśa Caturthī",
      tagline: "the arrival of Ganesha",
      rule: { masa: "Bhādrapada", tithi: "Caturthī", paksha: "śukla" },
      regions: ["north", "south"],
      productSlugs: ["brass-ashtadhatu-pyramid"],
      source: "Gaṇeśa Purāṇa · engine-computed, human-verify before publish",
    },
    {
      codeBase: "sharad-navratri", name: "Śāradīya Navrātri (Day 1)",
      nameDeva: "शारदीय नवरात्रि", nameIast: "Śāradīya Navarātri",
      tagline: "the nine nights of the Devī",
      rule: { masa: "Āśvina", tithi: "Pratipadā", paksha: "śukla" },
      regions: ["north", "south", "bengali"],
      productSlugs: ["ashtalakshmi-brass-kalash"],
      source: "Devī Māhātmya · engine-computed, human-verify before publish",
    },
    {
      codeBase: "diwali", name: "Deepāvalī",
      nameDeva: "दीपावली", nameIast: "Deepāvalī",
      tagline: "the festival of lights",
      rule: { masa: "Kārtika", tithi: "Amāvāsyā", paksha: "kṛṣṇa", basis: "sunset" },
      regions: ["north", "south", "bengali", "gaudiya"],
      productSlugs: ["ashtalakshmi-brass-kalash", "silver-sri-yantra-plate", "gold-accent-om-wall-panel"],
      source: "Padma Purāṇa · engine-computed, human-verify before publish",
    },
    {
      codeBase: "sharad-purnima", name: "Sharad Purnima",
      nameDeva: "शरद पूर्णिमा", nameIast: "Śarad Pūrṇimā",
      tagline: "the moon of abundance",
      rule: { masa: "Āśvina", tithi: "Pūrṇimā", paksha: "śukla", basis: "sunset" },
      regions: ["north", "south", "bengali", "gaudiya"],
      productSlugs: [],
      source: "Kojāgarī Lakṣmī vrata · engine-computed, human-verify before publish",
    },
    {
      codeBase: "dussehra", name: "Dussehra",
      nameDeva: "विजयादशमी", nameIast: "Vijayādaśamī",
      tagline: "the victory of dharma",
      rule: { masa: "Āśvina", tithi: "Daśamī", paksha: "śukla", basis: "sunset" },
      regions: ["north", "south", "bengali", "gaudiya"],
      productSlugs: [],
      source: "Rāmāyaṇa · Devī Māhātmya · engine-computed, human-verify before publish",
    },
    {
      codeBase: "karwa-chauth", name: "Karwa Chauth",
      nameDeva: "करवा चौथ", nameIast: "Karvā Cauth",
      tagline: "a vow for the household",
      rule: { masa: "Kārtika", tithi: "Caturthī", paksha: "kṛṣṇa", basis: "sunset" },
      regions: ["north"],
      productSlugs: [],
      source: "North-Indian vrata tradition · engine-computed, human-verify before publish",
    },
    {
      codeBase: "dhanteras", name: "Dhanteras",
      nameDeva: "धनतेरस", nameIast: "Dhanatrayodaśī",
      tagline: "welcoming wealth and metal home",
      rule: { masa: "Kārtika", tithi: "Trayodaśī", paksha: "kṛṣṇa", basis: "sunset" },
      regions: ["north", "south", "bengali", "gaudiya"],
      productSlugs: [],
      source: "Skanda Purāṇa · engine-computed, human-verify before publish",
    },
    {
      codeBase: "bhai-dooj", name: "Bhai Dooj",
      nameDeva: "भाई दूज", nameIast: "Bhrātṛ Dvitīyā",
      tagline: "the bond of siblings",
      rule: { masa: "Kārtika", tithi: "Dvitīyā", paksha: "śukla" },
      regions: ["north", "south", "bengali", "gaudiya"],
      productSlugs: [],
      source: "Yama Dvitīyā tradition · engine-computed, human-verify before publish",
    },
    {
      codeBase: "chhath", name: "Chhath Puja",
      nameDeva: "छठ पूजा", nameIast: "Chaṭh Pūjā",
      tagline: "offering to the setting sun",
      rule: { masa: "Kārtika", tithi: "Ṣaṣṭhī", paksha: "śukla" },
      regions: ["north"],
      productSlugs: [],
      source: "Sūrya Ṣaṣṭhī tradition · engine-computed, human-verify before publish",
    },
    {
      codeBase: "dev-uthani-ekadashi", name: "Dev Uthani Ekadashi",
      nameDeva: "देवउठनी एकादशी", nameIast: "Devotthānī Ekādaśī",
      tagline: "Viṣṇu awakens",
      rule: { masa: "Kārtika", tithi: "Ekādaśī", paksha: "śukla" },
      regions: ["north", "south", "bengali", "gaudiya"],
      productSlugs: [],
      source: "Padma Purāṇa · engine-computed, human-verify before publish",
    },
    {
      codeBase: "vasant-panchami", name: "Vasant Panchami",
      nameDeva: "वसंत पंचमी", nameIast: "Vasanta Pañcamī",
      tagline: "honouring Sarasvatī",
      rule: { masa: "Māgha", tithi: "Pañcamī", paksha: "śukla" },
      regions: ["north", "south", "bengali", "gaudiya"],
      productSlugs: [],
      source: "Sarasvatī pūjā tradition · engine-computed, human-verify before publish",
    },
    {
      codeBase: "maha-shivratri", name: "Maha Shivratri",
      nameDeva: "महाशिवरात्रि", nameIast: "Mahāśivarātri",
      tagline: "the great night of Śiva",
      rule: { masa: "Phālguna", tithi: "Caturdaśī", paksha: "kṛṣṇa", basis: "sunset" },
      regions: ["north", "south", "bengali", "gaudiya"],
      productSlugs: [],
      source: "Śiva Purāṇa · engine-computed, human-verify before publish",
    },
    {
      codeBase: "holi", name: "Holika Dahan",
      nameDeva: "होलिका दहन", nameIast: "Holikā Dahana",
      tagline: "the bonfire before Holī",
      rule: { masa: "Phālguna", tithi: "Pūrṇimā", paksha: "śukla", basis: "sunset" },
      regions: ["north", "south", "bengali", "gaudiya"],
      productSlugs: [],
      source: "Bhāgavata Purāṇa (Prahlāda) · engine-computed, human-verify before publish",
    },
    {
      codeBase: "ram-navami", name: "Ram Navami",
      nameDeva: "राम नवमी", nameIast: "Rāma Navamī",
      tagline: "the birth of Rāma",
      rule: { masa: "Caitra", tithi: "Navamī", paksha: "śukla" },
      regions: ["north", "south", "bengali", "gaudiya"],
      productSlugs: [],
      source: "Rāmāyaṇa · engine-computed, human-verify before publish",
    },
    {
      codeBase: "hanuman-jayanti", name: "Hanuman Jayanti",
      nameDeva: "हनुमान जयंती", nameIast: "Hanumān Jayantī",
      tagline: "the birth of Hanumān",
      rule: { masa: "Caitra", tithi: "Pūrṇimā", paksha: "śukla" },
      regions: ["north", "south", "bengali", "gaudiya"],
      productSlugs: [],
      source: "North-Indian tradition · engine-computed, human-verify before publish",
    },
    {
      codeBase: "akshaya-tritiya", name: "Akshaya Tritiya",
      nameDeva: "अक्षय तृतीया", nameIast: "Akṣaya Tṛtīyā",
      tagline: "the day of unending merit",
      rule: { masa: "Vaiśākha", tithi: "Tṛtīyā", paksha: "śukla", basis: "sunrise" },
      regions: ["north", "south", "bengali", "gaudiya"],
      productSlugs: [],
      source: "Bhaviṣya Purāṇa · engine-computed, human-verify before publish",
    },
];

export async function seedFestivals(db: PrismaClient): Promise<void> {
  const now = new Date();
  for (const f of FESTIVALS) {
    const date = findFestivalDate(f.rule, now, "delhi");
    if (!date) {
      console.warn(`  ✗ ${f.name}: engine could not find a date for its rule — skipping.`);
      continue;
    }
    const code = `${f.codeBase}-${date.getUTCFullYear()}`;
    const data = {
      observedOn: date, name: f.name, nameDeva: f.nameDeva, nameIast: f.nameIast,
      tagline: f.tagline, masaIast: f.rule.masa, tithiIast: f.rule.tithi, paksha: f.rule.paksha,
      regions: f.regions, productSlugs: f.productSlugs, source: f.source,
    };
    await db.festival.upsert({ where: { code }, update: data, create: { code, ...data } });
    const dateStr = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
    console.log(`  ✓ ${f.nameIast.padEnd(24)} → ${dateStr}`);
  }
}
