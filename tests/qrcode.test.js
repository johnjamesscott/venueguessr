import test from 'node:test';
import assert from 'node:assert/strict';
import QRCode from 'qrcode';

test('private score links can be rendered as local QR data URLs', async () => {
  const dataUrl = await QRCode.toDataURL('https://example.com/submit?token=test-token', {
    width: 320,
    margin: 2,
  });
  assert.match(dataUrl, /^data:image\/png;base64,/);
});
