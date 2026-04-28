/**
 * 把用户粘贴的"逗号/换行/空格"分隔的手机号文本归一化为标准 11 位手机号数组。
 *
 * 兼容：
 * - 国家代码前缀：+86 / 086 / 86
 * - 中文/英文逗号、空格、Tab、换行
 * - 横杠 / 圆点（如 138-0013-8000）
 *
 * 行为：
 * - 仅保留连续 11 位数字，且首位为 1（中国大陆手机号格式）
 * - 重复号码自动去重，保留首次出现顺序
 * - 不合法的片段静默丢弃（不报错；前端可对比 input/output 长度提示用户）
 */
export function normalizePhones(rawText: string): string[] {
  if (!rawText) return [];

  // 1. 把所有可能的分隔符（中英文逗号、分号、空白、Tab、换行）替换成单一逗号
  const flat = rawText.replace(/[,、，;；\s\t\r\n]+/g, ',');

  // 2. 拆分并对每个片段做归一化
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of flat.split(',')) {
    if (!raw) continue;

    // 去除横杠、圆点、加号、括号等
    const digitsOnly = raw.replace(/[-.()+]/g, '');

    // 去除可能的国家代码前缀
    let normalized = digitsOnly;
    if (normalized.startsWith('086')) {
      normalized = normalized.slice(3);
    } else if (normalized.startsWith('86') && normalized.length === 13) {
      normalized = normalized.slice(2);
    }

    // 仅接受 11 位、首位为 1 的中国大陆手机号
    if (!/^1\d{10}$/.test(normalized)) continue;

    if (!seen.has(normalized)) {
      seen.add(normalized);
      out.push(normalized);
    }
  }

  return out;
}
