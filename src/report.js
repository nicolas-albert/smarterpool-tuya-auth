const { version } = require('../package.json');
const { accountTypeFromLogin } = require('./config');
const { redact } = require('./redact');
const { summarizeDevice } = require('./schema');

function actionStatuses(actions) {
  if (!actions) {
    return undefined;
  }

  if (Array.isArray(actions)) {
    return actions.map((action) => ({
      label: action.label,
      action: action.action,
      ok: action.ok,
      code: action.code,
      message: action.message,
    }));
  }

  return Object.fromEntries(
    Object.entries(actions).map(([name, action]) => [name, {
      action: action.action,
      ok: action.ok,
      code: action.code,
      message: action.message,
    }]),
  );
}

function buildReport({ config, deviceDump, discovery }) {
  const deviceResult = deviceDump && deviceDump.device && deviceDump.device.ok
    ? deviceDump.device.result
    : undefined;

  const report = {
    tool: {
      name: 'smarterpool-auth',
      version,
    },
    account: {
      accountType: accountTypeFromLogin(config.login),
      countryCode: config.countryCode,
      region: config.region,
      ttid: config.ttid,
    },
    device: summarizeDevice(deviceResult),
    discovery: discovery ? {
      devices: discovery.devices,
      actions: actionStatuses(discovery.attempts),
    } : undefined,
    actions: actionStatuses(deviceDump),
  };

  if (!deviceResult && !discovery) {
    report.notice = 'No device id was provided and discovery was not run.';
  } else if (!deviceResult && discovery && discovery.devices.length === 0) {
    report.notice = 'No device id was provided and automatic discovery did not return devices. Re-run with --device-id <id>.';
  } else if (!deviceResult && discovery && discovery.devices.length > 1) {
    report.notice = 'Multiple devices were discovered. Re-run with --device-id <id> to inspect one device in detail.';
  }

  return report;
}

function withOptionalRaw(report, { raw, deviceDump, discovery }) {
  if (!raw) {
    return report;
  }

  return {
    ...report,
    raw: {
      deviceDump,
      discovery,
    },
  };
}

function formatReport(report, options) {
  return `${JSON.stringify(redact(report, options), null, 2)}\n`;
}

module.exports = {
  buildReport,
  formatReport,
  withOptionalRaw,
};
