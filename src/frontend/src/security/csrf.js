import { probeCsrfEnabled, readCookie } from '../api';

let lastStatus = { enabled: true, tokenPresent: false, checkedAt: 0 };

export async function probeCsrf() {
  const enabled = await probeCsrfEnabled();
  const token = readCookie('XSRF-TOKEN');
  lastStatus = { enabled, tokenPresent: !!token, checkedAt: Date.now() };
  return lastStatus;
}

export function getCsrfStatus() {
  const token = readCookie('XSRF-TOKEN');
  return { ...lastStatus, tokenPresent: !!token };
}
