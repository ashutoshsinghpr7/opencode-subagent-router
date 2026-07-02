import type { SrCommand, TuiApi } from "./types"

export function registerCommands(api: TuiApi, commands: SrCommand[]) {
  const keymap = (api as any).keymap
  if (keymap?.registerLayer) {
    keymap.registerLayer({
      commands: commands.map((c) => ({
        namespace: "palette",
        name: c.name,
        title: c.title,
        desc: c.description,
        category: "Subagent Router",
        slashName: c.slashName,
        run: c.run,
      })),
    })
    return
  }

  api.command?.register(() =>
    commands.map((c) => ({
      title: c.title,
      value: c.name,
      description: c.description,
      category: "Subagent Router",
      slash: { name: c.slashName },
      onSelect: c.run,
    })),
  )
}
