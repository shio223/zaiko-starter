import type { ShelfFormData } from "@/lib/types/shelf";

export type ShelfFormErrors = Partial<Record<keyof ShelfFormData, string>>;

export function validateShelfForm(data: ShelfFormData): ShelfFormErrors {
  const errors: ShelfFormErrors = {};

  if (!data.shelf_number.trim()) {
    errors.shelf_number = "棚番を入力してください。";
  }

  if (!data.shelf_name.trim()) {
    errors.shelf_name = "棚名を入力してください。";
  }

  return errors;
}

export function hasShelfFormErrors(errors: ShelfFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function formatShelfSaveError(err: unknown): string {
  if (!(err instanceof Error)) {
    return "保存に失敗しました。";
  }

  if (
    err.message.includes("idx_shelves_shelf_number_unique") ||
    err.message.includes("duplicate key")
  ) {
    return "同じ棚番が既に登録されています。別の棚番を入力してください。";
  }

  return err.message;
}
