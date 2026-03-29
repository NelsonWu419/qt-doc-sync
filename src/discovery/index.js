function discover(sourceItems = []) {
  return sourceItems.map((item) => ({
    doc_token: item.obj_token,
    title: item.title || item.obj_token || 'unknown',
    obj_type: item.obj_type || 'unknown',
    parent_token: item.parent_token || null,
    source_update_time: item.update_time || null,
  }));
}

module.exports = { discover };
