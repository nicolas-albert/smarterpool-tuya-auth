const assert = require('node:assert/strict');
const test = require('node:test');

const { parseEnv } = require('../src/env');

test('parses simple env files', () => {
  assert.deepEqual(parseEnv(`
# comment
SMARTERPOOL_LOGIN=user@example.com
SMARTERPOOL_PASSWORD='with spaces'
EMPTY=
`), {
    EMPTY: '',
    SMARTERPOOL_LOGIN: 'user@example.com',
    SMARTERPOOL_PASSWORD: 'with spaces',
  });
});
