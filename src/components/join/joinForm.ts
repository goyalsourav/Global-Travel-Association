// Types, constants and validation for the GTA membership application wizard.
import type { UploadedFileMeta } from "@/lib/uploadFile";

export type JoinValues = {
  email: string;
  name: string;
  companyName: string;
  officeAddress: string;
  businessEmail: string;
  contactNumber: string;
  currentAccount: "" | "Yes" | "No";
  establishmentYear: string;
  ref1Name: string;
  ref1Phone: string;
  ref2Name: string;
  ref2Phone: string;
  yearsExperience: string;
  expertise: string;
  socialLinks: string;
  designation: string;
  otherBusiness: string;
  associations: string[];
  associationOther: string;
  reason: string;
};

export type FileFieldKey =
  | "profilePicture"
  | "aadhar"
  | "workspacePhoto"
  | "gstCertificate"
  | "msmeLicense"
  | "visitingCard";

export type JoinFiles = Partial<Record<FileFieldKey, UploadedFileMeta>>;

export type JoinDraft = {
  step: number;
  values: JoinValues;
  files: JoinFiles;
  updatedAt: number;
};

export const emptyValues: JoinValues = {
  email: "",
  name: "",
  companyName: "",
  officeAddress: "",
  businessEmail: "",
  contactNumber: "",
  currentAccount: "",
  establishmentYear: "",
  ref1Name: "",
  ref1Phone: "",
  ref2Name: "",
  ref2Phone: "",
  yearsExperience: "",
  expertise: "",
  socialLinks: "",
  designation: "",
  otherBusiness: "",
  associations: [],
  associationOther: "",
  reason: "",
};

export const ASSOCIATION_OPTIONS = [
  "CGTTA",
  "TAAI",
  "TAFI",
  "TAAN",
  "JCOM",
  "IATA",
  "IATO",
  "IATTE",
  "BNI",
  "JBN",
  "Other",
] as const;

export const STEP_NAMES = [
  "Personal Details",
  "Business Details",
  "Documents",
  "Association & Review",
];

export const REASON_WORD_LIMIT = 200;

export const DRAFT_STORAGE_KEY = "gta-membership-draft-v1";

export function countWords(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function trimToWordLimit(text: string, limit: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= limit) return text;
  return words.slice(0, limit).join(" ");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10}$/;

export type FieldErrors = Partial<Record<string, string>>;

export function validateStep(step: number, values: JoinValues, files: JoinFiles): FieldErrors {
  const errors: FieldErrors = {};
  const currentYear = new Date().getFullYear();

  if (step === 0) {
    if (!values.email.trim()) errors.email = "Please enter your email address.";
    else if (!EMAIL_RE.test(values.email.trim()))
      errors.email = "That doesn't look like a valid email — please check it.";
    if (values.contactNumber && !PHONE_RE.test(values.contactNumber))
      errors.contactNumber = "Please enter a 10-digit mobile number.";
    if (!files.profilePicture) errors.profilePicture = "Please upload your profile picture.";
  }

  if (step === 1) {
    if (values.businessEmail && !EMAIL_RE.test(values.businessEmail.trim()))
      errors.businessEmail = "That doesn't look like a valid email — please check it.";
    if (values.establishmentYear) {
      const y = Number(values.establishmentYear);
      if (!Number.isInteger(y) || y < 1950 || y > currentYear)
        errors.establishmentYear = `Enter a 4-digit year between 1950 and ${currentYear}.`;
    }
    if (values.yearsExperience) {
      const n = Number(values.yearsExperience);
      if (!Number.isFinite(n) || n < 0 || n > 80)
        errors.yearsExperience = "Enter your years of experience (0–80).";
    }
    if (!values.currentAccount)
      errors.currentAccount = "Please tell us if you have a current account for your business.";
  }

  if (step === 2) {
    if (!files.aadhar) errors.aadhar = "Please upload your Aadhar card.";
    if (!files.msmeLicense)
      errors.msmeLicense = "Please upload your MSME / Trade License / Gomasta.";
    if (!files.visitingCard) errors.visitingCard = "Please upload your visiting card.";
  }

  if (step === 3) {
    if (values.associations.length === 0)
      errors.associations = "Select at least one association (or “Other”).";
    if (values.associations.includes("Other") && !values.associationOther.trim())
      errors.associationOther = "Please name the other association and your role.";
    if (!values.ref1Name.trim()) errors.ref1Name = "Reference 1 name is required.";
    if (!PHONE_RE.test(values.ref1Phone)) errors.ref1Phone = "Enter a 10-digit contact number.";
    if (!values.ref2Name.trim()) errors.ref2Name = "Reference 2 name is required.";
    if (!PHONE_RE.test(values.ref2Phone)) errors.ref2Phone = "Enter a 10-digit contact number.";
    const words = countWords(values.reason);
    if (words === 0) errors.reason = "Please tell us why you'd like to join GTA.";
    else if (words > REASON_WORD_LIMIT)
      errors.reason = `Please keep it within ${REASON_WORD_LIMIT} words.`;
  }

  return errors;
}

export function firstInvalidStep(values: JoinValues, files: JoinFiles): number | null {
  for (let s = 0; s < STEP_NAMES.length; s++) {
    if (Object.keys(validateStep(s, values, files)).length > 0) return s;
  }
  return null;
}
