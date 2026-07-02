# opencode-model-router

Dynamic model router for [OpenCode](https://opencode.ai) — cost-optimized sub-agent model selection with escalation and quality guardrails.

## Features

- **Dynamic routing**: `chat.message` hook intercepts sub-agent invocations and overrides the model based on task type
- **Cost-optimized**: Routes cheap tasks (explore, title, summary, compaction) to `deepseek-v4-flash` ($0.42/M tokens) and complex tasks (general, build, plan) to `deepseek-v4-pro` ($1.30/M tokens)
- **Smart escalation**: If a cheap model receives a complex task (> threshold output), auto-promotes to the powerful model
- **Quality guardrails**: If a cheap model produces inadequate output, auto-reverts to the powerful model and tracks the pattern
- **Session summaries**: Reports cost saved at session end via toast
- **TUI sidebar**: Live cost savings visible in the right-side panel
- **`/route-stats` command**: Show routing stats on demand

## Cost Savings

| Sub-Agent | Default Model (native config) | Plugin Override | Cost/M tokens |
|---|---|---|---|
| explore | deepseek-v4-flash ($0.42) | Same (pass-through) | $0.42 |
| title | deepseek-chat ($0.42) | deepseek-v4-flash ($0.42) | Same cost |
| summary | deepseek-chat ($0.42) | deepseek-v4-flash ($0.42) | Same cost |
| compaction | deepseek-chat ($0.42) | deepseek-v4-flash ($0.42) | Same cost |
| general | deepseek-v4-pro ($1.30) | deepseek-v4-pro ($1.30) | Same (quality critical) |
| build | deepseek-v4-pro ($1.30) | deepseek-v4-pro ($1.30) | Same (quality critical) |
| plan | deepseek-v4-pro ($1.30) | deepseek-v4-pro ($1.30) | Same (quality critical) |

The plugin's primary value over native config is **dynamic escalation** — if an explore agent gets a task too complex for flash, it auto-promotes to pro, then reverts when done. This prevents the "cheap model → bad output → more expensive rework" loop.

## Install

```bash
npm install opencode-model-router
```

### Configure

In `.opencode/opencode.json`:
```json
{
  "plugin": ["opencode-model-router"]
}
```

In `.opencode/tui.json`:
```json
{
  "plugin": ["opencode-model-router"]
}
```

## Configuration

Add a `model-router` section to `opencode.json`:

```json
{
  "model-router": {
    "rules": [
      {
        "agents": ["explore", "title", "summary", "compaction"],
        "model": "deepseek-v4-flash",
        "provider": "deepseek",
        "label": "Cheap with reasoning"
      },
      {
        "agents": ["general", "build", "plan"],
        "model": "deepseek-v4-pro",
        "provider": "deepseek",
        "label": "Flagship for code"
      }
    ],
    "defaultModel": "deepseek-v4-flash",
    "escalation": {
      "enabled": true,
      "threshold": 2,
      "cooldownMs": 300000
    },
    "guardrails": {
      "enabled": true,
      "maxRetries": 2,
      "retryWindowMs": 600000
    },
    "costDisplay": "both"
  }
}
```

## Architecture

```
chat.message hook
  └─ scan output.parts for SubtaskPart
       ├─ No subtask → pass through
       ├─ Subtask found → lookup agent in rules
       │    ├─ Match found → override part.model
       │    └─ No match → use defaultModel
       └─ Track decision + cost saved
```

## License

MIT
