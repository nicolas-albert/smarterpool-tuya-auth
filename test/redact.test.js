const assert = require('node:assert/strict');
const test = require('node:test');

const { redact } = require('../src/redact');

test('redacts secret-like keys by default', () => {
  const result = redact({
    appKey: 'app-key-value',
    deviceId: 'device-id-value',
    localKey: 'local-key-value',
    nested: {
      token: 'token-value',
    },
  });

  assert.equal(result.appKey, 'app-...alue');
  assert.equal(result.deviceId, 'device-id-value');
  assert.equal(result.localKey, 'loca...alue');
  assert.equal(result.nested.token, 'toke...alue');
});

test('can redact device ids', () => {
  const result = redact({
    deviceId: 'device-id-value',
    mac: 'aa:bb:cc:dd:ee:ff',
  }, { redactDeviceIds: true });

  assert.equal(result.deviceId, 'devi...alue');
  assert.equal(result.mac, 'aa:b...e:ff');
});

test('showSecrets bypasses redaction', () => {
  const value = { localKey: 'local-key-value' };
  assert.equal(redact(value, { showSecrets: true }), value);
});
