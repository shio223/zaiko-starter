"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AccessPanel } from "@/components/ui/AccessPanel";
import { AccessInput } from "@/components/ui/AccessInput";
import { AccessButton } from "@/components/ui/AccessButton";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include",
      });

      const json = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(json.error ?? "ログインに失敗しました。");
        setSubmitting(false);
        return;
      }

      router.replace(nextPath.startsWith("/") ? nextPath : "/");
      router.refresh();
    } catch {
      setError("ログインに失敗しました。");
      setSubmitting(false);
    }
  };

  return (
    <div className="menu-screen">
      <div className="menu-window" style={{ maxWidth: 420 }}>
        <AccessPanel title="Zaiko STARTER ログイン">
          <form onSubmit={handleSubmit}>
            <AccessInput
              id="login-password"
              label="パスワード"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
              autoComplete="current-password"
            />

            {error && <p className="field-error mb-2">{error}</p>}

            <div className="dialog-actions">
              <AccessButton variant="green" type="submit" disabled={submitting}>
                {submitting ? "ログイン中..." : "ログイン"}
              </AccessButton>
            </div>
          </form>
        </AccessPanel>
      </div>
    </div>
  );
}
