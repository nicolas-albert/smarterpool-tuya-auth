const assert = require('node:assert/strict');
const test = require('node:test');

const { collectDevices, summarizeSchema } = require('../src/schema');

test('summarizes schema JSON', () => {
  const summary = summarizeSchema(JSON.stringify([
    {
      code: 'TempSet',
      id: 102,
      mode: 'rw',
      name: 'temperature',
      property: { type: 'value', min: 18, max: 40 },
      type: 'obj',
    },
  ]));

  assert.deepEqual(summary, [{
    code: 'TempSet',
    id: 102,
    mode: 'rw',
    name: 'temperature',
    property: { type: 'value', min: 18, max: 40 },
    type: 'obj',
  }]);
});

test('collects nested device-like objects', () => {
  const devices = collectDevices({
    result: {
      devices: [
        { devId: 'abc', productId: 'product', name: 'PAC' },
      ],
    },
  });

  assert.deepEqual(devices, [{
    deviceId: 'abc',
    isOnline: undefined,
    localKey: undefined,
    name: 'PAC',
    path: '$.result.devices[0]',
    productId: 'product',
    protocolVersion: undefined,
  }]);
});
