const test = require('node:test');
const assert = require('node:assert/strict');
const { withRetry, guarded, isRateLimitError, getRetryDelayMs } = require('../src/guard');

test('retries retryable task and succeeds', async () => {
  let count = 0;
  const result = await withRetry(async () => {
    count += 1;
    if (count < 2) {
      const err = new Error('retry me');
      err.retryable = true;
      throw err;
    }
    return 'ok';
  }, { retries: 2 });

  assert.equal(result, 'ok');
  assert.equal(count, 2);
});

test('throws non-retryable error immediately', async () => {
  await assert.rejects(
    () => withRetry(async () => {
      throw new Error('fatal');
    }, { retries: 2 }),
    /fatal/
  );
});

test('guarded wraps task with retry and rate limit', async () => {
  const result = await guarded(async () => 'ok', { retries: 1, delayMs: 1 });
  assert.equal(result, 'ok');
});

test('detects rate limit errors and backoff delay', () => {
  assert.equal(isRateLimitError({ statusCode: 429 }), true);
  assert.equal(getRetryDelayMs(new Error('x'), 2, { baseDelayMs: 10 }), 40);
});
