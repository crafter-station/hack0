import { main } from "./cli.js";

main().then((code) => {
  process.exitCode = code;
});
