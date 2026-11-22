// Pemeran. `img` merujuk ke /media/actors/<img>.webp; `open` = ada bingkai mulut terbuka.
export interface CastMember {
  name: string;
  role: string;
  img: string;
  open?: boolean;
  flip?: boolean; // potret aslinya menghadap kanan
}

export const CAST: Record<string, CastMember> = {
  tutor: { name: "Frau Lehmann", role: "Pendampingmu", img: "tutor", open: true },
  mia: { name: "Mia", role: "Tetangga sebelah", img: "mia", open: true },
  pos: { name: "Petugas Pos", role: "Pengantar surat", img: "pos", open: true },
  tetangga: { name: "Herr Brandt", role: "Tetangga", img: "tetangga", open: true },
  kaya: { name: "Frau Kaya", role: "Penjaga gedung", img: "penjaga-buku-ch01", open: true, flip: true },
  jonas: { name: "Jonas", role: "Teman serumah Mia", img: "tamu-kafe-ch04" },
  aydin: { name: "Herr Aydın", role: "Penjual di pasar", img: "penjual-pasar", open: true, flip: true },
  demir: { name: "Frau Demir", role: "Pembeli di pasar", img: "penjual-mandiri-ch02", open: true },
  helga: { name: "Oma Helga", role: "Nenek Mia", img: "pemilik-foto-ch03", open: true },
  stefan: { name: "Onkel Stefan", role: "Paman Mia", img: "kerabat-ch03" },
  lena: { name: "Lena", role: "Barista Café Linde", img: "barista", open: true },
  sommer: { name: "Frau Sommer", role: "Pramuniaga", img: "penjual-pakaian", open: true },
  timo: { name: "Timo", role: "Kasir", img: "kasir", open: true },
  eva: { name: "Eva", role: "Pemilik kamar", img: "eva", open: true },
  marek: { name: "Marek", role: "Pelancong", img: "tamu-kota", open: true },
  vogel: { name: "Frau Vogel", role: "Rekan kerja", img: "rekan-panitia", open: true },
  yilmaz: { name: "Frau Yılmaz", role: "Resepsionis praktik", img: "petugas-praktik", open: true },
  wagner: { name: "Herr Wagner", role: "Apoteker", img: "apoteker", open: true },
  kim: { name: "Kim", role: "Pengurus klub renang", img: "petugas-klub", open: true },
  richter: { name: "Frau Richter", role: "Petugas stasiun", img: "petugas-stasiun", open: true },
  karim: { name: "Karim", role: "Tetangga baru", img: "pendatang-baru", open: true },
};

export const AVATARS = ["player-01", "player-02", "player-03", "player-04"] as const;

export function nameOf(id: string, playerName = "Kamu"): string {
  if (id === "narator") return "";
  if (id === "player") return playerName;
  return CAST[id]?.name ?? id;
}
