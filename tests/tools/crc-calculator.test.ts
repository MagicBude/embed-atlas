import { describe, expect, it } from 'vitest';

import {
  calculateCrc,
  CRC_PRESETS,
  MAX_CRC_BYTES,
  reflectBits,
  type CrcModel,
} from '../../site/lib/tools/crc-calculator';

const checkBytes = Array.from(new TextEncoder().encode('123456789'));

describe('CRC preset check values', () => {
  for (const preset of CRC_PRESETS) {
    it(`${preset.name} matches its published check value`, () => {
      const result = calculateCrc(checkBytes, preset);
      expect(result).toMatchObject({ ok: true });
      if (result.ok) {
        expect(result.value.value).toBe(preset.check);
      }
    });
  }
});

describe('calculateCrc boundaries', () => {
  const crc8: CrcModel = CRC_PRESETS[0];

  it('rejects empty and invalid byte arrays', () => {
    expect(calculateCrc([], crc8)).toMatchObject({ ok: false, error: { code: 'EMPTY_DATA' } });
    expect(calculateCrc([0, 256], crc8)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_BYTE', index: 1 },
    });
    expect(calculateCrc([1.5], crc8)).toMatchObject({ ok: false, error: { code: 'INVALID_BYTE' } });
    expect(calculateCrc(new Array(MAX_CRC_BYTES + 1).fill(0), crc8)).toMatchObject({
      ok: false,
      error: { code: 'DATA_TOO_LARGE', maxBytes: MAX_CRC_BYTES },
    });
  });

  it('rejects zero and out-of-width parameters', () => {
    expect(calculateCrc([0], { ...crc8, poly: 0n })).toMatchObject({
      ok: false,
      error: { code: 'ZERO_POLYNOMIAL' },
    });
    expect(calculateCrc([0], { ...crc8, init: 0x100n })).toMatchObject({
      ok: false,
      error: { code: 'PARAMETER_OUT_OF_RANGE', parameter: 'init', width: 8 },
    });
  });

  it('honors RefOut independently from RefIn', () => {
    const ordinary = calculateCrc([0x01], crc8);
    const reflectedOutput = calculateCrc([0x01], { ...crc8, refOut: true });
    expect(ordinary).toMatchObject({ ok: true });
    expect(reflectedOutput).toMatchObject({ ok: true });
    if (ordinary.ok && reflectedOutput.ok) {
      expect(reflectedOutput.value.value).toBe(reflectBits(ordinary.value.value, 8));
    }
  });
});
