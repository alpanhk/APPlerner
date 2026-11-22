import { defineConfig } from "drizzle-kit";

// DATABASE_URL dibaca dari environment (lihat .env.example). Jangan
// memasukkan kredensial ke Git. Untuk preview terisolasi, jalankan
// `npm run preview:db` yang mencetak DATABASE_URL lokal.
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required (lihat .env.example)");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: { url },
});
