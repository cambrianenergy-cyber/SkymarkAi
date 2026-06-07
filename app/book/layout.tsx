import { Suspense } from "react";
import BookPage from "./page";

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <BookPage />
    </Suspense>
  );
}
