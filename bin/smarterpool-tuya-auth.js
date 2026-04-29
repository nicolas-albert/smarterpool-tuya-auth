#!/usr/bin/env node

const { run } = require('../src/cli');

run(process.argv.slice(2), process.env).catch((error) => {
  const message = error && error.message ? error.message : String(error);
  console.error(message);
  process.exit(error && error.exitCode ? error.exitCode : 1);
});
