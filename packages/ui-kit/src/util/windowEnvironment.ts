export enum MouseButton {
  Main = 0,
  Auxiliary = 1,
  Secondary = 2,
  Fourth = 3,
  Fifth = 4,
}

export function getPlatform() {
  const { userAgent, platform } = window.navigator;

  const iosPlatforms = ['iPhone', 'iPad', 'iPod'];
  if (
    iosPlatforms.indexOf(platform) !== -1
    // For new IPads with M1 chip and IPadOS platform returns "MacIntel"
    || (platform === 'MacIntel' && ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 2))
  ) return 'iOS';

  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
  if (macosPlatforms.indexOf(platform) !== -1) return 'macOS';

  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
  if (windowsPlatforms.indexOf(platform) !== -1) return 'Windows';

  if (/Android/.test(userAgent)) return 'Android';

  if (/Linux/.test(platform)) return 'Linux';

  return undefined;
}
export const ANIMATION_END_DELAY = 100;
export const IS_TOUCH_ENV = window.matchMedia("(pointer: coarse)").matches;
export const PLATFORM_ENV = getPlatform();
export const IS_MAC_OS = PLATFORM_ENV === 'macOS';
export const IS_WINDOWS = PLATFORM_ENV === 'Windows';
export const IS_LINUX = PLATFORM_ENV === 'Linux';
export const IS_IOS = PLATFORM_ENV === 'iOS';
export const IS_ANDROID = PLATFORM_ENV === 'Android';
export const IS_MOBILE = IS_IOS || IS_ANDROID;
export const IS_SAFARI = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
export const IS_YA_BROWSER = navigator.userAgent.includes('YaBrowser');
export const IS_FIREFOX = navigator.userAgent.toLowerCase().includes('firefox')
  || navigator.userAgent.toLowerCase().includes('iceweasel')
  || navigator.userAgent.toLowerCase().includes('icecat');
//@ts-ignore
export const IS_ELECTRON = Boolean(window?.electron);

export const IS_BACKDROP_BLUR_SUPPORTED = CSS.supports('backdrop-filter: blur()')
  || CSS.supports('-webkit-backdrop-filter: blur()');