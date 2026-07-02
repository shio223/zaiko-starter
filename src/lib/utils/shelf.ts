import type { Shelf, ShelfFormData, ShelfSearchFilter } from "@/lib/types/shelf";

function matchesField(value: string, query: string): boolean {
  if (!query.trim()) {
    return true;
  }
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

/** 棚番マスタ一覧の検索・絞り込み */
export function filterShelves(
  shelves: Shelf[],
  filter: ShelfSearchFilter
): Shelf[] {
  const conditions = [
    (s: Shelf) => matchesField(s.shelf_number, filter.shelfNumber),
    (s: Shelf) => matchesField(s.shelf_name, filter.shelfName),
    (s: Shelf) => matchesField(s.location, filter.location),
  ];

  const activeConditions = conditions.filter((_, index) => {
    const fields = [filter.shelfNumber, filter.shelfName, filter.location];
    return fields[index].trim() !== "";
  });

  if (activeConditions.length === 0) {
    return shelves;
  }

  return shelves.filter((shelf) => {
    if (filter.mode === "AND") {
      return activeConditions.every((condition) => condition(shelf));
    }
    return activeConditions.some((condition) => condition(shelf));
  });
}

export function shelfToFormData(shelf: Shelf): ShelfFormData {
  return {
    shelf_number: shelf.shelf_number,
    shelf_name: shelf.shelf_name,
    location: shelf.location,
    memo: shelf.memo,
  };
}

export function normalizeShelfFormData(data: ShelfFormData): ShelfFormData {
  return {
    shelf_number: data.shelf_number.trim(),
    shelf_name: data.shelf_name.trim(),
    location: data.location.trim(),
    memo: data.memo.trim(),
  };
}
