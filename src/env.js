const fs = require('fs');

function unquote(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseEnv(content) {
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) {
      continue;
    }

    env[match[1]] = unquote(match[2]);
  }
  return env;
}

function loadEnvFile(filePath, targetEnv) {
  if (!filePath || !fs.existsSync(filePath)) {
    return [];
  }

  const parsed = parseEnv(fs.readFileSync(filePath, 'utf8'));
  const loaded = [];
  for (const [key, value] of Object.entries(parsed)) {
    if (targetEnv[key] === undefined) {
      targetEnv[key] = value;
      loaded.push(key);
    }
  }
  return loaded;
}

module.exports = {
  loadEnvFile,
  parseEnv,
};
