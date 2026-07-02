/** @jsxImportSource @opentui/solid */
/** @jsxRuntime automatic */
import type { TuiPluginModule } from "@opencode-ai/plugin/tui"
import { registerCommands } from "./lib/tui/commands"
import { showSrDialog } from "./lib/tui/dialog"

const tui: TuiPluginModule["tui"] = async (api) => {
  registerCommands(api, [
    {
      title: "Subagent Router",
      name: "sr.panel",
      description: "Open sub-agent routing stats",
      slashName: "sr",
      run: () => showSrDialog(api),
    },
  ])
}

export default {
  id: "opencode-subagent-router",
  tui,
} satisfies TuiPluginModule
