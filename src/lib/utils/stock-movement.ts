import type {
  StockMovement,
  StockMovementFilter,
} from "@/lib/types/stock-movement";

const movementTypeLabels: Record<string, string> = {
  in: "入庫",
  out: "出庫",
  adjust: "調整",
};

export function getMovementTypeLabel(type: string): string {
  return movementTypeLabels[type] ?? type;
}

function matchesField(value: string, query: string): boolean {
  if (!query.trim()) {
    return true;
  }
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

/** 入出庫履歴の検索・絞り込み */
export function filterStockMovements(
  movements: StockMovement[],
  filter: StockMovementFilter
): StockMovement[] {
  return movements.filter((m) => {
    if (!matchesField(m.part_number, filter.partNumber)) {
      return false;
    }
    if (!matchesField(m.product_name, filter.productName)) {
      return false;
    }
    if (filter.movementType && m.movement_type !== filter.movementType) {
      return false;
    }
    if (filter.dateFrom) {
      const from = new Date(`${filter.dateFrom}T00:00:00`);
      if (new Date(m.performed_at) < from) {
        return false;
      }
    }
    if (filter.dateTo) {
      const to = new Date(`${filter.dateTo}T23:59:59`);
      if (new Date(m.performed_at) > to) {
        return false;
      }
    }
    return true;
  });
}

/** 日時表示 */
export function formatDateTime(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** 月別移動量の集計 */
export function aggregateMonthlyMovements(
  movements: StockMovement[]
): import("@/lib/types/monthly-movement").MonthlyMovementRow[] {
  const map = new Map<string, import("@/lib/types/monthly-movement").MonthlyMovementRow>();

  for (const m of movements) {
    const date = new Date(m.performed_at);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const key = `${yearMonth}|${m.part_number}`;

    const existing = map.get(key) ?? {
      yearMonth,
      part_number: m.part_number,
      product_name: m.product_name,
      shelf_number: m.shelf_number,
      in_quantity: 0,
      out_quantity: 0,
      net_quantity: 0,
    };

    if (m.movement_type === "in") {
      existing.in_quantity += m.quantity;
      existing.net_quantity += m.quantity;
    } else if (m.movement_type === "out") {
      existing.out_quantity += m.quantity;
      existing.net_quantity -= m.quantity;
    } else if (m.movement_type === "adjust") {
      const delta = m.quantity_after - m.quantity_before;
      if (delta >= 0) {
        existing.in_quantity += delta;
        existing.net_quantity += delta;
      } else {
        existing.out_quantity += Math.abs(delta);
        existing.net_quantity += delta;
      }
    }

    map.set(key, existing);
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.yearMonth !== b.yearMonth) {
      return b.yearMonth.localeCompare(a.yearMonth);
    }
    return a.part_number.localeCompare(b.part_number);
  });
}

export function filterMonthlyMovements(
  rows: import("@/lib/types/monthly-movement").MonthlyMovementRow[],
  filter: import("@/lib/types/monthly-movement").MonthlyMovementFilter
) {
  return rows.filter((row) => {
    if (filter.yearMonth && row.yearMonth !== filter.yearMonth) {
      return false;
    }
    if (!matchesField(row.part_number, filter.partNumber)) {
      return false;
    }
    if (!matchesField(row.product_name, filter.productName)) {
      return false;
    }
    return true;
  });
}

/** 利用可能な年月リスト */
export function getAvailableYearMonths(
  rows: import("@/lib/types/monthly-movement").MonthlyMovementRow[]
): string[] {
  return [...new Set(rows.map((r) => r.yearMonth))].sort((a, b) =>
    b.localeCompare(a)
  );
}
