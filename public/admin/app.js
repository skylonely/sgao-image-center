const folderInput = document.querySelector('#folder');
const folderSuggestions = document.querySelector('#folderSuggestions');
const directoryStatus = document.querySelector('#directoryStatus');
const dropZone = document.querySelector('#dropZone');
const fileInput = document.querySelector('#fileInput');
const fileList = document.querySelector('#fileList');
const uploadButton = document.querySelector('#uploadButton');
const retryFailedButton = document.querySelector('#retryFailedButton');
const statusBox = document.querySelector('#status');
const conflictDialog = document.querySelector('#conflictDialog');
const conflictKey = document.querySelector('#conflictKey');
const conflictMeta = document.querySelector('#conflictMeta');
const suggestedFilename = document.querySelector('#suggestedFilename');
const cancelConflictButton = document.querySelector('#cancelConflictButton');
const overwriteButton = document.querySelector('#overwriteButton');
const renameButton = document.querySelector('#renameButton');
const backupInput = document.querySelector('#backupInput');
const backupStatus = document.querySelector('#backupStatus');
const backupList = document.querySelector('#backupList');
const restoreButton = document.querySelector('#restoreButton');
const restoreStatus = document.querySelector('#restoreStatus');

let selectedFiles = [];
const previewUrls = new Map();
const uploadStates = new Map();
let uploadBusy = false;
let conflictResolver = null;
let directoryRequestId = 0;
let directorySuggestions = new Set();
let backupFiles = [];
let selectedBackupKeys = new Set();
let restoreBusy = false;

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Map([
	['image/jpeg', new Set(['jpg', 'jpeg'])],
	['image/png', new Set(['png'])],
	['image/webp', new Set(['webp'])],
	['image/gif', new Set(['gif'])],
	['image/svg+xml', new Set(['svg'])],
]);

function resetBackup() {
	backupFiles = []; selectedBackupKeys.clear(); restoreBusy = false;
	backupInput.value = ''; backupInput.disabled = false; backupStatus.textContent = ''; backupList.replaceChildren(); restoreStatus.replaceChildren(); restoreStatus.className = 'status';
	updateRestoreButton();
}

function updateRestoreButton() {
	restoreButton.textContent = restoreBusy ? '正在恢复…' : `恢复所选（${selectedBackupKeys.size}）`;
	restoreButton.disabled = restoreBusy || !selectedBackupKeys.size || !window.imageAccount.authorized;
}

function renderBackupFiles() {
	backupList.replaceChildren();
	for (const entry of backupFiles) {
		const row = document.createElement('label'); row.className = 'file-item';
		const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = selectedBackupKeys.has(entry.key); checkbox.disabled = restoreBusy;
		checkbox.setAttribute('aria-label', `恢复 ${entry.key}`); checkbox.addEventListener('change', () => { if (checkbox.checked) selectedBackupKeys.add(entry.key); else selectedBackupKeys.delete(entry.key); updateRestoreButton(); });
		const name = document.createElement('span'); name.className = 'file-name'; name.textContent = entry.key;
		const size = document.createElement('span'); size.className = 'file-size'; size.textContent = formatSize(entry.size);
		row.append(checkbox, name, size); backupList.append(row);
	}
	updateRestoreButton();
}

backupInput.addEventListener('change', async () => {
	const archive = backupInput.files?.[0]; backupFiles = []; selectedBackupKeys.clear(); backupList.replaceChildren(); restoreStatus.replaceChildren(); restoreStatus.className = 'status'; updateRestoreButton();
	if (!archive) { backupStatus.textContent = ''; return; }
	if (!window.imageAccount.authorized) { backupStatus.textContent = '请先登录图片管理账号。'; return; }
	if (!window.ImageZip?.readBackup) { backupStatus.textContent = '当前浏览器不支持读取图片备份。'; return; }
	backupInput.disabled = true; backupStatus.textContent = '正在校验备份文件…';
	try {
		const backup = await window.ImageZip.readBackup(archive);
		if (!window.imageAccount.authorized) return;
		backupFiles = backup.files; selectedBackupKeys = new Set(backup.files.map((entry) => entry.key));
		backupStatus.textContent = `备份有效：${backup.files.length} 张图片，共 ${formatSize(backup.totalBytes)}。同名图片会跳过，不会覆盖。`;
		renderBackupFiles();
	} catch (error) {
		backupStatus.textContent = error instanceof Error ? error.message : '备份文件无法读取。';
	} finally { backupInput.disabled = false; updateRestoreButton(); }
});

folderInput.value = localStorage.getItem('sgaoUploadFolder') || 'common';

folderInput.addEventListener('input', () => {
	localStorage.setItem('sgaoUploadFolder', folderInput.value.trim());
});

folderInput.addEventListener('focus', () => {
	if (window.imageAccount.authorized && !directorySuggestions.size) {
		loadDirectorySuggestions();
	}
});

function renderDirectorySuggestions() {
	folderSuggestions.replaceChildren();

	for (const directory of [...directorySuggestions].sort((left, right) => left.localeCompare(right, 'en'))) {
		const option = document.createElement('option');

		option.value = directory;
		folderSuggestions.append(option);
	}
}

function addDirectorySuggestion(directory) {
	const segments = directory.split('/').filter(Boolean);

	for (let depth = 1; depth <= segments.length; depth += 1) {
		directorySuggestions.add(segments.slice(0, depth).join('/'));
	}

	renderDirectorySuggestions();
}

async function loadDirectorySuggestions() {
	const requestId = ++directoryRequestId;

	if (!window.imageAccount.authorized) {
		directorySuggestions.clear();
		renderDirectorySuggestions();
		directoryStatus.textContent = '登录后自动读取 R2 中的实际目录。';
		return;
	}

	directoryStatus.textContent = '正在读取 R2 目录…';

	try {
		const discovered = new Set();
		let cursor = null;

		do {
			const query = new URLSearchParams({ view: 'directories' });

			if (cursor) {
				query.set('cursor', cursor);
			}

			const response = await window.imageAccount.request(`/api/files?${query}`);
			const result = await response.json();

			if (!response.ok || !result.success) {
				throw new Error(result.message || '目录读取失败。');
			}

			for (const directory of result.directories) {
				discovered.add(directory);
			}

			cursor = result.truncated ? result.cursor : null;
		} while (cursor && requestId === directoryRequestId);

		if (requestId !== directoryRequestId) {
			return;
		}

		directorySuggestions = discovered;
		renderDirectorySuggestions();
		directoryStatus.textContent = discovered.size ? `已从 R2 同步 ${discovered.size} 个实际目录。` : 'R2 中暂无目录，可直接输入新目录。';
	} catch (error) {
		if (requestId !== directoryRequestId) {
			return;
		}

		directorySuggestions.clear();
		renderDirectorySuggestions();
		directoryStatus.textContent = error instanceof Error ? error.message : '目录读取失败。';
	}
}

dropZone.addEventListener('click', () => {
	if (!uploadBusy) fileInput.click();
});

dropZone.addEventListener('keydown', (event) => {
	if (event.key === 'Enter' || event.key === ' ') {
		event.preventDefault();
		if (!uploadBusy) fileInput.click();
	}
});

dropZone.addEventListener('dragover', (event) => {
	event.preventDefault();
	dropZone.classList.add('dragging');
});

dropZone.addEventListener('dragleave', () => {
	dropZone.classList.remove('dragging');
});

dropZone.addEventListener('drop', (event) => {
	event.preventDefault();
	dropZone.classList.remove('dragging');
	if (!uploadBusy) selectFiles(Array.from(event.dataTransfer.files));
});

fileInput.addEventListener('change', () => {
	const chosen = Array.from(fileInput.files || []);
	if (!uploadBusy && chosen.length) selectFiles(chosen);
});

document.addEventListener('paste', (event) => {
	if (!window.imageAccount.authorized || uploadBusy || !conflictDialog.hidden) return;
	const editable = 'input, textarea, select, [contenteditable]';
	if (event.target?.closest?.(editable) || document.activeElement?.matches?.(editable)) return;
	const pasted = Array.from(event.clipboardData?.items || [])
		.filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
		.map((item) => ({ file: item.getAsFile(), type: item.type })).filter((entry) => entry.file);
	if (!pasted.length) return;
	event.preventDefault();
	const usedNames = new Set(selectedFiles.map((file) => file.name.toLowerCase()));
	const timestamp = new Date();
	const stamp = [timestamp.getFullYear(), String(timestamp.getMonth() + 1).padStart(2, '0'), String(timestamp.getDate()).padStart(2, '0')].join('')
		+ '-' + [timestamp.getHours(), timestamp.getMinutes(), timestamp.getSeconds()].map((part) => String(part).padStart(2, '0')).join('');
	const named = pasted.map(({ file, type: clipboardType }) => {
		const type = file.type || clipboardType;
		const extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg' })[type] || 'bin';
		let name = `clipboard-${stamp}.${extension}`; let suffix = 2;
		while (usedNames.has(name.toLowerCase())) name = `clipboard-${stamp}-${suffix++}.${extension}`;
		usedNames.add(name.toLowerCase());
		return new File([file], name, { type, lastModified: file.lastModified || Date.now() });
	});
	selectFiles(named, { append: true });
});

function formatSize(bytes) {
	if (bytes < 1024) {
		return `${bytes} B`;
	}

	if (bytes < 1024 * 1024) {
		return `${(bytes / 1024).toFixed(2)} KB`;
	}

	return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function fileExtension(filename) {
	const extensionIndex = filename.lastIndexOf('.');

	return extensionIndex > 0 ? filename.slice(extensionIndex + 1).toLowerCase() : '';
}

function normalizeFolder(value) {
	const folder = value.trim().replace(/^\/+|\/+$/g, '');

	if (!folder) {
		return 'common';
	}

	return folder.split('/').every((segment) => /^[a-z0-9][a-z0-9_-]*$/i.test(segment)) ? folder : null;
}

function validateSelectedFile(file) {
	if (file.size <= 0) {
		return '文件为空';
	}

	if (file.size > MAX_FILE_SIZE) {
		return '超过 10 MB';
	}

	const extensions = ALLOWED_FILE_TYPES.get(file.type);

	if (!extensions) {
		return '仅支持 JPEG、PNG、WebP、GIF 和 SVG';
	}

	if (!extensions.has(fileExtension(file.name))) {
		return '扩展名与图片类型不匹配';
	}

	return null;
}

function removeSelectedFile(file) {
	const previewUrl = previewUrls.get(file);
	if (previewUrl) URL.revokeObjectURL(previewUrl);
	previewUrls.delete(file);
	uploadStates.delete(file);
	selectedFiles = selectedFiles.filter((entry) => entry !== file);
}

function clearSelectedFiles() {
	for (const previewUrl of previewUrls.values()) URL.revokeObjectURL(previewUrl);
	previewUrls.clear();
	uploadStates.clear();
	selectedFiles = [];
	fileInput.value = '';
	renderFiles();
}

function selectFiles(files, { append = false } = {}) {
	const validFiles = [];
	const validationErrors = [];

	for (const file of files) {
		const error = validateSelectedFile(file);

		if (error) {
			validationErrors.push(`${file.name}: ${error}`);
		} else {
			validFiles.push(file);
		}
	}

	if (!append) clearSelectedFiles();
	selectedFiles.push(...validFiles);
	for (const file of validFiles) {
		previewUrls.set(file, URL.createObjectURL(file));
		uploadStates.set(file, { phase: 'pending' });
	}
	renderFiles();

	if (validationErrors.length) {
		showError(`以下文件未加入上传列表：\n${validationErrors.join('\n')}`);
	} else {
		statusBox.className = 'status';
		statusBox.textContent = '';
	}
}

function updateUploadActions() {
	const pendingCount = selectedFiles.filter((file) => uploadStates.get(file)?.phase === 'pending').length;
	const failedCount = selectedFiles.filter((file) => uploadStates.get(file)?.phase === 'error').length;
	uploadButton.disabled = uploadBusy || !window.imageAccount.authorized || !pendingCount;
	uploadButton.textContent = uploadBusy ? '正在上传……' : '开始上传';
	retryFailedButton.hidden = !failedCount;
	retryFailedButton.disabled = uploadBusy || !window.imageAccount.authorized || !failedCount;
	retryFailedButton.textContent = `只重试失败项（${failedCount}）`;
}

function renderFiles() {
	fileList.replaceChildren();
	for (const file of selectedFiles) {
		const state = uploadStates.get(file) || { phase: 'pending' };
		const row = document.createElement('div'); row.className = 'file-item upload-file-item';
		const preview = document.createElement('img'); preview.className = 'upload-file-preview'; preview.src = previewUrls.get(file); preview.alt = `待上传图片预览：${file.name}`;
		const details = document.createElement('div'); details.className = 'upload-file-details';
		const label = document.createElement('label'); label.textContent = '文件名';
		const nameRow = document.createElement('div'); nameRow.className = 'upload-file-name';
		const extension = fileExtension(file.name);
		const basename = extension ? file.name.slice(0, -(extension.length + 1)) : file.name;
		const input = document.createElement('input'); input.type = 'text'; input.value = basename; input.maxLength = 120; input.disabled = uploadBusy || state.phase === 'success';
		input.setAttribute('aria-label', `修改 ${file.name} 的文件名`);
		input.addEventListener('change', () => {
			const nextBase = input.value.trim();
			if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(nextBase) || nextBase === '..') {
				input.value = basename; showError('文件名只能使用英文字母、数字、点、短横线和下划线，并以字母或数字开头。'); return;
			}
			const nextName = extension ? `${nextBase}.${extension}` : nextBase;
			if (nextName === file.name) return;
			const renamed = new File([file], nextName, { type: file.type, lastModified: file.lastModified });
			const index = selectedFiles.indexOf(file);
			if (index < 0) return;
			selectedFiles[index] = renamed;
			previewUrls.set(renamed, previewUrls.get(file)); previewUrls.delete(file);
			uploadStates.delete(file); uploadStates.set(renamed, { phase: 'pending' });
			statusBox.textContent = ''; statusBox.className = 'status'; renderFiles();
		});
		const extensionLabel = document.createElement('span'); extensionLabel.className = 'upload-file-extension'; extensionLabel.textContent = extension ? `.${extension}` : '';
		nameRow.append(input, extensionLabel); label.append(nameRow);
		const stateLabel = document.createElement('span'); stateLabel.className = `upload-file-state is-${state.phase}`;
		stateLabel.textContent = ({ pending: '待上传', uploading: '上传中', success: '已上传', error: '上传失败' })[state.phase];
		const stateRow = document.createElement('div'); stateRow.className = 'upload-file-status'; stateRow.append(stateLabel);
		if (state.message) {
			const errorText = document.createElement('span'); errorText.className = 'upload-file-error'; errorText.textContent = state.message;
			stateRow.append(errorText);
		}
		const size = document.createElement('span'); size.className = 'file-size'; size.textContent = formatSize(file.size);
		const actions = document.createElement('div'); actions.className = 'upload-file-actions'; actions.append(size);
		const remove = document.createElement('button'); remove.className = 'upload-remove'; remove.type = 'button'; remove.textContent = state.phase === 'success' ? '清除记录' : '移除'; remove.disabled = uploadBusy;
		remove.setAttribute('aria-label', `${state.phase === 'success' ? '从列表清除已上传记录' : '移除'} ${file.name}`);
		remove.addEventListener('click', () => { removeSelectedFile(file); renderFiles(); }); actions.append(remove);
		details.append(label, stateRow); row.append(preview, details, actions); fileList.append(row);
	}
	updateUploadActions();
}

function escapeHtml(value) {
	return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function showError(message) {
	statusBox.className = 'status error';
	statusBox.textContent = message;
}

function showResults(results, failures) {
	let html = '';

	if (results.length) {
		html += `
			<strong>上传完成，共 ${results.length} 张。</strong>
			<div class="result-list">
				${results
					.map(
						(result) => `
							<div class="result-item">
								${
									result.renamed
										? `<div class="result-note">同名文件已保留，新图片保存为 <strong>${escapeHtml(result.filename)}</strong></div>`
										: result.overwritten
											? '<div class="result-note warning">已按你的选择覆盖旧图片</div>'
											: ''
								}
								<div class="result-url">
									${escapeHtml(result.url)}
								</div>

								<div class="result-actions">
									<button
										type="button"
										class="secondary-button copy-url"
										data-value="${escapeHtml(result.url)}"
									>
										复制地址
									</button>

									<button
										type="button"
										class="secondary-button light copy-markdown"
										data-value="![](${escapeHtml(result.url)})"
									>
										复制 Markdown
									</button>
								</div>
							</div>
						`,
					)
					.join('')}
			</div>
		`;
	}

	if (failures.length) {
		html += `
			<div style="margin-top: 16px;">
				<strong>以下文件上传失败：</strong><br />
				${failures.map(escapeHtml).join('<br />')}
			</div>
		`;
	}

	statusBox.className = failures.length && !results.length ? 'status error' : 'status success';

	statusBox.innerHTML = html;

	document.querySelectorAll('.copy-url, .copy-markdown').forEach((button) => {
		button.addEventListener('click', async () => {
			await navigator.clipboard.writeText(button.dataset.value);

			const originalText = button.textContent;
			button.textContent = '已复制';

			setTimeout(() => {
				button.textContent = originalText;
			}, 1200);
		});
	});
}

function formatDate(value) {
	return new Intl.DateTimeFormat('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(value));
}

function chooseConflict(conflict) {
	conflictKey.textContent = conflict.key;
	conflictMeta.textContent = `现有文件：${formatSize(conflict.existing.size)} · 上传于 ${formatDate(conflict.existing.uploaded)}`;
	suggestedFilename.textContent = conflict.suggestedFilename;
	conflictDialog.hidden = false;
	document.body.classList.add('modal-open');
	renameButton.focus();

	return new Promise((resolve) => {
		conflictResolver = resolve;
	});
}

function resolveConflict(choice) {
	if (!conflictResolver) {
		return;
	}

	const resolve = conflictResolver;

	conflictResolver = null;
	conflictDialog.hidden = true;
	document.body.classList.remove('modal-open');
	resolve(choice);
}

cancelConflictButton.addEventListener('click', () => resolveConflict('cancel'));
overwriteButton.addEventListener('click', () => resolveConflict('overwrite'));
renameButton.addEventListener('click', () => resolveConflict('rename'));

conflictDialog.addEventListener('click', (event) => {
	if (event.target === conflictDialog) {
		resolveConflict('cancel');
	}
});

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && !conflictDialog.hidden) {
		resolveConflict('cancel');
	}
});

async function sendUpload(file, folder, conflict = 'reject', expectedEtag = '') {
	const formData = new FormData();

	formData.append('folder', folder);
	formData.append('file', file);
	formData.append('conflict', conflict);

	if (expectedEtag) {
		formData.append('expectedEtag', expectedEtag);
	}

	const response = await window.imageAccount.request('/api/upload', {
		method: 'POST',
		body: formData,
	});

	const result = await response.json();

	if (response.status === 409 && (result.code === 'FILE_EXISTS' || result.code === 'FILE_CHANGED')) {
		return { conflict: result };
	}

	if (!response.ok || !result.success) {
		throw new Error(result.message || '上传失败');
	}

	return { result };
}

async function uploadWithConflictChoice(file, folder) {
	let attempt = await sendUpload(file, folder);

	while (attempt.conflict) {
		const choice = await chooseConflict(attempt.conflict);

		if (choice === 'cancel') {
			return { cancelled: true };
		}

		attempt = await sendUpload(
			file,
			folder,
			choice,
			choice === 'overwrite' ? attempt.conflict.etag : '',
		);
	}

	return attempt;
}

async function sendBackupRestore(entry) {
	const formData = new FormData();
	formData.append('restore', 'backup-v1'); formData.append('restoreKey', entry.key); formData.append('conflict', 'reject'); formData.append('file', entry.file);
	const response = await window.imageAccount.request('/api/upload', { method: 'POST', body: formData });
	const result = await response.json();
	if (response.status === 409 && result.code === 'FILE_EXISTS') return { skipped: true, key: entry.key };
	if (!response.ok || !result.success) throw new Error(result.message || '恢复失败');
	return { restored: true, key: entry.key, url: result.url };
}

function showRestoreResults(restored, skipped, failed) {
	restoreStatus.replaceChildren(); restoreStatus.className = failed.length && !restored.length ? 'status error' : 'status success';
	const summary = document.createElement('strong'); summary.textContent = `恢复 ${restored.length} 张，跳过同名 ${skipped.length} 张，失败 ${failed.length} 张。`; restoreStatus.append(summary);
	for (const [label, values] of [['已恢复', restored], ['跳过', skipped], ['失败', failed]]) {
		if (!values.length) continue;
		const group = document.createElement('div'); group.className = 'result-list'; const heading = document.createElement('p'); heading.textContent = label; group.append(heading);
		for (const value of values) { const item = document.createElement('div'); item.className = 'result-item'; item.textContent = typeof value === 'string' ? value : value.key; group.append(item); }
		restoreStatus.append(group);
	}
}

restoreButton.addEventListener('click', async () => {
	if (restoreBusy || !window.imageAccount.authorized) return;
	const snapshot = backupFiles.filter((entry) => selectedBackupKeys.has(entry.key)); if (!snapshot.length) return;
	restoreBusy = true; backupInput.disabled = true; restoreStatus.replaceChildren(); restoreStatus.className = 'status'; updateRestoreButton();
	const restored = []; const skipped = []; const failed = [];
	for (let index = 0; index < snapshot.length; index += 1) {
		if (!window.imageAccount.authorized) break;
		backupStatus.textContent = `正在恢复 ${index + 1} / ${snapshot.length}：${snapshot[index].key}`;
		try { const result = await sendBackupRestore(snapshot[index]); if (result.restored) restored.push(result); else skipped.push(result); }
		catch (error) { failed.push(`${snapshot[index].key}: ${error instanceof Error ? error.message : '恢复失败'}`); }
	}
	for (const result of [...restored, ...skipped]) selectedBackupKeys.delete(result.key);
	restoreBusy = false; backupInput.disabled = false;
	if (window.imageAccount.authorized) { backupStatus.textContent = failed.length ? '恢复已完成，失败项仍保持勾选，可修正后重试。' : '恢复已完成。'; showRestoreResults(restored, skipped, failed); renderBackupFiles(); loadDirectorySuggestions(); }
	else resetBackup();
});

async function uploadQueuedFiles(phase) {
	if (uploadBusy) return;
	const folder = normalizeFolder(folderInput.value);

	if (!window.imageAccount.authorized) {
		showError('请先登录图片管理账号。');
		return;
	}

	const uploadQueue = selectedFiles.filter((file) => uploadStates.get(file)?.phase === phase);
	if (!uploadQueue.length) {
		showError(phase === 'error' ? '没有需要重试的失败项。' : '没有待上传的图片。');
		return;
	}

	if (!folder) {
		showError('目录格式不正确。每一段只能使用字母、数字、短横线和下划线。');
		folderInput.focus();
		return;
	}

	folderInput.value = folder;
	localStorage.setItem('sgaoUploadFolder', folder);

	uploadBusy = true;
	fileInput.disabled = true;
	renderFiles();

	statusBox.className = 'status';
	statusBox.innerHTML = '';

	const results = [];
	const failures = [];

	for (const file of uploadQueue) {
		if (!window.imageAccount.authorized) break;
		uploadStates.set(file, { phase: 'uploading' });
		renderFiles();
		try {
			const upload = await uploadWithConflictChoice(file, folder);
			if (!window.imageAccount.authorized || !selectedFiles.includes(file)) continue;

			if (upload.cancelled) {
				failures.push(`${file.name}: 已取消上传`);
				uploadStates.set(file, { phase: 'error', message: '已取消上传' });
			} else {
				results.push(upload.result);
				uploadStates.set(file, { phase: 'success' });
			}
		} catch (error) {
			if (!window.imageAccount.authorized || !selectedFiles.includes(file)) continue;
			const message = error instanceof Error ? error.message : '上传失败';
			failures.push(`${file.name}: ${message}`);
			uploadStates.set(file, { phase: 'error', message });
		}
		renderFiles();
	}

	if (window.imageAccount.authorized) showResults(results, failures);

	if (window.imageAccount.authorized && results.length) {
		addDirectorySuggestion(folder);
		directoryStatus.textContent = `已从 R2 同步 ${directorySuggestions.size} 个实际目录。`;
	}

	uploadBusy = false;
	fileInput.disabled = false;
	renderFiles();
}

uploadButton.addEventListener('click', () => uploadQueuedFiles('pending'));
retryFailedButton.addEventListener('click', () => uploadQueuedFiles('error'));

window.addEventListener('image-auth-changed', (event) => {
	if (event.detail.authorized) loadDirectorySuggestions();
	else {
		directoryRequestId += 1; directorySuggestions.clear(); renderDirectorySuggestions(); resolveConflict('cancel');
		clearSelectedFiles(); statusBox.replaceChildren();
		resetBackup();
	}
});
