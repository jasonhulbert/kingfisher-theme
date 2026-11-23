import type { ThemeFamily } from '../theme.ts';

export interface OutputFile {
  /** Path relative to the adapter's output folder. */
  path: string;
  contents: string;
}

export interface InstallContext {
  home: string;
  /** Obsidian vault folder, from `--vault` or KINGFISHER_OBSIDIAN_VAULT. */
  vault?: string;
}

export interface InstallCopy {
  /** File or folder, relative to the adapter's output folder. */
  from: string;
  /** Absolute destination. Replaced on every install. */
  to: string;
}

export interface InstallWrite {
  /** Absolute path of an existing app file, such as a settings file. */
  to: string;
  /** The file's full new contents, usually the old contents with Kingfisher's keys set. */
  contents: string;
}

export type InstallStep = InstallCopy | InstallWrite;

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
  /**
   * Where the built files go on this machine, or which app files to rewrite.
   * Return a string to explain why it was skipped.
   */
  install?(family: ThemeFamily, ctx: InstallContext): InstallStep[] | string;
}

export const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
