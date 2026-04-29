# Home Assistant Integrations

`smarterpool-auth` is not a Home Assistant integration. It is a bootstrap helper for existing Tuya integrations that require local credentials.

## tuya-local

Project: <https://github.com/make-all/tuya-local>

Use the CLI output to configure:

- device host/IP
- device id
- local key
- protocol version

`tuya-local` already contains device profiles for many Tuya devices. If a Smarter Pool heat pump variant is not fully supported, use the raw DPS/schema output to prepare a device profile PR.

## localtuya

Project: <https://github.com/rospogrigio/localtuya>

Use the CLI output to provide:

- device id
- local key
- protocol version
- DPS ids

## TinyTuya

Project: <https://github.com/jasonacox/tinytuya>

TinyTuya can be useful for validating local connectivity and DPS mappings outside Home Assistant.
