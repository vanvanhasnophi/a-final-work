// 提供带重试机制的动态 import 封装
// 使用方式：const Comp = lazyRetry(() => import('../pages/XXX'))
import React from 'react';

export function lazyRetry(importer, { retries = 3, retryDelay = 1000, onAttempt } = {}) {
  let attempt = 0;

  function load() {
    return importer().catch(err => {
      attempt += 1;
      const retriable = /Loading chunk|ChunkLoadError|NetworkError|Failed to fetch|timeout/i.test(err?.message || '');
      if (retriable && attempt <= retries) {
        if (typeof onAttempt === 'function') onAttempt(attempt, err);
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            load().then(resolve).catch(reject);
          }, typeof retryDelay === 'function' ? retryDelay(attempt) : retryDelay * attempt);
        });
      }
      throw err;
    });
  }

  return React.lazy(load);
}

export default lazyRetry;
