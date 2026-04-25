import { MODULE_ID } from "../constants.mjs";

const prefix = `${MODULE_ID} |`;

export const log = {
  debug: (...args) => console.debug(prefix, ...args),
  info:  (...args) => console.log(prefix, ...args),
  warn:  (...args) => console.warn(prefix, ...args),
  error: (...args) => console.error(prefix, ...args)
};
