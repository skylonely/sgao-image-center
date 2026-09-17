(() => {
	const status = document.querySelector('#accountStatus');
	const login = document.querySelector('#loginLink');
	const logout = document.querySelector('#logoutLink');
	const retry = document.querySelector('#checkAccountButton');
	let authorized = false;
	let checking;
	let generation = 0;
	try { sessionStorage.removeItem('sgaoUploadToken'); } catch { /* No browser token storage is needed. */ }
	function update(next, message) {
		const changed = authorized !== next;
		authorized = next;
		if (changed && !next) generation += 1;
		status.textContent = message;
		login.hidden = next; logout.hidden = !next;
		for (const panel of document.querySelectorAll('[data-owner-only]')) panel.hidden = !next;
		if (changed) window.dispatchEvent(new CustomEvent('image-auth-changed', { detail: { authorized: next } }));
	}
	async function check() {
		if (checking) return checking;
		const started = generation;
		retry.disabled = true;
		checking = (async () => {
			try {
				const response = await fetch('/api/session', { credentials: 'same-origin', cache: 'no-store', redirect: 'manual' });
				if (response.type === 'opaqueredirect' || response.status === 0) throw new Error('请登录 gsios602@gmail.com 后管理图片。');
				const result = await response.json();
				if (started !== generation) return authorized;
				const valid = response.ok && result.success && result.account?.email === 'gsios602@gmail.com';
				update(Boolean(valid), valid ? `已登录 · ${result.account.email}` : result.message || '请先登录图片管理账号。');
			} catch (error) {
				if (started === generation) update(false, error instanceof Error ? error.message : '暂时无法检查登录，请重试。');
			} finally { retry.disabled = false; checking = null; }
			return authorized;
		})();
		return checking;
	}
	async function request(url, options = {}) {
		if (!authorized) throw new Error('请先登录图片管理账号。');
		const started = generation;
		const response = await fetch(url, { ...options, credentials: 'same-origin', cache: 'no-store', redirect: 'manual' });
		if (started !== generation || !authorized) throw new Error('登录状态已变化，请重新检查。');
		if (response.type === 'opaqueredirect' || response.status === 0) {
			generation += 1; update(false, '登录已过期，请重新登录。');
			throw new Error('登录已过期，请重新登录。');
		}
		if (response.status === 401 || response.status === 403 || response.status === 503) {
			generation += 1;
			const result = await response.clone().json().catch(() => null);
			update(false, result?.message || '登录验证失败，请重新登录或重试。');
		}
		return response;
	}
	window.imageAccount = { get authorized() { return authorized; }, check, request, ready: null };
	retry.addEventListener('click', check);
	window.addEventListener('focus', check);
	window.imageAccount.ready = check();
})();
