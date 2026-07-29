import { getImageFromGitHub } from './github';
import { getImageFromR2 } from './r2';

export type StorageMode = 'github' | 'r2' | 'r2-github';

const STORAGE_MODE: StorageMode = 'r2-github';

export async function getImage(path: string, env: Env): Promise<Response | null> {
	switch (STORAGE_MODE) {
		case 'github':
			return getImageFromGitHub(path);

		case 'r2':
			return getImageFromR2(path, env);

		case 'r2-github': {
			try {
				const r2Response = await getImageFromR2(path, env);

				if (r2Response) {
					return r2Response;
				}

				console.log('R2 missing, fallback to GitHub:', path);
			} catch (error) {
				console.error('R2 unavailable, fallback to GitHub:', error);
			}

			return getImageFromGitHub(path);
		}

		default: {
			const exhaustiveCheck: never = STORAGE_MODE;
			throw new Error(`Unsupported storage mode: ${exhaustiveCheck}`);
		}
	}
}
