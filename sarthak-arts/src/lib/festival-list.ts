import type { FestivalRule } from "@/lib/panchang/festivals";

/**
 * The master festival calendar. The nightly job (src/lib/festival-refresh.ts)
 * keeps one row per festival in the database, dated to its next occurrence.
 * To add a festival, add a line here — it appears automatically after the next run.
 *
 * Months are North-Indian (pūrṇimānta), as published by Drik Panchang.
 * `basis` = when the tithi must prevail: sunrise (udaya tithi), midday (default), sunset (pradoṣa).
 */
export type FestivalDef = {
  code: string;
  name: string; nameDeva: string; nameIast: string; tagline: string;
  rule?: FestivalRule;        // lunar festivals
  fixedDate?: string;         // "MM-DD" for solar / fixed-date festivals
  regions?: string[];         // default: all
  productSlugs?: string[];
};

type Paksha = "śukla" | "kṛṣṇa";
const L = (code: string, name: string, nameDeva: string, nameIast: string, tagline: string,
  masa: string, paksha: Paksha, tithi: string, basis?: FestivalRule["basis"], regions?: string[]): FestivalDef =>
  ({ code, name, nameDeva, nameIast, tagline, rule: { masa, paksha, tithi, ...(basis ? { basis } : {}) }, regions });
const F = (code: string, name: string, nameDeva: string, nameIast: string, tagline: string, fixedDate: string, regions?: string[]): FestivalDef =>
  ({ code, name, nameDeva, nameIast, tagline, fixedDate, regions });

const N = ["north"];

export const FESTIVALS: FestivalDef[] = [
  // ── Solar / fixed-date ──
  F("lohri", "Lohri", "लोहड़ी", "Lohṛī", "the bonfire of the harvest", "01-13", N),
  F("makar-sankranti", "Makar Sankranti", "मकर संक्रांति", "Makara Saṅkrānti", "the sun turns north", "01-14"),
  F("pongal", "Pongal", "பொங்கல்", "Poṅgal", "the harvest thanksgiving", "01-14", ["south"]),
  F("baisakhi", "Baisakhi", "बैसाखी", "Vaiśākhī", "the harvest new year", "04-14", N),

  // ── Caitra ──
  L("ugadi", "Ugadi / Gudi Padwa", "गुड़ी पड़वा", "Yugādi", "the Hindu new year", "Caitra", "śukla", "Pratipadā", "sunrise"),
  L("chaitra-navratri", "Chaitra Navratri (Day 1)", "चैत्र नवरात्रि", "Caitra Navarātri", "nine nights of the Goddess", "Caitra", "śukla", "Pratipadā", "sunrise"),
  L("ram-navami", "Ram Navami", "राम नवमी", "Rāma Navamī", "the birth of Rāma", "Caitra", "śukla", "Navamī"),
  L("hanuman-jayanti", "Hanuman Jayanti", "हनुमान जयंती", "Hanumān Jayantī", "the birth of Hanumān", "Caitra", "śukla", "Pūrṇimā", "sunrise"),
  // ── Vaiśākha ──
  L("akshaya-tritiya", "Akshaya Tritiya", "अक्षय तृतीया", "Akṣaya Tṛtīyā", "the day of unending merit", "Vaiśākha", "śukla", "Tṛtīyā", "sunrise"),
  L("buddha-purnima", "Buddha Purnima", "बुद्ध पूर्णिमा", "Buddha Pūrṇimā", "the enlightened one", "Vaiśākha", "śukla", "Pūrṇimā", "sunrise"),
  // ── Jyeṣṭha ──
  L("vat-savitri", "Vat Savitri", "वट सावित्री", "Vaṭa Sāvitrī", "a vow beneath the banyan", "Jyeṣṭha", "kṛṣṇa", "Amāvāsyā", "sunrise", N),
  L("ganga-dussehra", "Ganga Dussehra", "गंगा दशहरा", "Gaṅgā Daśaharā", "the descent of the Gaṅgā", "Jyeṣṭha", "śukla", "Daśamī", "sunrise"),
  L("nirjala-ekadashi", "Nirjala Ekadashi", "निर्जला एकादशी", "Nirjalā Ekādaśī", "the waterless fast", "Jyeṣṭha", "śukla", "Ekādaśī", "sunrise"),
  // ── Āṣāḍha ──
  L("rath-yatra", "Rath Yatra", "रथ यात्रा", "Ratha Yātrā", "Jagannātha's chariot", "Āṣāḍha", "śukla", "Dvitīyā", "sunrise"),
  L("devshayani-ekadashi", "Devshayani Ekadashi", "देवशयनी एकादशी", "Devaśayanī Ekādaśī", "Viṣṇu's cosmic sleep begins", "Āṣāḍha", "śukla", "Ekādaśī", "sunrise"),
  { ...L("guru-purnima", "Guru Purnima", "गुरु पूर्णिमा", "Guru Pūrṇimā", "honouring the teacher", "Āṣāḍha", "śukla", "Pūrṇimā"), productSlugs: ["silver-sri-yantra-plate", "brass-ashtadhatu-pyramid"] },
  // ── Śrāvaṇa ──
  L("hariyali-teej", "Hariyali Teej", "हरियाली तीज", "Hariyālī Tīj", "the green festival of Pārvatī", "Śrāvaṇa", "śukla", "Tṛtīyā", "sunrise", N),
  L("nag-panchami", "Nag Panchami", "नाग पंचमी", "Nāga Pañcamī", "honouring the serpents", "Śrāvaṇa", "śukla", "Pañcamī", "sunrise"),
  { ...L("raksha-bandhan", "Raksha Bandhan", "रक्षा बन्धन", "Rakṣā Bandhana", "the tie of protection", "Śrāvaṇa", "śukla", "Pūrṇimā"), productSlugs: ["ashtalakshmi-brass-kalash", "silver-sri-yantra-plate"] },
  // ── Bhādrapada ──
  { ...L("janmashtami", "Krishna Janmashtami", "जन्माष्टमी", "Janmāṣṭamī", "the birth of Kṛṣṇa", "Bhādrapada", "kṛṣṇa", "Aṣṭamī"), productSlugs: ["silver-sri-yantra-plate"] },
  L("hartalika-teej", "Hartalika Teej", "हरतालिका तीज", "Haritālikā Tīj", "Pārvatī's devotion", "Bhādrapada", "śukla", "Tṛtīyā", "sunrise", N),
  { ...L("ganesh-chaturthi", "Ganesh Chaturthi", "गणेश चतुर्थी", "Gaṇeśa Caturthī", "the arrival of Gaṇeśa", "Bhādrapada", "śukla", "Caturthī"), productSlugs: ["brass-ashtadhatu-pyramid"] },
  L("anant-chaturdashi", "Anant Chaturdashi", "अनंत चतुर्दशी", "Ananta Caturdaśī", "Gaṇeśa's farewell", "Bhādrapada", "śukla", "Caturdaśī", "sunrise"),
  // ── Āśvina ──
  L("sharad-navratri", "Śāradīya Navrātri (Day 1)", "शारदीय नवरात्रि", "Śāradīya Navarātri", "nine nights of the Goddess", "Āśvina", "śukla", "Pratipadā"),
  L("durga-ashtami", "Durga Ashtami", "दुर्गा अष्टमी", "Durgā Aṣṭamī", "the Goddess triumphant", "Āśvina", "śukla", "Aṣṭamī"),
  L("maha-navami", "Maha Navami", "महानवमी", "Mahā Navamī", "the ninth night", "Āśvina", "śukla", "Navamī"),
  L("dussehra", "Dussehra", "विजयादशमी", "Vijayādaśamī", "the victory of dharma", "Āśvina", "śukla", "Daśamī", "sunset"),
  L("sharad-purnima", "Sharad Purnima", "शरद पूर्णिमा", "Śarad Pūrṇimā", "the moon of abundance", "Āśvina", "śukla", "Pūrṇimā", "sunset"),
  // ── Kārtika ──
  L("karwa-chauth", "Karwa Chauth", "करवा चौथ", "Karvā Cauth", "a vow for the household", "Kārtika", "kṛṣṇa", "Caturthī", "sunset", N),
  L("dhanteras", "Dhanteras", "धनतेरस", "Dhanatrayodaśī", "welcoming wealth and metal home", "Kārtika", "kṛṣṇa", "Trayodaśī", "sunset"),
  L("naraka-chaturdashi", "Choti Diwali", "नरक चतुर्दशी", "Naraka Caturdaśī", "the eve of lights", "Kārtika", "kṛṣṇa", "Caturdaśī", "sunrise"),
  { ...L("diwali", "Deepāvalī", "दीपावली", "Deepāvalī", "the festival of lights", "Kārtika", "kṛṣṇa", "Amāvāsyā", "sunset"), productSlugs: ["ashtalakshmi-brass-kalash", "silver-sri-yantra-plate", "gold-accent-om-wall-panel"] },
  L("govardhan-puja", "Govardhan Puja", "गोवर्धन पूजा", "Govardhana Pūjā", "the mountain that sheltered Gokul", "Kārtika", "śukla", "Pratipadā", "sunrise"),
  L("bhai-dooj", "Bhai Dooj", "भाई दूज", "Bhrātṛ Dvitīyā", "the bond of siblings", "Kārtika", "śukla", "Dvitīyā"),
  L("chhath", "Chhath Puja", "छठ पूजा", "Chaṭh Pūjā", "offering to the setting sun", "Kārtika", "śukla", "Ṣaṣṭhī", undefined, N),
  L("dev-uthani-ekadashi", "Dev Uthani Ekadashi", "देवउठनी एकादशी", "Devotthānī Ekādaśī", "Viṣṇu awakens", "Kārtika", "śukla", "Ekādaśī"),
  L("kartik-purnima", "Kartik Purnima / Dev Deepawali", "देव दीपावली", "Kārtika Pūrṇimā", "the gods' festival of lights", "Kārtika", "śukla", "Pūrṇimā", "sunset"),
  // ── Mārgaśīrṣa ──
  L("gita-jayanti", "Gita Jayanti", "गीता जयंती", "Gītā Jayantī", "the day the Gītā was spoken", "Mārgaśīrṣa", "śukla", "Ekādaśī", "sunrise"),
  // ── Māgha ──
  L("mauni-amavasya", "Mauni Amavasya", "मौनी अमावस्या", "Mauni Amāvasyā", "the day of silence", "Māgha", "kṛṣṇa", "Amāvāsyā", "sunrise"),
  L("vasant-panchami", "Vasant Panchami", "वसंत पंचमी", "Vasanta Pañcamī", "honouring Sarasvatī", "Māgha", "śukla", "Pañcamī"),
  // ── Phālguna ──
  L("maha-shivratri", "Maha Shivratri", "महाशिवरात्रि", "Mahāśivarātri", "the great night of Śiva", "Phālguna", "kṛṣṇa", "Caturdaśī", "sunset"),
  L("holika-dahan", "Holika Dahan", "होलिका दहन", "Holikā Dahana", "the bonfire before Holī", "Phālguna", "śukla", "Pūrṇimā", "sunset"),
  L("holi", "Holi", "होली", "Holī", "the festival of colours", "Caitra", "kṛṣṇa", "Pratipadā", "sunset"),
];
