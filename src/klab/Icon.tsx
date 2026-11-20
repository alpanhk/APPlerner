type Name = 'today' | 'explore' | 'notes' | 'profile' | 'arrow' | 'back' | 'sun' | 'moon' | 'book' | 'play' | 'grid';
const paths: Record<Name, string> = {
  today: 'm3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9',
  explore: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  notes: 'M5 3h14v18H5zM9 7h6M9 11h6M9 15h4',
  profile: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-3a8 6 0 0 1 16 0v3',
  arrow: 'm9 5 7 7-7 7', back: 'm15 5-7 7 7 7M8 12h13',
  sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2',
  moon: 'M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10',
  book: 'M12 5v16M12 5C8 2 4 3 2 4v15c4-1 6-1 10 2 4-3 6-3 10-2V4c-4-1-6-1-10 1',
  play: 'm9 5 11 7-11 7z',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
};
export default function Icon({ name }: { name: Name }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
