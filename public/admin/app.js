const tokenInput = document.querySelector('#token');
const folderSelect = document.querySelector('#folder');
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

tokenInput.value = sessionStorage.getItem('sgaoUploadToken') || '';

folderSelect.value = localStorage.getItem('sgaoUploadFolder') || 'common';

tokenInput.addEventListener('input', () => {
	sessionStorage.setItem('sgaoUploadToken', tokenInput.value.trim());
});

folderSelect.addEventListener('change', () => {
	localStorage.setItem('sgaoUploadFolder', folderSelect.value);
});

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

	selectedFiles = Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith('image/'));

	renderFiles();
});

fileInput.addEventListener('change', () => {
	selectedFiles = Array.from(fileInput.files || []);
	renderFiles();
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
	const folder = folderSelect.value;

	if (!token) {
		showError('请输入上传密钥。');
		return;
	}

	if (!selectedFiles.length) {
		showError('请选择至少一张图片。');
		return;
	}

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

	uploadButton.disabled = false;
	uploadButton.textContent = '开始上传';

	if (!failures.length) {
		selectedFiles = [];
		fileInput.value = '';
		renderFiles();
	}
});
