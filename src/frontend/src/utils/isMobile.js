// 判断是否为移动端设备
export default function isMobile() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|Mobile|iPod|Windows Phone/i.test(navigator.userAgent);
}
