import { Suspense } from "react";
import BillingPage from "./page";

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <BillingPage />
    </Suspense>
  );
}
