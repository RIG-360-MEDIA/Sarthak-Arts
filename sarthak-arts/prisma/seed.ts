import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const db = new PrismaClient();

async function main() {
  // Demo data (sample products, stock, availability slots, social posts) loads for dev.
  // Production runs with SEED_DEMO=false to seed only reference/config data + logins.
  const demo = process.env.SEED_DEMO !== "false";

  const directions = [
    ["northeast", "Northeast", "Ishanya", "Water", "Clarity, spiritual grounding", "Keep water moving here, and clarity follows.", 1],
    ["north", "North", "Uttara", null, "Wealth, career flow", "The zone most linked to career and cash flow.", 2],
    ["northwest", "Northwest", "Vayavya", "Air", "Support, relationships, movement", "Where support from others either flows or stalls.", 3],
    ["west", "West", "Paschima", "Space", "Gains, creativity", "Govern how gains settle, not just how they arrive.", 4],
    ["southwest", "Southwest", "Nairutya", "Earth", "Stability, relationships", "The anchor corner. Weight goes here, not air.", 5],
    ["south", "South", "Dakshina", "Fire", "Recognition, reputation", "What your home says about you before a guest sits down.", 6],
    ["southeast", "Southeast", "Agneya", "Fire", "Finance, energy, the kitchen", "Fire and finance share a corner. Handle both with care.", 7],
    ["east", "East", "Purva", "Air", "New beginnings, health", "The direction that sets the tone for the rest of the day.", 8],
    ["center", "Center", "Brahmasthan", null, "Balance for every other zone", "The open core of the home. Kept light, kept clear.", 9],
  ] as const;
  for (const [code, name, sanskritName, element, governs, microcopy, displayOrder] of directions)
    await db.direction.upsert({ where: { code }, update: {}, create: { code, name, sanskritName, element, governs, microcopy, displayOrder } });

  for (const [code, name] of [["copper", "Copper"], ["brass", "Brass"], ["silver", "Silver"], ["gold", "Gold"]] as const)
    await db.metal.upsert({ where: { code }, update: {}, create: { code, name } });

  const gems = [
    ["sapphire", "Blue Sapphire", "#2E4A6B"], ["quartz", "Clear Quartz", "#8C8C94"],
    ["ruby", "Ruby", "#7A2E2E"], ["turquoise", "Turquoise", "#2E7A74"], ["amethyst", "Amethyst", "#5B4670"],
  ] as const;
  for (const [code, name, accentHex] of gems)
    await db.gemstone.upsert({ where: { code }, update: {}, create: { code, name, accentHex } });

  await db.category.upsert({ where: { code: "murtis" }, update: {}, create: { code: "murtis", name: "Murtis" } });
  const instruments = await db.category.upsert({ where: { code: "vastu-instruments" }, update: {}, create: { code: "vastu-instruments", name: "Vastu Instruments" } });
  for (const [code, name] of [["kalash", "Kalash"], ["yantra", "Yantra"], ["pyramid", "Pyramid"], ["panel", "Wall Panel"], ["chime", "Wind Chime"]] as const)
    await db.category.upsert({ where: { code }, update: {}, create: { code, name, parentId: instruments.id } });
  for (const [code, name] of [["ganesha", "Ganesha"], ["lakshmi", "Lakshmi"], ["shiva", "Shiva"], ["hanuman", "Hanuman"]] as const)
    await db.deity.upsert({ where: { code }, update: {}, create: { code, name, placementGuidance: "Placement guidance pending from the client's Vastu consultant." } });

  for (const [code, name] of [["wealth", "Wealth"], ["health", "Health"], ["relationships", "Relationships"], ["career", "Career"], ["peace", "Peace"]] as const)
    await db.purpose.upsert({ where: { code }, update: {}, create: { code, name } });

  for (const [code, name, displayOrder] of [
    ["pending_payment", "Pending payment", 0], ["confirmed", "Confirmed", 1], ["packed", "Packed", 2],
    ["shipped", "Shipped", 3], ["delivered", "Delivered", 4], ["cancelled", "Cancelled", 9],
  ] as const)
    await db.orderStatus.upsert({ where: { code }, update: {}, create: { code, name, displayOrder } });

  const currencies = [["INR", "₹", true, 1], ["USD", "$", false, 0.012], ["GBP", "£", false, 0.0095], ["AED", "د.إ", false, 0.044]] as const;
  for (const [code, symbol, isDefault, ratePerBase] of currencies)
    await db.currency.upsert({ where: { code }, update: {}, create: { code, symbol, isDefault, ratePerBase } });

  await db.paymentGateway.upsert({ where: { code: "razorpay" }, update: {}, create: { code: "razorpay", name: "Razorpay", routingRule: { countries: ["IN"] } } });
  await db.paymentGateway.upsert({ where: { code: "stripe" }, update: {}, create: { code: "stripe", name: "Stripe", routingRule: { fallback: true } } });

  const india = await db.shippingZone.upsert({ where: { code: "india" }, update: {}, create: { code: "india", name: "India", countries: ["IN"] } });
  const intl = await db.shippingZone.upsert({ where: { code: "international" }, update: {}, create: { code: "international", name: "International", countries: ["*"] } });
  if (!(await db.shippingRate.findFirst({ where: { zoneId: india.id } })))
    await db.shippingRate.create({ data: { zoneId: india.id, name: "Standard", amountMinor: 15000, freeAboveMinor: 500000 } });
  if (!(await db.shippingRate.findFirst({ where: { zoneId: intl.id } })))
    await db.shippingRate.create({ data: { zoneId: intl.id, name: "International", amountMinor: 250000, freeAboveMinor: null } });

  if (!(await db.taxRule.findFirst({ where: { region: "india" } })))
    await db.taxRule.create({ data: { region: "india", ratePercent: 3 } }); // placeholder — confirm real GST rate with the client
  if (!(await db.taxRule.findFirst({ where: { region: "*" } })))
    await db.taxRule.create({ data: { region: "*", ratePercent: 0 } });

  const settings: [string, unknown][] = [
    ["announcement_lines", [
      "Handcrafted in copper, brass and silver — nothing cast from a mould twice.",
      "Every piece ships with a certificate of composition and a placement guide.",
      "Free Vastu placement consultation with every order over ₹15,000.",
    ]],
    ["consultation_credit_threshold_minor", 1500000],
    ["store_name", "Sarthak Arts"],
    ["low_stock_threshold", 5],
    ["return_window_days", 7],
  ];
  for (const [key, value] of settings)
    await db.setting.upsert({ where: { key }, update: {}, create: { key, value: value as object } });

  const adminRole = await db.role.upsert({ where: { code: "admin" }, update: {}, create: { code: "admin", name: "Admin" } });
  const admin = await db.user.upsert({
    where: { email: process.env.ADMIN_EMAIL ?? "owner@sarthakarts.com" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL ?? "owner@sarthakarts.com",
      name: "Owner",
      passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD ?? "change-me", 10),
    },
  });
  await db.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {}, create: { userId: admin.id, roleId: adminRole.id },
  });

  const m = async (c: string) => (await db.metal.findUniqueOrThrow({ where: { code: c } })).id;
  const g = async (c: string) => (await db.gemstone.findUniqueOrThrow({ where: { code: c } })).id;
  const d = async (c: string) => (await db.direction.findUniqueOrThrow({ where: { code: c } })).id;
  const cat = async (c: string) => (await db.category.findUniqueOrThrow({ where: { code: c } })).id;

  const products = [
    {
      slug: "copper-vastu-kalash", name: "Copper Vastu Kalash", category: "kalash", direction: "northeast", priceMinor: 1840000,
      positioningLine: "A hand-beaten copper vessel that keeps the water element active in your northeast corner.",
      placementNote: "Northeast (Ishanya) — the zone Vastu Shastra links to clarity and spiritual grounding. A kalash here is traditionally kept filled with water and topped with a coconut or mango leaves.",
      description: "Raised from a single copper sheet by hand, then finished with a narrow silver band at the neck. The surface keeps the light hammer-marks of the smith who shaped it — no two kalashes leave the workshop looking quite the same. Sits at just under 18cm tall, suited to a shelf, altar corner, or low table.",
      careNote: "Wipe with a dry cloth; copper will darken naturally over time — this is patina, not damage, and considered auspicious in traditional use.",
      includedItems: "Kalash, cotton dust cover, placement card, certificate of composition.",
      composition: [
        { metal: "copper", weightGrams: 420 }, { metal: "silver", weightGrams: 15 },
        { gemstone: "sapphire", gemstoneQty: 1, label: "chip set at the rim" },
      ],
    },
    {
      slug: "brass-ashtadhatu-pyramid", name: "Brass Ashtadhatu Pyramid", category: "pyramid", direction: "center", priceMinor: 2490000,
      positioningLine: "An eight-metal alloy pyramid built for the Brahmasthan — the center of your home.",
      placementNote: "Center of the home — the point Vastu treats as the balancing core for every other zone.",
      description: "Cast in an ashtadhatu (eight-metal) brass alloy and finished by hand, with a clear quartz point set at the apex. Meant to sit on a central table or shelf where it isn't boxed in by walls — the Brahmasthan is traditionally kept open, and this piece is sized to sit in that kind of open space rather than dominate it.",
      careNote: "Dust with a soft brush; avoid harsh polish, which can dull the alloy's natural tone.",
      includedItems: "Pyramid, cotton dust cover, placement card, certificate of composition.",
      composition: [
        { metal: "brass", weightGrams: 640, label: "ashtadhatu alloy" },
        { gemstone: "quartz", gemstoneQty: 1, label: "point at the apex" },
      ],
    },
    {
      slug: "silver-sri-yantra-plate", name: "Silver Sri Yantra Plate", category: "yantra", direction: "north", priceMinor: 3120000,
      positioningLine: "A hand-engraved silver yantra for the wall that governs wealth and career.",
      placementNote: "North (Uttara) — associated in Vastu practice with financial flow and professional growth.",
      description: "Engraved by hand onto a solid silver plate, with a single ruby set at the bindu — the geometric center point of the yantra. Meant to hang at eye height on a north-facing wall, ideally where it catches morning light. Comes pre-fitted with a wall mount.",
      careNote: "Polish occasionally with a silver cloth; store the cotton cover if not displayed.",
      includedItems: "Yantra plate, wall mount fitted, cotton dust cover, placement card, certificate of composition.",
      composition: [
        { metal: "silver", weightGrams: 180 },
        { gemstone: "ruby", gemstoneQty: 1, label: "bindu stone" },
      ],
    },
    {
      slug: "gold-accent-om-wall-panel", name: "Gold-Accent Om Wall Panel", category: "panel", direction: "east", priceMinor: 4260000,
      positioningLine: "A brass Om panel with a fine gold overlay for the east wall — the direction linked to new beginnings.",
      placementNote: "East (Purva) — traditionally the direction to support health and fresh starts, best placed where morning light reaches it.",
      description: "The Om form is cut from solid brass, then finished with a thin gold overlay by hand and set with a single turquoise inlay at the base. Substantial enough to anchor a wall on its own — this is not a small accent piece.",
      careNote: "Dust gently; avoid direct contact with perfumes or cleaning sprays, which can affect the gold finish over time.",
      includedItems: "Panel, wall mount fitted, cotton dust cover, placement card, certificate of composition.",
      composition: [
        { metal: "brass", weightGrams: 510 },
        { metal: "gold", weightGrams: 2.5, label: "overlay" },
        { gemstone: "turquoise", gemstoneQty: 1, label: "inlay at the base" },
      ],
    },
    {
      slug: "copper-brass-wind-chime", name: "Copper-Brass Wind Chime", category: "chime", direction: "northwest", priceMinor: 980000,
      positioningLine: "A six-rod chime in copper and brass for the northwest — the zone of support and movement.",
      placementNote: "Northwest (Vayavya) — linked to relationships, travel, and the flow of support from others.",
      description: "Six rods, alternating copper and brass, tuned by ear rather than machine — each chime has a slightly different voice. Strung with amethyst beads at the crown. Best hung somewhere air actually moves: near a window or an open doorway, not a sealed corner.",
      careNote: "Wipe rods dry if exposed to rain; indoor or covered outdoor use recommended.",
      includedItems: "Chime, hanging cord, placement card, certificate of composition.",
      composition: [
        { metal: "copper", weightGrams: 260 }, { metal: "brass", weightGrams: 180 },
        { gemstone: "amethyst", gemstoneQty: 1, label: "bead cluster at the crown" },
      ],
    },
  ];

  if (demo) for (const p of products) {
    const created = await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug, name: p.name, positioningLine: p.positioningLine, placementNote: p.placementNote,
        description: p.description, careNote: p.careNote, includedItems: p.includedItems,
        basePriceMinor: p.priceMinor, categoryId: await cat(p.category),
      },
    });
    await db.productDirection.upsert({
      where: { productId_directionId: { productId: created.id, directionId: await d(p.direction) } },
      update: {}, create: { productId: created.id, directionId: await d(p.direction) },
    });
    if (!(await db.productComposition.findFirst({ where: { productId: created.id } }))) {
      let sortOrder = 0;
      for (const line of p.composition as Array<{ metal?: string; gemstone?: string; weightGrams?: number; gemstoneQty?: number; label?: string }>)
        await db.productComposition.create({
          data: {
            productId: created.id, sortOrder: sortOrder++,
            metalId: line.metal ? await m(line.metal) : null,
            gemstoneId: line.gemstone ? await g(line.gemstone) : null,
            weightGrams: line.weightGrams ?? null, gemstoneQty: line.gemstoneQty ?? null, label: line.label ?? null,
          },
        });
    }
    if (!(await db.productImage.findFirst({ where: { productId: created.id } })))
      await db.productImage.create({ data: { productId: created.id, url: `/placeholder/${p.slug}.svg`, alt: p.name, sortOrder: 0 } });
  }
  const vastu = await db.consultationType.upsert({
    where: { code: "vastu-placement" }, update: {},
    create: { code: "vastu-placement", name: "Vastu placement", description: "A 20-minute call to place your pieces correctly for your specific home layout.", durationMinutes: 20, feeMinor: 99900, creditsTowardOrder: true, displayOrder: 1 },
  });
  const astro = await db.consultationType.upsert({
    where: { code: "astrology" }, update: {},
    create: { code: "astrology", name: "Astrology", description: "A 30-minute astrology consultation.", durationMinutes: 30, feeMinor: 99900, creditsTowardOrder: false, displayOrder: 2 },
  });
  const consultant = (await db.consultant.findFirst({ where: { name: "Resident Consultant" } }))
    ?? (await db.consultant.create({ data: { name: "Resident Consultant" } }));

  // Consultant login: role + user, linked to the consultant record so the portal
  // resolves their own bookings/availability by userId.
  const consultantRole = await db.role.upsert({ where: { code: "consultant" }, update: {}, create: { code: "consultant", name: "Consultant" } });
  const consultantUser = await db.user.upsert({
    where: { email: process.env.CONSULTANT_EMAIL ?? "consultant@sarthakarts.com" },
    update: {},
    create: {
      email: process.env.CONSULTANT_EMAIL ?? "consultant@sarthakarts.com",
      name: "Resident Consultant",
      passwordHash: await bcrypt.hash(process.env.CONSULTANT_PASSWORD ?? "change-me", 10),
    },
  });
  await db.userRole.upsert({
    where: { userId_roleId: { userId: consultantUser.id, roleId: consultantRole.id } },
    update: {}, create: { userId: consultantUser.id, roleId: consultantRole.id },
  });
  if (consultant.userId !== consultantUser.id)
    await db.consultant.update({ where: { id: consultant.id }, data: { userId: consultantUser.id } });
  for (const t of [vastu, astro])
    await db.consultantType.upsert({
      where: { consultantId_consultationTypeId: { consultantId: consultant.id, consultationTypeId: t.id } },
      update: {}, create: { consultantId: consultant.id, consultationTypeId: t.id },
    });
  if (demo && (await db.consultantAvailability.count()) === 0) {
    const base = new Date("2026-07-10T04:30:00.000Z"); // 10:00 IST
    for (let day = 0; day < 5; day++)
      for (const hourOffset of [0, 2, 5]) {
        const slotStart = new Date(base.getTime() + day * 86400000 + hourOffset * 3600000);
        await db.consultantAvailability.create({ data: { consultantId: consultant.id, slotStart, durationMin: 20 } });
      }
  }

  if ((await db.auditQuestion.count()) === 0) {
    const q1 = await db.auditQuestion.create({ data: { prompt: "Which direction does your main entrance face?", displayOrder: 1 } });
    for (const [answerText, dir, order] of [["North", "north", 1], ["Northeast", "northeast", 2], ["East", "east", 3], ["Not sure", null, 4]] as const)
      await db.auditAnswerRule.create({ data: { questionId: q1.id, answerText, mapsToDirection: dir, displayOrder: order } });
    const q2 = await db.auditQuestion.create({ data: { prompt: "What would you most like to improve at home?", displayOrder: 2 } });
    for (const [answerText, dir, order] of [["Wealth & career", "north", 1], ["Clarity & calm", "northeast", 2], ["Relationships", "southwest", 3]] as const)
      await db.auditAnswerRule.create({ data: { questionId: q2.id, answerText, mapsToDirection: dir, displayOrder: order } });
    const q3 = await db.auditQuestion.create({ data: { prompt: "Is your home a standard rectangular layout?", displayOrder: 3 } });
    await db.auditAnswerRule.create({ data: { questionId: q3.id, answerText: "Yes, fairly standard", displayOrder: 1 } });
    await db.auditAnswerRule.create({ data: { questionId: q3.id, answerText: "No — it's irregular (L-shaped, corner, multi-floor)", recommendConsult: true, displayOrder: 2 } });
  }

  for (const [code, displayName] of [
    ["changed-mind", "Changed my mind"],
    ["damaged", "Arrived damaged"],
    ["not-as-described", "Not as described"],
    ["wrong-item", "Wrong item received"],
  ] as const)
    await db.returnReason.upsert({ where: { code }, update: {}, create: { code, displayName } });

  const stockBySlug: Record<string, number> = {
    "copper-vastu-kalash": 14,
    "brass-ashtadhatu-pyramid": 8,
    "silver-sri-yantra-plate": 3,
    "gold-accent-om-wall-panel": 0,
    "copper-brass-wind-chime": 21,
  };
  if (demo) for (const [slug, stockQuantity] of Object.entries(stockBySlug))
    await db.product.update({ where: { slug }, data: { stockQuantity } });

  // content blocks (owner-editable copy) — sourced from the client copy doc
  const blocks: [string, string | null, string][] = [
    ["about.body", "Why we started making these", "We started Sarthak Arts because too many so-called Vastu objects are sold without honesty — no real material, no real direction. We work direction-first, with a small circle of craftspeople, so each piece is built for one zone of a home and stated plainly."],
    ["our-craft.intro", "Made by hand, not run through a mould twice", "Every piece passes through the hands of one metalworker from raw sheet or ingot to finished object. We work with a small circle of coppersmiths, silversmiths and stone-setters. We don't run production batches — we run orders."],
    ["our-craft.materials", "The materials", "We use copper, brass and silver at stated purity, and gold only as a thin overlay where a listing says so. Every product page lists the exact metal weight, not a range."],
    ["our-craft.stones", "The stones", "Gemstones are chosen by hand for colour and clarity. Each stone is set, not glued, so it can be reset or replaced by a jeweller decades from now if needed."],
    ["vastu.intro", "Vastu Shastra, briefly", "Vastu Shastra is a traditional Indian system for arranging buildings and objects so a home works with natural energy rather than against it. We don't claim our products guarantee an outcome — what we can tell you is that every piece is built to the traditional specification for its direction and purpose."],
    ["faq.1", "Is this real gold/silver, or plated?", "Each listing states this exactly. Where we use a gold overlay on brass, we say gold-accent or gold overlay, never gold. Solid silver and copper pieces are stated as solid."],
    ["faq.2", "Do you offer a certificate of authenticity?", "Yes — every order ships with a certificate stating the exact metal weight and gemstone in your piece."],
    ["faq.3", "Can copper darken over time?", "Yes, and that's expected — copper develops a natural patina with air exposure, which in Vastu tradition is not considered a flaw. A light polish restores the bright finish."],
    ["faq.4", "What if I'm not sure which direction applies to my home?", "Use the direction guide, take the 2-minute home audit, or book a short consultation — we'll point you to the right pieces."],
    ["legal.terms", "Terms of Service", "These terms govern your use of the Sarthak Arts website and your purchase of our products. By placing an order you agree to them.\n\nOrders. Placing an order is an offer to buy. We confirm your order by email once payment is received. We may decline or cancel an order — for example if an item is unavailable or a price was listed in error — and will refund any amount already charged.\n\nProducts. Each piece is handmade, so small natural variations in finish, weight and patina are expected and are not defects. Metal weights and gemstone details are stated per piece and certified in your order.\n\nPricing and payment. Prices are shown in Indian Rupees and reflect the true cost of the materials and craft; they are reviewed as material costs move. The price shown at checkout is the price you pay for that order.\n\nContact. Questions about these terms can be sent to hello@sarthakarts.com."],
    ["legal.privacy", "Privacy Policy", "We collect only what we need to fulfil your order and support you.\n\nWhat we collect. Your name, email, phone, and shipping address at checkout; your order and consultation history; and, if you subscribe, your email for occasional updates.\n\nHow we use it. To process and ship orders, issue certificates, provide consultations, respond to enquiries, and — only if you opt in — send you a monthly placement tip. We do not sell your personal information.\n\nPayments. Card and payment details are handled by our payment provider and are never stored on our servers.\n\nYour choices. You can unsubscribe from emails at any time, and you can ask us to access or delete your personal data by writing to hello@sarthakarts.com."],
    ["legal.shipping", "Shipping & Returns", "Shipping. We pack each piece by hand and dispatch within a few working days. Shipping is calculated at checkout by destination. You'll receive tracking once your order ships.\n\nReturns. If a piece isn't right, you may request a return within 7 days of delivery, provided it is unused and in its original condition. Items marked final sale cannot be returned. Start a return from your order page using your order number and email.\n\nRefunds. Once an approved return is received and checked, we refund to your original payment method. Return shipping for a change of mind is the customer's responsibility; if an item arrives damaged or incorrect, we cover it.\n\nDamaged or wrong items. Tell us within 48 hours of delivery at hello@sarthakarts.com with a photo and we'll make it right."],
  ];
  for (const [key, title, body] of blocks)
    await db.contentBlock.upsert({ where: { key }, update: {}, create: { key, title, body } });

  for (const [platform, handle, profileUrl] of [
    ["instagram", "@sarthakarts", "https://instagram.com/sarthakarts"],
    ["threads", "@sarthakarts", "https://www.threads.net/@sarthakarts"],
  ] as const)
    await db.socialAccount.upsert({ where: { platform }, update: {}, create: { platform, handle, profileUrl } });

  if (demo && (await db.socialPost.count()) === 0)
    for (let i = 1; i <= 4; i++)
      await db.socialPost.create({ data: { platform: "instagram", caption: `A piece from the workshop #${i}`, mediaUrl: `/placeholder/copper-vastu-kalash.svg`, permalink: "https://instagram.com/sarthakarts" } });

  console.log(`Seed complete. Mode: ${demo ? "demo (sample products loaded)" : "production (reference data only, no sample products)"}.`);
}

main().finally(() => db.$disconnect());
