import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const db = new PrismaClient();

async function main() {
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

  for (const p of products) {
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
  for (const t of [vastu, astro])
    await db.consultantType.upsert({
      where: { consultantId_consultationTypeId: { consultantId: consultant.id, consultationTypeId: t.id } },
      update: {}, create: { consultantId: consultant.id, consultationTypeId: t.id },
    });
  if ((await db.consultantAvailability.count()) === 0) {
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

  const stockBySlug: Record<string, number> = {
    "copper-vastu-kalash": 14,
    "brass-ashtadhatu-pyramid": 8,
    "silver-sri-yantra-plate": 3,
    "gold-accent-om-wall-panel": 0,
    "copper-brass-wind-chime": 21,
  };
  for (const [slug, stockQuantity] of Object.entries(stockBySlug))
    await db.product.update({ where: { slug }, data: { stockQuantity } });

  console.log("Seed complete.");
}

main().finally(() => db.$disconnect());
