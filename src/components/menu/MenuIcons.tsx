/** メインメニュー用のSVGアイコン（Access版を簡略再現） */
type IconProps = {
  className?: string;
};

export function InventoryListIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="8" y="28" width="12" height="12" fill="#4a90d9" />
      <rect x="22" y="16" width="12" height="12" fill="#4a90d9" />
      <rect x="30" y="28" width="12" height="12" fill="#4a90d9" />
    </svg>
  );
}

export function MonthlyMovementIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="10" y="30" width="6" height="10" fill="#fff" />
      <rect x="20" y="22" width="6" height="18" fill="#fff" />
      <rect x="30" y="14" width="6" height="26" fill="#fff" />
    </svg>
  );
}

export function HistoryIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="8" y="20" width="28" height="16" fill="#4a90d9" rx="2" />
      <circle cx="14" cy="38" r="4" fill="#333" />
      <circle cx="30" cy="38" r="4" fill="#333" />
      <rect x="32" y="12" width="10" height="10" fill="#ccc" />
    </svg>
  );
}

export function InventoryCountIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="8" y="14" width="14" height="18" fill="#fff" />
      <rect x="24" y="14" width="14" height="18" fill="#4a90d9" />
      <rect x="8" y="34" width="30" height="4" fill="#ccc" />
    </svg>
  );
}

export function SettingsIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="8" y="10" width="24" height="18" fill="#ccc" />
      <rect x="10" y="12" width="20" height="14" fill="#4a90d9" />
      <rect x="30" y="30" width="10" height="12" fill="#fff" rx="1" />
    </svg>
  );
}

export function MasterIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="10" y="10" width="20" height="14" fill="#ccc" />
      <rect x="18" y="24" width="20" height="14" fill="#4a90d9" />
    </svg>
  );
}

export function UnregisteredIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        d="M24 10 C18 18, 12 22, 12 28 C12 34, 17 38, 24 38 C31 38, 36 34, 36 28 C36 22, 30 18, 24 10 Z"
        fill="#fff"
      />
    </svg>
  );
}

export function BarcodeIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="10" y="12" width="2" height="24" fill="#fff" />
      <rect x="14" y="12" width="4" height="24" fill="#fff" />
      <rect x="20" y="12" width="2" height="24" fill="#fff" />
      <rect x="24" y="12" width="6" height="24" fill="#fff" />
      <rect x="32" y="12" width="2" height="24" fill="#fff" />
      <rect x="36" y="12" width="4" height="24" fill="#fff" />
    </svg>
  );
}

export function DataTransferIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="14" y="10" width="20" height="28" fill="#ccc" rx="2" />
      <rect x="18" y="14" width="12" height="20" fill="#4a90d9" />
      <path d="M24 8 L30 16 L18 16 Z" fill="#e74c3c" />
    </svg>
  );
}

export function InventoryStartIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="12" y="8" width="24" height="32" fill="#ccc" rx="2" />
      <rect x="14" y="12" width="20" height="22" fill="#4a90d9" />
      <rect x="20" y="36" width="8" height="4" fill="#666" />
    </svg>
  );
}

export function ExitIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="14" fill="none" stroke="#fff" strokeWidth="3" />
      <line x1="24" y1="14" x2="24" y2="26" stroke="#fff" strokeWidth="3" />
      <line x1="24" y1="26" x2="18" y2="32" stroke="#fff" strokeWidth="3" />
    </svg>
  );
}
