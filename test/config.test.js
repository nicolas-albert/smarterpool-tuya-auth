const assert = require('node:assert/strict');
const test = require('node:test');

const { buildConfig, parseCliArgs } = require('../src/config');

test('parses login and password positionals', () => {
  const parsed = parseCliArgs(['user@example.com', 'secret', '--device-id', 'abc']);
  const config = buildConfig(parsed, {});

  assert.equal(config.login, 'user@example.com');
  assert.equal(config.password, 'secret');
  assert.equal(config.deviceId, 'abc');
});

test('flags override env values', () => {
  const parsed = parseCliArgs(['--login', 'flag@example.com', '--password', 'flag']);
  const config = buildConfig(parsed, {
    SMARTERPOOL_LOGIN: 'env@example.com',
    SMARTERPOOL_PASSWORD: 'env',
  });

  assert.equal(config.login, 'flag@example.com');
  assert.equal(config.password, 'flag');
});

test('rejects unknown flags', () => {
  assert.throws(() => parseCliArgs(['--unknown']), /Unknown flag/);
});

test('uses bundled Smarter Pool app profile by default', () => {
  const parsed = parseCliArgs(['user@example.com', 'secret']);
  const config = buildConfig(parsed, {});

  assert.equal(config.appProfile, 'smarter-pool-1.0.3-international');
  assert.equal(config.certSign, 'A');
  assert.equal(config.region, 'EU');
  assert.equal(config.ttid, 'tuya_international');
  assert.ok(config.appKey);
  assert.ok(config.appSecret);
  assert.ok(config.secret2);
});

test('allows Tuya app credential overrides', () => {
  const parsed = parseCliArgs([
    'user@example.com',
    'secret',
    '--app-key',
    'custom-key',
    '--app-secret',
    'custom-secret',
    '--secret2',
    'custom-secret2',
    '--region',
    'AZ',
  ]);
  const config = buildConfig(parsed, {});

  assert.equal(config.appKey, 'custom-key');
  assert.equal(config.appSecret, 'custom-secret');
  assert.equal(config.secret2, 'custom-secret2');
  assert.equal(config.region, 'AZ');
});
