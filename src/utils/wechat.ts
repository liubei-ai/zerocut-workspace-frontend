export function isWeiXin() {
  let ua = navigator.userAgent.toLowerCase();
  return ua.indexOf('micromessenger') !== -1;
}
