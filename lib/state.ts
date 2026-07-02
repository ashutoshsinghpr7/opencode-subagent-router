import { writeFileSync, existsSync, readFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

export interface RoutingDecision {
  timestamp: number
  agent: string
  originalModel: string
  routedModel: string
  costSaved: number
  reason: "rule" | "escalation" | "guardrail_revert" | "default"
}

export interface RoutingStats {
  checks: number
  decisions: RoutingDecision[]
  totalTokensRouted: number
  totalCostSaved: number
  sessionCostSaved: number
  escalationCount: number
  guardrailReverts: number
  sessionStart: number
}

const STATS_FILE = join(homedir(), ".local", "state", "opencode", "subagent-router-stats.json")

function ensureDir(): void {
  const dir = join(homedir(), ".local", "state", "opencode")
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function readStats(): RoutingStats {
  try {
    if (existsSync(STATS_FILE)) {
      const raw = readFileSync(STATS_FILE, "utf-8")
      return JSON.parse(raw)
    }
  } catch {}
  return {
    checks: 0,
    decisions: [],
    totalTokensRouted: 0,
    totalCostSaved: 0,
    sessionCostSaved: 0,
    escalationCount: 0,
    guardrailReverts: 0,
    sessionStart: Date.now(),
  }
}

function writeStats(s: RoutingStats): void {
  try {
    ensureDir()
    writeFileSync(STATS_FILE, JSON.stringify(s), "utf-8")
  } catch {}
}

function syncInMemoryToFile(): void {
  writeStats(stats)
}

export const stats: RoutingStats = readStats()

export function resetStats(): void {
  stats.checks = 0
  stats.decisions = []
  stats.totalTokensRouted = 0
  stats.totalCostSaved = 0
  stats.sessionCostSaved = 0
  stats.escalationCount = 0
  stats.guardrailReverts = 0
  stats.sessionStart = Date.now()
  syncInMemoryToFile()
}

export function persistStats(): void {
  syncInMemoryToFile()
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
