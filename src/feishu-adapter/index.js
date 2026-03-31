function classifyFeishuType(objType = '') {
  const t = String(objType).toUpperCase();
  let result;
  if (t === 'DOC') result = 'doc';
  else if (t === 'DOCX') result = 'docx';
  else if (t === 'SHEET') result = 'sheet';
  else if (t === 'BITABLE') result = 'bitable';
  else if (t === 'WIKI') result = 'wiki';
  else if (t === 'MINDNOTE') result = 'mindnote';
  else result = String(objType || '').toLowerCase() || 'unknown';

  return result;
}

function mapSearchItemsToSourceItems(items = []) {
  return items.map((item) => {
    const obj_type = classifyFeishuType(item.obj_type || item.doc_type || item.doc_types);
    const mapped = {
      obj_token: item.obj_token || item.token || item.doc_token,
      title: item.title || item.title_highlighted || item.obj_token || item.token || item.doc_token,
      obj_type: obj_type,
      parent_token: item.parent_token || null,
      update_time: item.update_time || item.create_time || null,
    };
    return mapped;
  });
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
