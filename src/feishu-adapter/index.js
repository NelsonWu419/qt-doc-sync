function classifyFeishuType(objType = '') {
  const t = String(objType).toUpperCase();
  if (t === 'DOC') return 'doc';
  if (t === 'DOCX') return 'docx';
  if (t === 'SHEET') return 'sheet';
  if (t === 'BITABLE') return 'bitable';
  if (t === 'WIKI') return 'wiki';
  if (t === 'MINDNOTE') return 'mindnote';
  return String(objType || '').toLowerCase() || 'unknown';
}

function mapSearchItemsToSourceItems(items = []) {
  return items.map((item) => ({
    obj_token: item.obj_token || item.token || item.doc_token,
    title: item.title || item.title_highlighted || item.obj_token || item.token || item.doc_token,
    obj_type: classifyFeishuType(item.obj_type || item.doc_type || item.doc_types),
    parent_token: item.parent_token || null,
    update_time: item.update_time || item.create_time || null,
  }));
}

function buildDocFetchRequest(doc) {
  const type = String(doc.obj_type || '').toLowerCase();
  if (['doc', 'docx', 'wiki', 'mindnote'].includes(type)) {
    return { action: 'fetch_doc', doc_id: doc.doc_token };
  }
  if (type === 'sheet') {
    return { action: 'fetch_sheet', spreadsheet_token: doc.doc_token };
  }
  if (type === 'bitable') {
    return { action: 'fetch_bitable', app_token: doc.doc_token };
  }
  return { action: 'unsupported', doc_id: doc.doc_token };
}

module.exports = {
  classifyFeishuType,
  mapSearchItemsToSourceItems,
  buildDocFetchRequest,
};
