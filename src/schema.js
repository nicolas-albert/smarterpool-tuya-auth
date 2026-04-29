function parseSchema(schema) {
  if (!schema) {
    return [];
  }

  if (Array.isArray(schema)) {
    return schema;
  }

  if (typeof schema !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(schema);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function summarizeSchema(schema) {
  return parseSchema(schema).map((entry) => ({
    code: entry.code,
    id: entry.id,
    mode: entry.mode,
    name: entry.name,
    property: entry.property,
    type: entry.type,
  }));
}

function summarizeDevice(device) {
  if (!device || typeof device !== 'object') {
    return undefined;
  }

  return {
    name: device.name,
    deviceId: device.devId || device.id,
    uuid: device.uuid,
    mac: device.mac,
    ip: device.ip,
    isOnline: device.isOnline,
    productId: device.productId,
    localKey: device.localKey,
    protocolVersion: device.pv,
    softwareVersion: device.verSw,
    dps: device.dps,
    schema: summarizeSchema(device.schema),
  };
}

function collectDevices(value, path = '$', devices = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectDevices(item, `${path}[${index}]`, devices));
    return devices;
  }

  if (!value || typeof value !== 'object') {
    return devices;
  }

  const deviceId = value.devId || value.deviceId || value.id;
  if (deviceId && (value.productId || value.localKey || value.dps || value.schema)) {
    devices.push({
      path,
      name: value.name || value.devName,
      deviceId,
      productId: value.productId,
      isOnline: value.isOnline,
      localKey: value.localKey,
      protocolVersion: value.pv,
    });
  }

  for (const [key, item] of Object.entries(value)) {
    collectDevices(item, `${path}.${key}`, devices);
  }

  return devices;
}

function collectGroupIds(value, ids = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectGroupIds(item, ids));
    return ids;
  }

  if (!value || typeof value !== 'object') {
    return ids;
  }

  for (const key of ['gid', 'groupId', 'homeId']) {
    if (value[key] !== undefined && value[key] !== null && value[key] !== '') {
      ids.add(String(value[key]));
    }
  }

  for (const item of Object.values(value)) {
    collectGroupIds(item, ids);
  }

  return ids;
}

module.exports = {
  collectDevices,
  collectGroupIds,
  parseSchema,
  summarizeDevice,
  summarizeSchema,
};
