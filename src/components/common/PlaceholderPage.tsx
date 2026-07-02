/** 未実装機能のプレースホルダー画面 */
"use client";

type PlaceholderPageProps = {
  title: string;
  description?: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="access-panel p-8 text-center">
      <h2 className="mb-2 text-lg font-bold">{title}</h2>
      <p className="text-sm text-gray-700">
        {description ?? "この機能は今後実装予定です。"}
      </p>
    </div>
  );
}
