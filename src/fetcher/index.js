async function fetchByType(doc) {
  const type = (doc.obj_type || '').toLowerCase();

  if (['doc', 'docx', 'wiki', 'mindnote'].includes(type)) {
    return {
      status: 'ok',
      kind: 'text',
      payload: {
        text: `# ${doc.doc_token}\nmock text content`,
      },
    };
  }

  return {
    status: 'unsupported',
    kind: 'unsupported',
    payload: null,
  };
}

module.exports = { fetchByType };
