import type { GtaEvent } from "@/data/siteContent";

export type Activity = {
  images: string[]; // first image is the cover
  alt: string;
  title: string;
  caption: string;
};

// All activities/events now come from the database (managed in /admin, in the
// admin-defined order). The original hardcoded set was migrated there via
// scripts/seed-events.mjs.
export function eventsToActivities(events: GtaEvent[]): Activity[] {
  return events.map((e) => ({
    images: e.imageUrls,
    alt: e.title,
    title: e.title,
    caption: e.description,
  }));
}
