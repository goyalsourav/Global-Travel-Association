export type Activity = {
  src: string;
  alt: string;
  title: string;
  caption: string;
};

// Add new activities/events to the end of this list — the full list appears
// on the /activities page. The homepage overview only shows a fixed featured
// set (see Activities.tsx) so it doesn't grow as this list grows.
export const activities: Activity[] = [
  {
    src: "https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=1400&q=80",
    alt: "Members on FAM trip through the forests of Kanha National Park",
    title: "Tathastu Kanha FAM",
    caption: "A familiarisation trip through the wilderness of Kanha with partner resorts.",
  },
  {
    src: "https://images.unsplash.com/photo-1585484173186-14b13c0a3d6b?auto=format&fit=crop&w=1400&q=80",
    alt: "Educational session on Char Dham and Kailash Mansarovar pilgrimages",
    title: "Char Dham & Kailash Mansarovar",
    caption: "An educational session for members on pilgrimage circuit planning.",
  },
  {
    src: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1400&q=80",
    alt: "GTA cricket team playing at TAFI industry tournament",
    title: "GTA Cricket Team — TAFI Tournament",
    caption: "Representing GTA on the field at the TAFI inter-association tournament.",
  },
  {
    src: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1400&q=80",
    alt: "Charity event at Lions Club Vriddhashram donating a water purifier",
    title: "Charity at Lions Club Vriddhashram",
    caption: "Donating a water purifier to support residents at the community home.",
  },
  {
    src: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1400&q=80",
    alt: "GTA members at cricket practice sessions",
    title: "Cricket Practices",
    caption: "Weekly practice sessions building camaraderie among member agencies.",
  },
  {
    src: "https://images.unsplash.com/photo-1587381420270-3e1a5b9e6904?auto=format&fit=crop&w=1400&q=80",
    alt: "Members visiting Narayani Farms and Resort during FAM trip",
    title: "FAM at Narayani Farms & Resort",
    caption: "Exploring the property, hospitality and experiences at Narayani Farms.",
  },
];
