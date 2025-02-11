// Note: Ensure that `jest.config.js` is set to use `jsdom` as the test environment.
// Example: testEnvironment: 'jest-environment-jsdom'

import CookieProvider from '../src/CookieProvider';

describe('CookieProvider', () => {
  let cookieProvider: CookieProvider;

  beforeEach(() => {
    cookieProvider = new CookieProvider();
    document.cookie = ''; // Initialize cookies for testing.
  });

  test('should set and get a cookie', () => {
    const name = 'testCookie';
    const value = 'testValue';
    const exp = new Date();
    exp.setTime(exp.getTime() + (60*60*1000));

    cookieProvider.setCookie(name, value, exp);
    const result = cookieProvider.getCookie(name);

    expect(result).toBe(value);
  });

  test('should return null for a non-existing cookie', () => {
    const result = cookieProvider.getCookie('nonExistingCookie');
    expect(result).toBeNull();
  });

  test('should remove a cookie', () => {
    const name = 'testCookie';
    const value = 'testValue';
    const exp = new Date();
    exp.setTime(exp.getTime() + (60*60*1000));

    cookieProvider.setCookie(name, value, exp);
    cookieProvider.removeCookie(name);

    const result = cookieProvider.getCookie(name);
    expect(result).toBeNull();
  });

  test('should set, get, and remove banner cookie', () => {
    const value = 'bannerValue';
    const exp = new Date();
    exp.setTime(exp.getTime() + (60*60*1000));

    cookieProvider.setBanner(value, exp);
    const banner = cookieProvider.getBanner();
    expect(banner).toBe(value);

    cookieProvider.removeBanner();
    const removedBanner = cookieProvider.getBanner();
    expect(removedBanner).toBeNull();
  });
});
