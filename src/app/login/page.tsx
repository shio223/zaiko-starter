import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="menu-screen">
          <div className="menu-window" style={{ maxWidth: 420 }}>
            <div className="access-panel p-4 text-center text-sm">
              読み込み中...
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
