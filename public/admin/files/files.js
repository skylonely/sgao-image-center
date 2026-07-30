const tokenInput = document.querySelector('#filesToken');
const loadButton = document.querySelector('#loadButton');
const refreshButton = document.querySelector('#refreshButton');
const authPanel = document.querySelector('#authPanel');
const manager = document.querySelector('#manager');
const searchInput = document.querySelector('#searchInput');
const fileCount = document.querySelector('#fileCount');
const managerStatus = document.querySelector('#managerStatus');
const folderList = document.querySelector('#folderList');
const loadMoreButton = document.querySelector('#loadMoreButton');
const deleteDialog = document.querySelector('#deleteDialog');
const deleteKey = document.querySelector('#deleteKey');
const cancelDeleteButton = document.querySelector('#cancelDeleteButton');
const confirmDeleteButton = document.querySelector('#confirmDeleteButton');
const toast = document.querySelector('#toast');
const imagePreview = document.querySelector('#imagePreview');
const previewImage = document.querySelector('#previewImage');
const previewName = document.querySelector('#previewName');
const previewPosition = document.querySelector('#previewPosition');
const previewOpenLink = document.querySelector('#previewOpenLink');
const previewError = document.querySelector('#previewError');
const closePreviewButton = document.querySelector('#closePreviewButton');
const previousPreviewButton = document.querySelector('#previousPreviewButton');
const nextPreviewButton = document.querySelector('#nextPreviewButton');

let files = [];
let renderedFiles = [];
let cursor = null;
let pendingDeleteKey = null;
let toastTimer = null;
let previewIndex = -1;
let lastPreviewTrigger = null;

const collapsedFolders = new Set(readCollapsedFolders());

tokenInput.value = sessionStorage.getItem('sgaoUploadToken') || '';

tokenInput.addEventListener('input', () => {
	sessionStorage.setItem('sgaoUploadToken', tokenInput.value.trim());
});

tokenInput.addEventListener('keydown', (event) => {
	if (event.key === 'Enter') {
		loadFiles({ reset: true });
	}
});

loadButton.addEventListener('click', () => loadFiles({ reset: true }));
refreshButton.addEventListener('click', () => loadFiles({ reset: true }));
loadMoreButton.addEventListener('click', () => loadFiles({ reset: false }));
searchInput.addEventListener('input', renderFiles);

cancelDeleteButton.addEventListener('click', closeDeleteDialog);
confirmDeleteButton.addEventListener('click', deleteFile);

deleteDialog.addEventListener('click', (event) => {
	if (event.target === deleteDialog) {
		closeDeleteDialog();
	}
});

document.addEventListener('keydown', (event) => {
	if (!imagePreview.hidden) {
		if (event.key === 'Escape') {
			closeImagePreview();
		} else if (event.key === 'ArrowLeft') {
			showPreviousPreview();
		} else if (event.key === 'ArrowRight') {
			showNextPreview();
		}

		return;
	}

	if (event.key === 'Escape' && !deleteDialog.hidden) {
		closeDeleteDialog();
	}
});

closePreviewButton.addEventListener('click', closeImagePreview);
previousPreviewButton.addEventListener('click', showPreviousPreview);
nextPreviewButton.addEventListener('click', showNextPreview);

imagePreview.addEventListener('click', (event) => {
	if (event.target === imagePreview) {
		closeImagePreview();
	}
});

previewImage.addEventListener('load', () => {
	previewImage.hidden = false;
	previewError.hidden = true;
});

previewImage.addEventListener('error', () => {
	previewImage.hidden = true;
	previewError.hidden = false;
});

function getToken() {
	return tokenInput.value.trim();
}

async function requestFiles(url, options = {}) {
	const response = await fetch(url, {
		...options,
		headers: {
			...options.headers,
			Authorization: `Bearer ${getToken()}`,
		},
	});

	let result;

	try {
		result = await response.json();
	} catch {
		throw new Error('服务器返回了无法解析的响应');
	}

	if (!response.ok || !result.success) {
		const error = new Error(result.message || '请求失败');
		error.status = response.status;
		throw error;
	}

	return result;
}

async function loadFiles({ reset }) {
	if (!getToken()) {
		showManagerError('请输入管理密钥。');
		tokenInput.focus();
		return;
	}

	setLoading(true, reset ? '正在读取文件…' : '正在加载更多…');

	try {
		const query = new URLSearchParams({ limit: '100' });

		if (!reset && cursor) {
			query.set('cursor', cursor);
		}

		const result = await requestFiles(`/api/files?${query}`);

		files = reset ? result.files : [...files, ...result.files];
		cursor = result.cursor;

		sessionStorage.setItem('sgaoUploadToken', getToken());
		authPanel.classList.add('authenticated');
		manager.hidden = false;
		managerStatus.textContent = '';
		managerStatus.className = 'manager-status';
		loadMoreButton.hidden = !result.truncated;

		renderFiles();
	} catch (error) {
		if (error.status === 401) {
			showManagerError('密钥不正确，请重新输入。');
			tokenInput.focus();
			tokenInput.select();
		} else {
			showManagerError(error.message || '文件读取失败，请稍后重试。');
		}
	} finally {
		setLoading(false);
	}
}

function setLoading(loading, message = '') {
	loadButton.disabled = loading;
	refreshButton.disabled = loading;
	loadMoreButton.disabled = loading;
	loadButton.textContent = loading ? '读取中…' : '查看文件';

	if (loading && manager.hidden === false) {
		managerStatus.className = 'manager-status loading';
		managerStatus.textContent = message;
	}
}

function showManagerError(message) {
	manager.hidden = false;
	managerStatus.className = 'manager-status error';
	managerStatus.textContent = message;
}

function groupFiles(visibleFiles) {
	const groups = new Map();

	for (const file of visibleFiles) {
		const segments = file.key.split('/');
		const filename = segments.pop();
		const folder = segments.join('/') || '根目录';

		if (!groups.has(folder)) {
			groups.set(folder, []);
		}

		groups.get(folder).push({ ...file, filename });
	}

	return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right, 'zh-CN'));
}

function readCollapsedFolders() {
	try {
		const saved = JSON.parse(localStorage.getItem('sgaoCollapsedFolders') || '[]');

		return Array.isArray(saved) ? saved.filter((folder) => typeof folder === 'string') : [];
	} catch {
		return [];
	}
}

function saveCollapsedFolders() {
	localStorage.setItem('sgaoCollapsedFolders', JSON.stringify([...collapsedFolders]));
}

function renderFiles() {
	const query = searchInput.value.trim().toLocaleLowerCase();
	const visibleFiles = query ? files.filter((file) => file.key.toLocaleLowerCase().includes(query)) : files;

	renderedFiles = visibleFiles;
	fileCount.textContent = query ? `${visibleFiles.length} / ${files.length} 个文件` : `${files.length} 个文件`;
	folderList.replaceChildren();

	if (!visibleFiles.length) {
		const empty = document.createElement('div');

		empty.className = 'empty-state';
		empty.innerHTML = `
			<div class="empty-icon" aria-hidden="true">⌁</div>
			<strong>${query ? '没有匹配的文件' : '还没有图片'}</strong>
			<span>${query ? '换个关键词试试。' : '从上传页添加第一张图片吧。'}</span>
		`;

		folderList.append(empty);
		return;
	}

	for (const [groupIndex, [folder, folderFiles]] of groupFiles(visibleFiles).entries()) {
		const section = document.createElement('section');
		const header = document.createElement('button');
		const title = document.createElement('span');
		const summary = document.createElement('span');
		const count = document.createElement('span');
		const chevron = document.createElement('span');
		const list = document.createElement('div');
		const listId = `folder-files-${groupIndex}`;
		const isCollapsed = !query && collapsedFolders.has(folder);

		section.className = `folder-section${isCollapsed ? ' collapsed' : ''}`;
		header.className = 'folder-header';
		header.type = 'button';
		header.setAttribute('aria-expanded', String(!isCollapsed));
		header.setAttribute('aria-controls', listId);
		header.title = isCollapsed ? `展开 ${folder}` : `折叠 ${folder}`;
		title.className = 'folder-title';
		title.innerHTML = `
			<svg aria-hidden="true" viewBox="0 0 24 24">
				<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5Z" />
			</svg>
		`;
		title.append(document.createTextNode(folder));
		summary.className = 'folder-summary';
		count.className = 'folder-count';
		count.textContent = `${folderFiles.length}`;
		chevron.className = 'folder-chevron';
		chevron.innerHTML = `
			<svg aria-hidden="true" viewBox="0 0 24 24">
				<path d="m8 10 4 4 4-4" />
			</svg>
		`;
		summary.append(count, chevron);
		header.append(title, summary);

		list.className = 'files-list';
		list.id = listId;
		list.hidden = isCollapsed;

		for (const file of folderFiles) {
			list.append(createFileRow(file));
		}

		header.addEventListener('click', () => {
			const willCollapse = header.getAttribute('aria-expanded') === 'true';

			header.setAttribute('aria-expanded', String(!willCollapse));
			header.title = willCollapse ? `展开 ${folder}` : `折叠 ${folder}`;
			section.classList.toggle('collapsed', willCollapse);
			list.hidden = willCollapse;

			if (willCollapse) {
				collapsedFolders.add(folder);
			} else {
				collapsedFolders.delete(folder);
			}

			saveCollapsedFolders();
		});

		section.append(header, list);
		folderList.append(section);
	}
}

function createFileRow(file) {
	const row = document.createElement('article');
	const preview = document.createElement('button');
	const image = document.createElement('img');
	const details = document.createElement('div');
	const name = document.createElement('a');
	const meta = document.createElement('p');
	const actions = document.createElement('div');

	row.className = 'file-row';
	preview.className = 'file-preview';
	preview.type = 'button';
	preview.setAttribute('aria-label', `预览 ${file.filename}`);
	preview.title = '预览大图';
	preview.addEventListener('click', () => openImagePreview(file.key, preview));

	image.src = file.url;
	image.alt = '';
	image.loading = 'lazy';
	image.addEventListener('error', () => {
		preview.classList.add('preview-error');
		image.remove();
		preview.textContent = 'IMG';
	});
	preview.append(image);

	details.className = 'file-details';
	name.className = 'managed-file-name';
	name.href = file.url;
	name.target = '_blank';
	name.rel = 'noreferrer';
	name.textContent = file.filename;
	name.title = file.key;
	meta.className = 'file-meta';
	meta.textContent = `${formatSize(file.size)} · ${formatDate(file.uploaded)}`;
	details.append(name, meta);

	actions.className = 'file-actions';
	actions.append(
		createActionButton('复制地址', 'copy', () => copyText(file.url, '地址已复制')),
		createActionButton('Markdown', 'markdown', () => copyText(`![](${file.url})`, 'Markdown 已复制')),
		createOpenLink(file.url),
		createActionButton('删除', 'delete', () => openDeleteDialog(file.key)),
	);

	row.append(preview, details, actions);

	return row;
}

function openImagePreview(key, trigger) {
	const index = renderedFiles.findIndex((file) => file.key === key);

	if (index < 0) {
		return;
	}

	lastPreviewTrigger = trigger;
	previewIndex = index;
	imagePreview.hidden = false;
	document.body.classList.add('modal-open');
	updateImagePreview();
	closePreviewButton.focus();
}

function updateImagePreview() {
	const file = renderedFiles[previewIndex];

	if (!file) {
		closeImagePreview();
		return;
	}

	previewImage.hidden = false;
	previewError.hidden = true;
	previewName.textContent = file.key;
	previewPosition.textContent = `${previewIndex + 1} / ${renderedFiles.length}`;
	previewOpenLink.href = file.url;
	previewImage.alt = file.key;

	if (previewImage.src !== file.url) {
		previewImage.src = file.url;
	}

	previousPreviewButton.disabled = previewIndex <= 0;
	nextPreviewButton.disabled = previewIndex >= renderedFiles.length - 1;
}

function closeImagePreview() {
	imagePreview.hidden = true;
	previewImage.removeAttribute('src');
	previewImage.alt = '';
	previewIndex = -1;
	document.body.classList.remove('modal-open');

	if (lastPreviewTrigger?.isConnected) {
		lastPreviewTrigger.focus();
	}

	lastPreviewTrigger = null;
}

function showPreviousPreview() {
	if (previewIndex > 0) {
		previewIndex -= 1;
		updateImagePreview();
	}
}

function showNextPreview() {
	if (previewIndex < renderedFiles.length - 1) {
		previewIndex += 1;
		updateImagePreview();
	}
}

function createActionButton(label, variant, handler) {
	const button = document.createElement('button');

	button.className = `file-action ${variant}`;
	button.type = 'button';
	button.textContent = label;
	button.addEventListener('click', handler);

	return button;
}

function createOpenLink(url) {
	const link = document.createElement('a');

	link.className = 'file-action open';
	link.href = url;
	link.target = '_blank';
	link.rel = 'noreferrer';
	link.textContent = '打开';

	return link;
}

function formatSize(bytes) {
	if (bytes < 1024) {
		return `${bytes} B`;
	}

	if (bytes < 1024 * 1024) {
		return `${(bytes / 1024).toFixed(1)} KB`;
	}

	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value) {
	const date = new Date(value);

	return new Intl.DateTimeFormat('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(date);
}

async function copyText(value, successMessage) {
	try {
		await navigator.clipboard.writeText(value);
		showToast(successMessage);
	} catch {
		const textarea = document.createElement('textarea');

		textarea.value = value;
		textarea.style.position = 'fixed';
		textarea.style.opacity = '0';
		document.body.append(textarea);
		textarea.select();
		document.execCommand('copy');
		textarea.remove();
		showToast(successMessage);
	}
}

function openDeleteDialog(key) {
	pendingDeleteKey = key;
	deleteKey.textContent = key;
	deleteDialog.hidden = false;
	document.body.classList.add('modal-open');
	confirmDeleteButton.focus();
}

function closeDeleteDialog() {
	pendingDeleteKey = null;
	deleteDialog.hidden = true;
	document.body.classList.remove('modal-open');
}

async function deleteFile() {
	if (!pendingDeleteKey) {
		return;
	}

	const key = pendingDeleteKey;

	confirmDeleteButton.disabled = true;
	confirmDeleteButton.textContent = '删除中…';

	try {
		await requestFiles(`/api/files?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
		files = files.filter((file) => file.key !== key);
		closeDeleteDialog();
		renderFiles();
		showToast('图片已删除');
	} catch (error) {
		closeDeleteDialog();
		showManagerError(error.message || '删除失败，请稍后重试。');
	} finally {
		confirmDeleteButton.disabled = false;
		confirmDeleteButton.textContent = '确认删除';
	}
}

function showToast(message) {
	window.clearTimeout(toastTimer);
	toast.textContent = message;
	toast.classList.add('visible');
	toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 1800);
}

if (getToken()) {
	loadFiles({ reset: true });
}
