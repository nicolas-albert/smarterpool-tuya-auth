const path = require('path');

const { version } = require('../package.json');

const VALUE_FLAGS = new Set([
  'app-key',
  'app-secret',
  'cert-sign',
  'client-device-id',
  'country',
  'country-code',
  'device-id',
  'env',
  'login',
  'output',
  'password',
  'region',
  'secret2',
  'ttid',
]);

const BOOLEAN_FLAGS = new Set([
  'help',
  'json',
  'raw',
  'show-secrets',
  'version',
]);

const FLAG_ALIASES = {
  country: 'country-code',
};

class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UsageError';
    this.exitCode = 2;
  }
}

function camelCase(flagName) {
  return flagName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function normalizeFlagName(name) {
  return FLAG_ALIASES[name] || name;
}

function parseCliArgs(argv) {
  const flags = {};
  const positionals = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') {
      positionals.push(...argv.slice(index + 1));
      break;
    }

    if (!arg.startsWith('--')) {
      positionals.push(arg);
      continue;
    }

    const withoutPrefix = arg.slice(2);
    const [rawName, inlineValue] = withoutPrefix.split(/=(.*)/s, 2);
    const name = normalizeFlagName(rawName);
    const key = camelCase(name);

    if (BOOLEAN_FLAGS.has(name)) {
      if (inlineValue !== undefined) {
        throw new UsageError(`Flag --${name} does not take a value`);
      }
      flags[key] = true;
      continue;
    }

    if (!VALUE_FLAGS.has(name)) {
      throw new UsageError(`Unknown flag --${name}`);
    }

    const value = inlineValue !== undefined ? inlineValue : argv[index + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new UsageError(`Missing value for --${name}`);
    }
    flags[key] = value;
    if (inlineValue === undefined) {
      index += 1;
    }
  }

  if (positionals.length > 2) {
    throw new UsageError(`Unexpected positional arguments: ${positionals.slice(2).join(' ')}`);
  }

  return { flags, positionals };
}

function envValue(env, name) {
  const value = env[name];
  return value === undefined || value === '' ? undefined : value;
}

function buildConfig(parsed, env = process.env) {
  const { flags, positionals } = parsed;
  const login = flags.login || positionals[0] || envValue(env, 'SMARTERPOOL_LOGIN');
  const password = flags.password || positionals[1] || envValue(env, 'SMARTERPOOL_PASSWORD');

  return {
    appKey: flags.appKey || envValue(env, 'SMARTERPOOL_APP_KEY'),
    appSecret: flags.appSecret || envValue(env, 'SMARTERPOOL_APP_SECRET'),
    certSign: flags.certSign || envValue(env, 'SMARTERPOOL_CERT_SIGN') || 'A',
    clientDeviceId: flags.clientDeviceId || envValue(env, 'SMARTERPOOL_CLIENT_DEVICE_ID'),
    countryCode: flags.countryCode || envValue(env, 'SMARTERPOOL_COUNTRY_CODE') || '33',
    deviceId: flags.deviceId || envValue(env, 'SMARTERPOOL_DEVICE_ID'),
    envPath: flags.env || '.env',
    login,
    outputPath: flags.output ? path.resolve(flags.output) : undefined,
    password,
    raw: Boolean(flags.raw),
    region: flags.region || envValue(env, 'SMARTERPOOL_REGION') || 'EU',
    secret2: flags.secret2 || envValue(env, 'SMARTERPOOL_SECRET2'),
    showSecrets: Boolean(flags.showSecrets),
    ttid: flags.ttid || envValue(env, 'SMARTERPOOL_TTID') || 'tuya_international',
  };
}

function validateConfig(config) {
  const missing = [];
  if (!config.login) missing.push('SMARTERPOOL_LOGIN or --login');
  if (!config.password) missing.push('SMARTERPOOL_PASSWORD or --password');
  if (!config.appKey) missing.push('SMARTERPOOL_APP_KEY or --app-key');
  if (!config.appSecret) missing.push('SMARTERPOOL_APP_SECRET or --app-secret');
  if (!config.secret2) missing.push('SMARTERPOOL_SECRET2 or --secret2');

  if (missing.length > 0) {
    throw new UsageError(`Missing required configuration:\n- ${missing.join('\n- ')}\n\nRun with --help for usage details.`);
  }
}

function accountTypeFromLogin(login) {
  return login && login.includes('@') ? 'email' : 'mobile';
}

function helpText() {
  return `smarterpool-auth ${version}

Read-only helper to recover Tuya local credentials from Smarter Pool accounts.

Usage:
  smarterpool-auth [login] [password] [options]
  smarterpool-auth --env .env

Options:
  --login <value>             Smarter Pool email or phone login
  --password <value>          Smarter Pool password
  --country-code <value>      Account country code, default 33
  --device-id <value>         Tuya device id to inspect
  --app-key <value>           Tuya OEM app key
  --app-secret <value>        Tuya OEM app secret
  --secret2 <value>           Tuya OEM secret2
  --cert-sign <value>         Tuya OEM cert sign, default A
  --region <value>            Tuya region, default EU
  --ttid <value>              Tuya ttid, default tuya_international
  --client-device-id <value>  Mobile client device id override
  --env <path>                Load env file, default .env when present
  --output <path>             Write JSON output to file
  --raw                       Include raw API action results
  --show-secrets              Print localKey/tokens/secrets instead of redacting
  --help                      Show this help
  --version                   Show package version

Environment:
  SMARTERPOOL_LOGIN, SMARTERPOOL_PASSWORD, SMARTERPOOL_COUNTRY_CODE
  SMARTERPOOL_DEVICE_ID
  SMARTERPOOL_APP_KEY, SMARTERPOOL_APP_SECRET, SMARTERPOOL_SECRET2
  SMARTERPOOL_CERT_SIGN, SMARTERPOOL_REGION, SMARTERPOOL_TTID
`;
}

module.exports = {
  UsageError,
  accountTypeFromLogin,
  buildConfig,
  helpText,
  parseCliArgs,
  validateConfig,
  version,
};
