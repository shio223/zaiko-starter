import {
  createShelf,
  isShelfNumberTaken,
  updateShelf,
} from "@/lib/supabase/shelves";
import type { ShelfFormData } from "@/lib/types/shelf";
import { normalizeShelfFormData } from "@/lib/utils/shelf";
import {
  formatShelfSaveError,
  hasShelfFormErrors,
  validateShelfForm,
  type ShelfFormErrors,
} from "@/lib/utils/shelf-validation";

type SaveShelfResult =
  | { ok: true }
  | { ok: false; errors: ShelfFormErrors }
  | { ok: false; message: string };

export async function saveNewShelf(
  formData: ShelfFormData
): Promise<SaveShelfResult> {
  const normalized = normalizeShelfFormData(formData);
  const errors = validateShelfForm(normalized);

  if (hasShelfFormErrors(errors)) {
    return { ok: false, errors };
  }

  try {
    if (await isShelfNumberTaken(normalized.shelf_number)) {
      return {
        ok: false,
        errors: { shelf_number: "同じ棚番が既に登録されています。" },
      };
    }

    await createShelf(normalized);
    return { ok: true };
  } catch (err) {
    return { ok: false, message: formatShelfSaveError(err) };
  }
}

export async function saveExistingShelf(
  id: string,
  formData: ShelfFormData
): Promise<SaveShelfResult> {
  const normalized = normalizeShelfFormData(formData);
  const errors = validateShelfForm(normalized);

  if (hasShelfFormErrors(errors)) {
    return { ok: false, errors };
  }

  try {
    if (await isShelfNumberTaken(normalized.shelf_number, id)) {
      return {
        ok: false,
        errors: { shelf_number: "同じ棚番が既に登録されています。" },
      };
    }

    await updateShelf(id, normalized);
    return { ok: true };
  } catch (err) {
    return { ok: false, message: formatShelfSaveError(err) };
  }
}
