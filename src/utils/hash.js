const crypto = require('crypto');

function normalizeLineEndings(value) {
  return String(value ?? '').replace(/\r\n/g, '\n');
}

function stableStringify(value) {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return normalizeLineEndings(value);
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`;
}

function createHash(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function computeContentHash(content) {
  return createHash(normalizeLineEndings(content));
}

function computeSchemaHash(schema) {
  return createHash(stableStringify(schema ?? {}));
}

function computeDocumentHashes({ content, schema } = {}) {
  return {
    contentHash: computeContentHash(content),
    schemaHash: computeSchemaHash(schema),
  };
}

module.exports = {
  normalizeLineEndings,
  stableStringify,
  computeContentHash,
  computeSchemaHash,
  computeDocumentHashes,
};
