/**
 * 文字正規化與斷詞（不依賴外部套件）
 * 中文採字元 bigram，英數採整個單字，適合短句檢索。
 */

/** 全形轉半形、轉小寫、統一空白 */
export function normalize(input: string): string {
  return input.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** 只保留中文、英數字，用於比對關鍵詞 */
export function compact(input: string): string {
  return normalize(input).replace(/[^\p{Script=Han}a-z0-9]/gu, '');
}

const CJK = /\p{Script=Han}/u;

export function tokenize(input: string): string[] {
  const text = normalize(input);
  const tokens: string[] = [];
  let cjkRun = '';
  let word = '';

  const flushCjk = () => {
    if (cjkRun.length === 1) tokens.push(cjkRun);
    for (let i = 0; i < cjkRun.length - 1; i++) tokens.push(cjkRun.slice(i, i + 2));
    cjkRun = '';
  };
  const flushWord = () => {
    if (word) tokens.push(word);
    word = '';
  };

  for (const ch of text) {
    if (CJK.test(ch)) {
      flushWord();
      cjkRun += ch;
    } else if (/[a-z0-9]/.test(ch)) {
      flushCjk();
      word += ch;
    } else {
      flushCjk();
      flushWord();
    }
  }
  flushCjk();
  flushWord();
  return tokens;
}
