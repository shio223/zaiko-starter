import { Suspense } from "react";
import MasterPageContent from "./MasterPageContent";

/** useSearchParams 利用のため Suspense でラップ */
export default function MasterPage() {
  return (
    <Suspense
      fallback={
        <div className="app-layout p-4">
          <div className="access-panel p-4 text-center text-sm">読み込み中...</div>
        </div>
      }
    >
      <MasterPageContent />
    </Suspense>
  );
}
