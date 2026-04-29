const crypto = require('crypto');

const NodeRSA = require('node-rsa');

const { accountTypeFromLogin } = require('./config');
const { collectDevices, collectGroupIds } = require('./schema');

const DEFAULT_CLIENT_DEVICE_ID = crypto
  .createHash('sha1')
  .update('smarterpool-tuya-auth')
  .digest('hex');

const VALUES_TO_SIGN = [
  'a',
  'v',
  'lat',
  'lon',
  'lang',
  'deviceId',
  'imei',
  'imsi',
  'appVersion',
  'ttid',
  'isH5',
  'h5Token',
  'os',
  'clientId',
  'postData',
  'time',
  'requestId',
  'n4h5',
  'sid',
  'sp',
  'et',
];

class TuyaApiError extends Error {
  constructor(code, message) {
    super(message || code || 'Tuya API request failed');
    this.name = 'TuyaApiError';
    this.code = code || '';
  }
}

function md5(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

function mobileHash(data) {
  const preHash = md5(data);
  return preHash.slice(8, 16)
    + preHash.slice(0, 8)
    + preHash.slice(24, 32)
    + preHash.slice(16, 24);
}

function endpointForRegion(region) {
  switch (region) {
    case 'AZ':
      return 'https://a1.tuyaus.com/api.json';
    case 'AY':
      return 'https://a1.tuyacn.com/api.json';
    case 'EU':
      return 'https://a1.tuyaeu.com/api.json';
    case 'IN':
      return 'https://a1.tuyain.com/api.json';
    default:
      throw new Error(`Unsupported Tuya region: ${region}`);
  }
}

function isEmptySignValue(value) {
  return value === undefined || value === null || value === '';
}

function buildSignString(pairs) {
  const chunks = [];
  for (const key of Object.keys(pairs).sort()) {
    if (!VALUES_TO_SIGN.includes(key) || isEmptySignValue(pairs[key])) {
      continue;
    }

    const value = key === 'postData' ? mobileHash(pairs[key]) : pairs[key];
    chunks.push(`${key}=${value}`);
  }
  return chunks.join('||');
}

class TuyaMobileApi {
  constructor(config) {
    this.key = config.appKey;
    this.secret = config.appSecret;
    this.keyHmac = `${config.certSign}_${config.secret2}_${config.appSecret}`;
    this.region = config.region;
    this.endpoint = endpointForRegion(config.region);
    this.ttid = config.ttid;
    this.deviceID = config.clientDeviceId || DEFAULT_CLIENT_DEVICE_ID;
    this.sid = undefined;
  }

  async request(options) {
    const request = options || {};
    if (!request.action) {
      throw new Error('Must specify an action to call.');
    }

    const requiresSID = request.requiresSID !== false;
    if (!this.sid && requiresSID) {
      throw new Error('Must call login() first.');
    }

    const pairs = {
      a: request.action,
      appRnVersion: '5.11',
      appVersion: '3.8.5',
      clientId: this.key,
      deviceId: this.deviceID,
      et: '0.0.1',
      lang: 'en',
      os: 'Android',
      platform: 'Android',
      requestId: crypto.randomUUID(),
      time: Math.round(Date.now() / 1000),
      ttid: this.ttid,
      v: request.version || '1.0',
    };

    if (request.data) {
      pairs.postData = JSON.stringify(request.data);
    }
    if (request.gid) {
      pairs.gid = request.gid;
    }
    if (requiresSID) {
      pairs.sid = this.sid;
    }

    pairs.sign = crypto
      .createHmac('sha256', this.keyHmac)
      .update(buildSignString(pairs))
      .digest('hex');

    const url = new URL(this.endpoint);
    for (const [key, value] of Object.entries(pairs)) {
      url.searchParams.set(key, String(value));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    const body = await response.text();
    let data;
    try {
      data = JSON.parse(body);
    } catch {
      throw new Error(`Invalid JSON response from Tuya API: HTTP ${response.status}`);
    }

    if (data.success === false) {
      throw new TuyaApiError(data.errorCode, data.errorMsg);
    }

    return data.result;
  }
}

function encryptPassword(password, token) {
  const key = new NodeRSA({}, {
    encryptionScheme: {
      scheme: 'pkcs1',
      padding: crypto.constants.RSA_NO_PADDING,
    },
  });
  key.importKey({ n: token.publicKey, e: Number(token.exponent) }, 'components-public');
  return key.encrypt(Buffer.from(md5(password)), 'hex');
}

class TuyaMobileClient {
  constructor(config) {
    this.config = config;
    this.accountType = accountTypeFromLogin(config.login);
    this.api = new TuyaMobileApi(config);
    this.session = undefined;
  }

  async login() {
    const accountField = this.accountType === 'email' ? 'email' : 'mobile';
    const tokenAction = this.accountType === 'email'
      ? 'tuya.m.user.email.token.create'
      : 'tuya.m.user.mobile.token.get';
    const loginAction = this.accountType === 'email'
      ? 'tuya.m.user.email.password.login'
      : 'tuya.m.user.mobile.passwd.login';

    const token = await this.api.request({
      action: tokenAction,
      data: {
        countryCode: this.config.countryCode,
        [accountField]: this.config.login,
      },
      requiresSID: false,
    });

    const result = await this.api.request({
      action: loginAction,
      data: {
        countryCode: this.config.countryCode,
        [accountField]: this.config.login,
        ifencrypt: 1,
        options: { group: 1 },
        passwd: encryptPassword(this.config.password, token),
        token: token.token,
      },
      requiresSID: false,
    });

    if (result.domain && result.domain.mobileApiUrl) {
      this.api.endpoint = `${result.domain.mobileApiUrl}/api.json`;
      this.api.region = result.domain.regionCode || this.api.region;
    }
    this.api.sid = result.sid;
    this.session = result;
    return result;
  }

  async request(action, data = {}, extra = {}) {
    return this.api.request({ action, data, ...extra });
  }

  async requestSafe(label, action, data = {}, extra = {}) {
    try {
      const result = await this.request(action, data, extra);
      return { action, data, label, ok: true, result };
    } catch (error) {
      return {
        action,
        data,
        label,
        ok: false,
        code: error.code || '',
        message: error.message || String(error),
      };
    }
  }

  async getDeviceDump(deviceId) {
    const actions = [
      ['device', 'tuya.m.device.get', { devId: deviceId }],
      ['deviceInfo', 'tuya.m.device.info.get', { devId: deviceId }],
      ['dps', 'tuya.m.device.dp.get', { devId: deviceId }],
      ['cachedDps', 'tuya.m.device.cache.dp.get', { devId: deviceId }],
    ];

    const dump = {};
    for (const [label, action, data] of actions) {
      dump[label] = await this.requestSafe(label, action, data);
    }
    return dump;
  }

  async discoverDevices() {
    const attempts = [];
    const devices = [];

    const baseActions = [
      ['userInfo', 'tuya.m.user.info.get', {}],
      ['locationList', 'tuya.m.location.list', {}],
      ['deviceList', 'tuya.m.device.list', {}],
      ['deviceAllList', 'tuya.m.device.all.list', {}],
      ['groupDeviceList', 'tuya.m.my.group.device.list', {}],
      ['relationList', 'tuya.m.device.relation.list', {}],
    ];

    for (const [label, action, data] of baseActions) {
      const attempt = await this.requestSafe(label, action, data);
      attempts.push(attempt);
      if (attempt.ok) {
        devices.push(...collectDevices(attempt.result));
      }
    }

    const groupIds = new Set();
    attempts.forEach((attempt) => {
      if (attempt.ok) {
        collectGroupIds(attempt.result, groupIds);
      }
    });

    for (const gid of groupIds) {
      const groupedActions = [
        [`deviceList:${gid}`, 'tuya.m.device.list', {}, { gid }],
        [`deviceAllList:${gid}`, 'tuya.m.device.all.list', {}, { gid }],
        [`groupDeviceList:${gid}`, 'tuya.m.my.group.device.list', {}, { gid }],
        [`relationList:${gid}`, 'tuya.m.device.relation.list', {}, { gid }],
        [`relationEntityList:${gid}`, 'tuya.m.device.relation.entity.list', {}, { gid }],
        [`relationListGroupId:${gid}`, 'tuya.m.device.relation.list', { groupId: gid }],
        [`relationEntityListGroupId:${gid}`, 'tuya.m.device.relation.entity.list', { groupId: gid }],
      ];

      for (const [label, action, data, extra] of groupedActions) {
        const attempt = await this.requestSafe(label, action, data, extra);
        attempts.push(attempt);
        if (attempt.ok) {
          devices.push(...collectDevices(attempt.result));
        }
      }
    }

    const deduped = [];
    const seen = new Set();
    for (const device of devices) {
      if (!seen.has(device.deviceId)) {
        seen.add(device.deviceId);
        deduped.push(device);
      }
    }

    return { attempts, devices: deduped };
  }
}

module.exports = {
  DEFAULT_CLIENT_DEVICE_ID,
  TuyaApiError,
  TuyaMobileClient,
  buildSignString,
  encryptPassword,
  md5,
  mobileHash,
};
