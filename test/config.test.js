const assert = require('node:assert/strict');
const test = require('node:test');

const { buildConfig, parseCliArgs } = require('../src/config');

test('parses login and password positionals', () => {
  const parsed = parseCliArgs(['user@example.com', 'secret', '--device-id', 'abc']);
  const config = buildConfig(parsed, {
    SMARTERPOOL_APP_KEY: 'app',
    SMARTERPOOL_APP_SECRET: 'secret',
    SMARTERPOOL_SECRET2: 'secret2',
  });

  assert.equal(config.login, 'user@example.com');
  assert.equal(config.password, 'secret');
  assert.equal(config.deviceId, 'abc');
});

test('flags override env values', () => {
  const parsed = parseCliArgs(['--login', 'flag@example.com', '--password', 'flag']);
  const config = buildConfig(parsed, {
    SMARTERPOOL_LOGIN: 'env@example.com',
    SMARTERPOOL_PASSWORD: 'env',
    SMARTERPOOL_APP_KEY: 'app',
    SMARTERPOOL_APP_SECRET: 'secret',
    SMARTERPOOL_SECRET2: 'secret2',
  });

  assert.equal(config.login, 'flag@example.com');
  assert.equal(config.password, 'flag');
});

test('rejects unknown flags', () => {
  assert.throws(() => parseCliArgs(['--unknown']), /Unknown flag/);
});
