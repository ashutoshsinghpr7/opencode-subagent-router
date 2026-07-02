/** @jsxImportSource @opentui/solid */
/** @jsxRuntime automatic */
import { createSignal, onCleanup, onMount } from "solid-js"
import { TextAttributes } from "@opentui/core"
import { stats, formatCost } from "../state.js"

const POLL_INTERVAL_MS = 2000

export function RouterPanel() {
  const [decisions, setDecisions] = createSignal(0)
  const [totalCostSaved, setTotalCostSaved] = createSignal(0)
  const [sessionCostSaved, setSessionCostSaved] = createSignal(0)
  const [tokensRouted, setTokensRouted] = createSignal(0)
  const [escalations, setEscalations] = createSignal(0)
  const [reverts, setReverts] = createSignal(0)

  let interval: ReturnType<typeof setInterval> | undefined

  onMount(() => {
    const sync = () => {
      setDecisions(stats.decisions.length)
      setTotalCostSaved(stats.totalCostSaved)
      setSessionCostSaved(stats.sessionCostSaved)
      setTokensRouted(stats.totalTokensRouted)
      setEscalations(stats.escalationCount)
      setReverts(stats.guardrailReverts)
    }
    sync()
    interval = setInterval(sync, POLL_INTERVAL_MS)
  })

  onCleanup(() => {
    if (interval) clearInterval(interval)
  })

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
      {d === 0 ? (
        <text attributes={TextAttributes.DIM}>No routing yet</text>
      ) : (
        <>
          <box flexDirection="row" justifyContent="space-between">
            <text attributes={TextAttributes.DIM}>Saved:</text>
            <text fg="green" attributes={TextAttributes.BOLD}>
              {formatCost(sessionCostSaved())}
            </text>
          </box>
          <box flexDirection="row" justifyContent="space-between">
            <text attributes={TextAttributes.DIM}>Decisions:</text>
            <text>{d}</text>
          </box>
          <box flexDirection="row" justifyContent="space-between">
            <text attributes={TextAttributes.DIM}>Tokens:</text>
            <text>{tokensRouted().toLocaleString()}</text>
          </box>
          <box flexDirection="row" justifyContent="space-between">
            <text attributes={TextAttributes.DIM}>Total saved:</text>
            <text fg="green">{formatCost(totalCostSaved())}</text>
          </box>
          <box flexDirection="row" justifyContent="space-between">
            <text attributes={TextAttributes.DIM}>Escalations:</text>
            <text fg="yellow">{escalations()}</text>
          </box>
          <box flexDirection="row" justifyContent="space-between">
            <text attributes={TextAttributes.DIM}>Reverts:</text>
            <text fg="red">{reverts()}</text>
          </box>
        </>
      )}
    </box>
  )
}
