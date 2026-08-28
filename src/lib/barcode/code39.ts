/**
 * Full ASCII / Extended Code 39 エンコーダ
 *
 * 標準 Code-39（43文字）では表現できない ASCII 0–127 を、
 * 2文字シーケンス（$, /, %, + 前置）へ変換する。
 * 変換後の文字列は JsBarcode 標準 CODE39 で描画可能。
 *
 * 参照: Wikipedia Code 39 / Morovia Code 39 Specification
 */

/** JsBarcode CODE39.valid() と同等（標準 Code-39 文字集合） */
const STANDARD_CODE39_PATTERN = /^[0-9A-Z\-\.\ \$\/\+\%]+$/;

/**
 * ASCII 0–127 → Full ASCII Code 39 シーケンス
 * 標準文字（0-9 A-Z - . space）はそのまま。
 */
const FULL_ASCII_CODE39_MAP: readonly string[] = [
  /* 0x00–0x1F control */
  "%U",
  "$A",
  "$B",
  "$C",
  "$D",
  "$E",
  "$F",
  "$G",
  "$H",
  "$I",
  "$J",
  "$K",
  "$L",
  "$M",
  "$N",
  "$O",
  "$P",
  "$Q",
  "$R",
  "$S",
  "$T",
  "$U",
  "$V",
  "$W",
  "$X",
  "$Y",
  "$Z",
  "%A",
  "%B",
  "%C",
  "%D",
  "%E",
  /* 0x20–0x2F */
  " ",
  "/A",
  "/B",
  "/C",
  "/D",
  "/E",
  "/F",
  "/G",
  "/H",
  "/I",
  "/J",
  "/K",
  "/L",
  "-",
  ".",
  "/O",
  /* 0x30–0x3F */
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "/Z",
  "%F",
  "%G",
  "%H",
  "%I",
  "%J",
  /* 0x40–0x4F */
  "%V",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  /* 0x50–0x5F */
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "%K",
  "%L",
  "%M",
  "%N",
  "%O",
  /* 0x60–0x6F */
  "%W",
  "+A",
  "+B",
  "+C",
  "+D",
  "+E",
  "+F",
  "+G",
  "+H",
  "+I",
  "+J",
  "+K",
  "+L",
  "+M",
  "+N",
  "+O",
  /* 0x70–0x7F */
  "+P",
  "+Q",
  "+R",
  "+S",
  "+T",
  "+U",
  "+V",
  "+W",
  "+X",
  "+Y",
  "+Z",
  "%P",
  "%Q",
  "%R",
  "%S",
  "%T",
];

export type FullAsciiCode39Result =
  | {
      ok: true;
      /** JsBarcode に渡す標準 Code-39 文字列（利用者には非表示） */
      encoded: string;
      /** 元の品番（ラベル下表示用） */
      original: string;
    }
  | {
      ok: false;
      original: string;
      /** 非ASCIIなどマッピング不能な文字 */
      unmappedChars: string[];
      message: string;
    };

export function isStandardCode39(value: string): boolean {
  return value.length > 0 && STANDARD_CODE39_PATTERN.test(value);
}

/**
 * 品番を Full ASCII Code 39 用の標準 Code-39 文字列へ変換する。
 * 非 ASCII（半角カナ・全角など）は置換せず失敗を返す。
 */
export function encodeFullAsciiCode39(partNumber: string): FullAsciiCode39Result {
  const original = partNumber;

  if (!original) {
    return {
      ok: false,
      original,
      unmappedChars: [],
      message: "この品番にはCode-39で印刷できない文字が含まれています",
    };
  }

  let encoded = "";
  const unmappedChars: string[] = [];

  for (const ch of original) {
    const code = ch.codePointAt(0);
    if (code === undefined || code > 127) {
      if (!unmappedChars.includes(ch)) {
        unmappedChars.push(ch);
      }
      continue;
    }
    encoded += FULL_ASCII_CODE39_MAP[code];
  }

  if (unmappedChars.length > 0) {
    return {
      ok: false,
      original,
      unmappedChars,
      message: "この品番にはCode-39で印刷できない文字が含まれています",
    };
  }

  if (!isStandardCode39(encoded)) {
    return {
      ok: false,
      original,
      unmappedChars: [],
      message: "この品番にはCode-39で印刷できない文字が含まれています",
    };
  }

  return { ok: true, encoded, original };
}

/** 後方互換: 標準のみ判定（Full ASCII 変換前） */
export function isCode39Compatible(value: string): boolean {
  return encodeFullAsciiCode39(value).ok;
}

export function getCode39InvalidChars(value: string): string[] {
  const result = encodeFullAsciiCode39(value);
  if (result.ok) {
    return [];
  }
  return result.unmappedChars;
}
