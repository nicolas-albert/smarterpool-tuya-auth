# smarterpool-auth

Read-only CLI helper to recover Tuya device information from a Smarter Pool account, mainly for configuring Home Assistant local Tuya integrations.

The primary use case is retrieving the Tuya `deviceId`, `localKey`, DPS values, and schema for Smarter Pool / Garden PAC InverTech pool heat pumps without re-pairing the device.

## Who Is This For?

Use this tool if your pool heat pump is controlled by the Smarter Pool Android app and you want to integrate it locally with Home Assistant, `tuya-local`, `localtuya`, or TinyTuya.

It is especially useful when the device is paired with the Smarter Pool OEM app and is not visible from Tuya Smart / Smart Life without re-pairing. Re-pairing can change the Tuya `localKey` and may risk losing app-specific functionality, so this CLI reads the needed local credentials from the existing Smarter Pool account instead.

Search terms this project is meant to cover: Smarter Pool Home Assistant, Smarter Pool Tuya `localKey`, Garden PAC Tuya, Garden PAC InverTech Home Assistant, pool heat pump local Tuya.

## Status

Experimental. It was built from reverse engineering of the Smarter Pool Android app and the Tuya OEM mobile API. The tool only performs login and read-only device information requests.

The Smarter Pool Android app credentials for version `1.0.3 international` are bundled as the default app profile, so normal users should only need their Smarter Pool account credentials.

## Tested With

- Smarter Pool Android app `1.0.3 international`
- Garden PAC InverTech GHD-150-0356 swimming pool heat pump
- Tuya product ID `koAASpds906awojG`
- Home Assistant with [`tuya-local`](https://github.com/make-all/tuya-local)

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

For `tuya-local`, configure the device with:

- Host: the local IP address of the pool heat pump.
- Device ID: `device.deviceId` from `smarterpool-auth --show-secrets`.
- Local key: `device.localKey` from `smarterpool-auth --show-secrets`.
- Protocol version: `device.protocolVersion`, or `auto` if the integration supports it.

For `localtuya`, use the same `deviceId`, `localKey`, IP address, protocol version and DPS values. The `device.dps` and `device.schema` fields can help identify which DPS should be mapped to Home Assistant entities.

Example command for local integration setup:

```bash
npx smarterpool-auth --env .env --show-secrets --output smarterpool-device.local.json
```

Do not paste `smarterpool-device.local.json` into public issues, because it contains the Tuya `localKey`.

## Example Redacted Output

```json
{
  "tool": {
    "name": "smarterpool-auth",
    "version": "0.1.1"
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
