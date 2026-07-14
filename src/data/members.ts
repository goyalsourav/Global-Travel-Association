// Member + application-pipeline types shared by the public members page and
// the admin panel.

export type MemberStatus = "active" | "inactive";
export type PaymentStatus = "pending" | "paid";

export type Member = {
  id: number;
  name: string;
  firmName: string;
  contact: string;
  email: string;
  status: MemberStatus;
  paymentStatus: PaymentStatus;
  paidAt: string | null;
  applicationId: number | null;
  createdAt: string;
};

// What the public /members page sees — no contact details.
export type PublicMember = {
  id: number;
  name: string;
  firmName: string;
};

// One entry in a member's payment ledger (admin only).
export type MemberPayment = {
  id: number;
  memberId: number;
  amount: number;
  paidOn: string; // yyyy-mm-dd
  note: string;
  createdAt: string;
};

export type ApplicationStatus =
  "submitted" | "reviewed" | "payment_requested" | "payment_successful" | "complete";

export const APPLICATION_STATUSES: { value: ApplicationStatus; label: string }[] = [
  { value: "submitted", label: "Submitted" },
  { value: "reviewed", label: "Reviewed" },
  { value: "payment_requested", label: "Payment Requested" },
  { value: "payment_successful", label: "Payment Successful" },
  { value: "complete", label: "Complete" },
];

export function applicationStatusLabel(status: string): string {
  return APPLICATION_STATUSES.find((s) => s.value === status)?.label ?? status;
}

// Badge tints per status, on the site's gold/ink palette.
export const APPLICATION_STATUS_CLS: Record<ApplicationStatus, string> = {
  submitted: "bg-ink/5 text-charcoal border-ink/15",
  reviewed: "bg-gold/10 text-ink border-gold/40",
  payment_requested: "bg-gold/20 text-ink border-gold/60",
  payment_successful: "bg-green-600/10 text-green-700 border-green-600/30",
  complete: "bg-ink text-gold border-ink",
};
