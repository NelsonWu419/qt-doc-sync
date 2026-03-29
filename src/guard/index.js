function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs(error, attempt, options = {}) {
  if (typeof options.retryDelayMs === 'function') {
    return options.retryDelayMs(error, attempt);
  }
  if (typeof options.retryDelayMs === 'number') {
    return options.retryDelayMs;
  }
  const base = options.baseDelayMs ?? options.delayMs ?? 0;
  return base > 0 ? base * (2 ** attempt) : 0;
}

function isRateLimitError(err) {
  return Boolean(
    err && (
      err.statusCode === 429 ||
      err.code === 429 ||
      err.status === 429 ||
      err.retryAfter !== undefined ||
      err.rateLimited === true
    )
  );
}

async function withRetry(task, options = {}) {
  const retries = options.retries ?? 2;
  const shouldRetry = options.shouldRetry || ((err) => err && (err.retryable === true || isRateLimitError(err)));

  let lastError;
  for (let i = 0; i <= retries; i += 1) {
    try {
      return await task();
    } catch (err) {
      lastError = err;
      if (i === retries || !shouldRetry(err)) throw err;
      const retryDelay = getRetryDelayMs(err, i, options);
      if (retryDelay > 0) await sleep(retryDelay);
    }
  }
  throw lastError;
}

async function withRateLimit(task, options = {}) {
  const delayMs = options.delayMs ?? 0;
  if (delayMs > 0) {
    await sleep(delayMs);
  }
  return task();
}

async function guarded(task, options = {}) {
  return withRetry(() => withRateLimit(task, options), options);
}

module.exports = { withRetry, withRateLimit, guarded, isRateLimitError, getRetryDelayMs, sleep };
