// One-time member seeding. Run with: node scripts/seed-members.mjs
// Skips seeding if the members table already has rows (safe to re-run).
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
const match = env.match(/^DATABASE_URL=(.+)$/m);
if (!match) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}
const sql = neon(match[1].trim());

const members = [
  ["MANISH JAIN", "MANISH JAIN HOLIDAYS", "7770987654", "MANISHJAINHOLIDAYS@GMAIL.COM"],
  ["SHUBHAM AGRAWAL", "SURBHI HOLIDAYS", "9009661010", "Raipur@surbhitravels.com"],
  ["RAHUL WASWANI", "ASHTVINAYAK TRAVELS", "9770132677", "INFO@ASHTVINAYAKTRAVELS.IN"],
  ["Rahul Khoobchandani", "Travel Planet India", "9329823045", "travelplanet.rpr@gmail.com"],
  ["Akash Dudani", "Holiday Kings", "9713866000", "holidaykings.ind@gmail.com"],
  ["SATISH KUMAR", "STAR TRAVEL", "8359011530", "startravelbsp@gmail.com"],
  ["Shailesh Agrawal", "Agrawal Holidays", "9993021106", "agrawalholidays1@gmail.com"],
  [
    "AKASH AGRAWAL",
    "BUCKET LIST TOUR & TRAVELS PVT. LTD.",
    "8878530004",
    "bucketlisttravel.in@gmail.com",
  ],
  ["AKASH JIWNANI", "OM SAI HOLIDAYS", "7898676888", "omsaitravelsbsp@gmail.com"],
  ["Akhilesh Nashine", "Nashine Travel Services", "7803052556", "akhileshnashine0908@gmail.com"],
  ["AMIT BANSAL", "BANSAL TOUR & TRAVELS", "7828034293", "bansalholidays2708@gmail.com"],
  ["AMIT KUMAR SAHU", "OM SAI HOLIDAYS", "9993746644", "OMSAITRAVELS32@GMAIL.COM"],
  ["ANIL KUMAR MANGLANI", "PRATHAM TRAVELS", "9300965280", "anil.manglani3333@gmail.com"],
  ["ANKUSH KUMAR JAIN", "ANKUSH HOLIDYAS", "7646907600", "ankushholidays24@gmail.com"],
  ["ANSHUL KHARE", "DEV HOLIGO", "9827652114", "anshul@devholigo.com"],
  ["ANSHUL RAMARIYAA", "BENNO VACATIONS", "7566329336", "anshul@benovacations.com"],
  ["AYUSH BAJAJ", "OM SAI HOLIDAYS", "9993746644", "omsaiholidays32@gmail.com"],
  [
    "Darshan Kumar Mungutwar",
    "Mauli Travel Destination",
    "9303033775",
    "traveldestination2010@gmail.com",
  ],
  ["Hemant Kumar Mulchandani", "Shree Travels", "9329651293", "Shreetravels1293@gmail.com"],
  [
    "HIMANSHU AGRAWAL",
    "JAY JAGANNATH TRAVEL AGENCY",
    "7771922335",
    "jayjagannathtravelagency@gmail.com",
  ],
  ["Karan Shadija", "Satguru Travels", "7000678942", "satgurutravels690@gmail.com"],
  ["LUCKY ROHRA", "YAAHOO TOUR & TRAVELS", "9301010103", "yaahootravels@gmail.com"],
  ["Manohar Wadhwani", "Apna Tour & Travels", "9827152005", "Buntywadhwani67@gmail.com"],
  ["MAYANK M GOYAL", "HORIZON HOLIDAYS", "8822226600", "horizonholidayscg@gmail.com"],
  ["MOHAN LAL SONI", "DINESH TOUR AND TRAVELS", "9244927070", "Dineshcomtours@gmail.com"],
  ["NARESH NANWANI", "UDAAN FOREX PRIVATE LIMITED", "9009177777", "udaanforex.rpr@gmail.com"],
  ["Pankaj Kukreja", "SHUBH YATRA", "9302806177", "itzdl08915@gmail.com"],
  ["PRANAV DUBEY", "TRAVEL GURU RAIPUR", "", "tgrpr1992@gmail.com"],
  ["Raahul Sethi", "Valuable Stays Travel Planner", "7722045999", "valuablestays@gmail.com"],
  ["Rahul Borker", "Universal Tours", "9691925001", "sales@universaltours.co.in"],
  ["Rahul Vardiyani", "Radha Swami Travels", "9907774444", "travelsradhaswami@gmail.com"],
  ["RAJESH VASUKUTTY", "VAYUDOOT TOURS & TRAVELS", "9425553005", "vayudoottravel@gmail.com"],
  ["REVATH KUMAR SEN", "TRAVEL JUNCTION", "9826132898", "international.traveljunction@gmail.com"],
  ["ROHIT AGRAWAL", "BALAJI TRAVELS", "9981344872", "BALAJITRAVELS57@GMAIL.COM"],
  ["SAMIR KUMAR BHOWMIK", "SKB WEEKEND HOLIDAYS", "8085580166", "SKBWEEKENDHOIDAYS@GMAIL.COM"],
  ["SANDEEP KUMAR JAIN", "VIDHYASHREE TRAVELS", "9827172993", "vidhyashreetravels@gmail.com"],
  ["Sanjeev Kumar Das", "TourMap", "7000073672", "sales1.tourmap@gmail.com"],
  ["Sanjib Kumar Pal", "Beyond Tour and Travels", "7987192650", "beyondtourtravels@gmail.com"],
  ["SRIJAN DIWAN", "TRAVEL WINDOW", "8770492736", "srijan.travelwindow@gmail.com"],
  ["Sumeet Chandiramani", "JK HOLIDAYS", "8871102854", "Jkholidays.rpr@gmail.com"],
  ["Sunny Bansal", "195 Holidays", "9437070177", "sunnygrm@gmail.com"],
  ["Vishal Popat", "Travel@ 7Th Gear", "9300230008", "Travelseventhgear@gmail.com"],
  ["Yuwaraj Katre", "Gurukripa Travels", "9424213700", "gktraipur@gmail.com"],
];

// Same DDL the app runs on startup — makes the script standalone.
await sql`
  CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    firm_name TEXT NOT NULL DEFAULT '',
    contact TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    application_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;

const [{ count }] = await sql`SELECT count(*)::int AS count FROM members`;
if (count > 0) {
  console.log(`members table already has ${count} rows — skipping seed.`);
  process.exit(0);
}

for (const [name, firm, contact, email] of members) {
  await sql`
    INSERT INTO members (name, firm_name, contact, email, status)
    VALUES (${name}, ${firm}, ${contact}, ${email}, 'active')
  `;
}
console.log(`seeded ${members.length} members (all active).`);
