# AGENTS.md

## Project Scope

This repository contains a small Node.js CLI that logs into the Smarter Pool Tuya OEM cloud and prints read-only device information useful for Home Assistant local Tuya integrations.

## Safety Rules

- Never commit `.env`, account credentials, Tuya `localKey`, session tokens, API secrets, device dumps, or unredacted command output.
- Keep the tool read-only. Do not add device control/write commands unless they are explicitly scoped, documented, and protected.
- Default CLI output must stay redacted. Secrets may only be printed when the user passes an explicit flag such as `--show-secrets`.
- Prefer small, dependency-light code. This tool should remain easy to audit.

## Development

- Run `npm test` before committing.
- Use `node --test` for unit tests.
- Keep Node.js support at `>=20`.
- Manual changes should use focused commits with a clear message.
