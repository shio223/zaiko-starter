/**
 * メインメニュー画面（Access版と同じ3列レイアウト）
 * 青=データ閲覧 / 緑=設定・マスタ / オレンジ=操作 / 赤=終了
 */
"use client";

import { MainMenuHeader } from "@/components/menu/MainMenuHeader";
import { MenuButton } from "@/components/menu/MenuButton";
import {
  BarcodeIcon,
  DataTransferIcon,
  ExitIcon,
  HistoryIcon,
  InventoryCountIcon,
  InventoryListIcon,
  InventoryStartIcon,
  MasterIcon,
  MonthlyMovementIcon,
  SettingsIcon,
  UnregisteredIcon,
} from "@/components/menu/MenuIcons";

/** 左列：青ボタン（在庫・履歴系） */
const column1 = [
  {
    number: 1,
    label: "在庫リスト",
    href: "/inventory",
    variant: "blue" as const,
    Icon: InventoryListIcon,
  },
  {
    number: 2,
    label: "月別移動量",
    href: "/monthly-movement",
    variant: "blue" as const,
    Icon: MonthlyMovementIcon,
  },
  {
    number: 3,
    label: "入出庫履歴",
    href: "/history",
    variant: "blue" as const,
    Icon: HistoryIcon,
  },
  {
    number: 4,
    label: "棚卸リスト",
    href: "/inventory-count",
    variant: "blue" as const,
    Icon: InventoryCountIcon,
  },
];

/** 中央列：緑ボタン（設定・マスタ系） */
const column2 = [
  {
    number: 5,
    label: "環境設定",
    href: "/settings",
    variant: "green" as const,
    Icon: SettingsIcon,
  },
  {
    number: 6,
    label: "マスタ保守",
    href: "/master",
    variant: "green" as const,
    Icon: MasterIcon,
  },
  {
    number: 7,
    label: "未登録リスト",
    href: "/unregistered",
    variant: "green" as const,
    Icon: UnregisteredIcon,
  },
  {
    number: 8,
    label: "バーコード印刷",
    href: "/barcode",
    variant: "green" as const,
    Icon: BarcodeIcon,
  },
];

/** 右列：オレンジボタン（操作系）＋終了ボタン */
const column3 = [
  {
    number: 9,
    label: "データ転送",
    href: "/data-transfer",
    variant: "orange" as const,
    Icon: DataTransferIcon,
  },
  {
    number: 10,
    label: "棚卸開始",
    href: "/inventory-start",
    variant: "orange" as const,
    Icon: InventoryStartIcon,
  },
];

export default function MainMenuPage() {
  return (
    <div className="menu-screen">
      <div className="menu-window">
        <MainMenuHeader />

        <div className="menu-body">
          <div className="menu-columns">
            <div className="menu-column">
              {column1.map((item) => (
                <MenuButton
                  key={item.number}
                  number={item.number}
                  label={item.label}
                  href={item.href}
                  variant={item.variant}
                  icon={<item.Icon className="menu-icon-svg" />}
                />
              ))}
            </div>

            <div className="menu-column">
              {column2.map((item) => (
                <MenuButton
                  key={item.number}
                  number={item.number}
                  label={item.label}
                  href={item.href}
                  variant={item.variant}
                  icon={<item.Icon className="menu-icon-svg" />}
                />
              ))}
            </div>

            <div className="menu-column menu-column-right">
              {column3.map((item) => (
                <MenuButton
                  key={item.number}
                  number={item.number}
                  label={item.label}
                  href={item.href}
                  variant={item.variant}
                  icon={<item.Icon className="menu-icon-svg" />}
                />
              ))}

              {/* 終了ボタンを右列の下に配置（Access版と同じ） */}
              <div className="menu-spacer" aria-hidden="true" />

              <MenuButton
                number={11}
                label="終　了"
                variant="red"
                icon={<ExitIcon className="menu-icon-svg" />}
                onClick={() => window.close()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
