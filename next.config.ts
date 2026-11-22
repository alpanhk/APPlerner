import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Izinkan origin preview Arena (host *.e2b.app) dan localhost agar dev server
  // dapat diakses dari pratinjau live maupun dari mesin pengembang. Di produksi,
  // daftar ini tidak berpengaruh.
  allowedDevOrigins: ["*.e2b.app", "localhost", "127.0.0.1", "0.0.0.0"],
};

export default nextConfig;
