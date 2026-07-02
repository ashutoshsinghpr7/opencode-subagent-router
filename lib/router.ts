import { DEFAULT_CONFIG, getModelCost, resolveModel, type RouterConfig } from "./config.js"
import { stats, estimateTokens, type RoutingDecision } from "./state.js"

export function getRouteForAgent(
  agent: string,
  config: RouterConfig = DEFAULT_CONFIG,
): { providerID: string; modelID: string; reason: RoutingDecision["reason"] } {
  const defaultRoute = resolveModel(config.defaultModel)

  if (config.escalation.enabled) {
  const escalationKey = `${agent}_escalated`
  const escalationTime = (stats as unknown as Record<string, number>)[escalationKey]
  if (escalationTime && Date.now() - escalationTime < config.escalation.cooldownMs) {
    return { ...resolveModel("deepseek-v4-pro"), reason: "escalation" }
  }
  }

  const rule = config.rules.find((r) => r.agents.includes(agent))
  if (rule) {
    const resolved = rule.provider ? { providerID: rule.provider, modelID: rule.model } : resolveModel(rule.model)
    return { ...resolved, reason: "rule" }
  }

  return { ...defaultRoute, reason: "default" }
}

export function shouldEscalate(
  agent: string,
  modelUsed: string,
  outputLength: number,
  config: RouterConfig = DEFAULT_CONFIG,
): boolean {
  if (!config.escalation.enabled) return false

  const costs = getModelCost(modelUsed)
  if (!costs || costs.reasoning) return false

  const tokenEstimate = estimateTokens(String(outputLength))
  const expectedOutput = 4000

  if (tokenEstimate > expectedOutput * config.escalation.threshold) {
    return true
  }

  return false
}

export function escalateAgent(agent: string): void {
  const escalationKey = `${agent}_escalated`
  ;(stats as unknown as Record<string, number>)[escalationKey] = Date.now()
  stats.escalationCount++
}

export function calculateCostSaved(
  originalModelKey: string,
  routedModelKey: string,
  outputText: string,
): number {
  const originalCost = getModelCost(originalModelKey)
  const routedCost = getModelCost(routedModelKey)
  if (!originalCost || !routedCost) return 0

  const tokens = estimateTokens(outputText)
  const originalPrice = (tokens / 1_000_000) * (originalCost.cost.input + originalCost.cost.output)
  const routedPrice = (tokens / 1_000_000) * (routedCost.cost.input + routedCost.cost.output)

  return Math.max(0, originalPrice - routedPrice)
}

export function recordDecision(
  agent: string,
  originalModel: string,
  routedModel: string,
  outputText: string,
  reason: RoutingDecision["reason"],
): void {
  const saved = calculateCostSaved(originalModel, routedModel, outputText)
  const tokens = estimateTokens(outputText)

  const decision: RoutingDecision = {
    timestamp: Date.now(),
    agent,
    originalModel,
    routedModel,
    costSaved: saved,
    reason,
  }

  stats.decisions.push(decision)
  stats.totalTokensRouted += tokens
  stats.totalCostSaved += saved
  stats.sessionCostSaved += saved
}

export function recordGuardrailRevert(agent: string): void {
  stats.guardrailReverts++
  const escalationKey = `${agent}_escalated`
  ;(stats as unknown as Record<string, number>)[escalationKey] = Date.now()
}
