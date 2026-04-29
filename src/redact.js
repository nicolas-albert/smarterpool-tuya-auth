const SECRET_KEY_PATTERN = /(sid|token|localkey|secret|password|passwd|publickey|appkey|sign)/i;
const DEVICE_ID_PATTERN = /(devid|deviceid|uuid|mac)/i;

function maskString(value) {
  if (typeof value !== 'string') {
    return '<redacted>';
  }
  if (value.length <= 8) {
    return `${value.slice(0, 1)}...${value.slice(-1)}`;
  }
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function redact(value, options = {}) {
  const { showSecrets = false, redactDeviceIds = false } = options;
  if (showSecrets) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, options));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const out = {};
  for (const [key, item] of Object.entries(value)) {
    if (SECRET_KEY_PATTERN.test(key)) {
      out[key] = maskString(item);
    } else if (redactDeviceIds && DEVICE_ID_PATTERN.test(key)) {
      out[key] = maskString(item);
    } else {
      out[key] = redact(item, options);
    }
  }
  return out;
}

module.exports = {
  maskString,
  redact,
};
