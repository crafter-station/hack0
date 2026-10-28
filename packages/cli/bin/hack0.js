#!/usr/bin/env node
import { main } from "../dist/cli.js";

main().then((code) => {
  process.exitCode = code;
});
