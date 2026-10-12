import { Platform } from 'react-native';
import type { PlatformOSType } from 'react-native';

const LOCALHOST_HOST = 'localhost';
const ANDROID_EMULATOR_HOST = '10.0.2.2';
export const CHALLENGE_SERVER_PORT = 8080;

export function resolveServerHost(platformOS: PlatformOSType): string {
  return platformOS === 'android' ? ANDROID_EMULATOR_HOST : LOCALHOST_HOST;
}

export function getServerHost(): string {
  return resolveServerHost(Platform.OS);
}

export function getHttpBaseUrl(): string {
  return `http://${getServerHost()}:${CHALLENGE_SERVER_PORT}`;
}

export function getWsBaseUrl(): string {
  return `ws://${getServerHost()}:${CHALLENGE_SERVER_PORT}`;
}
