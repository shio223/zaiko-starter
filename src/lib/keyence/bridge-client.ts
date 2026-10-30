/**
 * KEYENCE BT-600 ローカル連携ソフト（Windows PC 上の Bridge）クライアント
 *
 * 127.0.0.1 は「このブラウザを開いている PC」を指すため、必ずブラウザから直接呼ぶ
 * （サーバー / Vercel Functions 経由にしない）。
 * 受信した内容は返すだけで、在庫・DB には一切触れない。
 */

const DEFAULT_BRIDGE_URL = "http://127.0.0.1:8765";
const BRIDGE_HEADER_NAME = "X-BT-Bridge";
const BRIDGE_HEADER_VALUE = "zaiko-bt600";
const RECEIVE_TIMEOUT_MS = 120_000;
const DEFAULT_FILE_NAME = "BT600_INOUT_LOG.TXT";

export const KEYENCE_BRIDGE_URL = (
  process.env.NEXT_PUBLIC_KEYENCE_BRIDGE_URL || DEFAULT_BRIDGE_URL
).replace(/\/+$/, "");

export type KeyenceBridgeErrorKind = "no_data" | "unreachable" | "timeout" | "failed";

const USER_MESSAGES: Record<KeyenceBridgeErrorKind, string> = {
  no_data: "BT-600に新しいデータがありません。",
  unreachable:
    "BT-600連携ソフトに接続できませんでした。このPCでBT-600連携ソフトが起動しているか確認してください。",
  timeout:
    "BT-600からの受信に時間がかかりすぎたため中止しました。BT-600を通信ユニットにセットし直して、もう一度お試しください。",
  failed:
    "BT-600から受信できませんでした。BT-600を通信ユニットにセットし直して、もう一度お試しください。",
};

/** 利用者向けの日本語メッセージを持つエラー（技術的な詳細は console にだけ出す） */
export class KeyenceBridgeError extends Error {
  readonly kind: KeyenceBridgeErrorKind;

  constructor(kind: KeyenceBridgeErrorKind) {
    super(USER_MESSAGES[kind]);
    this.name = "KeyenceBridgeError";
    this.kind = kind;
  }
}

export type KeyenceBridgeReceived = {
  fileName: string;
  /** 旧 Access 形式に変換済みの INOUT_LOG 本文 */
  content: string;
};

type BridgeReceiveResponse = {
  ok?: boolean;
  fileName?: unknown;
  content?: unknown;
  error?: unknown;
};

/** BT-600 からログを受信する（POST /receive）。受信内容を返すだけで保存はしない */
export async function receiveFromKeyenceBridge(): Promise<KeyenceBridgeReceived> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RECEIVE_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${KEYENCE_BRIDGE_URL}/receive`, {
      method: "POST",
      headers: { [BRIDGE_HEADER_NAME]: BRIDGE_HEADER_VALUE },
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    if (controller.signal.aborted) {
      console.error("[KeyenceBridge] /receive timed out", err);
      throw new KeyenceBridgeError("timeout");
    }
    console.error("[KeyenceBridge] /receive unreachable", err);
    throw new KeyenceBridgeError("unreachable");
  } finally {
    clearTimeout(timer);
  }

  let body: BridgeReceiveResponse;
  try {
    body = (await response.json()) as BridgeReceiveResponse;
  } catch (err) {
    console.error("[KeyenceBridge] /receive returned non-JSON", response.status, err);
    throw new KeyenceBridgeError("failed");
  }

  if (body.ok === false && body.error === "no_log_file") {
    throw new KeyenceBridgeError("no_data");
  }
  if (!response.ok || body.ok !== true || typeof body.content !== "string") {
    console.error("[KeyenceBridge] /receive failed", response.status, body);
    throw new KeyenceBridgeError("failed");
  }
  if (body.content.trim() === "") {
    throw new KeyenceBridgeError("no_data");
  }

  const fileName =
    typeof body.fileName === "string" && body.fileName.trim() !== ""
      ? body.fileName.trim()
      : DEFAULT_FILE_NAME;

  return { fileName, content: body.content };
}
