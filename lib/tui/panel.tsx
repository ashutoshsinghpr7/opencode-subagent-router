/** @jsxImportSource @opentui/solid */
/** @jsxRuntime automatic */
import { createSignal, onCleanup, onMount } from "solid-js"
import { TextAttributes } from "@opentui/core"
import { formatCost, readStatsFromFile } from "../state.js"

const POLL_INTERVAL_MS = 2000

export function RouterPanel() {
  const [checks, setChecks] = createSignal(0)
  const [decisions, setDecisions] = createSignal(0)
  const [sessionCostSaved, setSessionCostSaved] = createSignal(0)
  const [totalCostSaved, setTotalCostSaved] = createSignal(0)
  const [escalations, setEscalations] = createSignal(0)
  const [reverts, setReverts] = createSignal(0)

  let interval: ReturnType<typeof setInterval> | undefined

  onMount(() => {
    const sync = () => {
      const s = readStatsFromFile()
      setChecks(s.checks)
      setDecisions(s.decisions.length)
      setSessionCostSaved(s.sessionCostSaved)
      setTotalCostSaved(s.totalCostSaved)
      setEscalations(s.escalationCount)
      setReverts(s.guardrailReverts)
    }
    sync()
    interval = setInterval(sync, POLL_INTERVAL_MS)
  })

  onCleanup(() => {
    if (interval) clearInterval(interval)
  })

  const c = checks()
  const d = decisions()

  return (
    <box
      title="Subagent Router"
      borderStyle="single"
      flexDirection="column"
      paddingX={1}
      paddingY={0}
      width="100%"
    >
      {c === 0 ? (
        <text attributes={TextAttributes.DIM}>No routing yet</text>
      ) : (
        <>
          <box flexDirection="row" justifyContent="space-between">
            <text attributes={TextAttributes.DIM}>Checked:</text>
            <text>{c} subtasks</text>
          </box>
          <box flexDirection="row" justifyContent="space-between">
            <text attributes={TextAttributes.DIM}>Decisions:</text>
            <text>{d}</text>
          </box>
          {d > 0 && (
            <>
              <box flexDirection="row" justifyContent="space-between">
                <text attributes={TextAttributes.DIM}>Saved this session:</text>
                <text fg="green" attributes={TextAttributes.BOLD}>
                  {formatCost(sessionCostSaved())}
                </text>
              </box>
              <box flexDirection="row" justifyContent="space-between">
                <text attributes={TextAttributes.DIM}>Total saved:</text>
                <text fg="green">{formatCost(totalCostSaved())}</text>
              </box>
            </>
          )}
          {escalations() > 0 && (
            <box flexDirection="row" justifyContent="space-between">
              <text attributes={TextAttributes.DIM}>Escalations:</text>
              <text fg="yellow">{escalations()}</text>
            </box>
          )}
          {reverts() > 0 && (
            <box flexDirection="row" justifyContent="space-between">
              <text attributes={TextAttributes.DIM}>Reverts:</text>
              <text fg="red">{reverts()}</text>
            </box>
          )}
        </>
      )}
    </box>
  )
}
