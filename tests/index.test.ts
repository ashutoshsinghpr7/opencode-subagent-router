import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { resolveModel, getModelCost, DEFAULT_CONFIG, registerProviderCosts } from "../lib/config.js"
import { getRouteForAgent, calculateCostSaved } from "../lib/router.js"
import { estimateTokens, formatCost, stats, resetStats } from "../lib/state.js"

describe("config", () => {
  test("resolveModel with provider prefix", () => {
    const result = resolveModel("deepseek/deepseek-chat")
    assert.equal(result.providerID, "deepseek")
    assert.equal(result.modelID, "deepseek-chat")
  })

  test("resolveModel without provider defaults to deepseek", () => {
    const result = resolveModel("deepseek-v4-flash")
    assert.equal(result.providerID, "deepseek")
    assert.equal(result.modelID, "deepseek-v4-flash")
  })

  test("getModelCost returns correct pricing", () => {
    const cost = getModelCost("deepseek/deepseek-chat")
    assert.ok(cost)
    assert.equal(cost!.cost.input, 0.14)
    assert.equal(cost!.cost.output, 0.28)
    assert.equal(cost!.reasoning, false)
  })

  test("getModelCost returns correct pricing for pro", () => {
    const cost = getModelCost("deepseek/deepseek-v4-pro")
    assert.ok(cost)
    assert.equal(cost!.reasoning, true)
    assert.ok(cost!.cost.input > 0.14)
  })

  test("registerProviderCosts adds new provider models", () => {
    registerProviderCosts({
      openai: {
        "gpt-4o-mini": {
          cost: { input: 0.15, output: 0.60 },
          reasoning: false,
          context: 128000,
        },
      },
    })
    const cost = getModelCost("openai/gpt-4o-mini")
    assert.ok(cost)
    assert.equal(cost!.providerID, "openai")
    assert.equal(cost!.cost.input, 0.15)
    assert.equal(cost!.reasoning, false)
  })
})

describe("router", () => {
  test("getRouteForAgent routes explore to flash", () => {
    const route = getRouteForAgent("explore")
    assert.equal(route.modelID, "deepseek-v4-flash")
    assert.equal(route.providerID, "deepseek")
    assert.equal(route.reason, "rule")
  })

  test("getRouteForAgent routes general to pro", () => {
    const route = getRouteForAgent("general")
    assert.equal(route.modelID, "deepseek-v4-pro")
    assert.equal(route.reason, "rule")
  })

  test("getRouteForAgent routes build to pro", () => {
    const route = getRouteForAgent("build")
    assert.equal(route.modelID, "deepseek-v4-pro")
  })

  test("getRouteForAgent routes title to flash", () => {
    const route = getRouteForAgent("title")
    assert.equal(route.modelID, "deepseek-v4-flash")
  })

  test("getRouteForAgent unknown agent gets default", () => {
    const route = getRouteForAgent("unknown_agent")
    assert.equal(route.reason, "default")
  })

  test("getRouteForAgent summary goes to flash", () => {
    const route = getRouteForAgent("summary")
    assert.equal(route.modelID, "deepseek-v4-flash")
  })

  test("calculateCostSaved pro→flash saves money", () => {
    const saved = calculateCostSaved(
      "deepseek/deepseek-v4-pro",
      "deepseek/deepseek-v4-flash",
      "test output ".repeat(250),
    )
    assert.ok(saved > 0)
  })

  test("calculateCostSaved same model saves zero", () => {
    const saved = calculateCostSaved(
      "deepseek/deepseek-chat",
      "deepseek/deepseek-chat",
      "test",
    )
    assert.equal(saved, 0)
  })
})

describe("state", () => {
  test("estimateTokens", () => {
    assert.equal(estimateTokens("hello world"), 3)
    assert.equal(estimateTokens(""), 0)
    assert.equal(estimateTokens("a".repeat(1000)), 250)
  })

  test("formatCost", () => {
    assert.equal(formatCost(0), "$0.000")
    assert.equal(formatCost(0.001), "$0.0010")
    assert.equal(formatCost(0.05), "$0.050")
    assert.equal(formatCost(1.5), "$1.50")
  })

  test("resetStats clears decisions", () => {
    stats.decisions.push({
      timestamp: Date.now(),
      agent: "explore",
      originalModel: "pro",
      routedModel: "flash",
      costSaved: 0.001,
      reason: "rule",
    })
    assert.ok(stats.decisions.length > 0)
    resetStats()
    assert.equal(stats.decisions.length, 0)
  })
})

describe("DEFAULT_CONFIG", () => {
  test("covers explore, title, summary, compaction in cheap tier", () => {
    const cheapAgents = ["explore", "title", "summary", "compaction"]
    const cheapRule = DEFAULT_CONFIG.rules.find((r) => r.agents.includes("explore"))
    assert.ok(cheapRule)
    for (const agent of cheapAgents) {
      assert.ok(cheapRule!.agents.includes(agent))
    }
  })

  test("covers general, build, plan in expensive tier", () => {
    const expensiveAgents = ["general", "build", "plan"]
    const expensiveRule = DEFAULT_CONFIG.rules.find((r) => r.agents.includes("general"))
    assert.ok(expensiveRule)
    for (const agent of expensiveAgents) {
      assert.ok(expensiveRule!.agents.includes(agent))
    }
  })

  test("escalation is enabled by default", () => {
    assert.equal(DEFAULT_CONFIG.escalation.enabled, true)
  })

  test("guardrails are enabled by default", () => {
    assert.equal(DEFAULT_CONFIG.guardrails.enabled, true)
  })
})
