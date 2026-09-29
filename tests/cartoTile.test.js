import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../base44/functions/cartoTile/entry.ts', import.meta.url), 'utf8');
const compiled = ts.transpile(source.replace("import { secrets } from 'base44:runtime';", "const secrets = { get: () => globalThis.testCartoKey };"), { module: ts.ModuleKind.ESNext });
const { default: handler } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const request = (query = 'z=2&x=1&y=1') => new Request(`https://example.com/functions/cartoTile?${query}`);

test('tile proxy validates coordinates before contacting CARTO', async () => {
  for (const query of ['', 'z=19&x=1&y=1', 'z=2&x=4&y=1', 'z=2&x=1&y=-1', 'z=2&x=https://evil.test&y=1']) {
    assert.equal((await handler(request(query))).status, 400);
  }
  assert.equal((await handler(new Request(request().url, { method: 'POST' }))).status, 405);
});

test('tile proxy keeps keys and provider errors server-side', async (t) => {
  globalThis.testCartoKey = '';
  assert.equal((await handler(request())).status, 503);
  globalThis.testCartoKey = 'test-secret';
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url.hostname, 'basemaps.cartocdn.com');
    assert.equal(url.searchParams.get('key'), 'test-secret');
    return new Response('png-bytes', { headers: { 'content-type': 'image/png', 'x-secret': 'test-secret' } });
  });
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'png-bytes');
  assert.equal(response.headers.get('x-secret'), null);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=3600');
  globalThis.fetch = async () => new Response('test-secret', { status: 403 });
  const error = await handler(request());
  assert.equal(error.status, 502);
  assert.ok(!(await error.text()).includes('test-secret'));
  globalThis.fetch = async () => { throw new Error('test-secret'); };
  assert.ok(!(await (await handler(request())).text()).includes('test-secret'));
  delete globalThis.testCartoKey;
});
