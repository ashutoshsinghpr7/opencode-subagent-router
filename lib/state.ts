export interface RoutingDecision {
  timestamp: number
  agent: string
  originalModel: string
  routedModel: string
  costSaved: number
  reason: "rule" | "escalation" | "guardrail_revert" | "default"
}

export interface RoutingStats {
  decisions: RoutingDecision[]
  totalTokensRouted: number
  totalCostSaved: number
  sessionCostSaved: number
  escalationCount: number
  guardrailReverts: number
  sessionStart: number
}

export const stats: RoutingStats = {
  decisions: [],
  totalTokensRouted: 0,
  totalCostSaved: 0,
  sessionCostSaved: 0,
  escalationCount: 0,
  guardrailReverts: 0,
  sessionStart: Date.now(),
}

export function resetStats(): void {
  stats.decisions = []
  stats.totalTokensRouted = 0
  stats.totalCostSaved = 0
  stats.sessionCostSaved = 0
  stats.escalationCount = 0
  stats.guardrailReverts = 0
  stats.sessionStart = Date.now()
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export function formatCost(cost: number): string {
  if (cost < 0.001) return "$0.000"
  if (cost < 0.01) return `$${cost.toFixed(4)}`
  if (cost < 1) return `$${cost.toFixed(3)}`
  return `$${cost.toFixed(2)}`
}
