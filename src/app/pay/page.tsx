import { PaymentPassport } from "@/components/payment-passport";
export const metadata = {
  title: "Verified payment request",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function Page() {
  return <PaymentPassport publicView />;
}
