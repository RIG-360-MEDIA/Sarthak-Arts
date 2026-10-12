import "dotenv/config";
import { syncFestivals } from "../src/lib/festival-refresh";

// Same as the nightly job: sync festivals with src/lib/festival-list.ts (touches only the Festival table).
syncFestivals().then((r) => console.log("Festivals synced:", r)).catch((e) => { console.error(e); process.exit(1); });
