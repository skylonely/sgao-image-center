const refreshButton = document.querySelector('#refreshButton');
const activeFilesButton = document.querySelector('#activeFilesButton');
const trashFilesButton = document.querySelector('#trashFilesButton');
const trashNotice = document.querySelector('#trashNotice');
const manager = document.querySelector('#manager');
const searchInput = document.querySelector('#searchInput');
const directoryFilter = document.querySelector('#directoryFilter');
const formatFilter = document.querySelector('#formatFilter');
const tagFilter = document.querySelector('#tagFilter');
const favoriteFilter = document.querySelector('#favoriteFilter');
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
const batchTagsButton = document.querySelector('#batchTagsButton');
const batchRestoreTrashButton = document.querySelector('#batchRestoreTrashButton');
const batchPurgeTrashButton = document.querySelector('#batchPurgeTrashButton');
const trashBatchDialog = document.querySelector('#trashBatchDialog');
const trashBatchForm = document.querySelector('#trashBatchForm');
const trashBatchTitle = document.querySelector('#trashBatchTitle');
const trashBatchWarning = document.querySelector('#trashBatchWarning');
const trashBatchSummary = document.querySelector('#trashBatchSummary');
const trashBatchResults = document.querySelector('#trashBatchResults');
const trashBatchAcknowledgement = document.querySelector('#trashBatchAcknowledgement');
const trashBatchAcknowledged = document.querySelector('#trashBatchAcknowledged');
const trashBatchError = document.querySelector('#trashBatchError');
const cancelTrashBatchButton = document.querySelector('#cancelTrashBatchButton');
const confirmTrashBatchButton = document.querySelector('#confirmTrashBatchButton');
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
const tagsDialog = document.querySelector('#tagsDialog');
const tagsForm = document.querySelector('#tagsForm');
const tagsKey = document.querySelector('#tagsKey');
const tagsInput = document.querySelector('#tagsInput');
const tagsFavorite = document.querySelector('#tagsFavorite');
const tagsError = document.querySelector('#tagsError');
const cancelTagsButton = document.querySelector('#cancelTagsButton');
const confirmTagsButton = document.querySelector('#confirmTagsButton');
const batchTagsDialog = document.querySelector('#batchTagsDialog');
const batchTagsForm = document.querySelector('#batchTagsForm');
const batchAddTagsInput = document.querySelector('#batchAddTagsInput');
const batchRemoveTagsInput = document.querySelector('#batchRemoveTagsInput');
const batchFavoriteAction = document.querySelector('#batchFavoriteAction');
const batchTagsError = document.querySelector('#batchTagsError');
const batchTagsSummary = document.querySelector('#batchTagsSummary');
const batchTagsResults = document.querySelector('#batchTagsResults');
const cancelBatchTagsButton = document.querySelector('#cancelBatchTagsButton');
const confirmBatchTagsButton = document.querySelector('#confirmBatchTagsButton');
const replaceDialog = document.querySelector('#replaceDialog');
const replaceForm = document.querySelector('#replaceForm');
const replaceKey = document.querySelector('#replaceKey');
const replaceInput = document.querySelector('#replaceInput');
const replaceSelection = document.querySelector('#replaceSelection');
const replaceError = document.querySelector('#replaceError');
const cancelReplaceButton = document.querySelector('#cancelReplaceButton');
const confirmReplaceButton = document.querySelector('#confirmReplaceButton');
const versionsDialog = document.querySelector('#versionsDialog');
const versionsForm = document.querySelector('#versionsForm');
const versionsKey = document.querySelector('#versionsKey');
const versionsStatus = document.querySelector('#versionsStatus');
const versionsList = document.querySelector('#versionsList');
const versionsError = document.querySelector('#versionsError');
const restoreAcknowledgement = document.querySelector('#restoreAcknowledgement');
const restoreAcknowledged = document.querySelector('#restoreAcknowledged');
const closeVersionsButton = document.querySelector('#closeVersionsButton');
const confirmRestoreButton = document.querySelector('#confirmRestoreButton');
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
let pendingTagsFile = null;
let pendingBatchTagFiles = [];
let batchTagsFinished = false;
let batchTagsGeneration = 0;
let pendingReplaceFile = null;
let pendingVersionFile = null;
let pendingRestoreVersion = null;
let toastTimer = null;
let previewIndex = -1;
let lastPreviewTrigger = null;
function requestedInitialView() {
	try { return new URLSearchParams(window.location.search).get('view'); }
	catch { return null; }
}

function consumeInitialView() {
	try {
		const query = new URLSearchParams(window.location.search);
		if (!query.has('view')) return;
		query.delete('view');
		const nextQuery = query.toString();
		window.history?.replaceState(window.history.state, '', `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash || ''}`);
	} catch { /* Keep the selected view even if the address cannot be cleaned up. */ }
}

let trashMode = requestedInitialView() === 'trash';
let loadGeneration = 0;
let pendingPurgeFile = null;
let pendingTrashBatchFiles = [];
let trashBatchAction = null;
let trashBatchFinished = false;
let trashBatchGeneration = 0;
let operationBusy = false;
let listComplete = false;
let loadingFiles = false;
let loadController = null;
let searchTimer = null;
let searchPaused = false;
let directoryScanRequested = false;
let directoryOptionsSignature = '';
let tagOptionsSignature = '';
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
activeFilesButton.setAttribute('aria-pressed', String(!trashMode));
trashFilesButton.setAttribute('aria-pressed', String(trashMode));
trashNotice.hidden = !trashMode;
consumeInitialView();

activeFilesButton.addEventListener('click', () => switchView(false));
trashFilesButton.addEventListener('click', () => switchView(true));

function switchView(nextTrashMode) {
	if (operationBusy || !window.imageAccount.authorized) return;
	trashMode = nextTrashMode;
	cancelFileLoad();
	listComplete = false; searchPaused = false;
	files = []; cursor = null; selectedKeys.clear();
	closeImagePreview(); closeDeleteDialog(); closeTrashBatchDialog(true); closeRenameDialog(); closeTagsDialog(true); closeBatchTagsDialog(true); closeReplaceDialog(true); closeVersionsDialog(true); closeMoveDialog(); closeExportDialog(true);
	activeFilesButton.setAttribute('aria-pressed', String(!trashMode));
	trashFilesButton.setAttribute('aria-pressed', String(trashMode));
	trashNotice.hidden = !trashMode;
	selectVisibleButton.hidden = false;
	searchInput.value = '';
	directoryFilter.value = ''; formatFilter.value = ''; tagFilter.value = ''; favoriteFilter.checked = false; directoryScanRequested = false;
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
tagFilter.addEventListener('change', handleFilterChange);
favoriteFilter.addEventListener('change', handleFilterChange);
sortOrder.addEventListener('change', handleSearchInput);
clearFiltersButton.addEventListener('click', () => {
	directoryFilter.value = ''; formatFilter.value = ''; tagFilter.value = ''; favoriteFilter.checked = false;
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
batchTagsButton.addEventListener('click', openBatchTagsDialog);
batchRestoreTrashButton.addEventListener('click', () => openTrashBatchDialog('restore'));
batchPurgeTrashButton.addEventListener('click', () => openTrashBatchDialog('purge'));
cancelTrashBatchButton.addEventListener('click', () => closeTrashBatchDialog());
trashBatchForm.addEventListener('submit', submitTrashBatch);
trashBatchAcknowledged.addEventListener('change', () => {
	confirmTrashBatchButton.disabled = trashBatchAction === 'purge' && !trashBatchAcknowledged.checked;
});
trashBatchDialog.addEventListener('click', (event) => { if (event.target === trashBatchDialog) closeTrashBatchDialog(); });
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
cancelTagsButton.addEventListener('click', () => closeTagsDialog());
tagsForm.addEventListener('submit', saveTags);
tagsDialog.addEventListener('click', (event) => { if (event.target === tagsDialog) closeTagsDialog(); });
cancelBatchTagsButton.addEventListener('click', () => closeBatchTagsDialog());
batchTagsForm.addEventListener('submit', saveBatchTags);
batchTagsDialog.addEventListener('click', (event) => { if (event.target === batchTagsDialog) closeBatchTagsDialog(); });
cancelReplaceButton.addEventListener('click', () => closeReplaceDialog());
replaceForm.addEventListener('submit', replaceFile);
replaceInput.addEventListener('change', updateReplaceSelection);
replaceDialog.addEventListener('click', (event) => { if (event.target === replaceDialog) closeReplaceDialog(); });
closeVersionsButton.addEventListener('click', () => closeVersionsDialog());
versionsForm.addEventListener('submit', restoreVersion);
versionsDialog.addEventListener('click', (event) => { if (event.target === versionsDialog) closeVersionsDialog(); });

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
	if (!trashBatchDialog.hidden) {
		if (event.key === 'Escape') closeTrashBatchDialog();
		return;
	}
	if (!batchTagsDialog.hidden) {
		if (event.key === 'Escape') closeBatchTagsDialog();
		return;
	}
	if (!tagsDialog.hidden) {
		if (event.key === 'Escape') closeTagsDialog();
		return;
	}
	if (!versionsDialog.hidden) {
		if (event.key === 'Escape') closeVersionsDialog();
		return;
	}
	if (!replaceDialog.hidden) {
		if (event.key === 'Escape') closeReplaceDialog();
		return;
	}
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
	return Boolean(searchInput.value.trim() || directoryFilter.value || formatFilter.value || tagFilter.value || favoriteFilter.checked);
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
	clearFiltersButton.disabled = !directoryFilter.value && !formatFilter.value && !tagFilter.value && !favoriteFilter.checked;
}

function updateTagOptions() {
	const selected = tagFilter.value;
	const tags = new Set();
	for (const file of files) for (const tag of file.tags || []) tags.add(tag);
	if (selected) tags.add(selected);
	const sorted = [...tags].sort((left, right) => left.localeCompare(right, 'zh-CN'));
	const signature = JSON.stringify(sorted);
	if (signature !== tagOptionsSignature) {
		tagOptionsSignature = signature;
		tagFilter.replaceChildren();
		for (const [value, label] of [['', '全部标签'], ...sorted.map((tag) => [tag, tag])]) {
			const option = document.createElement('option'); option.value = value; option.textContent = label; tagFilter.append(option);
		}
		tagFilter.value = selected;
	}
}

function matchesFileFilters(file) {
	const folder = directoryFilter.value;
	if (folder === 'root' && file.key.includes('/')) return false;
	if (folder.startsWith('dir:') && !file.key.startsWith(`${folder.slice(4)}/`)) return false;
	if (favoriteFilter.checked && !file.favorite) return false;
	if (tagFilter.value && !(file.tags || []).some((tag) => tag === tagFilter.value)) return false;
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
	const action = directoryFilter.value || formatFilter.value || tagFilter.value || favoriteFilter.checked ? '筛选' : searchInput.value.trim() ? '搜索' : directoryScanRequested ? '读取' : '排序';
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
	updateTagOptions();
	sortTimeDescOption.textContent = trashMode ? '删除时间：最新在前' : '上传时间：最新在前';
	sortTimeAscOption.textContent = trashMode ? '删除时间：最早在前' : '上传时间：最早在前';
	const query = searchInput.value.trim().toLocaleLowerCase();
	const filtered = hasActiveCriteria();
	const visibleFiles = files.filter((file) => (!query || file.key.toLocaleLowerCase().includes(query)) && matchesFileFilters(file));
	const previewed = previewIndex >= 0 ? renderedFiles[previewIndex] : null;
	if (sortOrder.value !== 'directory') visibleFiles.sort(compareFileRecords);
	const availableKeys = new Set(files.map((file) => trashMode ? file.id : file.key));

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
	if (file.favorite || file.tags?.length) {
		const labels = document.createElement('div'); labels.className = 'file-labels';
		if (file.favorite) {
			const favorite = document.createElement('span'); favorite.className = 'file-label favorite'; favorite.textContent = '★ 收藏'; labels.append(favorite);
		}
		for (const tag of file.tags || []) {
			const label = document.createElement('span'); label.className = 'file-label'; label.textContent = tag; labels.append(label);
		}
		details.append(labels);
	}

	actions.className = 'file-actions';
	actions.append(
		createActionButton('复制地址', 'copy', () => copyText(file.url, '地址已复制')),
		createActionButton('Markdown', 'markdown', () => copyText(`![](${file.url})`, 'Markdown 已复制')),
		createOpenLink(file.url),
		createActionButton(file.favorite ? '取消收藏' : '收藏', 'favorite', () => toggleFavorite(file)),
		createActionButton('标签', 'tags', () => openTagsDialog(file)),
		createActionButton('替换', 'replace', () => openReplaceDialog(file)),
		createActionButton('历史', 'history', () => openVersionsDialog(file)),
		createActionButton('重命名', 'rename', () => openRenameDialog(file)),
		createActionButton('删除', 'delete', () => openDeleteDialog(file.key)),
	);

	row.append(selectLabel, preview, details, actions);

	return row;
}

function updateSelectionUI() {
	const selectedVisibleCount = renderedFiles.filter((file) => selectedKeys.has(trashMode ? file.id : file.key)).length;
	const allVisibleSelected = renderedFiles.length > 0 && selectedVisibleCount === renderedFiles.length;
	const selectionAtLimit = selectedVisibleCount > 0 && selectedKeys.size >= MAX_BATCH_DELETE;

	selectionBar.hidden = selectedKeys.size === 0;
	selectedCount.textContent = `已选择 ${selectedKeys.size} 个文件`;
	batchDeleteButton.textContent = `删除所选（${selectedKeys.size}）`;
	batchRestoreTrashButton.textContent = `恢复所选（${selectedKeys.size}）`;
	batchPurgeTrashButton.textContent = `彻底删除所选（${selectedKeys.size}）`;
	for (const button of [batchDeleteButton, batchMoveButton, batchExportButton, batchTagsButton]) button.hidden = trashMode;
	batchRestoreTrashButton.hidden = !trashMode;
	batchPurgeTrashButton.hidden = !trashMode;
	batchMoveButton.textContent = `移动所选（${selectedKeys.size}）`;
	batchExportButton.textContent = `导出所选（${selectedKeys.size}）`;
	batchTagsButton.textContent = `编辑标签（${selectedKeys.size}）`;
	batchMoveButton.disabled = operationBusy;
	batchExportButton.disabled = operationBusy;
	batchTagsButton.disabled = operationBusy;
	batchDeleteButton.disabled = operationBusy;
	batchRestoreTrashButton.disabled = operationBusy;
	batchPurgeTrashButton.disabled = operationBusy;
	clearSelectionButton.disabled = operationBusy;
	selectVisibleButton.textContent =
		allVisibleSelected || selectionAtLimit ? '取消当前选择' : renderedFiles.length > MAX_BATCH_DELETE ? '选择前 50 个' : '选择当前';
	selectVisibleButton.disabled = operationBusy || renderedFiles.length === 0;
	exportVisibleButton.disabled = operationBusy || renderedFiles.length === 0 || !listComplete;
}

function toggleVisibleSelection() {
	if (operationBusy) return;
	const visibleKeys = renderedFiles.map((file) => trashMode ? file.id : file.key);
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

function openBatchTagsDialog() {
	if (operationBusy || trashMode || !window.imageAccount.authorized || !selectedKeys.size) return;
	const selected = files.filter((file) => selectedKeys.has(file.key));
	if (!selected.length || selected.length > MAX_BATCH_DELETE) return;
	closeImagePreview(); closeRenameDialog(); closeTagsDialog(true); closeDeleteDialog(); closeMoveDialog(); closeExportDialog(true);
	pendingBatchTagFiles = selected.map((file) => ({ ...file, tags: [...(file.tags || [])] }));
	batchTagsGeneration += 1; batchTagsFinished = false;
	batchAddTagsInput.value = ''; batchRemoveTagsInput.value = ''; batchFavoriteAction.value = 'keep';
	batchAddTagsInput.disabled = false; batchRemoveTagsInput.disabled = false; batchFavoriteAction.disabled = false;
	batchTagsError.hidden = true; batchTagsError.textContent = ''; batchTagsResults.replaceChildren();
	batchTagsSummary.textContent = `已选择 ${pendingBatchTagFiles.length} 张图片。成功项会取消选择，失败项会继续保留。`;
	confirmBatchTagsButton.hidden = false; confirmBatchTagsButton.disabled = false; confirmBatchTagsButton.textContent = '应用修改';
	cancelBatchTagsButton.disabled = false; cancelBatchTagsButton.textContent = '取消';
	batchTagsDialog.hidden = false; document.body.classList.add('modal-open'); batchAddTagsInput.focus();
}

function closeBatchTagsDialog(force = false) {
	if (operationBusy && !force) return;
	batchTagsGeneration += 1; pendingBatchTagFiles = []; batchTagsFinished = false;
	batchAddTagsInput.value = ''; batchRemoveTagsInput.value = ''; batchFavoriteAction.value = 'keep';
	batchTagsError.hidden = true; batchTagsError.textContent = ''; batchTagsSummary.textContent = ''; batchTagsResults.replaceChildren();
	batchTagsDialog.hidden = true; document.body.classList.remove('modal-open');
	if (window.imageAccount.authorized && batchTagsButton.isConnected) batchTagsButton.focus();
}

function batchMetadataForFile(file, addTags, removeTags, favoriteAction) {
	const remove = new Set(removeTags.map((tag) => tag.toLocaleLowerCase('zh-CN')));
	const seen = new Set(); const tags = [];
	for (const original of file.tags || []) {
		const tag = String(original).trim().normalize('NFC'); const identity = tag.toLocaleLowerCase('zh-CN');
		if (tag && !remove.has(identity) && !seen.has(identity)) { seen.add(identity); tags.push(tag); }
	}
	for (const tag of addTags) {
		const identity = tag.toLocaleLowerCase('zh-CN');
		if (!seen.has(identity)) { seen.add(identity); tags.push(tag); }
	}
	if (tags.length > 12) return null;
	const favorite = favoriteAction === 'favorite' ? true : favoriteAction === 'unfavorite' ? false : Boolean(file.favorite);
	return { tags, favorite };
}

function renderBatchTagsResults(snapshot, updated, failed) {
	batchTagsResults.replaceChildren();
	for (const file of snapshot) {
		const item = document.createElement('li'); const next = updated.get(file.key); const failure = failed.get(file.key);
		item.setAttribute('data-state', next ? 'updated' : 'failed');
		item.textContent = next
			? `已更新：${file.key}（${next.tags?.length || 0} 个标签${next.favorite ? ' · 已收藏' : ''}）`
			: `未完成：${file.key} — ${failure?.message || '结果未确认，请刷新检查。'}`;
		batchTagsResults.append(item);
	}
}

async function saveBatchTags(event) {
	event.preventDefault();
	if (operationBusy || batchTagsFinished || !pendingBatchTagFiles.length || !window.imageAccount.authorized) return;
	const addTags = normalizeTagInput(batchAddTagsInput.value); const removeTags = normalizeTagInput(batchRemoveTagsInput.value);
	if (addTags === null || removeTags === null) {
		batchTagsError.textContent = '每组最多 12 个标签，每个最多 32 个字符，不能包含控制字符。'; batchTagsError.hidden = false; return;
	}
	const removeIdentities = new Set(removeTags.map((tag) => tag.toLocaleLowerCase('zh-CN')));
	if (addTags.some((tag) => removeIdentities.has(tag.toLocaleLowerCase('zh-CN')))) {
		batchTagsError.textContent = '同一标签不能同时添加和移除。'; batchTagsError.hidden = false; return;
	}
	if (!addTags.length && !removeTags.length && batchFavoriteAction.value === 'keep') {
		batchTagsError.textContent = '请至少添加或移除一个标签，或者修改收藏状态。'; batchTagsError.hidden = false; return;
	}

	const snapshot = pendingBatchTagFiles.map((file) => ({ ...file, tags: [...(file.tags || [])] }));
	const generation = batchTagsGeneration; const localFailed = new Map(); const requestEntries = [];
	for (const file of snapshot) {
		const metadata = batchMetadataForFile(file, addTags, removeTags, batchFavoriteAction.value);
		if (!metadata) localFailed.set(file.key, { key: file.key, message: '添加后会超过 12 个标签，请先移除部分标签。' });
		else requestEntries.push({ key: file.key, expectedEtag: file.etag, expectedVersion: file.version, ...metadata });
	}
	if (!requestEntries.length) {
		renderBatchTagsResults(snapshot, new Map(), localFailed); batchTagsSummary.textContent = `已更新 0 张，未完成 ${localFailed.size} 张。未完成项保持勾选。`;
		batchTagsFinished = true; confirmBatchTagsButton.hidden = true; cancelBatchTagsButton.textContent = '关闭'; return;
	}

	operationBusy = true; cancelFileLoad(); searchPaused = true;
	confirmBatchTagsButton.disabled = true; confirmBatchTagsButton.textContent = '处理中…'; cancelBatchTagsButton.disabled = true;
	batchAddTagsInput.disabled = true; batchRemoveTagsInput.disabled = true; batchFavoriteAction.disabled = true;
	batchTagsError.hidden = true; batchTagsSummary.textContent = `正在处理 ${snapshot.length} 张图片，请勿关闭页面。`; renderFiles();
	try {
		const result = await requestFiles('/api/files', { method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'metadata-batch', files: requestEntries }) });
		if (generation !== batchTagsGeneration || !window.imageAccount.authorized) return;
		if (!Array.isArray(result.updated) || !Array.isArray(result.failed)) throw new Error('批量标签结果无法解析，请刷新后检查。');
		const updated = new Map(result.updated.map((entry) => [entry.previousKey, entry.file]));
		const failed = new Map([...localFailed, ...result.failed.map((entry) => [entry.key, entry])]);
		for (const entry of requestEntries) if (!updated.has(entry.key) && !failed.has(entry.key)) failed.set(entry.key, { key: entry.key, message: '服务器未返回处理结果，请刷新检查。' });
		files = files.map((file) => updated.get(file.key) || file);
		for (const key of updated.keys()) selectedKeys.delete(key);
		renderBatchTagsResults(snapshot, updated, failed);
		batchTagsSummary.textContent = `已更新 ${updated.size} 张，未完成 ${failed.size} 张。未完成项保持勾选；请检查结果后刷新列表。`;
		batchTagsFinished = true; confirmBatchTagsButton.hidden = true; cancelBatchTagsButton.textContent = '关闭';
	} catch (error) {
		if (generation !== batchTagsGeneration || !window.imageAccount.authorized) return;
		if (error.status === 400) {
			batchTagsError.textContent = error.message; batchTagsError.hidden = false; batchTagsSummary.textContent = '请求未执行，请检查输入后重试。';
			batchAddTagsInput.disabled = false; batchRemoveTagsInput.disabled = false; batchFavoriteAction.disabled = false; confirmBatchTagsButton.disabled = false;
			return;
		}
		batchTagsError.textContent = `${error.message || '请求失败。'} 如果请求已发送，部分图片可能已经更新；请刷新检查，勿直接重复提交。`;
		batchTagsError.hidden = false; batchTagsSummary.textContent = '批量编辑结果未确认。'; cursor = null; listComplete = false;
		batchTagsFinished = true; confirmBatchTagsButton.hidden = true; cancelBatchTagsButton.textContent = '关闭';
	} finally {
		if (generation === batchTagsGeneration) {
			operationBusy = false; cancelBatchTagsButton.disabled = false; confirmBatchTagsButton.textContent = '应用修改';
			setLoading(loadingFiles); if (window.imageAccount.authorized) renderFiles(); cancelBatchTagsButton.focus();
		}
	}
}

function openExportDialog(scope) {
	if (operationBusy || trashMode || !window.imageAccount.authorized) return;
	if (scope === 'current' && !listComplete) { showToast('请先读取完整结果后再导出当前结果。'); return; }
	const source = scope === 'selected' ? files.filter((file) => selectedKeys.has(file.key)) : renderedFiles;
	if (!source.length) { showToast('没有可导出的图片。'); return; }
	if (source.length > MAX_EXPORT_FILES) { showToast(`单次最多导出 ${MAX_EXPORT_FILES} 张图片，请先缩小筛选范围。`); return; }
	closeImagePreview(); closeRenameDialog(); closeDeleteDialog(); closeMoveDialog(); closeBatchTagsDialog(true);
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
	closeImagePreview(); closeRenameDialog(); closeDeleteDialog(); closeBatchTagsDialog(true);
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

function normalizeTagInput(value) {
	const tags = []; const seen = new Set();
	for (const raw of value.split(/[,，]/)) {
		const tag = raw.trim().normalize('NFC');
		if (!tag) continue;
		if ([...tag].length > 32 || /[\u0000-\u001f\u007f]/.test(tag)) return null;
		const identity = tag.toLocaleLowerCase('zh-CN');
		if (!seen.has(identity)) { seen.add(identity); tags.push(tag); }
	}
	return tags.length <= 12 ? tags : null;
}

function openTagsDialog(file) {
	if (operationBusy || trashMode || !window.imageAccount.authorized) return;
	closeImagePreview(); closeRenameDialog(); closeDeleteDialog(); closeBatchTagsDialog(true); closeReplaceDialog(true); closeVersionsDialog(true);
	pendingTagsFile = { ...file, tags: [...(file.tags || [])] };
	tagsKey.textContent = file.key; tagsInput.value = (file.tags || []).join('，'); tagsFavorite.checked = Boolean(file.favorite);
	tagsError.hidden = true; tagsError.textContent = ''; confirmTagsButton.disabled = false; confirmTagsButton.textContent = '保存标签';
	tagsDialog.hidden = false; document.body.classList.add('modal-open'); tagsInput.focus();
}

function closeTagsDialog(force = false) {
	if (operationBusy && !force) return;
	pendingTagsFile = null; tagsInput.value = ''; tagsFavorite.checked = false;
	tagsError.hidden = true; tagsError.textContent = ''; tagsDialog.hidden = true; document.body.classList.remove('modal-open');
}

async function saveMetadata(file, tags, favorite) {
	return requestFiles('/api/files', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
		action: 'metadata', key: file.key, expectedEtag: file.etag, expectedVersion: file.version, tags, favorite,
	}) });
}

function applyMetadataResult(previousKey, nextFile) {
	files = files.map((file) => file.key === previousKey ? nextFile : file);
	// Metadata writes change the R2 object version, so retain only the new list snapshot.
	renderFiles();
}

async function saveTags(event) {
	event.preventDefault();
	if (operationBusy || !pendingTagsFile) return;
	const tags = normalizeTagInput(tagsInput.value);
	if (tags === null) {
		tagsError.textContent = '最多 12 个标签，每个最多 32 个字符，不能包含控制字符。'; tagsError.hidden = false; return;
	}
	const file = { ...pendingTagsFile, tags: [...(pendingTagsFile.tags || [])] };
	operationBusy = true; cancelFileLoad(); searchPaused = true; confirmTagsButton.disabled = true; cancelTagsButton.disabled = true; confirmTagsButton.textContent = '保存中…';
	try {
		const result = await saveMetadata(file, tags, tagsFavorite.checked);
		operationBusy = false; closeTagsDialog(); applyMetadataResult(file.key, result.file); showToast('标签已保存。');
	} catch (error) {
		tagsError.textContent = error.message || '保存失败，请刷新后重试。'; tagsError.hidden = false;
	} finally {
		operationBusy = false; confirmTagsButton.disabled = false; cancelTagsButton.disabled = false; confirmTagsButton.textContent = '保存标签'; setLoading(loadingFiles);
		if (window.imageAccount.authorized) renderFiles();
	}
}

async function toggleFavorite(file) {
	if (operationBusy || trashMode || !window.imageAccount.authorized) return;
	operationBusy = true; cancelFileLoad(); searchPaused = true; renderFiles();
	try {
		const result = await saveMetadata(file, [...(file.tags || [])], !file.favorite);
		applyMetadataResult(file.key, result.file); showToast(result.file.favorite ? '已加入收藏。' : '已取消收藏。');
	} catch (error) {
		showManagerError(error.message || '收藏状态保存失败，请刷新后重试。');
	} finally {
		operationBusy = false; setLoading(loadingFiles); if (window.imageAccount.authorized) renderFiles();
	}
}

function openReplaceDialog(file) {
	if (operationBusy || trashMode || !window.imageAccount.authorized) return;
	closeImagePreview(); closeRenameDialog(); closeDeleteDialog(); closeVersionsDialog(true);
	pendingReplaceFile = { ...file };
	replaceKey.textContent = file.key;
	replaceInput.value = '';
	replaceSelection.textContent = '支持 JPEG、PNG、WebP、GIF、SVG，单张最大 10 MB。';
	replaceError.hidden = true; replaceError.textContent = '';
	confirmReplaceButton.disabled = false; confirmReplaceButton.textContent = '确认替换';
	replaceDialog.hidden = false;
	document.body.classList.add('modal-open');
	replaceInput.focus();
}

function closeReplaceDialog(force = false) {
	if (operationBusy && !force) return;
	pendingReplaceFile = null;
	replaceInput.value = '';
	replaceError.hidden = true; replaceError.textContent = '';
	replaceDialog.hidden = true;
	document.body.classList.remove('modal-open');
}

function updateReplaceSelection() {
	const file = replaceInput.files?.[0];
	if (!file) {
		replaceSelection.textContent = '支持 JPEG、PNG、WebP、GIF、SVG，单张最大 10 MB。';
		return;
	}
	replaceSelection.textContent = `${file.name} · ${formatSize(file.size)}`;
	if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'].includes(file.type) || file.size <= 0 || file.size > 10 * 1024 * 1024) {
		replaceError.textContent = '请选择支持的非空图片，且单张不能超过 10 MB。';
		replaceError.hidden = false;
	} else {
		replaceError.hidden = true; replaceError.textContent = '';
	}
}

async function replaceFile(event) {
	event.preventDefault();
	if (operationBusy || !pendingReplaceFile) return;
	const replacement = replaceInput.files?.[0];
	if (!replacement) {
		replaceError.textContent = '请选择要替换的新图片。'; replaceError.hidden = false; replaceInput.focus(); return;
	}
	updateReplaceSelection();
	if (!replaceError.hidden) return;
	const source = { ...pendingReplaceFile };
	operationBusy = true; cancelFileLoad(); searchPaused = true;
	confirmReplaceButton.disabled = true; cancelReplaceButton.disabled = true; confirmReplaceButton.textContent = '替换中…';
	try {
		const body = new FormData();
		body.set('replace', 'version-v1'); body.set('replaceKey', source.key); body.set('conflict', 'reject');
		body.set('expectedEtag', source.etag); body.set('expectedVersion', source.version); body.set('file', replacement, replacement.name);
		await requestFiles('/api/upload', { method: 'POST', body });
		operationBusy = false;
		closeReplaceDialog();
		showToast('图片已替换，旧图已保存到版本历史。');
		await loadFiles({ reset: true });
	} catch (error) {
		replaceError.textContent = error.message || '替换失败，请刷新后重试。'; replaceError.hidden = false;
	} finally {
		operationBusy = false; cancelReplaceButton.disabled = false; confirmReplaceButton.disabled = false; confirmReplaceButton.textContent = '确认替换';
		setLoading(loadingFiles); if (window.imageAccount.authorized) renderFiles();
	}
}

function versionPreviewUrl(file, version) {
	return `/api/versions?view=preview&key=${encodeURIComponent(file.key)}&id=${encodeURIComponent(version.id)}`;
}

async function openVersionsDialog(file) {
	if (operationBusy || trashMode || !window.imageAccount.authorized) return;
	closeImagePreview(); closeRenameDialog(); closeDeleteDialog(); closeReplaceDialog(true);
	pendingVersionFile = { ...file }; pendingRestoreVersion = null;
	versionsKey.textContent = file.key; versionsList.replaceChildren(); versionsError.hidden = true; versionsError.textContent = '';
	versionsStatus.textContent = '正在读取历史版本…'; restoreAcknowledgement.hidden = true; restoreAcknowledged.checked = false;
	confirmRestoreButton.hidden = true; versionsDialog.hidden = false; document.body.classList.add('modal-open'); closeVersionsButton.focus();
	try {
		const result = await requestFiles(`/api/versions?key=${encodeURIComponent(file.key)}`);
		if (pendingVersionFile?.key !== file.key) return;
		const versions = Array.isArray(result.versions) ? result.versions : [];
		versionsStatus.textContent = versions.length ? `保留了 ${versions.length} 个历史版本（最多 5 个）。` : '还没有历史版本。替换图片后会在这里显示。';
		for (const version of versions) {
			const item = document.createElement('li');
			const title = document.createElement('strong'); title.textContent = `${formatDateTime(version.createdAt)} · ${formatSize(version.size)}`;
			const type = document.createElement('span'); type.textContent = version.contentType;
			const actions = document.createElement('div'); actions.className = 'version-actions';
			const preview = document.createElement('a'); preview.className = 'file-action open'; preview.href = versionPreviewUrl(file, version); preview.target = '_blank'; preview.rel = 'noreferrer'; preview.textContent = '预览';
			const restore = createActionButton('恢复', 'history', () => selectVersionForRestore(version));
			actions.append(preview, restore); item.append(title, type, actions); versionsList.append(item);
		}
	} catch (error) {
		versionsStatus.textContent = '无法读取历史版本。'; versionsError.textContent = error.message || '读取失败，请稍后重试。'; versionsError.hidden = false;
	}
}

function selectVersionForRestore(version) {
	if (!pendingVersionFile || operationBusy) return;
	pendingRestoreVersion = version; restoreAcknowledgement.hidden = false; restoreAcknowledged.checked = false;
	confirmRestoreButton.hidden = false; confirmRestoreButton.disabled = false; confirmRestoreButton.textContent = `恢复 ${formatDateTime(version.createdAt)} 的版本`;
	versionsStatus.textContent = '请确认恢复。当前图片会被保存为新的历史版本。';
	restoreAcknowledged.focus();
}

function closeVersionsDialog(force = false) {
	if (operationBusy && !force) return;
	pendingVersionFile = null; pendingRestoreVersion = null; restoreAcknowledged.checked = false; restoreAcknowledgement.hidden = true;
	versionsList.replaceChildren(); versionsError.hidden = true; versionsError.textContent = ''; versionsDialog.hidden = true;
	document.body.classList.remove('modal-open');
}

async function restoreVersion(event) {
	event.preventDefault();
	if (operationBusy || !pendingVersionFile || !pendingRestoreVersion) return;
	if (!restoreAcknowledged.checked) {
		versionsError.textContent = '请先确认恢复操作。'; versionsError.hidden = false; return;
	}
	const file = { ...pendingVersionFile }; const version = { ...pendingRestoreVersion };
	operationBusy = true; cancelFileLoad(); searchPaused = true;
	confirmRestoreButton.disabled = true; closeVersionsButton.disabled = true; confirmRestoreButton.textContent = '恢复中…'; versionsError.hidden = true;
	try {
		await requestFiles('/api/versions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'restore', key: file.key, id: version.id, expectedEtag: file.etag, expectedVersion: file.version }) });
		operationBusy = false; closeVersionsDialog(); showToast('已恢复历史版本，替换前的图片已保存到版本历史。');
		await loadFiles({ reset: true });
	} catch (error) {
		versionsError.textContent = error.message || '恢复失败，请刷新后重试。'; versionsError.hidden = false;
	} finally {
		operationBusy = false; closeVersionsButton.disabled = false; confirmRestoreButton.disabled = false; confirmRestoreButton.textContent = '恢复所选版本';
		setLoading(loadingFiles); if (window.imageAccount.authorized) renderFiles();
	}
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

function formatDateTime(value) {
	const date = new Date(value);
	if (!Number.isFinite(date.getTime())) return '时间未知';
	return new Intl.DateTimeFormat('zh-CN', {
		year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
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
		directoryFilter.value = ''; formatFilter.value = ''; tagFilter.value = ''; favoriteFilter.checked = false; directoryScanRequested = false;
		sortOrder.value = 'time-desc';
		updateDirectoryOptions();
		updateTagOptions();
		closeImagePreview(); closeRenameDialog(); closeTagsDialog(true); closeBatchTagsDialog(true); closeReplaceDialog(true); closeVersionsDialog(true); closeDeleteDialog(); closeTrashBatchDialog(true); closeMoveDialog(true); closeExportDialog(true);
	}
});

function openTrashBatchDialog(action) {
	if (operationBusy || !trashMode || !window.imageAccount.authorized || !selectedKeys.size || !['restore', 'purge'].includes(action)) return;
	const selected = files.filter((file) => selectedKeys.has(file.id));
	if (!selected.length || selected.length > MAX_BATCH_DELETE) return;
	closeImagePreview(); closeDeleteDialog(); closeExportDialog(true);
	pendingTrashBatchFiles = selected.map((file) => ({ id: file.id, key: file.key }));
	trashBatchGeneration += 1; trashBatchAction = action; trashBatchFinished = false;
	trashBatchTitle.textContent = action === 'restore' ? `恢复所选 ${selected.length} 张图片？` : `彻底删除所选 ${selected.length} 张图片？`;
	trashBatchWarning.textContent = action === 'restore'
		? '逐张恢复到原路径。如果原路径已有新图片，该张会失败且不会覆盖新图片。'
		: '将永久移除所选回收站副本，无法恢复；不会删除原路径后来上传的新图片。';
	trashBatchSummary.textContent = `已选择 ${selected.length} 张图片。操作会逐张执行，失败项会保留勾选。`;
	trashBatchError.hidden = true; trashBatchError.textContent = '';
	trashBatchResults.replaceChildren();
	for (const file of selected) {
		const item = document.createElement('li'); item.textContent = file.key; trashBatchResults.append(item);
	}
	trashBatchAcknowledgement.hidden = action !== 'purge'; trashBatchAcknowledged.checked = false;
	confirmTrashBatchButton.hidden = false; confirmTrashBatchButton.disabled = action === 'purge';
	confirmTrashBatchButton.classList.toggle('primary-choice', action !== 'purge');
	confirmTrashBatchButton.classList.toggle('danger', action === 'purge');
	confirmTrashBatchButton.textContent = action === 'restore' ? '确认恢复' : '确认彻底删除';
	cancelTrashBatchButton.disabled = false; cancelTrashBatchButton.textContent = '取消';
	trashBatchDialog.hidden = false; document.body.classList.add('modal-open');
	(action === 'purge' ? trashBatchAcknowledged : cancelTrashBatchButton).focus();
}

function closeTrashBatchDialog(force = false) {
	if (operationBusy && !force) return;
	trashBatchGeneration += 1; pendingTrashBatchFiles = []; trashBatchAction = null; trashBatchFinished = false;
	trashBatchAcknowledged.checked = false; trashBatchAcknowledgement.hidden = true;
	trashBatchError.hidden = true; trashBatchError.textContent = ''; trashBatchResults.replaceChildren();
	trashBatchDialog.hidden = true; document.body.classList.remove('modal-open');
	if (!force && window.imageAccount.authorized) (trashMode ? batchRestoreTrashButton : activeFilesButton).focus();
}

async function submitTrashBatch(event) {
	event.preventDefault();
	if (operationBusy || trashBatchFinished || !trashMode || !window.imageAccount.authorized || !pendingTrashBatchFiles.length) return;
	if (trashBatchAction === 'purge' && !trashBatchAcknowledged.checked) {
		trashBatchError.textContent = '请先确认永久删除所选图片。'; trashBatchError.hidden = false; return;
	}
	const action = trashBatchAction;
	if (!['restore', 'purge'].includes(action)) return;
	const snapshot = pendingTrashBatchFiles.map((file) => ({ ...file }));
	const generation = trashBatchGeneration;
	let succeeded = 0, failed = 0, cleanupPending = 0;
	let pageResult = '';
	let pageResultIsError = false;
	const failureDetails = [];
	operationBusy = true; cancelFileLoad(); searchPaused = true;
	confirmTrashBatchButton.disabled = true; confirmTrashBatchButton.textContent = '处理中…';
	cancelTrashBatchButton.disabled = true; trashBatchAcknowledged.disabled = true;
	trashBatchError.hidden = true; trashBatchSummary.textContent = `正在处理 0 / ${snapshot.length} 张，请勿关闭页面。`;
	renderFiles(); setLoading(loadingFiles);
	if (action === 'purge') {
		trashBatchDialog.hidden = true;
		document.body.classList.remove('modal-open');
		managerStatus.className = 'manager-status loading';
		managerStatus.textContent = `正在彻底删除 0 / ${snapshot.length} 张图片，请勿关闭页面。`;
		managerStatus.setAttribute('tabindex', '-1');
		managerStatus.focus();
	}
	try {
		for (const [index, file] of snapshot.entries()) {
			if (generation !== trashBatchGeneration || !window.imageAccount.authorized) return;
			const item = trashBatchResults.children[index];
			try {
				const result = await requestFiles('/api/trash', { method: action === 'restore' ? 'POST' : 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(action === 'restore' ? { id: file.id } : { id: file.id, confirmation: 'DELETE' }) });
				if (generation !== trashBatchGeneration || !window.imageAccount.authorized) return;
				succeeded += 1;
				selectedKeys.delete(file.id);
				if (result.cleanupPending) {
					cleanupPending += 1; item.setAttribute('data-state', 'warning');
					item.textContent = `已恢复但副本待清理：${file.key}。请刷新核对。`;
				} else {
					files = files.filter((entry) => entry.id !== file.id);
					item.setAttribute('data-state', 'moved');
					item.textContent = `${action === 'restore' ? '已恢复' : '已彻底删除'}：${file.key}`;
				}
			} catch (error) {
				if (generation !== trashBatchGeneration || !window.imageAccount.authorized) return;
				failed += 1; item.setAttribute('data-state', 'failed');
				const message = error.message || '结果未确认，请刷新核对后再操作。';
				failureDetails.push(`${file.key}：${message}`);
				item.textContent = `未完成：${file.key} — ${message}`;
			}
			trashBatchSummary.textContent = `已处理 ${index + 1} / ${snapshot.length} 张。`;
			if (action === 'purge') managerStatus.textContent = `正在彻底删除 ${index + 1} / ${snapshot.length} 张图片，请勿关闭页面。`;
			renderFiles();
		}
		trashBatchFinished = true;
		trashBatchSummary.textContent = `已${action === 'restore' ? '恢复' : '彻底删除'} ${succeeded} 张，未完成 ${failed} 张${cleanupPending ? `；${cleanupPending} 张副本待清理` : ''}。${failed ? '未完成项保持勾选，请刷新核对后再试。' : ''}`;
		if (action === 'purge') {
			pageResult = trashBatchSummary.textContent + (failureDetails.length ? ` 失败详情：${failureDetails.slice(0, 3).join('；')}${failureDetails.length > 3 ? '；其余请刷新核对。' : ''}` : '');
			pageResultIsError = failed > 0;
			closeTrashBatchDialog(true);
		} else {
			confirmTrashBatchButton.hidden = true; cancelTrashBatchButton.textContent = '关闭';
		}
	} catch (error) {
		if (action === 'purge') {
			pageResult = `批量彻底删除中断：${error.message || '未知错误'}。请刷新核对后再操作。`;
			pageResultIsError = true;
			closeTrashBatchDialog(true);
		} else {
			trashBatchError.textContent = error.message || '处理失败，请刷新核对。'; trashBatchError.hidden = false;
		}
	} finally {
		operationBusy = false; trashBatchAcknowledged.disabled = false; cancelTrashBatchButton.disabled = false;
		setLoading(loadingFiles);
		if (window.imageAccount.authorized) {
			renderFiles();
			if (action === 'purge' && pageResult) {
				managerStatus.className = pageResultIsError ? 'manager-status error' : 'manager-status success';
				managerStatus.textContent = pageResult;
			}
		}
	}
}

function createTrashRow(file) {
	const row = document.createElement('article');
	row.className = 'file-row recycle-row';
	row.classList.toggle('selected', selectedKeys.has(file.id));
	const selectLabel = document.createElement('label'); selectLabel.className = 'file-select'; selectLabel.title = `选择 ${file.key}`;
	const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = selectedKeys.has(file.id);
	checkbox.disabled = operationBusy; checkbox.setAttribute('aria-label', `选择回收站图片 ${file.key}`);
	checkbox.addEventListener('change', () => {
		if (operationBusy) return;
		if (checkbox.checked) {
			if (selectedKeys.size >= MAX_BATCH_DELETE) {
				checkbox.checked = false; showToast(`单次最多选择 ${MAX_BATCH_DELETE} 个文件`); return;
			}
			selectedKeys.add(file.id);
		} else selectedKeys.delete(file.id);
		row.classList.toggle('selected', checkbox.checked); updateSelectionUI();
	});
	selectLabel.append(checkbox);
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
	row.append(selectLabel, image, details, actions);
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
