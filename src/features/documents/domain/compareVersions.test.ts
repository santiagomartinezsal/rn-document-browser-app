import { compareVersions } from './compareVersions';

describe('compareVersions', () => {
  it('returns 0 for equal versions', () => {
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
  });

  it('compares multi-digit segments numerically, not lexicographically', () => {
    expect(compareVersions('2.10.0', '2.9.1')).toBeGreaterThan(0);
    expect(compareVersions('2.9.1', '2.10.0')).toBeLessThan(0);
  });

  it('treats missing trailing segments as zero', () => {
    expect(compareVersions('1.2', '1.2.0')).toBe(0);
    expect(compareVersions('1.2.1', '1.2')).toBeGreaterThan(0);
  });
});
