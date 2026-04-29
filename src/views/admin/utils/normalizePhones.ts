/**
 * 把用户粘贴的多手机号文本归一化为标准 11 位手机号数组。
 *
 * 兼容：
 * - 国家代码前缀：+86 / 086 / 86
 * - 段内格式空白：`153 5616 2166`、`138-0000-0001`、`138.0000.0002`、`(+86) 138 0000 0001`
 * - 段间硬分隔符：换行、Tab、逗号（中英文）、分号（中英文）
 * - 段间软分隔符（空格）：根据上下文自动判断是手机号内部格式还是分隔符
 *
 * 算法（每段独立处理）：
 *   1. 去除明确的格式字符（- . ( ) +）
 *   2. 去除国家代码前缀（+86 / 086 / 86，可带紧跟空格）
 *   3. 把段内的「数字组」按顺序提取（空格切分）
 *   4. 优先尝试把所有数字组拼起来：若总长度是 11 的倍数且每个 11 位 chunk
 *      都是合法的 `1\d{10}` 手机号 → 视为 N 个手机号
 *   5. 拼接策略不成立 → 回退：单个数字组本身就是合法手机号则收下
 *
 * 行为：
 * - 重复号码自动去重，保留首次出现顺序
 * - 不合法的片段静默丢弃
 */

const SOFT_FORMATTING_RE = /[-.()+]/g;
const COUNTRY_CODE_RE = /(?:\+|0)?86\s?(?=1\d{10})/g;
const HARD_SEPARATOR_RE = /[\n\r\t,，;；]+/;
const WHITESPACE_RE = /\s+/;
const PHONE_RE = /^1\d{10}$/;
const DIGITS_ONLY_RE = /^\d+$/;

/**
 * 若 digits 长度是 11 的倍数且每个 11 位 chunk 都是合法手机号，返回手机号数组；
 * 否则返回 null（让调用方走回退路径）。
 */
function splitConcatenatedAsPhones(digits: string): string[] | null {
  if (digits.length === 0 || digits.length % 11 !== 0) return null;
  const out: string[] = [];
  for (let i = 0; i < digits.length; i += 11) {
    const chunk = digits.slice(i, i + 11);
    if (!PHONE_RE.test(chunk)) return null;
    out.push(chunk);
  }
  return out;
}

function parsePhonesFromSegment(segment: string): string[] {
  // 1. 去除明确的格式字符
  let cleaned = segment.replace(SOFT_FORMATTING_RE, '');
  // 2. 去除国家代码前缀（紧跟空格也吃掉）
  cleaned = cleaned.replace(COUNTRY_CODE_RE, '');

  // 3. 提取段内所有「纯数字组」，保留顺序
  const groups = cleaned.split(WHITESPACE_RE).filter(g => DIGITS_ONLY_RE.test(g));
  if (groups.length === 0) return [];

  // 4. 优先尝试拼接策略
  const concatPhones = splitConcatenatedAsPhones(groups.join(''));
  if (concatPhones) return concatPhones;

  // 5. 回退：单个数字组本身就是合法手机号则保留
  const out: string[] = [];
  for (const g of groups) {
    if (PHONE_RE.test(g)) out.push(g);
  }
  return out;
}

export function normalizePhones(rawText: string): string[] {
  if (!rawText) return [];

  const segments = rawText.split(HARD_SEPARATOR_RE);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const seg of segments) {
    if (!seg.trim()) continue;
    for (const phone of parsePhonesFromSegment(seg)) {
      if (!seen.has(phone)) {
        seen.add(phone);
        out.push(phone);
      }
    }
  }
  return out;
}
