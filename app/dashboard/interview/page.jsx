import { Suspense } from "react";
import InterviewClient from "./InterviewClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6">Loading interview...</div>}>
      <InterviewClient />
    </Suspense>
  );
}
