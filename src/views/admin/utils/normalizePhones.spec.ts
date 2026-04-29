import { describe, expect, it } from 'vite-plus/test';

import { normalizePhones } from './normalizePhones';

describe('normalizePhones', () => {
  it('returns empty array for empty / nullish input', () => {
    expect(normalizePhones('')).toEqual([]);
  });

  it('parses comma-separated 11-digit phones', () => {
    expect(normalizePhones('13800000001,13800000002')).toEqual(['13800000001', '13800000002']);
  });

  it('handles mixed separators (newline, space, Chinese comma, semicolon)', () => {
    const input = '13800000001\n13800000002 13800000003，13800000004；13800000005';
    expect(normalizePhones(input)).toEqual([
      '13800000001',
      '13800000002',
      '13800000003',
      '13800000004',
      '13800000005',
    ]);
  });

  it('strips +86 prefix', () => {
    expect(normalizePhones('+86 13800000001')).toEqual(['13800000001']);
  });

  it('strips 086 prefix', () => {
    expect(normalizePhones('08613800000001')).toEqual(['13800000001']);
  });

  it('strips 86 prefix when leading 13 digits', () => {
    expect(normalizePhones('8613800000001')).toEqual(['13800000001']);
  });

  it('strips dashes and dots', () => {
    expect(normalizePhones('138-0000-0001, 138.0000.0002')).toEqual(['13800000001', '13800000002']);
  });

  it('deduplicates while preserving first-seen order', () => {
    expect(normalizePhones('13800000002, 13800000001, 13800000002, 13800000001')).toEqual([
      '13800000002',
      '13800000001',
    ]);
  });

  it('silently drops invalid fragments (too short, wrong leading digit, garbage)', () => {
    const input = '12345, 23800000001, abcd, 13800000001';
    expect(normalizePhones(input)).toEqual(['13800000001']);
  });

  it('rejects phones not starting with 1', () => {
    expect(normalizePhones('20000000000')).toEqual([]);
  });

  it('handles parentheses and plus in mixed format', () => {
    expect(normalizePhones('(+86) 138-0000-0001')).toEqual(['13800000001']);
  });

  it('treats internal spaces as formatting (parses 153 5616 2166 as one phone)', () => {
    expect(normalizePhones('153 5616 2166')).toEqual(['15356162166']);
  });

  it('parses multiple phones each containing internal-space formatting', () => {
    const input = '153 5616 2166, 138 0000 0001\n139 0000 0002';
    expect(normalizePhones(input)).toEqual(['15356162166', '13800000001', '13900000002']);
  });

  it('falls back to space-separated parsing when whole-segment glue fails', () => {
    // 两个完整 11 位手机号用空格分隔（无逗号）— 整段拼起来不是有效手机号，
    // 应回退到按空格切分
    expect(normalizePhones('13800000001 13800000002')).toEqual(['13800000001', '13800000002']);
  });

  it('handles mixed: comma + internal-space formatting + space-separated', () => {
    const input = '153 5616 2166 13900000003, 138-0000-0001';
    expect(normalizePhones(input)).toEqual(['15356162166', '13900000003', '13800000001']);
  });
});
