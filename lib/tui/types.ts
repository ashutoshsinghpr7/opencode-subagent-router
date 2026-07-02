import type { TuiPluginModule } from "@opencode-ai/plugin/tui"

export type TuiApi = Parameters<NonNullable<TuiPluginModule["tui"]>>[0]
export type Theme = TuiApi["theme"]["current"]

export type SrCommand = {
  title: string
  name: string
  description: string
  slashName: string
  run: () => void | Promise<void>
}
