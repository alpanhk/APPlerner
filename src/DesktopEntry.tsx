import { useState } from "react";
import Desktop from "./App";
import { isTauri } from "@tauri-apps/api/core";
import { WebLearning } from "./arena/components/WebLearning";
import Arena from "./arena/App";
import { navigation } from "./app/navigation";
import type { Route } from "./klab/routes";

// Titik masuk produksi: Arena (prolog visual novel) adalah layar pertama.
// Aplikasi desktop lama tetap dapat dibuka dari tindakan sekunder, dan
// pengguna dapat kembali ke prolog tanpa memuat ulang proses.
export default function DesktopEntry() {
  const [desktop, setDesktop] = useState<{ route?: Route } | null>(null);

  if (desktop) {
    if (!isTauri()) return <WebLearning route={desktop.route} onBack={() => setDesktop(null)} />;
    return (
      <div className="relative h-full w-full">
        <Desktop />
        <button
          type="button"
          className="fixed right-3 top-3 z-[60] rounded-full border border-[#2c3e6b]/30 bg-[#f7efdd]/95 px-3 py-1.5 text-xs font-semibold text-[#2c3e6b] shadow"
          onClick={() => setDesktop(null)}
        >
          Kembali ke prolog
        </button>
      </div>
    );
  }

  return (
    <Arena
      onDesktop={(route) => {
        if (route) navigation.getState().push(route);
        setDesktop({ route });
      }}
    />
  );
}
