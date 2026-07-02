import type { Product, ProductFormData, SearchFilter } from "@/lib/types/product";

/** 部分一致検索（大文字小文字を区別しない） */
function matchesField(value: string, query: string): boolean {
  if (!query.trim()) {
    return true;
  }
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

/**
 * 在庫リストの検索・絞り込み
 * 入力された条件のみを AND または OR で適用
 */
export function filterProducts(
  products: Product[],
  filter: SearchFilter
): Product[] {
  const conditions = [
    (p: Product) => matchesField(p.part_number, filter.partNumber),
    (p: Product) => matchesField(p.product_name, filter.productName),
    (p: Product) => matchesField(p.shelf_number, filter.shelfNumber),
    (p: Product) => matchesField(p.supplier, filter.supplier),
  ];

  // 入力がある検索条件だけを抽出
  const activeConditions = conditions.filter((_, index) => {
    const fields = [
      filter.partNumber,
      filter.productName,
      filter.shelfNumber,
      filter.supplier,
    ];
    return fields[index].trim() !== "";
  });

  if (activeConditions.length === 0) {
    return products;
  }

  return products.filter((product) => {
    if (filter.mode === "AND") {
      return activeConditions.every((condition) => condition(product));
    }
    return activeConditions.some((condition) => condition(product));
  });
}

/** 数値を日本語形式で表示（例: 1,200） */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("ja-JP").format(value);
}

/** 金額表示（例: ¥1,200） */
export function formatCurrency(value: number): string {
  return `¥${formatNumber(value)}`;
}

/** DBの製品データを編集フォーム用に変換 */
export function productToFormData(product: Product) {
  return {
    shelf_number: product.shelf_number,
    supplier: product.supplier,
    department: product.department,
    part_number: product.part_number,
    product_name: product.product_name,
    quantity: product.quantity,
    unit_price: product.unit_price,
    reorder_point: product.reorder_point,
    memo: product.memo,
    last_inventory_count: product.last_inventory_count,
  };
}

/** 保存前に文字列項目をトリム */
export function normalizeProductFormData(data: ProductFormData): ProductFormData {
  return {
    ...data,
    shelf_number: data.shelf_number.trim(),
    supplier: data.supplier.trim(),
    department: data.department.trim(),
    part_number: data.part_number.trim(),
    product_name: data.product_name.trim(),
    memo: data.memo.trim(),
  };
}
