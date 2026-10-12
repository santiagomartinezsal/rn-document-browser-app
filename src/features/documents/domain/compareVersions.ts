export function compareVersions(a: string, b: string): number {
  const segmentsA = a.split('.').map(Number);
  const segmentsB = b.split('.').map(Number);
  const segmentCount = Math.max(segmentsA.length, segmentsB.length);

  for (let i = 0; i < segmentCount; i++) {
    const diff = (segmentsA[i] ?? 0) - (segmentsB[i] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
}
