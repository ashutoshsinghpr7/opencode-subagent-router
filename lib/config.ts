export interface ModelInfo {
  id: string
  providerID: string
  cost: {
    input: number
    output: number
    cacheRead?: number
  }
  reasoning: boolean
  context: number
  status: string
}

export interface RoutingRule {
  agents: string[]
  model: string
  provider?: string
  label: string
}

export interface RouterConfig {
  rules: RoutingRule[]
  defaultModel: string
  escalation: {
    enabled: boolean
    threshold: number
    cooldownMs: number
  }
  guardrails: {
    enabled: boolean
    maxRetries: number
    retryWindowMs: number
  }
  costDisplay: "session" | "cumulative" | "both"
}

export const DEFAULT_CONFIG: RouterConfig = {
  rules: [
    {
      agents: ["explore", "title", "summary", "compaction"],
      model: "deepseek-v4-flash",
      provider: "deepseek",
      label: "Cheap with reasoning for simple tasks",
    },
    {
      agents: ["general", "build", "plan"],
      model: "deepseek-v4-pro",
      provider: "deepseek",
      label: "Flagship for code generation and complex tasks",
    },
  ],
  defaultModel: "deepseek-v4-flash",
  escalation: {
    enabled: true,
    threshold: 2,
    cooldownMs: 300_000,
  },
  guardrails: {
    enabled: true,
    maxRetries: 2,
    retryWindowMs: 600_000,
  },
  costDisplay: "both",
}

export const MODEL_COST_TABLE: Record<string, ModelInfo> = {
  "deepseek/deepseek-chat": {
    id: "deepseek-chat",
    providerID: "deepseek",
    cost: { input: 0.14, output: 0.28 },
    reasoning: false,
    context: 1_000_000,
    status: "active",
  },
  "deepseek/deepseek-v4-flash": {
    id: "deepseek-v4-flash",
    providerID: "deepseek",
    cost: { input: 0.14, output: 0.28 },
    reasoning: true,
    context: 1_000_000,
    status: "active",
  },
  "deepseek/deepseek-reasoner": {
    id: "deepseek-reasoner",
    providerID: "deepseek",
    cost: { input: 0.14, output: 0.28 },
    reasoning: true,
    context: 1_000_000,
    status: "active",
  },
  "deepseek/deepseek-v4-pro": {
    id: "deepseek-v4-pro",
    providerID: "deepseek",
    cost: { input: 0.435, output: 0.87 },
    reasoning: true,
    context: 1_000_000,
    status: "active",
  },
}

export function resolveModel(modelKey: string): {
  providerID: string
  modelID: string
} {
  if (modelKey.includes("/")) {
    const [providerID, modelID] = modelKey.split("/")
    return { providerID, modelID }
  }
  const rule = DEFAULT_CONFIG.rules.find((r) => r.model === modelKey)
  if (rule?.provider) {
    return { providerID: rule.provider, modelID: rule.model }
  }
  return { providerID: "deepseek", modelID: modelKey }
}

export function getModelCost(modelKey: string): ModelInfo | undefined {
  return MODEL_COST_TABLE[modelKey]
}
