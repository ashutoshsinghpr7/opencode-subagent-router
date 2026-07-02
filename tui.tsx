/** @jsxImportSource @opentui/solid */
/** @jsxRuntime automatic */
import type { TuiPluginApi, TuiSlotContext } from "@opencode-ai/plugin/tui"
import { RouterPanel } from "./lib/tui/panel.js"

export default {
  id: "opencode-model-router",
  tui: async (api: TuiPluginApi) => {
    api.slots.register({
      slots: {
        sidebar_footer(_ctx: TuiSlotContext, _props: { session_id: string }) {
          return <RouterPanel />
        },
      },
    })
  },
}
