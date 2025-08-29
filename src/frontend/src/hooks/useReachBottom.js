import { useEffect } from 'react';

/**
 * 监听ref元素的滚动，触底时触发回调
 * @param {React.RefObject} ref - 需要监听的滚动容器ref
 * @param {Function} onReachBottom - 触底时触发的回调
 * @param {Object} options - 可选项
 * @param {number} options.threshold - 距底部多少像素内触发，默认60
 * @param {boolean} options.enabled - 是否启用监听，默认true
 */
export function useReachBottom(ref, onReachBottom, options = {}) {
  const { threshold = 60, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (!node) return;

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        const { scrollTop, scrollHeight, clientHeight } = node;
        if (scrollHeight - scrollTop - clientHeight < threshold) {
          onReachBottom();
        }
      });
    };

    node.addEventListener('scroll', handleScroll);
    return () => {
      node.removeEventListener('scroll', handleScroll);
    };
  }, [ref, onReachBottom, threshold, enabled]);
}
