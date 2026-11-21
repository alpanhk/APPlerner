import React from "react";
import ReactDOM from "react-dom/client";
// CLONE PERSIS: entry merender tampilan referensi. LegacyApp tetap dipertahankan
// sebagai modul tidur di src/App.tsx, tidak dirender dari jalur utama.
import App from "./klab/novel/App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
