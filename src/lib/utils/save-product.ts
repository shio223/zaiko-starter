/**
 * 製品マスタの保存処理（新規・編集共通）
 */
import {
  createProduct,
  isPartNumberTaken,
  updateProduct,
} from "@/lib/supabase/client";
import type { ProductFormData } from "@/lib/types/product";
import { normalizeProductFormData } from "@/lib/utils/product";
import {
  formatProductSaveError,
  hasFormErrors,
  validateProductForm,
  type ProductFormErrors,
} from "@/lib/utils/product-validation";

type SaveProductResult =
  | { ok: true }
  | { ok: false; errors: ProductFormErrors }
  | { ok: false; message: string };

/** 新規登録 */
export async function saveNewProduct(
  formData: ProductFormData
): Promise<SaveProductResult> {
  const normalized = normalizeProductFormData(formData);
  const errors = validateProductForm(normalized);

  if (hasFormErrors(errors)) {
    return { ok: false, errors };
  }

  try {
    if (await isPartNumberTaken(normalized.part_number)) {
      return {
        ok: false,
        errors: { part_number: "同じ品番が既に登録されています。" },
      };
    }

    await createProduct(normalized);
    return { ok: true };
  } catch (err) {
    return { ok: false, message: formatProductSaveError(err) };
  }
}

/** 更新 */
export async function saveExistingProduct(
  id: string,
  formData: ProductFormData
): Promise<SaveProductResult> {
  const normalized = normalizeProductFormData(formData);
  const errors = validateProductForm(normalized);

  if (hasFormErrors(errors)) {
    return { ok: false, errors };
  }

  try {
    if (await isPartNumberTaken(normalized.part_number, id)) {
      return {
        ok: false,
        errors: { part_number: "同じ品番が既に登録されています。" },
      };
    }

    await updateProduct(id, normalized);
    return { ok: true };
  } catch (err) {
    return { ok: false, message: formatProductSaveError(err) };
  }
}
