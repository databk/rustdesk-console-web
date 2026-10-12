// JSDOM omits the Encoding API that current target browsers provide.
import { TextDecoder, TextEncoder } from 'node:util';

Object.assign(globalThis, { TextDecoder, TextEncoder });
