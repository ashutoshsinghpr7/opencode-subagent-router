import type { Plugin } from "@opencode-ai/plugin"
import {
  DEFAULT_CONFIG,
  getModelCost,
  registerProviderCosts,
  type RouterConfig,
} from "./lib/config.js"
import { stats, resetStats, estimateTokens, formatCost, persistStats } from "./lib/state.js"
import { getRouteForAgent } from "./lib/router.js"

let activeConfig: RouterConfig = DEFAULT_CONFIG

export const SubagentRouter: Plugin = async ({ client, directory }) => {
  try {
    await client.app.log({
      body: {
        service: "opencode-subagent-router",
        level: "info",
        message: `Subagent Router loaded — cost-optimized routing active in ${directory}`,
      },
    })
  } catch {}

  return {
    "chat.message": async (input, output) => {
      const agent = input.agent || "unknown"

      if (!output.parts || !Array.isArray(output.parts)) return

      for (const part of output.parts) {
        if (part.type !== "subtask") continue

        stats.checks++

        const subtaskPart = part as {
          type: "subtask"
          agent: string
          model?: { providerID: string; modelID: string }
        }
        const subtaskAgent = subtaskPart.agent || agent
        const route = getRouteForAgent(subtaskAgent, activeConfig)

        const effectiveProvider =
          subtaskPart.model?.providerID || input.model?.providerID || "deepseek"
        const effectiveModel =
          subtaskPart.model?.modelID || input.model?.modelID || DEFAULT_CONFIG.defaultModel

        if (route.providerID === effectiveProvider && route.modelID === effectiveModel) {
          continue
        }

        subtaskPart.model = {
          providerID: route.providerID,
          modelID: route.modelID,
        }

        const routedKey = `${route.providerID}/${route.modelID}`
        const originalKey = `${effectiveProvider}/${effectiveModel}`

        const routedInfo = getModelCost(routedKey)
        const originalInfo = getModelCost(originalKey)
        if (routedInfo && originalInfo) {
          const originalPrice = originalInfo.cost.input + originalInfo.cost.output
          const routedPrice = routedInfo.cost.input + routedInfo.cost.output
          if (originalPrice > routedPrice) {
            try {
              await client.app.log({
                body: {
                  service: "opencode-subagent-router",
                  level: "info",
                  message: `${subtaskAgent}: ${originalKey} → ${routedKey} (save ${formatCost(originalPrice - routedPrice)}/1M tokens)`,
                },
              })
            } catch {}
          }
        }

        stats.decisions.push({
          timestamp: Date.now(),
          agent: subtaskAgent,
          originalModel: originalKey,
          routedModel: routedKey,
          costSaved: 0,
          reason: route.reason,
        })
        persistStats()
      }
    },

    "tool.execute.after": async (input) => {
      const { tool, output: resultOutput } = input as unknown as {
        tool: string
        output: string
      }

      if (tool !== "task") return

      const outputText =
        typeof resultOutput === "string" ? resultOutput : JSON.stringify(resultOutput || "")
      const tokens = estimateTokens(outputText)
      stats.totalTokensRouted += tokens
      stats.checks++
      persistStats()
    },

    "session.idle": async () => {
      if (stats.decisions.length > 0) {
        const sessionSaved = stats.decisions.reduce((sum, d) => sum + d.costSaved, 0)
        const topAgents = new Map<string, number>()
        for (const d of stats.decisions) {
          topAgents.set(d.agent, (topAgents.get(d.agent) || 0) + 1)
        }
        const agentSummary = Array.from(topAgents.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([agent, count]) => `${agent}: ${count}`)
          .join(", ")

        try {
          await client.tui.showToast({
            body: {
              message: `Subagent Router: ${stats.decisions.length} decisions saved ${formatCost(sessionSaved)} | ${agentSummary}`,
              variant: "info",
              duration: 8000,
            },
          })
        } catch {}
      }
      resetStats()
    },

    "tui.command.execute": async (input: unknown) => {
      const cmd = input as { command: string }
      if (cmd.command === "/route-stats") {
        const totalSaved = stats.decisions.reduce((sum, d) => sum + d.costSaved, 0)
        const rulings = stats.decisions.map(
          (d) => `  ${d.agent}: ${d.originalModel} → ${d.routedModel} (${d.reason})`,
        )

        const lines = [
          `Decisions: ${stats.decisions.length}`,
          `Session saved: ${formatCost(totalSaved)}`,
          `Total saved: ${formatCost(stats.totalCostSaved)}`,
          `Tokens routed: ${stats.totalTokensRouted.toLocaleString()}`,
          `Escalations: ${stats.escalationCount}`,
          `Guardrail reverts: ${stats.guardrailReverts}`,
          ``,
          `Recent:`,
          ...rulings.slice(-10),
        ]

        try {
          await client.tui.showToast({
            body: {
              message: lines.join("\n"),
              variant: "info",
              duration: 10000,
            },
          })
        } catch {}
      }
    },
  }
}

export default SubagentRouter
