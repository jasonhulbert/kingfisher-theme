import type { ThemeFamily } from '../theme.ts';

export interface OutputFile {
  /** Path relative to the adapter's output folder. */
  path: string;
  contents: string;
}

/**
 * Turns the resolved theme family into one app's theme files. To add an app,
 * write an adapter and register it in `adapters/index.ts`.
 */
export interface Adapter {
  /** Output folder name and `--target` value. */
  id: string;
  /** App name for logs. */
  name: string;
  build(family: ThemeFamily): OutputFile[];
}

export const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
