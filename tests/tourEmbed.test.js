import test from 'node:test';
import assert from 'node:assert/strict';
import { getEmbedUrl } from '../src/data/venues.js';

test('new slashless Matterport links get quickstart without losing the starting view', () => {
  const url = new URL(getEmbedUrl('https://my.matterport.com/show?m=example&ss=238&sr=-.45,.01&play=0'));
  assert.equal(url.pathname, '/show/');
  assert.equal(url.searchParams.get('qs'), '1');
  assert.equal(url.searchParams.get('play'), '1');
  assert.equal(url.searchParams.get('mls'), '2');
  assert.equal(url.searchParams.get('m'), 'example');
  assert.equal(url.searchParams.get('ss'), '238');
  assert.equal(url.searchParams.get('sr'), '-.45,.01');
});

test('legacy Matterport and HeadBox links retain quickstart support', () => {
  for (const input of ['https://my.matterport.com/show/?m=example', 'https://tours.headbox.com/model/example']) {
    const url = new URL(getEmbedUrl(input));
    assert.equal(url.searchParams.get('m'), 'example');
    assert.equal(url.searchParams.get('qs'), '1');
  }
  assert.equal(getEmbedUrl('not a URL'), null);
});
