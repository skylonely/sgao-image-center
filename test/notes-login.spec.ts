import { expect, it } from 'vitest';
import { ownerFetch } from './auth-fixture';
import { imageLoginDestination } from '../src/notes-return';

it('preserves the fixed notes upload callback and refuses arbitrary destinations or extra query parameters', async () => {
  const path = '/admin/notes/?channel=12345678-1234-1234-1234-123456789abc';
  expect(imageLoginDestination(path)).toBe(path);
  for (const bad of ['https://evil.example/' + path, '//evil.example/', path + '&redirect=https://evil.example', '/admin/notes/../../', '/admin/notes/?channel=bad']) {
    expect(imageLoginDestination(bad)).toBe('/admin/');
  }
  const response = await ownerFetch(`https://example.com/api/login?returnTo=${encodeURIComponent(path)}`, { redirect: 'manual' });
  expect(response.status).toBe(302); expect(response.headers.get('Location')).toBe(path);
});
