import { CHALLENGE_SERVER_PORT, resolveServerHost } from './server-config';
import type { PlatformOSType } from 'react-native';

describe('resolveServerHost', () => {
  it.each<[PlatformOSType, string]>([
    ['ios', 'localhost'],
    ['web', 'localhost'],
    ['android', '10.0.2.2'],
  ])('resolves %s to %s', (platformOS, expectedHost) => {
    expect(resolveServerHost(platformOS)).toBe(expectedHost);
  });
});

describe('CHALLENGE_SERVER_PORT', () => {
  it('is the port the challenge server listens on', () => {
    expect(CHALLENGE_SERVER_PORT).toBe(8080);
  });
});
