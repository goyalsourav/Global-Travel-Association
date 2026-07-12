// Editable site content: types + the default values shown until the admin
// panel saves overrides to the database. Defaults mirror the original
// hardcoded copy so the public UI is unchanged when the DB is empty.

export type AboutContent = {
  intro: string;
  vision: string;
  mission: string;
};

export type Bearer = {
  name: string;
  role: string;
  image: string;
};

export type ContactContent = {
  email: string;
  phone: string;
  address: string;
  website: string;
  instagram: string;
};

export type GtaEvent = {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: string;
};

export type SiteContent = {
  about: AboutContent;
  bearers: Bearer[];
  contact: ContactContent;
};

export const defaultAbout: AboutContent = {
  intro:
    "Global Travel Association (GTA) is an India-based association established in 2026 with a global vision to unite, empower, and elevate travel agencies through collaboration, knowledge sharing, and ethical business practices.",
  vision:
    "To become India's most trusted and respected association of travel agencies, building a strong national network with meaningful global partnerships that inspire growth, innovation, and excellence across the travel industry.",
  mission:
    "To connect travel agencies through a professional and ethical platform that encourages collaboration, continuous learning, and sustainable business growth — creating networking opportunities, industry events and FAM trips, promoting responsible tourism, and representing India's travel agency community nationally and internationally.",
};

export const defaultBearers: Bearer[] = [
  {
    name: "Manish Jain",
    role: "President",
    image:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Shubham Agrawal",
    role: "General Secretary",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Rahul Waswani",
    role: "Treasurer",
    image:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80",
  },
];

export const defaultContact: ContactContent = {
  email: "globaltravelsassociation@gmail.com",
  phone: "[Phone Number]",
  address: "Raipur, Chhattisgarh, India",
  website: "https://www.globaltravelassociation.com",
  instagram:
    "https://www.instagram.com/global_travel_aassociation?igsh=YTRveHdtNmJpN3Vp&utm_source=qr",
};

export const defaultSiteContent: SiteContent = {
  about: defaultAbout,
  bearers: defaultBearers,
  contact: defaultContact,
};
