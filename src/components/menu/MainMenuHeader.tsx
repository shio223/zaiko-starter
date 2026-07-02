/** メインメニューのヘッダー部分（Access版のタイトルバー・ロゴ・オレンジ帯） */
export function MainMenuHeader() {
  return (
    <>
      <div className="menu-title-bar">在庫管理システム &lt;&lt;メインメニュー&gt;&gt;</div>

      <div className="menu-brand-header">
        <div className="menu-brand-left">
          <span className="menu-brand-zaiko">ZaiKo</span>
          <span className="menu-brand-starter">STARTER</span>
        </div>
        <div className="menu-brand-right">
          <div className="menu-is-logo">
            <span className="menu-is-icon">IS</span>
            <span className="menu-is-text">SYSTEMS</span>
          </div>
        </div>
      </div>

      <div className="menu-sub-header">
        <span>HT在庫管理システム</span>
        <span>
          <span className="menu-demo-badge">デモ版</span>
          <span className="menu-version">Ver 1.0.0</span>
        </span>
      </div>
    </>
  );
}
