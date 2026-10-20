(() => {
  const ORIGIN = 'https://notes.sgao.cc';
  const channel = new URLSearchParams(location.search).get('channel');
  const opener = window.opener;
  const fileInput = document.querySelector('#imageFile'), preview = document.querySelector('#preview');
  const connection = document.querySelector('#connectionStatus'), result = document.querySelector('#result');
  const button = document.querySelector('#uploadButton'), uploadedLink = document.querySelector('#uploadedLink');
  const extensions = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
  let noteId = '', selected = null, previewUrl = '', uploading = false, completed = false, received = false;
  const connected = opener && /^[a-f0-9-]{36}$/i.test(channel || '');
  document.querySelector('#loginLink').href = '/api/login?returnTo=' + encodeURIComponent(location.pathname + location.search);
  const send = message => { if (connected) opener.postMessage({ ...message, channel }, ORIGIN); };
  function update() { button.disabled = !window.imageAccount.authorized || !noteId || !selected || uploading || completed; fileInput.disabled = uploading || completed; }
  function select(file) {
    if (!file || uploading || completed) return;
    if (!extensions[file.type] || file.size <= 0 || file.size > 10 * 1024 * 1024) {
      selected = null; if (previewUrl) URL.revokeObjectURL(previewUrl); preview.hidden = true;
      document.querySelector('#filename').textContent = '';
      result.textContent = '请选择不超过 10 MB 的 PNG、JPEG、WebP 或 GIF 图片。'; update(); return;
    }
    selected = file; result.textContent = '';
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file); preview.src = previewUrl; preview.hidden = false;
    document.querySelector('#filename').textContent = `${file.name || '剪贴板截图'} · ${(file.size / 1024).toFixed(1)} KB`;
    update();
  }
  const ready = () => {
    if (!connected) { connection.textContent = '请从随手记中的「上传图片」按钮打开本窗口。'; return; }
    if (!received && window.imageAccount.authorized) send({ type: 'sgao-notes-image-ready' });
  };
  const interval = setInterval(ready, 1000);
  window.addEventListener('message', event => {
    if (!connected || event.origin !== ORIGIN || event.source !== opener || event.data?.channel !== channel
      || event.data?.type !== 'sgao-notes-image-init' || received) return;
    if (!/^[a-z0-9_-]{1,80}$/i.test(event.data.noteId)) return;
    received = true; noteId = event.data.noteId; clearInterval(interval);
    connection.textContent = '已连接随手记，上传后将返回原笔记。';
    if (event.data.file instanceof File) select(event.data.file);
    update();
  });
  window.addEventListener('image-auth-changed', () => {
    if (!window.imageAccount.authorized) { selected = null; preview.hidden = true; if (previewUrl) URL.revokeObjectURL(previewUrl); }
    ready(); update();
  });
  fileInput.addEventListener('change', () => select(fileInput.files[0]));
  window.addEventListener('paste', event => {
    const file = Array.from(event.clipboardData?.files || []).find(file => file.type.startsWith('image/'));
    if (file && window.imageAccount.authorized) { event.preventDefault(); select(file); }
  });
  button.addEventListener('click', async () => {
    if (button.disabled) return;
    uploading = true; update(); result.textContent = '正在上传，请保持窗口打开…';
    const file = selected;
    try {
      const form = new FormData();
      form.set('file', file, `${crypto.randomUUID()}.${extensions[file.type]}`);
      form.set('folder', `notes/${noteId}`); form.set('conflict', 'reject');
      const response = await window.imageAccount.request('/api/upload', { method: 'POST', body: form, signal: AbortSignal.timeout(120000) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || '上传未完成。');
      const url = new URL(data.url);
      if (url.origin !== location.origin || !url.pathname.startsWith(`/notes/${noteId}/`)) throw new Error('返回的图片地址无效。');
      completed = true; uploadedLink.href = url.href; uploadedLink.hidden = false;
      result.textContent = '图片已上传，已向笔记窗口发送链接。请返回笔记确认插入结果。';
      send({ type: 'sgao-notes-image-result', url: url.href, name: file.name || '剪贴板截图' });
    } catch (error) {
      result.textContent = `${error instanceof Error ? error.message : '上传未完成。'} 如果请求已经发出，请先到图片管理核对结果再重试，避免重复上传。`;
    } finally { uploading = false; update(); }
  });
  window.addEventListener('pagehide', () => { clearInterval(interval); if (previewUrl) URL.revokeObjectURL(previewUrl); });
  void window.imageAccount.ready.then(() => { ready(); update(); });
})();
