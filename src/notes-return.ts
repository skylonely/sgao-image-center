export function imageLoginDestination(value: string | null): string {
  if (value === '/admin/files/') return value;
  if (value && /^\/admin\/notes\/\?channel=[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) return value;
  return '/admin/';
}
