import { formatImperialMeasurement, formatImperialFraction, formatDimensionValue } from './formatters';
import { Dimension } from "../enums/Dimension";

describe('formatImperialMeasurement', () => {
  test('handles null and undefined values', () => {
    expect(formatImperialMeasurement(null)).toBe('');
    expect(formatImperialMeasurement(undefined)).toBe('');
  });

  test('formats small inch values', () => {
    expect(formatImperialMeasurement(5)).toBe('5.00"');
    expect(formatImperialMeasurement(5.5)).toBe('5.50"');
  });

  test('formats feet and inches', () => {
    expect(formatImperialMeasurement(12)).toBe('12.00" (1\'0")');
    expect(formatImperialMeasurement(15)).toBe('15.00" (1\'3")');
    expect(formatImperialMeasurement(36)).toBe('36.00" (3\'0")');
  });
});

describe('formatImperialFraction', () => {
  test('handles null and undefined values', () => {
    expect(formatImperialFraction(null)).toBe('');
    expect(formatImperialFraction(undefined)).toBe('');
  });

  test('formats zero value', () => {
    expect(formatImperialFraction(0)).toBe('0"');
    expect(formatImperialFraction(0.0005)).toBe('0"');
  });

  test('formats negative values', () => {
    expect(formatImperialFraction(-1.25)).toContain('-');
    expect(formatImperialFraction(-1.25)).toContain('1/4');
  });

  test('formats simple fractions', () => {
    expect(formatImperialFraction(0.25)).toBe('1/4"');
    expect(formatImperialFraction(0.5)).toBe('1/2"');
    expect(formatImperialFraction(0.75)).toBe('3/4"');
  });

  test('formats mixed numbers', () => {
    expect(formatImperialFraction(1.25)).toBe('1-1/4"');
    expect(formatImperialFraction(2.5)).toBe('2-1/2"');
    expect(formatImperialFraction(3.75)).toBe('3-3/4"');
  });

  test('formats feet notation for large values', () => {
    expect(formatImperialFraction(12)).toContain('(1\'');
    expect(formatImperialFraction(12, true)).not.toContain('(1\'');
  });
});

describe('formatDimensionValue', () => {
  test('handles null and undefined values', () => {
    expect(formatDimensionValue(null, Dimension.LENGTH, 'in')).toBe('');
    expect(formatDimensionValue(undefined, Dimension.WIDTH, 'mm')).toBe('');
  });

  test('formats imperial thickness differently than other dimensions', () => {
    const thicknessFormat = formatDimensionValue(19.05, Dimension.THICKNESS, 'in');
    const widthFormat = formatDimensionValue(19.05, Dimension.WIDTH, 'in');
    expect(thicknessFormat).not.toBe(widthFormat);
    expect(thicknessFormat).toContain('(');
  });

  test('formats metric values', () => {
    expect(formatDimensionValue(25.4, Dimension.LENGTH, 'mm')).toContain('mm');
    expect(formatDimensionValue(25.4, Dimension.LENGTH, 'mm')).toContain('25.4');
  });
  
  test('converts correctly between mm and inches', () => {
    // 25.4mm = 1 inch
    const mmValue = formatDimensionValue(25.4, Dimension.LENGTH, 'mm');
    const inchValue = formatDimensionValue(25.4, Dimension.LENGTH, 'in');
    expect(mmValue).toContain('25.4');
    expect(inchValue).toContain('1');
  });
});
