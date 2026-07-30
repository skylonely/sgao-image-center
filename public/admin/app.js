const tokenInput = document.querySelector('#token');
const folderInput = document.querySelector('#folder');
const folderSuggestions = document.querySelector('#folderSuggestions');
const directoryStatus = document.querySelector('#directoryStatus');
const dropZone = document.querySelector('#dropZone');
const fileInput = document.querySelector('#fileInput');
const fileList = document.querySelector('#fileList');
const uploadButton = document.querySelector('#uploadButton');
const statusBox = document.querySelector('#status');
const conflictDialog = document.querySelector('#conflictDialog');
const conflictKey = document.querySelector('#conflictKey');
const conflictMeta = document.querySelector('#conflictMeta');
const suggestedFilename = document.querySelector('#suggestedFilename');
const cancelConflictButton = document.querySelector('#cancelConflictButton');
const overwriteButton = document.querySelector('#overwriteButton');
const renameButton = document.querySelector('#renameButton');

let selectedFiles = [];
let conflictResolver = null;
let directoryLoadTimer = null;
let directoryRequestId = 0;
let directorySuggestions = new Set();

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Map([
	['image/jpeg', new Set(['jpg', 'jpeg'])],
	['image/png', new Set(['png'])],
	['image/webp', new Set(['webp'])],
	['image/gif', new Set(['gif'])],
	['image/svg+xml', new Set(['svg'])],
]);

tokenInput.value = sessionStorage.getItem('sgaoUploadToken') || '';

folderInput.value = localStorage.getItem('sgaoUploadFolder') || 'common';

tokenInput.addEventListener('input', () => {
	sessionStorage.setItem('sgaoUploadToken', tokenInput.value.trim());
	scheduleDirectoryLoad();
});

folderInput.addEventListener('input', () => {
	localStorage.setItem('sgaoUploadFolder', folderInput.value.trim());
});

folderInput.addEventListener('focus', () => {
	if (tokenInput.value.trim() && !directorySuggestions.size) {
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

function scheduleDirectoryLoad() {
	window.clearTimeout(directoryLoadTimer);
	directoryLoadTimer = window.setTimeout(loadDirectorySuggestions, 450);
}

async function loadDirectorySuggestions() {
	const token = tokenInput.value.trim();
	const requestId = ++directoryRequestId;

	if (!token) {
		directorySuggestions.clear();
		renderDirectorySuggestions();
		directoryStatus.textContent = '输入上传密钥后，将自动读取 R2 中的实际目录。';
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

			const response = await fetch(`/api/files?${query}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			const result = await response.json();

			if (!response.ok || !result.success) {
				throw new Error(response.status === 401 ? '密钥验证失败，暂时无法读取 R2 目录。' : result.message || '目录读取失败。');
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
	fileInput.click();
});

dropZone.addEventListener('keydown', (event) => {
	if (event.key === 'Enter' || event.key === ' ') {
		event.preventDefault();
		fileInput.click();
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

	selectFiles(Array.from(event.dataTransfer.files));
});

fileInput.addEventListener('change', () => {
	selectFiles(Array.from(fileInput.files || []));
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

function selectFiles(files) {
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

	selectedFiles = validFiles;
	renderFiles();

	if (validationErrors.length) {
		showError(`以下文件未加入上传列表：\n${validationErrors.join('\n')}`);
	} else {
		statusBox.className = 'status';
		statusBox.textContent = '';
	}
}

function renderFiles() {
	if (!selectedFiles.length) {
		fileList.innerHTML = '';
		return;
	}

	fileList.innerHTML = selectedFiles
		.map(
			(file) => `
				<div class="file-item">
					<span class="file-name">${escapeHtml(file.name)}</span>
					<span class="file-size">${formatSize(file.size)}</span>
				</div>
			`,
		)
		.join('');
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

async function sendUpload(file, folder, token, conflict = 'reject', expectedEtag = '') {
	const formData = new FormData();

	formData.append('folder', folder);
	formData.append('file', file);
	formData.append('conflict', conflict);

	if (expectedEtag) {
		formData.append('expectedEtag', expectedEtag);
	}

	const response = await fetch('/api/upload', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
		},
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

async function uploadWithConflictChoice(file, folder, token) {
	let attempt = await sendUpload(file, folder, token);

	while (attempt.conflict) {
		const choice = await chooseConflict(attempt.conflict);

		if (choice === 'cancel') {
			return { cancelled: true };
		}

		attempt = await sendUpload(
			file,
			folder,
			token,
			choice,
			choice === 'overwrite' ? attempt.conflict.etag : '',
		);
	}

	return attempt;
}

uploadButton.addEventListener('click', async () => {
	const token = tokenInput.value.trim();
	const folder = normalizeFolder(folderInput.value);

	if (!token) {
		showError('请输入上传密钥。');
		return;
	}

	if (!selectedFiles.length) {
		showError('请选择至少一张图片。');
		return;
	}

	if (!folder) {
		showError('目录格式不正确。每一段只能使用字母、数字、短横线和下划线。');
		folderInput.focus();
		return;
	}

	folderInput.value = folder;
	localStorage.setItem('sgaoUploadFolder', folder);

	uploadButton.disabled = true;
	uploadButton.textContent = '正在上传……';

	statusBox.className = 'status';
	statusBox.innerHTML = '';

	const results = [];
	const failures = [];

	for (const file of selectedFiles) {
		try {
			const upload = await uploadWithConflictChoice(file, folder, token);

			if (upload.cancelled) {
				failures.push(`${file.name}: 已取消上传`);
				continue;
			}

			results.push(upload.result);
		} catch (error) {
			failures.push(`${file.name}: ${error instanceof Error ? error.message : '上传失败'}`);
		}
	}

	showResults(results, failures);

	if (results.length) {
		addDirectorySuggestion(folder);
		directoryStatus.textContent = `已从 R2 同步 ${directorySuggestions.size} 个实际目录。`;
	}

	uploadButton.disabled = false;
	uploadButton.textContent = '开始上传';

	if (!failures.length) {
		selectedFiles = [];
		fileInput.value = '';
		renderFiles();
	}
});

if (tokenInput.value.trim()) {
	loadDirectorySuggestions();
}
