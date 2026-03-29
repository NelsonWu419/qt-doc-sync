function normalize(raw, doc) {
  const baseMeta = {
    doc_token: doc.doc_token,
    title: doc.title,
    obj_type: doc.obj_type,
  };

  if (raw.kind === 'text') {
    return {
      content: raw.payload?.text || '',
      schema: {},
      meta: baseMeta,
    };
  }

  return {
    content: '',
    schema: {},
    meta: baseMeta,
  };
}

module.exports = { normalize };
