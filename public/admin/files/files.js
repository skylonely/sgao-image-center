const refreshButton = document.querySelector('#refreshButton');
const activeFilesButton = document.querySelector('#activeFilesButton');
const trashFilesButton = document.querySelector('#trashFilesButton');
const trashNotice = document.querySelector('#trashNotice');
const manager = document.querySelector('#manager');
const searchInput = document.querySelector('#searchInput');
const directoryFilter = document.querySelector('#directoryFilter');
const formatFilter = document.querySelector('#formatFilter');
const sortOrder = document.querySelector('#sortOrder');
const sortTimeDescOption = document.querySelector('#sortTimeDescOption');
const sortTimeAscOption = document.querySelector('#sortTimeAscOption');
const clearFiltersButton = document.querySelector('#clearFiltersButton');
const directoryFilterHint = document.querySelector('#directoryFilterHint');
const loadDirectoriesButton = document.querySelector('#loadDirectoriesButton');
const searchProgress = document.querySelector('#searchProgress');
const searchProgressText = document.querySelector('#searchProgressText');
const searchControlButton = document.querySelector('#searchControlButton');
const fileCount = document.querySelector('#fileCount');
const managerStatus = document.querySelector('#managerStatus');
const folderList = document.querySelector('#folderList');
const loadMoreButton = document.querySelector('#loadMoreButton');
const selectVisibleButton = document.querySelector('#selectVisibleButton');
const overviewButton = document.querySelector('#overviewButton');
const overviewPanel = document.querySelector('#overviewPanel');
const overviewScanButton = document.querySelector('#overviewScanButton');
const overviewStatus = document.querySelector('#overviewStatus');
const overviewCards = document.querySelector('#overviewCards');
const overviewDirectories = document.querySelector('#overviewDirectories');
const overviewFormats = document.querySelector('#overviewFormats');
const overviewLargest = document.querySelector('#overviewLargest');
const exportVisibleButton = document.querySelector('#exportVisibleButton');
const selectionBar = document.querySelector('#selectionBar');
const selectedCount = document.querySelector('#selectedCount');
const clearSelectionButton = document.querySelector('#clearSelectionButton');
const batchDeleteButton = document.querySelector('#batchDeleteButton');
const batchMoveButton = document.querySelector('#batchMoveButton');
const batchExportButton = document.querySelector('#batchExportButton');
const exportDialog = document.querySelector('#exportDialog');
const exportForm = document.querySelector('#exportForm');
const exportSummary = document.querySelector('#exportSummary');
const exportList = document.querySelector('#exportList');
const exportProgress = document.querySelector('#exportProgress');
const exportError = document.querySelector('#exportError');
const cancelExportButton = document.querySelector('#cancelExportButton');
const confirmExportButton = document.querySelector('#confirmExportButton');
const moveDialog = document.querySelector('#moveDialog');
const moveForm = document.querySelector('#moveForm');
const moveDirectory = document.querySelector('#moveDirectory');
const moveNewDirectory = document.querySelector('#moveNewDirectory');
const moveNewDirectoryLabel = document.querySelector('#moveNewDirectoryLabel');
const moveDirectoryHint = document.querySelector('#moveDirectoryHint');
const moveAcknowledged = document.querySelector('#moveAcknowledged');
const moveError = document.querySelector('#moveError');
const moveSummary = document.querySelector('#moveSummary');
const moveResults = document.querySelector('#moveResults');
const cancelMoveButton = document.querySelector('#cancelMoveButton');
const confirmMoveButton = document.querySelector('#confirmMoveButton');
const deleteDialog = document.querySelector('#deleteDialog');
const deleteTitle = document.querySelector('#deleteTitle');
const deleteDescription = document.querySelector('#deleteDescription');
const deleteKey = document.querySelector('#deleteKey');
const cancelDeleteButton = document.querySelector('#cancelDeleteButton');
const confirmDeleteButton = document.querySelector('#confirmDeleteButton');
const renameDialog = document.querySelector('#renameDialog');
const renameForm = document.querySelector('#renameForm');
const renameInput = document.querySelector('#renameInput');
const renameError = document.querySelector('#renameError');
const cancelRenameButton = document.querySelector('#cancelRenameButton');
const confirmRenameButton = document.querySelector('#confirmRenameButton');
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
let selectedKeys = new Set();
let cursor = null;
let pendingDeleteKeys = [];
let pendingRenameFile = null;
let toastTimer = null;
let previewIndex = -1;
let lastPreviewTrigger = null;
let trashMode = false;
let loadGeneration = 0;
let pendingPurgeFile = null;
let operationBusy = false;
let listComplete = false;
let loadingFiles = false;
let loadController = null;
let searchTimer = null;
let searchPaused = false;
let directoryScanRequested = false;
let directoryOptionsSignature = '';
let pendingMoveFiles = [];
let moveFinished = false;
let moveGeneration = 0;
let pendingExportFiles = [];
let exportController = null;
let exportGeneration = 0;
let overviewController = null;
let overviewGeneration = 0;
let overviewBusy = false;
const MAX_OVERVIEW_FILES = 10000;
const fileNameCollator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
sortOrder.value = 'time-desc';

activeFilesButton.addEventListener('click', () => switchView(false));
trashFilesButton.addEventListener('click', () => switchView(true));

function switchView(nextTrashMode) {
	if (operationBusy || !window.imageAccount.authorized) return;
	trashMode = nextTrashMode;
	cancelFileLoad();
	listComplete = false; searchPaused = false;
	files = []; cursor = null; selectedKeys.clear();
	closeImagePreview(); closeDeleteDialog(); closeRenameDialog(); closeMoveDialog(); closeExportDialog(true);
	activeFilesButton.setAttribute('aria-pressed', String(!trashMode));
	trashFilesButton.setAttribute('aria-pressed', String(trashMode));
	trashNotice.hidden = !trashMode;
	selectVisibleButton.hidden = trashMode;
	searchInput.value = '';
	directoryFilter.value = ''; formatFilter.value = ''; directoryScanRequested = false;
	sortOrder.value = 'time-desc';
	renderFiles();
	loadFiles({ reset: true });
}

const MAX_BATCH_DELETE = 50;
const MAX_EXPORT_FILES = 20;
const collapsedFolders = new Set(readCollapsedFolders());

refreshButton.addEventListener('click', () => { if (!operationBusy) return loadFiles({ reset: true }); });
loadMoreButton.addEventListener('click', () => loadFiles({ reset: false }));
searchInput.addEventListener('input', handleSearchInput);
directoryFilter.addEventListener('change', handleFilterChange);
formatFilter.addEventListener('change', handleFilterChange);
sortOrder.addEventListener('change', handleSearchInput);
clearFiltersButton.addEventListener('click', () => {
	directoryFilter.value = ''; formatFilter.value = '';
	handleFilterChange();
});
loadDirectoriesButton.addEventListener('click', () => {
	if (operationBusy || loadingFiles || !window.imageAccount.authorized) return;
	directoryScanRequested = true;
	return loadFiles({ reset: false });
});
searchControlButton.addEventListener('click', () => {
	if (operationBusy || !window.imageAccount.authorized) return;
	if (loadingFiles || searchTimer !== null) {
		cancelFileLoad(); searchPaused = true; renderFiles();
	} else {
		searchPaused = false; return loadFiles({ reset: false });
	}
});
selectVisibleButton.addEventListener('click', toggleVisibleSelection);
overviewButton.addEventListener('click', toggleOverview);
overviewScanButton.addEventListener('click', () => overviewBusy ? cancelOverviewScan() : scanOverview());
exportVisibleButton.addEventListener('click', () => openExportDialog('current'));
clearSelectionButton.addEventListener('click', clearSelection);
batchDeleteButton.addEventListener('click', () => openDeleteDialog([...selectedKeys]));
batchMoveButton.addEventListener('click', openMoveDialog);
batchExportButton.addEventListener('click', () => openExportDialog('selected'));
cancelExportButton.addEventListener('click', cancelExport);
exportForm.addEventListener('submit', exportSelectedFiles);
exportDialog.addEventListener('click', (event) => { if (event.target === exportDialog) cancelExport(); });
cancelMoveButton.addEventListener('click', () => closeMoveDialog());
moveForm.addEventListener('submit', moveSelectedFiles);
moveDirectory.addEventListener('change', updateMovePreview);
moveNewDirectory.addEventListener('input', updateMovePreview);
moveDialog.addEventListener('click', (event) => { if (event.target === moveDialog) closeMoveDialog(); });

cancelDeleteButton.addEventListener('click', closeDeleteDialog);
confirmDeleteButton.addEventListener('click', deleteFile);
cancelRenameButton.addEventListener('click', closeRenameDialog);
renameForm.addEventListener('submit', renameFile);

deleteDialog.addEventListener('click', (event) => {
	if (event.target === deleteDialog) {
		closeDeleteDialog();
	}
});

renameDialog.addEventListener('click', (event) => {
	if (event.target === renameDialog) {
		closeRenameDialog();
	}
});

document.addEventListener('keydown', (event) => {
	if (!exportDialog.hidden) {
		if (event.key === 'Escape') cancelExport();
		return;
	}
	if (!moveDialog.hidden) {
		if (event.key === 'Escape') closeMoveDialog();
		if (event.key === 'Tab') {
			const controls = [...moveForm.querySelectorAll('button:not(:disabled), select:not(:disabled), input:not(:disabled)')].filter((control) => !control.hidden);
			if (!controls.length) { event.preventDefault(); return; }
			const first = controls[0], last = controls.at(-1);
			if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
			else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
		}
		return;
	}
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

	if (event.key === 'Escape' && !renameDialog.hidden) {
		closeRenameDialog();
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

async function requestFiles(url, options = {}) {
	const response = await window.imageAccount.request(url, options);

	let result;

	try {
		result = await response.json();
	} catch {
		throw new Error('服务器返回了无法解析的响应');
	}
	if (!window.imageAccount.authorized) throw new Error('登录状态已变化，请重新登录。');

	if (!response.ok || !result.success) {
		const error = new Error(result.message || '请求失败');
		error.status = response.status;
		throw error;
	}

	return result;
}

function toggleOverview() {
	if (overviewBusy) return;
	overviewPanel.hidden = !overviewPanel.hidden;
	overviewButton.setAttribute('aria-expanded', String(!overviewPanel.hidden));
	overviewButton.textContent = overviewPanel.hidden ? '图片库概览' : '收起概览';
}

function resetOverview() {
	overviewGeneration += 1; overviewController?.abort(); overviewController = null; overviewBusy = false;
	overviewPanel.hidden = true; overviewButton.setAttribute('aria-expanded', 'false'); overviewButton.textContent = '图片库概览'; overviewScanButton.textContent = '扫描图片库'; overviewScanButton.disabled = false;
	overviewStatus.textContent = '尚未扫描。'; overviewCards.replaceChildren(); overviewDirectories.replaceChildren(); overviewFormats.replaceChildren(); overviewLargest.replaceChildren();
}

function formatCategory(file) {
	const name = file.key.split('/').at(-1) || ''; const dot = name.lastIndexOf('.'); const extension = dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
	if (extension === 'jpg' || extension === 'jpeg') return 'JPEG';
	return ({ png: 'PNG', webp: 'WebP', gif: 'GIF', svg: 'SVG' })[extension] || '其他';
}

function aggregateOverview(active, trash) {
	const bucket = (records, key) => {
		const map = new Map();
		for (const file of records) { const label = key(file); const current = map.get(label) || { label, count: 0, size: 0 }; current.count += 1; current.size += Number(file.size) || 0; map.set(label, current); }
		return [...map.values()].sort((left, right) => right.size - left.size || right.count - left.count || left.label.localeCompare(right.label, 'zh-CN'));
	};
	return { activeCount: active.length, activeBytes: active.reduce((total, file) => total + (Number(file.size) || 0), 0), trashCount: trash.length, trashBytes: trash.reduce((total, file) => total + (Number(file.size) || 0), 0),
		directories: bucket(active, (file) => file.key.includes('/') ? file.key.split('/')[0] : '根目录'), formats: bucket(active, formatCategory), largest: [...active].sort((left, right) => (Number(right.size) || 0) - (Number(left.size) || 0) || left.key.localeCompare(right.key, 'zh-CN')).slice(0, 20) };
}

function renderOverviewList(element, records, formatter) {
	element.replaceChildren();
	if (!records.length) { const item = document.createElement('li'); item.textContent = '暂无数据'; element.append(item); return; }
	for (const record of records) { const item = document.createElement('li'); const label = document.createElement('span'); const detail = document.createElement('span'); label.textContent = record.label || record.key; detail.textContent = formatter(record); item.append(label, detail); element.append(item); }
}

function renderOverview(active, trash, complete) {
	const summary = aggregateOverview(active, trash); overviewCards.replaceChildren();
	for (const [label, value] of [['正常图片', `${summary.activeCount} 张 · ${formatSize(summary.activeBytes)}`], ['回收站', `${summary.trashCount} 张 · ${formatSize(summary.trashBytes)}`], ['合计占用', formatSize(summary.activeBytes + summary.trashBytes)]]) {
		const card = document.createElement('div'); card.className = 'overview-card'; const caption = document.createElement('span'); const number = document.createElement('strong'); caption.textContent = label; number.textContent = value; card.append(caption, number); overviewCards.append(card);
	}
	renderOverviewList(overviewDirectories, summary.directories.slice(0, 8), (record) => `${record.count} 张 · ${formatSize(record.size)}`);
	renderOverviewList(overviewFormats, summary.formats, (record) => `${record.count} 张 · ${formatSize(record.size)}`);
	renderOverviewList(overviewLargest, summary.largest, (record) => formatSize(record.size));
	if (complete) overviewStatus.textContent = `扫描完成：正常图片 ${summary.activeCount} 张，回收站 ${summary.trashCount} 张。统计时间 ${formatDate(new Date().toISOString())}。`;
}

async function collectOverview(path, label, controller, generation) {
	const entries = []; const ids = new Set(); const cursors = new Set(); let cursor = null;
	do {
		if (generation !== overviewGeneration || !window.imageAccount.authorized) { const error = new Error('统计已取消'); error.name = 'AbortError'; throw error; }
		const query = new URLSearchParams({ limit: '200' }); if (cursor) query.set('cursor', cursor);
		const result = await requestFiles(`${path}?${query}`, { signal: controller.signal });
		if (generation !== overviewGeneration || !window.imageAccount.authorized || controller.signal.aborted) { const error = new Error('统计已取消'); error.name = 'AbortError'; throw error; }
		if (!Array.isArray(result.files) || (result.truncated && (!result.cursor || cursors.has(result.cursor)))) throw new Error('统计分页信息异常，请稍后重试。');
		for (const file of result.files) { const id = file.id || file.key; if (!ids.has(id)) { ids.add(id); entries.push(file); } }
		if (entries.length > MAX_OVERVIEW_FILES) throw new Error(`图片数量超过 ${MAX_OVERVIEW_FILES} 张，暂不生成不完整统计。`);
		cursor = result.truncated ? result.cursor : null; if (cursor) cursors.add(cursor);
		overviewStatus.textContent = `正在扫描${label}：已读取 ${entries.length} 张…`;
	} while (cursor);
	return entries;
}

function cancelOverviewScan() {
	if (!overviewController) return;
	overviewController.abort(); overviewGeneration += 1; overviewController = null; overviewBusy = false; overviewScanButton.textContent = '重新扫描'; overviewScanButton.disabled = false; overviewStatus.textContent = '统计扫描已取消，未显示不完整结果。';
}

async function scanOverview() {
	if (overviewBusy || !window.imageAccount.authorized) return;
	const generation = ++overviewGeneration; const controller = new AbortController(); overviewController = controller; overviewBusy = true; overviewScanButton.textContent = '停止扫描'; overviewCards.replaceChildren(); overviewDirectories.replaceChildren(); overviewFormats.replaceChildren(); overviewLargest.replaceChildren();
	try {
		const active = await collectOverview('/api/files', '正常图片', controller, generation);
		const trash = await collectOverview('/api/trash', '回收站', controller, generation);
		if (generation !== overviewGeneration || !window.imageAccount.authorized) return;
		renderOverview(active, trash, true);
	} catch (error) {
		if (generation !== overviewGeneration || error?.name === 'AbortError') return;
		overviewStatus.textContent = error?.message || '统计扫描失败，请稍后重试。';
	} finally {
		if (generation === overviewGeneration) { overviewBusy = false; overviewController = null; overviewScanButton.textContent = '重新扫描'; overviewScanButton.disabled = false; }
	}
}

function cancelFileLoad() {
	window.clearTimeout(searchTimer); searchTimer = null;
	loadGeneration += 1;
	loadController?.abort(); loadController = null;
	loadingFiles = false;
	setLoading(false);
}

function hasActiveCriteria() {
	return Boolean(searchInput.value.trim() || directoryFilter.value || formatFilter.value);
}

function needsFullList() {
	return hasActiveCriteria() || directoryScanRequested || sortOrder.value !== 'directory';
}

function compareFileRecords(left, right) {
	const mode = sortOrder.value;
	let comparison = 0;
	if (mode.startsWith('time-') || mode.startsWith('size-')) {
		const timeKey = trashMode ? 'deletedAt' : 'uploaded';
		const sizeValue = (file) => typeof file.size === 'number' && file.size >= 0 ? file.size : NaN;
		const a = mode.startsWith('time-') ? Date.parse(left[timeKey]) : sizeValue(left);
		const b = mode.startsWith('time-') ? Date.parse(right[timeKey]) : sizeValue(right);
		// Unknown dates/sizes stay last, regardless of direction.
		if (Number.isFinite(a) !== Number.isFinite(b)) return Number.isFinite(a) ? -1 : 1;
		if (Number.isFinite(a)) comparison = mode.endsWith('asc') ? a - b : b - a;
	} else if (mode.startsWith('name-')) {
		comparison = fileNameCollator.compare(left.key.split('/').at(-1), right.key.split('/').at(-1));
		if (mode.endsWith('desc')) comparison *= -1;
	}
	if (comparison) return comparison;
	if (left.key !== right.key) return left.key < right.key ? -1 : 1;
	return String(left.id || '').localeCompare(String(right.id || ''), 'en');
}

function handleFilterChange() {
	// Do not retain hidden selections when the filtering conditions change.
	selectedKeys.clear();
	handleSearchInput();
}

function updateDirectoryOptions() {
	const selected = directoryFilter.value;
	const directories = new Set();
	for (const file of files) {
		const segments = file.key.split('/'); segments.pop();
		for (let depth = 1; depth <= segments.length; depth += 1) directories.add(segments.slice(0, depth).join('/'));
	}
	// Keep a chosen directory during refresh even before its page has been read.
	if (selected.startsWith('dir:')) directories.add(selected.slice(4));
	const sorted = [...directories].sort((left, right) => left.localeCompare(right, 'zh-CN'));
	const signature = JSON.stringify(sorted);
	if (signature !== directoryOptionsSignature) {
		directoryOptionsSignature = signature;
		const options = [['', '全部目录'], ['root', '根目录'], ...sorted.map((folder) => [`dir:${folder}`, `${folder}（含子目录）`])];
		directoryFilter.replaceChildren();
		for (const [value, label] of options) {
			const option = document.createElement('option'); option.value = value; option.textContent = label;
			directoryFilter.append(option);
		}
		directoryFilter.value = selected;
	}
	directoryFilterHint.textContent = listComplete ? '目录已完整读取，指定目录包含其子目录。' : '目录选项会随读取补齐；可读取全部目录。';
	loadDirectoriesButton.hidden = listComplete;
	loadDirectoriesButton.disabled = loadingFiles || operationBusy;
	clearFiltersButton.disabled = !directoryFilter.value && !formatFilter.value;
}

function matchesFileFilters(file) {
	const folder = directoryFilter.value;
	if (folder === 'root' && file.key.includes('/')) return false;
	if (folder.startsWith('dir:') && !file.key.startsWith(`${folder.slice(4)}/`)) return false;
	const format = formatFilter.value;
	if (!format) return true;
	const filename = file.key.split('/').at(-1);
	const dot = filename.lastIndexOf('.');
	const extension = dot < 0 ? '' : filename.slice(dot + 1).toLowerCase();
	// Match stored file extensions, not possibly stale or generic MIME metadata.
	return format === 'jpeg' ? extension === 'jpg' || extension === 'jpeg' : extension === format;
}

function handleSearchInput() {
	cancelFileLoad(); searchPaused = false;
	directoryScanRequested = false;
	closeImagePreview();
	managerStatus.textContent = ''; managerStatus.className = 'manager-status';
	if (needsFullList() && !listComplete && window.imageAccount.authorized) {
		searchTimer = window.setTimeout(() => {
			searchTimer = null;
			if (operationBusy) { searchPaused = true; renderFiles(); return; }
			loadFiles({ reset: false });
		}, 300);
	}
	renderFiles();
}

function updateSearchProgress(matches) {
	const searching = needsFullList();
	searchProgress.hidden = !searching;
	loadMoreButton.hidden = searching || listComplete;
	if (!searching) return;
	const busy = loadingFiles || searchTimer !== null;
	const action = directoryFilter.value || formatFilter.value ? '筛选' : searchInput.value.trim() ? '搜索' : directoryScanRequested ? '读取' : '排序';
	const phase = busy ? `正在${action}全部文件` : `${action}${searchPaused ? '已暂停' : '尚未完成'}`;
	searchProgressText.textContent = listComplete
		? `${action}完成：已检查 ${files.length} 个文件，找到 ${matches} 个匹配。`
		: `${phase}：已检查 ${files.length} 个文件，找到 ${matches} 个匹配。结果可能不完整。`;
	searchControlButton.hidden = listComplete;
	searchControlButton.disabled = operationBusy;
	searchControlButton.textContent = `${busy ? '暂停' : '继续'}${action}`;
}

async function loadFiles({ reset }) {
	if (!window.imageAccount.authorized) return;
	cancelFileLoad();
	const generation = loadGeneration;
	const requestedTrashMode = trashMode;
	const seenCursors = new Set(cursor ? [cursor] : []);
	const controller = new AbortController();
	loadController = controller;
	searchPaused = false;
	if (reset) {
		files = []; cursor = null; listComplete = false; selectedKeys.clear();
		seenCursors.clear();
		closeImagePreview();
	}
	loadingFiles = true;

	setLoading(true, reset ? '正在读取文件…' : '正在加载更多…');
	renderFiles();

	try {
		do {
			if (listComplete) break;
			const query = new URLSearchParams({ limit: '100' });
			if (cursor) query.set('cursor', cursor);

			const result = await requestFiles(`${requestedTrashMode ? '/api/trash' : '/api/files'}?${query}`, { signal: controller.signal });
			if (generation !== loadGeneration || !window.imageAccount.authorized) return;
			if (!Array.isArray(result.files) || (result.truncated && (!result.cursor || seenCursors.has(result.cursor)))) {
				throw new Error('服务器分页信息异常，请刷新后重试。');
			}
			if (result.truncated) seenCursors.add(result.cursor);

			// A repeated page must not duplicate files (trash may have several versions of one path).
			const merged = new Map(files.map((file) => [file.id || file.key, file]));
			for (const file of result.files) merged.set(file.id || file.key, file);
			files = [...merged.values()];
			cursor = result.cursor;
			listComplete = !result.truncated;

			manager.hidden = false;
			managerStatus.textContent = '';
			managerStatus.className = 'manager-status';

			renderFiles();
			// Continue through empty pages too; only pagination metadata determines completion.
		} while (needsFullList() && !listComplete);
	} catch (error) {
		if (generation === loadGeneration && window.imageAccount.authorized) {
			searchPaused = true;
			showManagerError(error.message || '文件读取失败，请稍后重试。');
		}
	} finally {
		if (generation === loadGeneration) {
			loadingFiles = false; loadController = null;
			setLoading(false); renderFiles();
		}
	}
}

function setLoading(loading, message = '') {
	refreshButton.disabled = loading || operationBusy;
	loadMoreButton.disabled = loading;
	folderList.setAttribute('aria-busy', String(loading));
	if (!loading && managerStatus.className === 'manager-status loading') {
		managerStatus.className = 'manager-status'; managerStatus.textContent = '';
	}

	if (loading && manager.hidden === false) {
		managerStatus.className = 'manager-status loading';
		managerStatus.textContent = message;
	}
}

function showManagerError(message) {
	if (!window.imageAccount.authorized) return;
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
	updateDirectoryOptions();
	sortTimeDescOption.textContent = trashMode ? '删除时间：最新在前' : '上传时间：最新在前';
	sortTimeAscOption.textContent = trashMode ? '删除时间：最早在前' : '上传时间：最早在前';
	const query = searchInput.value.trim().toLocaleLowerCase();
	const filtered = hasActiveCriteria();
	const visibleFiles = files.filter((file) => (!query || file.key.toLocaleLowerCase().includes(query)) && matchesFileFilters(file));
	const previewed = previewIndex >= 0 ? renderedFiles[previewIndex] : null;
	if (sortOrder.value !== 'directory') visibleFiles.sort(compareFileRecords);
	const availableKeys = new Set(files.map((file) => file.key));

	renderedFiles = visibleFiles;
	if (previewed) {
		previewIndex = renderedFiles.findIndex((file) => (file.id || file.key) === (previewed.id || previewed.key));
		if (previewIndex < 0) closeImagePreview();
		else updateImagePreview();
	}
	selectedKeys = new Set([...selectedKeys].filter((key) => availableKeys.has(key)));
	fileCount.textContent = filtered ? `${visibleFiles.length} / ${files.length} 个文件${listComplete ? '' : '（已读取）'}` : `${files.length} 个文件${listComplete ? '' : '（已读取）'}`;
	updateSearchProgress(visibleFiles.length);
	folderList.replaceChildren();
	updateSelectionUI();

	if (!visibleFiles.length) {
		const empty = document.createElement('div');

		empty.className = 'empty-state';
		empty.innerHTML = `
			<div class="empty-icon" aria-hidden="true">⌁</div>
			<strong>${filtered ? listComplete ? '没有匹配的文件' : '暂未找到匹配的文件' : !listComplete && needsFullList() ? '尚未读取到图片' : cursor ? '当前页没有可见图片' : trashMode ? '回收站是空的' : '还没有图片'}</strong>
			<span>${!listComplete && needsFullList() ? '读取尚未完成，请等待或点击继续。' : filtered ? '换个关键词或筛选条件试试。' : cursor ? '点击加载更多，继续读取后面的图片。' : trashMode ? '移入回收站的图片会出现在这里。' : '从上传页添加第一张图片吧。'}</span>
		`;

		folderList.append(empty);
		return;
	}

	if (sortOrder.value !== 'directory') {
		const list = document.createElement('div'); list.className = 'files-list sorted-files-list';
		for (const file of visibleFiles) list.append(createFileRow({ ...file, filename: file.key.split('/').at(-1) }));
		folderList.append(list);
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
		const isCollapsed = !filtered && collapsedFolders.has(folder);

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
	if (trashMode) return createTrashRow(file);
	const row = document.createElement('article');
	const selectLabel = document.createElement('label');
	const checkbox = document.createElement('input');
	const preview = document.createElement('button');
	const image = document.createElement('img');
	const details = document.createElement('div');
	const name = document.createElement('a');
	const meta = document.createElement('p');
	const actions = document.createElement('div');

	row.className = 'file-row';
	row.classList.toggle('selected', selectedKeys.has(file.key));

	selectLabel.className = 'file-select';
	selectLabel.title = `选择 ${file.filename}`;
	checkbox.type = 'checkbox';
	checkbox.checked = selectedKeys.has(file.key);
	checkbox.disabled = operationBusy;
	checkbox.setAttribute('aria-label', `选择 ${file.filename}`);
	checkbox.addEventListener('change', () => {
		if (operationBusy) return;
		if (checkbox.checked) {
			if (selectedKeys.size >= MAX_BATCH_DELETE) {
				checkbox.checked = false;
				showToast(`单次最多选择 ${MAX_BATCH_DELETE} 个文件`);
				return;
			}

			selectedKeys.add(file.key);
		} else {
			selectedKeys.delete(file.key);
		}

		row.classList.toggle('selected', checkbox.checked);
		updateSelectionUI();
	});
	selectLabel.append(checkbox);

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
	if (sortOrder.value !== 'directory') {
		const path = document.createElement('p'); path.className = 'file-meta'; path.textContent = file.key;
		details.append(path);
	}

	actions.className = 'file-actions';
	actions.append(
		createActionButton('复制地址', 'copy', () => copyText(file.url, '地址已复制')),
		createActionButton('Markdown', 'markdown', () => copyText(`![](${file.url})`, 'Markdown 已复制')),
		createOpenLink(file.url),
		createActionButton('重命名', 'rename', () => openRenameDialog(file)),
		createActionButton('删除', 'delete', () => openDeleteDialog(file.key)),
	);

	row.append(selectLabel, preview, details, actions);

	return row;
}

function updateSelectionUI() {
	const selectedVisibleCount = renderedFiles.filter((file) => selectedKeys.has(file.key)).length;
	const allVisibleSelected = renderedFiles.length > 0 && selectedVisibleCount === renderedFiles.length;
	const selectionAtLimit = selectedVisibleCount > 0 && selectedKeys.size >= MAX_BATCH_DELETE;

	selectionBar.hidden = trashMode || selectedKeys.size === 0;
	selectedCount.textContent = `已选择 ${selectedKeys.size} 个文件`;
	batchDeleteButton.textContent = `删除所选（${selectedKeys.size}）`;
	batchMoveButton.textContent = `移动所选（${selectedKeys.size}）`;
	batchExportButton.textContent = `导出所选（${selectedKeys.size}）`;
	batchMoveButton.disabled = operationBusy;
	batchExportButton.disabled = operationBusy;
	batchDeleteButton.disabled = operationBusy;
	clearSelectionButton.disabled = operationBusy;
	selectVisibleButton.textContent =
		allVisibleSelected || selectionAtLimit ? '取消当前选择' : renderedFiles.length > MAX_BATCH_DELETE ? '选择前 50 个' : '选择当前';
	selectVisibleButton.disabled = operationBusy || renderedFiles.length === 0;
	exportVisibleButton.disabled = operationBusy || renderedFiles.length === 0 || !listComplete;
}

function toggleVisibleSelection() {
	if (operationBusy) return;
	const visibleKeys = renderedFiles.map((file) => file.key);
	const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((key) => selectedKeys.has(key));
	const selectedVisibleCount = visibleKeys.filter((key) => selectedKeys.has(key)).length;
	const selectionAtLimit = selectedVisibleCount > 0 && selectedKeys.size >= MAX_BATCH_DELETE;

	if (allVisibleSelected || selectionAtLimit) {
		for (const key of visibleKeys) {
			selectedKeys.delete(key);
		}
	} else {
		for (const key of visibleKeys) {
			if (selectedKeys.size >= MAX_BATCH_DELETE) {
				break;
			}

			selectedKeys.add(key);
		}

		if (visibleKeys.length > MAX_BATCH_DELETE) {
			showToast(`已选择前 ${MAX_BATCH_DELETE} 个文件`);
		}
	}

	renderFiles();
}

function clearSelection() {
	if (operationBusy) return;
	selectedKeys.clear();
	renderFiles();
}

function openExportDialog(scope) {
	if (operationBusy || trashMode || !window.imageAccount.authorized) return;
	if (scope === 'current' && !listComplete) { showToast('请先读取完整结果后再导出当前结果。'); return; }
	const source = scope === 'selected' ? files.filter((file) => selectedKeys.has(file.key)) : renderedFiles;
	if (!source.length) { showToast('没有可导出的图片。'); return; }
	if (source.length > MAX_EXPORT_FILES) { showToast(`单次最多导出 ${MAX_EXPORT_FILES} 张图片，请先缩小筛选范围。`); return; }
	closeImagePreview(); closeRenameDialog(); closeDeleteDialog(); closeMoveDialog();
	pendingExportFiles = source.map((file) => ({ ...file })); exportGeneration += 1;
	exportError.hidden = true; exportError.textContent = ''; exportProgress.textContent = '';
	const expectedBytes = pendingExportFiles.reduce((total, file) => total + (Number(file.size) || 0), 0);
	exportSummary.textContent = `${scope === 'selected' ? '所选' : '当前结果'}共 ${pendingExportFiles.length} 张，列表大小约 ${formatSize(expectedBytes)}。每次最多导出 20 张、50 MB 原图。`;
	exportList.replaceChildren();
	for (const file of pendingExportFiles) { const item = document.createElement('li'); item.textContent = `${file.key} · ${formatSize(file.size)}`; exportList.append(item); }
	confirmExportButton.disabled = false; confirmExportButton.textContent = '开始下载'; cancelExportButton.disabled = false; cancelExportButton.textContent = '取消';
	exportDialog.hidden = false; document.body.classList.add('modal-open'); confirmExportButton.focus();
}

function closeExportDialog(force = false) {
	if (operationBusy && !force) return;
	if (force) exportController?.abort();
	exportGeneration += 1; exportController = null; pendingExportFiles = [];
	exportDialog.hidden = true; exportList.replaceChildren(); exportSummary.textContent = ''; exportProgress.textContent = '';
	exportError.hidden = true; exportError.textContent = ''; document.body.classList.remove('modal-open');
}

function cancelExport() {
	if (exportController) {
		exportController.abort(); operationBusy = false; closeExportDialog(true); setLoading(loadingFiles); if (window.imageAccount.authorized) renderFiles(); showToast('已取消导出。');
		return;
	}
	closeExportDialog();
}

function exportFilename() {
	const day = new Date().toISOString().slice(0, 10);
	return `sgao-image-backup-${day}.zip`;
}

async function exportSelectedFiles(event) {
	event.preventDefault();
	if (operationBusy || !pendingExportFiles.length || !window.imageAccount.authorized) return;
	if (!window.ImageZip?.createZip || !window.ImageZip?.download) { exportError.textContent = '当前浏览器不支持生成 ZIP 文件。'; exportError.hidden = false; return; }
	const snapshot = pendingExportFiles.map((file) => ({ ...file })); const generation = exportGeneration; exportController = new AbortController();
	operationBusy = true; confirmExportButton.disabled = true; confirmExportButton.textContent = '正在读取原图…'; cancelExportButton.textContent = '取消下载'; exportError.hidden = true; renderFiles();
	try {
		const result = await window.ImageZip.createZip(snapshot, { signal: exportController.signal, onProgress: (progress) => {
			if (generation !== exportGeneration) return;
			exportProgress.textContent = progress.phase === 'packing' ? '正在打包 ZIP…' : `正在读取 ${progress.index} / ${progress.total}：${progress.key}`;
		} });
		if (generation !== exportGeneration || !window.imageAccount.authorized) return;
		window.ImageZip.download(result.blob, exportFilename());
		const skipped = result.manifest?.failed?.length || 0;
		operationBusy = false; exportController = null; closeExportDialog(); setLoading(loadingFiles); renderFiles(); showToast(skipped ? `已下载备份，${skipped} 张未能读取，详见清单。` : `已下载 ${snapshot.length} 张图片的备份。`);
	} catch (error) {
		if (generation !== exportGeneration || error?.name === 'AbortError') return;
		exportError.textContent = error?.message || '导出失败，请重试。'; exportError.hidden = false; confirmExportButton.disabled = false; confirmExportButton.textContent = '重新下载';
	} finally {
		if (generation === exportGeneration) { operationBusy = false; exportController = null; setLoading(loadingFiles); if (window.imageAccount.authorized) renderFiles(); }
	}
}

function openMoveDialog() {
	if (operationBusy || trashMode || !window.imageAccount.authorized || !selectedKeys.size) return;
	closeImagePreview(); closeRenameDialog(); closeDeleteDialog();
	pendingMoveFiles = files.filter((file) => selectedKeys.has(file.key)).map((file) => ({ ...file }));
	if (!pendingMoveFiles.length || pendingMoveFiles.length > 50) return;
	moveGeneration += 1; moveFinished = false;
	const directories = new Set();
	for (const file of files) {
		const parts = file.key.split('/'); parts.pop();
		for (let depth = 1; depth <= parts.length; depth += 1) directories.add(parts.slice(0, depth).join('/'));
	}
	moveDirectory.replaceChildren();
	for (const [value, text] of [['', '请选择目录'], ['root', '根目录'], ...[...directories].sort((a, b) => a.localeCompare(b, 'zh-CN')).map((folder) => [`dir:${folder}`, folder]), ['new', '新建目录…']]) {
		const option = document.createElement('option'); option.value = value; option.textContent = text; moveDirectory.append(option);
	}
	moveDirectory.value = ''; moveNewDirectory.value = ''; moveAcknowledged.checked = false;
	moveDirectory.disabled = false; moveNewDirectory.disabled = false; moveAcknowledged.disabled = false;
	confirmMoveButton.disabled = false; confirmMoveButton.hidden = false; confirmMoveButton.textContent = '确认移动';
	cancelMoveButton.disabled = false; cancelMoveButton.textContent = '取消';
	moveError.hidden = true; moveError.textContent = ''; moveSummary.textContent = '';
	moveDirectoryHint.textContent = listComplete ? '目录已完整读取。' : '目录选项来自已读取的图片；也可输入任何新目录。';
	updateMovePreview(); moveDialog.hidden = false;
	document.body.classList.add('modal-open'); moveDirectory.focus();
}

function moveDestination() {
	return moveDirectory.value === 'root' ? '' : moveDirectory.value === 'new' ? moveNewDirectory.value.trim() : moveDirectory.value.startsWith('dir:') ? moveDirectory.value.slice(4) : null;
}

function updateMovePreview() {
	if (operationBusy || moveFinished) return;
	moveNewDirectory.hidden = moveNewDirectoryLabel.hidden = moveDirectory.value !== 'new';
	moveAcknowledged.checked = false;
	const directory = moveDestination();
	moveResults.replaceChildren();
	for (const file of pendingMoveFiles) {
		const item = document.createElement('li');
		const target = directory === null || (moveDirectory.value === 'new' && !directory) ? '请选择目标目录' : directory ? `${directory}/${file.key.split('/').at(-1)}` : file.key.split('/').at(-1);
		item.textContent = `${file.key} → ${target}`; moveResults.append(item);
	}
}

function closeMoveDialog(force = false) {
	if (operationBusy && !force) return;
	moveGeneration += 1; pendingMoveFiles = []; moveFinished = false;
	moveDialog.hidden = true; moveResults.replaceChildren(); moveSummary.textContent = '';
	moveError.hidden = true; moveError.textContent = ''; moveAcknowledged.checked = false;
	moveNewDirectory.value = ''; moveDirectory.value = '';
	document.body.classList.remove('modal-open');
	if (window.imageAccount.authorized && batchMoveButton.isConnected) batchMoveButton.focus();
}

async function moveSelectedFiles(event) {
	event.preventDefault();
	if (operationBusy || moveFinished || !pendingMoveFiles.length || !window.imageAccount.authorized) return;
	const directory = moveDestination();
	if (directory === null || (moveDirectory.value === 'new' && !directory) || !moveAcknowledged.checked) {
		moveError.textContent = '请选择目标目录，并勾选链接变化确认。'; moveError.hidden = false; return;
	}
	if (directory && (directory.includes('\\') || /[\u0000-\u001f\u007f]/.test(directory)
		|| directory.split('/').some((part) => !part || part === '.' || part === '..') || ['admin', 'api', '__sgao_trash'].includes(directory.split('/')[0]))) {
		moveError.textContent = '目录无效，请勿使用空路径段、点路径或系统保留目录。'; moveError.hidden = false; return;
	}
	const snapshot = pendingMoveFiles.map((file) => ({ ...file }));
	const generation = moveGeneration;
	operationBusy = true; cancelFileLoad(); searchPaused = true;
	confirmMoveButton.disabled = true; confirmMoveButton.textContent = '移动中…'; cancelMoveButton.disabled = true;
	moveDirectory.disabled = true; moveNewDirectory.disabled = true; moveAcknowledged.disabled = true;
	moveError.hidden = true; moveSummary.textContent = `正在处理 ${snapshot.length} 张图片，请勿关闭页面。`;
	renderFiles();
	try {
		const result = await requestFiles('/api/files', { method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'move', directory, files: snapshot.map((file) => ({ key: file.key, expectedEtag: file.etag, expectedVersion: file.version })) }) });
		if (generation !== moveGeneration || !window.imageAccount.authorized) return;
		if (!Array.isArray(result.moved) || !Array.isArray(result.failed) || !Array.isArray(result.skipped)) throw new Error('移动结果无法解析，请刷新检查两个目录后再操作。');
		const moved = new Map(result.moved.map((entry) => [entry.previousKey, entry.file]));
		const skipped = new Set(result.skipped.map((entry) => entry.key));
		const failed = new Map(result.failed.map((entry) => [entry.key, entry]));
		const updated = new Map(files.filter((file) => !moved.has(file.key)).map((file) => [file.key, file]));
		for (const file of moved.values()) updated.set(file.key, file);
		for (const failure of failed.values()) if (failure.copiedFile) updated.set(failure.copiedFile.key, failure.copiedFile);
		files = [...updated.values()];
		for (const file of snapshot) if (moved.has(file.key) || skipped.has(file.key)) selectedKeys.delete(file.key);
		// Moving keys changes pagination positions; restart metadata scanning from the beginning.
		cursor = null; listComplete = false;
		moveResults.replaceChildren();
		for (const file of snapshot) {
			const item = document.createElement('li');
			const state = moved.has(file.key) ? 'moved' : skipped.has(file.key) ? 'skipped' : 'failed';
			item.setAttribute('data-state', state);
			const target = directory ? `${directory}/${file.key.split('/').at(-1)}` : file.key.split('/').at(-1);
			item.textContent = state === 'moved' ? `已移动：${file.key} → ${moved.get(file.key).key}` : state === 'skipped' ? `未移动：${file.key}（已在目标目录）` : `未完成：${file.key} → ${failed.get(file.key)?.copiedFile?.key || target} — ${failed.get(file.key)?.message || '结果未确认，请刷新检查。'}`;
			moveResults.append(item);
		}
		moveFinished = true; confirmMoveButton.hidden = true; cancelMoveButton.textContent = '关闭';
		moveSummary.textContent = `已移动 ${moved.size} 张，原目录跳过 ${skipped.size} 张，未完成 ${failed.size} 张。未完成项保持勾选；请检查结果后刷新列表。`;
	} catch (error) {
		if (generation !== moveGeneration || !window.imageAccount.authorized) return;
		if (error.status === 400) {
			moveError.textContent = error.message; moveError.hidden = false; moveSummary.textContent = '请求未执行，请检查输入后重新确认。';
			moveDirectory.disabled = false; moveNewDirectory.disabled = false; moveAcknowledged.disabled = false;
			moveAcknowledged.checked = false; confirmMoveButton.disabled = false;
			return;
		}
		moveError.textContent = `${error.message || '请求失败。'} 如果请求已发送，部分图片可能已移动；请刷新检查两个目录，勿直接重复提交。`;
		cursor = null; listComplete = false;
		moveError.hidden = false; moveSummary.textContent = '移动结果未确认。';
		moveFinished = true; confirmMoveButton.hidden = true; cancelMoveButton.textContent = '关闭';
	} finally {
		if (generation === moveGeneration) {
			operationBusy = false; cancelMoveButton.disabled = false; confirmMoveButton.textContent = '确认移动';
			setLoading(loadingFiles); if (window.imageAccount.authorized) renderFiles(); cancelMoveButton.focus();
		}
	}
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

function openRenameDialog(file) {
	if (operationBusy) return;
	pendingRenameFile = file;
	renameInput.value = file.key.split('/').at(-1) || file.key;
	renameError.hidden = true;
	renameError.textContent = '';
	renameDialog.hidden = false;
	document.body.classList.add('modal-open');
	renameInput.focus();
	renameInput.select();
}

function closeRenameDialog() {
	pendingRenameFile = null;
	renameDialog.hidden = true;
	renameError.hidden = true;
	renameError.textContent = '';
	document.body.classList.remove('modal-open');
}

async function renameFile(event) {
	event.preventDefault();
	if (operationBusy) return;

	if (!pendingRenameFile) {
		return;
	}

	const source = pendingRenameFile;
	const newFilename = renameInput.value.trim();

	if (!newFilename) {
		renameError.textContent = '请输入新文件名。';
		renameError.hidden = false;
		renameInput.focus();
		return;
	}

	operationBusy = true;
	confirmRenameButton.disabled = true;
	cancelFileLoad(); searchPaused = true;
	confirmRenameButton.textContent = '保存中…';
	renameError.hidden = true;

	try {
		const result = await requestFiles('/api/files', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				key: source.key,
				newFilename,
				expectedEtag: source.etag,
			}),
		});

		files = files.map((file) => (file.key === source.key ? result.file : file));

		if (selectedKeys.delete(source.key)) {
			selectedKeys.add(result.file.key);
		}

		operationBusy = false;
		closeRenameDialog();
		renderFiles();
		showToast(`已重命名为 ${newFilename}`);
		if (needsFullList() && !listComplete) loadFiles({ reset: false });
	} catch (error) {
		renameError.textContent = error.message || '重命名失败，请稍后重试。';
		renameError.hidden = false;
	} finally {
		operationBusy = false; setLoading(loadingFiles);
		confirmRenameButton.disabled = false;
		confirmRenameButton.textContent = '保存名称';
		if (window.imageAccount.authorized) renderFiles();
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
	if (!Number.isFinite(date.getTime())) return '时间未知';

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

function openDeleteDialog(value) {
	if (operationBusy) return;
	const keys = Array.isArray(value) ? value : [value];

	if (!keys.length) {
		return;
	}

	pendingDeleteKeys = keys.slice(0, MAX_BATCH_DELETE);
	pendingPurgeFile = null;
	confirmDeleteButton.textContent = '移入回收站';
	deleteTitle.textContent = pendingDeleteKeys.length === 1 ? '移入回收站？' : `将 ${pendingDeleteKeys.length} 张图片移入回收站？`;
	deleteDescription.textContent = '可以在回收站恢复。引用这些图片的网页会暂时无法显示图片；浏览器已缓存的副本可能仍可见。';
	deleteKey.textContent =
		pendingDeleteKeys.length === 1
			? pendingDeleteKeys[0]
			: `${pendingDeleteKeys.slice(0, 3).join('\n')}${pendingDeleteKeys.length > 3 ? `\n…以及另外 ${pendingDeleteKeys.length - 3} 个文件` : ''}`;
	deleteDialog.hidden = false;
	document.body.classList.add('modal-open');
	confirmDeleteButton.focus();
}

function closeDeleteDialog() {
	if (operationBusy) return;
	pendingPurgeFile = null;
	pendingDeleteKeys = [];
	deleteDialog.hidden = true;
	document.body.classList.remove('modal-open');
}

async function deleteFile() {
	if (operationBusy) return;
	if (pendingPurgeFile) return permanentlyDeleteFile();
	if (!pendingDeleteKeys.length) {
		return;
	}

	const keys = [...pendingDeleteKeys];
	operationBusy = true;
	cancelFileLoad(); searchPaused = true;

	confirmDeleteButton.disabled = true;
	confirmDeleteButton.textContent = '移入中…';

	try {
		let deleted = keys;
		let failed = [];
		if (keys.length === 1) {
			await requestFiles(`/api/files?key=${encodeURIComponent(keys[0])}`, { method: 'DELETE' });
		} else {
			const result = await requestFiles('/api/files', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ keys }),
			});
			deleted = result.deletedKeys;
			failed = result.failed || [];
		}

		const deletedKeys = new Set(deleted);

		files = files.filter((file) => !deletedKeys.has(file.key));

		for (const key of deleted) {
			selectedKeys.delete(key);
		}

		operationBusy = false;
		closeDeleteDialog();
		renderFiles();
		showToast(`已移入回收站 ${deleted.length} 张图片`);
		if (!failed.length && needsFullList() && !listComplete) loadFiles({ reset: false });
		if (failed.length) showManagerError(`${failed.length} 张未移入：${failed.map((entry) => entry.message).join('；')}`);
	} catch (error) {
		operationBusy = false;
		closeDeleteDialog();
		showManagerError(error.message || '删除失败，请稍后重试。');
	} finally {
		operationBusy = false; setLoading(loadingFiles);
		confirmDeleteButton.disabled = false;
		confirmDeleteButton.textContent = '移入回收站';
		if (window.imageAccount.authorized) renderFiles();
	}
}

function showToast(message) {
	window.clearTimeout(toastTimer);
	toast.textContent = message;
	toast.classList.add('visible');
	toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 1800);
}

window.addEventListener('image-auth-changed', (event) => {
	if (event.detail.authorized) loadFiles({ reset: true });
	else {
		cancelFileLoad(); listComplete = false; searchPaused = false;
		resetOverview();
		operationBusy = false;
		files = []; cursor = null; selectedKeys.clear(); folderList.replaceChildren();
		manager.hidden = true; selectionBar.hidden = true; searchProgress.hidden = true;
		searchInput.value = ''; searchProgressText.textContent = ''; managerStatus.textContent = '';
		directoryFilter.value = ''; formatFilter.value = ''; directoryScanRequested = false;
		sortOrder.value = 'time-desc';
		updateDirectoryOptions();
		closeImagePreview(); closeRenameDialog(); closeDeleteDialog(); closeMoveDialog(true); closeExportDialog(true);
	}
});

function createTrashRow(file) {
	const row = document.createElement('article');
	row.className = 'file-row recycle-row';
	const image = document.createElement('img');
	image.className = 'recycle-thumbnail'; image.src = file.url; image.alt = ''; image.loading = 'lazy';
	image.addEventListener('error', () => { image.hidden = true; });
	const details = document.createElement('div'); details.className = 'file-details';
	const name = document.createElement('strong'); name.className = 'managed-file-name'; name.textContent = file.filename;
	const key = document.createElement('p'); key.className = 'file-meta'; key.textContent = file.key;
	const meta = document.createElement('p'); meta.className = 'file-meta';
	meta.textContent = `${formatSize(file.size)} · 删除于 ${formatDate(file.deletedAt)}`;
	details.append(name, key, meta);
	const actions = document.createElement('div'); actions.className = 'file-actions';
	actions.append(createActionButton('恢复', 'rename', () => restoreFile(file)),
		createActionButton('彻底删除', 'delete', () => openPurgeDialog(file)));
	row.append(image, details, actions);
	return row;
}

async function restoreFile(file) {
	if (operationBusy) return;
	operationBusy = true;
	cancelFileLoad(); searchPaused = true;
	try {
		const result = await requestFiles('/api/trash', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: file.id }) });
		showToast(result.cleanupPending ? '图片已恢复，回收站副本清理待重试' : '图片已恢复到原路径');
		operationBusy = false;
		await loadFiles({ reset: true });
	} catch (error) { showManagerError(error.message || '恢复失败，请刷新重试。'); }
	finally { operationBusy = false; setLoading(loadingFiles); if (window.imageAccount.authorized) renderFiles(); }
}

function openPurgeDialog(file) {
	if (operationBusy) return;
	pendingDeleteKeys = []; pendingPurgeFile = file;
	deleteTitle.textContent = '彻底删除这张图片？';
	deleteDescription.textContent = '将永久移除回收站中的图片副本，无法恢复。不会删除原路径后来上传的新图片。';
	deleteKey.textContent = file.key; confirmDeleteButton.textContent = '确认彻底删除';
	deleteDialog.hidden = false; document.body.classList.add('modal-open'); cancelDeleteButton.focus();
}

async function permanentlyDeleteFile() {
	const file = pendingPurgeFile;
	operationBusy = true; confirmDeleteButton.disabled = true; confirmDeleteButton.textContent = '彻底删除中…';
	cancelFileLoad(); searchPaused = true;
	try {
		await requestFiles('/api/trash', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: file.id, confirmation: 'DELETE' }) });
		operationBusy = false; closeDeleteDialog();
		showToast('已彻底删除，无法恢复'); await loadFiles({ reset: true });
	} catch (error) { operationBusy = false; closeDeleteDialog(); showManagerError(error.message || '彻底删除失败，请刷新检查。'); }
	finally { operationBusy = false; setLoading(loadingFiles); confirmDeleteButton.disabled = false; if (window.imageAccount.authorized) renderFiles(); }
}
