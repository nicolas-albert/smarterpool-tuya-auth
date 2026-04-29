# smarterpool-auth

Read-only CLI helper to recover Tuya device information from a Smarter Pool account, mainly for configuring Home Assistant local Tuya integrations.

The primary use case is retrieving the Tuya `deviceId`, `localKey`, DPS values, and schema for Smarter Pool / Garden PAC InverTech pool heat pumps without re-pairing the device.

## Status

Experimental. It was built from reverse engineering of the Smarter Pool Android app and the Tuya OEM mobile API. The tool only performs login and read-only device information requests.

The Smarter Pool Android app credentials for version `1.0.3 international` are bundled as the default app profile, so normal users should only need their Smarter Pool account credentials.

## Usage

```bash
npx smarterpool-auth user@example.com 'password'
```

For local use, prefer a `.env` file:

```bash
cp examples/smarterpool.env.example .env
$EDITOR .env
npx smarterpool-auth --env .env
```

By default the output redacts secrets, including `localKey`, session tokens, app secrets, and passwords. To print values needed by Home Assistant:

```bash
npx smarterpool-auth --env .env --show-secrets
```

Use `--output` to write the report to a file:

```bash
npx smarterpool-auth --env .env --show-secrets --output smarterpool-device.local.json
```

Files ending in `.local.json` are ignored by Git in this repository.

## Required Configuration

Account credentials:

- `SMARTERPOOL_LOGIN`: Smarter Pool email or phone number.
- `SMARTERPOOL_PASSWORD`: Smarter Pool password.
- `SMARTERPOOL_COUNTRY_CODE`: phone country code, defaults to `33`.
- `SMARTERPOOL_DEVICE_ID`: optional Tuya device id. If omitted, the CLI tries discovery. If exactly one device is discovered, it is inspected automatically.

Optional Tuya OEM app credential overrides:

- `SMARTERPOOL_APP_KEY`
- `SMARTERPOOL_APP_SECRET`
- `SMARTERPOOL_SECRET2`
- `SMARTERPOOL_CERT_SIGN`
- `SMARTERPOOL_REGION`
- `SMARTERPOOL_TTID`

The bundled default profile comes from the public Smarter Pool Android app `1.0.3 international`. These values are not user account credentials, but they may stop working if Smarter Pool rotates app credentials in a future release. Use the override variables if you need to test another APK version.

## Home Assistant

The output is useful for local integrations that need a Tuya `deviceId` and `localKey`:

- [tuya-local](https://github.com/make-all/tuya-local)
- [localtuya](https://github.com/rospogrigio/localtuya)
- [TinyTuya](https://github.com/jasonacox/tinytuya)

For `tuya-local`, configure the device with its local IP address, `deviceId`, `localKey`, and protocol version reported by the CLI.

## Example Redacted Output

```json
{
  "tool": {
    "name": "smarterpool-auth",
    "version": "0.1.0"
  },
  "account": {
    "accountType": "email",
    "appProfile": "smarter-pool-1.0.3-international",
    "countryCode": "33",
    "region": "EU"
  },
  "device": {
    "name": "Pool heat pump",
    "deviceId": "abcd...7890",
    "localKey": "1234...cdef",
    "protocolVersion": "3.3",
    "productId": "exampleProductId"
  }
}
```

## CLI Reference

```text
smarterpool-auth [login] [password] [options]

Options:
  --login <value>             Smarter Pool email or phone login
  --password <value>          Smarter Pool password
  --country-code <value>      Account country code, default 33
  --device-id <value>         Tuya device id to inspect
  --app-key <value>           Tuya OEM app key override
  --app-secret <value>        Tuya OEM app secret override
  --secret2 <value>           Tuya OEM secret2 override
  --cert-sign <value>         Tuya OEM cert sign override
  --region <value>            Tuya region override
  --ttid <value>              Tuya ttid override
  --env <path>                Load an env file, default .env when present
  --output <path>             Write JSON output to a file
  --raw                       Include raw API action results
  --show-secrets              Do not redact localKey/tokens/secrets
  --help                      Show help
  --version                   Show package version
```

## Security Notes

- Do not paste `--show-secrets` output into GitHub issues.
- Treat Tuya `localKey` like a password for local network control of the device.
- Rotate the device key by re-pairing the device if it was exposed.
