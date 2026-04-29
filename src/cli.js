const fs = require('fs');
const path = require('path');

const {
  buildConfig,
  helpText,
  parseCliArgs,
  validateConfig,
  version,
} = require('./config');
const { loadEnvFile } = require('./env');
const { buildReport, formatReport, withOptionalRaw } = require('./report');
const { TuyaMobileClient } = require('./tuya-mobile');

async function run(argv, processEnv = process.env) {
  const parsed = parseCliArgs(argv);
  if (parsed.flags.help) {
    process.stdout.write(helpText());
    return;
  }
  if (parsed.flags.version) {
    process.stdout.write(`${version}\n`);
    return;
  }

  const env = { ...processEnv };
  const envPath = parsed.flags.env || '.env';
  if (envPath && fs.existsSync(envPath)) {
    loadEnvFile(envPath, env);
  }

  const config = buildConfig(parsed, env);
  validateConfig(config);

  const client = new TuyaMobileClient(config);
  await client.login();

  let deviceDump;
  let discovery;
  if (config.deviceId) {
    deviceDump = await client.getDeviceDump(config.deviceId);
  } else {
    discovery = await client.discoverDevices();
    if (discovery.devices.length === 1) {
      deviceDump = await client.getDeviceDump(discovery.devices[0].deviceId);
    }
  }

  const report = withOptionalRaw(
    buildReport({ config, deviceDump, discovery }),
    { raw: config.raw, deviceDump, discovery },
  );
  const output = formatReport(report, {
    showSecrets: config.showSecrets,
    redactDeviceIds: !config.showSecrets,
  });

  if (config.outputPath) {
    fs.mkdirSync(path.dirname(config.outputPath), { recursive: true });
    fs.writeFileSync(config.outputPath, output, { mode: 0o600 });
    return;
  }

  process.stdout.write(output);
}

module.exports = {
  run,
};
