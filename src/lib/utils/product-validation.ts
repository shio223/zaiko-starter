import type { ProductFormData } from "@/lib/types/product";

export type ProductFormErrors = Partial<Record<keyof ProductFormData, string>>;

export function validateProductForm(data: ProductFormData): ProductFormErrors {
  const errors: ProductFormErrors = {};

  if (!data.part_number.trim()) {
    errors.part_number = "品番を入力してください。";
  }

  if (!data.name.trim()) {
    errors.name = "品名を入力してください。";
  }

  if (data.quantity < 0) {
    errors.quantity = "現在庫は0以上で入力してください。";
  }

  if (data.unit_price < 0) {
    errors.unit_price = "単価は0以上で入力してください。";
  }

  if (data.reorder_point < 0) {
    errors.reorder_point = "発注点は0以上で入力してください。";
  }

  if (data.latest_inventory_count < 0) {
    errors.latest_inventory_count = "最新棚卸数は0以上で入力してください。";
  }

  return errors;
}

export function hasFormErrors(errors: ProductFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function formatProductSaveError(err: unknown): string {
  if (!(err instanceof Error)) {
    return "保存に失敗しました。";
  }

  if (
    err.message.includes("idx_products_part_number_unique") ||
    err.message.includes("duplicate key")
  ) {
    return "同じ品番が既に登録されています。別の品番を入力してください。";
  }

  return err.message;
}
