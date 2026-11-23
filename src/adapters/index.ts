import { chatgpt } from './chatgpt.ts';
import { claude } from './claude.ts';
import { obsidian } from './obsidian.ts';
import type { Adapter } from './types.ts';
import { vscode } from './vscode.ts';
import { warp } from './warp.ts';
import { zed } from './zed.ts';

/** Every build target. Add new adapters here. */
export const adapters: Adapter[] = [vscode, zed, warp, obsidian, chatgpt, claude];
