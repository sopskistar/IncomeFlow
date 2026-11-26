import { redirect } from "next/navigation";
import { encodePassport, parsePassport } from "@/lib/passport";
import proof from "../../../deployments/passport-proof.json";
export const metadata = {
  title: "Verified illustrative Payment Passport",
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const view = (await searchParams).view === "owner" ? "passport" : "pay";
  redirect(`/${view}#${encodePassport(parsePassport(proof.passport))}`);
}
