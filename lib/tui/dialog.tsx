/** @jsxImportSource @opentui/solid */
/** @jsxRuntime automatic */
import { TextAttributes } from "@opentui/core"
import { readStatsFromFile, formatCost, type RoutingStats } from "../state.js"
import type { TuiApi, Theme } from "./types"

function loadStats(): RoutingStats {
  return readStatsFromFile()
}

export function showSrDialog(api: TuiApi) {
  api.ui.dialog.setSize("large")
  api.ui.dialog.replace(() => <SrPanel api={api} />)
}

function SrPanel(props: { api: TuiApi }) {
  const theme = props.api.theme.current
  const s = loadStats()

  const checks = s.checks || 0
  const decisions = s.decisions?.length || 0
  const sessionSaved = s.sessionCostSaved || 0
  const totalSaved = s.totalCostSaved || 0
  const escalations = s.escalationCount || 0
  const reverts = s.guardrailReverts || 0
  const tokens = s.totalTokensRouted || 0
  const recent = (s.decisions || []).slice(-10)

  return (
    <box paddingLeft={3} paddingRight={3} paddingBottom={1} gap={1}>
      <box flexDirection="row" justifyContent="space-between">
        <box flexDirection="column">
          <text fg={theme.primary} attributes={TextAttributes.BOLD}>
            Subagent Router
          </text>
          <text fg={theme.text}>Cost-optimized sub-agent model routing</text>
        </box>
        <text fg={theme.textMuted} onMouseUp={() => props.api.ui.dialog.clear()}>
          esc
        </text>
      </box>
      <box height={1} border={["bottom"]} borderColor={theme.borderSubtle} />
      {checks === 0 ? (
        <text fg={theme.textMuted} attributes={TextAttributes.DIM}>
          No sub-agent activity yet. Model routing activates when sub-agents are invoked and the assigned model differs from routing rules.
        </text>
      ) : (
        <>
          <Metric theme={theme} label="Sub-agents checked:" value={`${checks}`} />
          <Metric theme={theme} label="Routing decisions:" value={`${decisions}`} />
          <Metric
            theme={theme}
            label="Session saved:"
            value={formatCost(sessionSaved)}
            color="success"
          />
          <Metric
            theme={theme}
            label="Total saved:"
            value={formatCost(totalSaved)}
            color="success"
          />
          <Metric theme={theme} label="Tokens routed:" value={tokens.toLocaleString()} />
          {escalations > 0 && (
            <Metric theme={theme} label="Escalations:" value={`${escalations}`} color="warning" />
          )}
          {reverts > 0 && (
            <Metric theme={theme} label="Guardrail reverts:" value={`${reverts}`} color="error" />
          )}
          {recent.length > 0 && (
            <box flexDirection="column" gap={0} marginTop={1}>
              <text fg={theme.primary} attributes={TextAttributes.BOLD}>
                Recent decisions
              </text>
              {recent.map((d) => (
                <text fg={theme.textMuted}>
                  {d.agent}: {d.originalModel} → {d.routedModel} ({d.reason})
                </text>
              ))}
            </box>
          )}
        </>
      )}
      <box flexDirection="row" justifyContent="flex-end" paddingTop={1}>
        <box
          paddingLeft={2}
          paddingRight={2}
          backgroundColor={theme.primary}
          onMouseUp={() => props.api.ui.dialog.clear()}
        >
          <text fg={theme.selectedListItemText}>close</text>
        </box>
      </box>
    </box>
  )
}

function Metric(props: {
  theme: Theme
  label: string
  value: string
  color?: "success" | "warning" | "error"
}) {
  const color = props.color ? props.theme[props.color] : props.theme.text
  return (
    <box flexDirection="row" justifyContent="space-between" paddingTop={0} paddingBottom={0}>
      <text fg={props.theme.textMuted}>{props.label}</text>
      <text fg={color} attributes={TextAttributes.BOLD}>
        {props.value}
      </text>
    </box>
  )
}
