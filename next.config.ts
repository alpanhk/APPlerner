import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Izinkan origin preview Arena (host *.e2b.app) agar dev server dapat
  // diakses dari pratinjau live. Di produksi, hapus bila tidak diperlukan.
  allowedDevOrigins: ["*.e2b.app"],
};

export default nextConfig;
