import { Building2, QrCode } from "lucide-react";
import { defaultPayment, type PaymentContent } from "@/data/siteContent";

// Dark "Membership Payment" panel. Used in the homepage Membership section and
// at the end of the application flow — content is editable from /admin.
export function PaymentPanel({ payment = defaultPayment }: { payment?: PaymentContent }) {
  return (
    <div className="bg-ink text-white p-8 md:p-10 h-full">
      <span className="eyebrow" style={{ color: "var(--gold)" }}>
        <span className="gold-rule" />
        Membership Payment
      </span>
      <h3 className="mt-3 font-serif text-2xl">Pay via UPI or bank transfer.</h3>
      <p className="mt-2 text-sm text-white/70">
        Complete your payment after submitting the form. Our team will confirm your membership
        within 24–48 hours.
      </p>

      <div className="mt-8 grid gap-6">
        {payment.feePerYear && (
          <div className="flex flex-wrap items-baseline justify-between gap-2 p-5 bg-gold/10 border border-gold/40">
            <span className="text-xs uppercase tracking-[0.22em] text-gold">Membership Fee</span>
            <span className="font-serif text-xl text-white">
              {payment.feePerYear}
              <span className="ml-2 text-sm text-white/60 font-sans">
                per person / financial year
              </span>
            </span>
          </div>
        )}

        <div className="flex items-start gap-4 p-5 bg-white/5 border border-white/10">
          {payment.qrImage ? (
            <img
              src={payment.qrImage}
              alt="UPI payment QR code"
              className="h-32 w-32 shrink-0 object-contain bg-white p-1.5"
            />
          ) : (
            <div className="grid h-24 w-24 shrink-0 place-items-center bg-white text-ink">
              <QrCode className="h-14 w-14" strokeWidth={1} />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.22em] text-gold">Scan to Pay</div>
            <div className="mt-1 font-serif text-lg">UPI QR Code</div>
            {payment.upiId ? (
              <p className="mt-1 text-sm text-white/80 font-mono break-all">{payment.upiId}</p>
            ) : (
              !payment.qrImage && (
                <p className="mt-1 text-xs text-white/60">[Upload actual UPI QR image here]</p>
              )
            )}
          </div>
        </div>

        <div className="p-5 bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 text-gold text-xs uppercase tracking-[0.22em]">
            <Building2 className="h-4 w-4" /> Bank Transfer
          </div>
          <dl className="mt-4 space-y-2.5 text-sm">
            <BankRow label="Account Name" value={payment.accountName} />
            <BankRow label="Account Number" value={payment.accountNumber} />
            <BankRow label="IFSC Code" value={payment.ifsc} />
            <BankRow label="Bank Name" value={payment.bankName} />
            <BankRow label="Branch" value={payment.branch} />
          </dl>
        </div>
      </div>
    </div>
  );
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-4 border-b border-white/10 pb-2 last:border-0">
      <dt className="text-white/60 text-xs uppercase tracking-wider">{label}</dt>
      <dd className="text-white font-mono text-sm text-right">{value}</dd>
    </div>
  );
}
