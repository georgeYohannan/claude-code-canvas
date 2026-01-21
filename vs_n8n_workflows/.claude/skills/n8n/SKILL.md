---
name: n8n
description: Expert guidance for building n8n workflows using the n8n-mcp server tools. Covers node discovery, workflow patterns, expression syntax, code nodes, validation, and configuration best practices.
---

# n8n Workflow Expert

This skill provides comprehensive guidance for building n8n workflows. Use this when working with n8n automation, webhooks, or the n8n-mcp tools.

## MCP Tools Quick Reference

The n8n-mcp server provides these key tools:

| Tool | Purpose | Response Time |
|------|---------|---------------|
| `search_nodes` | Find available nodes | <20ms |
| `get_node` | Get node documentation | <10ms |
| `validate_node` | Validate configuration | <100ms |
| `list_workflows` | List all workflows | ~50ms |
| `get_workflow` | Get workflow details | ~100ms |
| `create_workflow` | Create new workflow | ~200ms |
| `update_workflow` | Modify workflow | ~200ms |

## Critical Concept: nodeType Formats

**Search/validation tools**: Use `"nodes-base.slack"`
**Workflow tools**: Use `"n8n-nodes-base.slack"`

## Workflow Patterns

### 1. Webhook Processing
```
Webhook → Set/Transform → IF/Switch → Action → Respond to Webhook
```

### 2. HTTP API Integration
```
Schedule/Webhook → HTTP Request → Parse/Transform → Store/Send
```

### 3. Database Operations
```
Trigger → Query → Transform → Update/Insert → Notify
```

### 4. AI Agent Workflow
```
Webhook → AI Agent → Tool Calls → Aggregate → Respond
```

## Expression Syntax

All dynamic content requires double curly braces: `{{expression}}`

### Core Variables
- `$json` - Current node output: `{{$json.email}}`
- `$node` - Other node data: `{{$node["Node Name"].json.field}}`
- `$now` - Current timestamp: `{{$now.toISO()}}`
- `$env` - Environment vars: `{{$env.API_KEY}}`

### Webhook Data Access
Webhook data is nested under `.body`:
```
{{$json.body.name}}     // Correct
{{$json.name}}          // Wrong - data is nested!
```

## Code Node (JavaScript)

Always return array format: `[{json: {...}}]`

### Run Once for All Items (Default)
```javascript
const items = $input.all();
const results = items.map(item => ({
  json: {
    original: item.json,
    processed: true
  }
}));
return results;
```

### Webhook Data Access in Code
```javascript
const webhookData = $input.first().json.body;
const name = webhookData.name;
return [{ json: { name, status: 'received' } }];
```

### HTTP Requests in Code
```javascript
const response = await $helpers.httpRequest({
  method: 'GET',
  url: 'https://api.example.com/data',
  headers: { 'Authorization': `Bearer ${$env.API_KEY}` }
});
return [{ json: response }];
```

## Code Node (Python)

Only use Python when specifically needed (standard library only, no external packages).

```python
items = _input.all()
results = []
for item in items:
    results.append({
        "json": {
            "original": item.json,
            "processed": True
        }
    })
return results
```

## Validation Best Practices

Use `runtime` profile for most validation. Expect 2-3 validate → fix cycles.

### Severity Levels
- **Errors**: Block execution (fix immediately)
- **Warnings**: May cause issues (review)
- **Suggestions**: Optional improvements

### Common Validation Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `missing_required` | Required field empty | Add the required value |
| `invalid_reference` | Bad node reference | Check node name spelling |
| `invalid_expression` | Syntax error | Verify `{{ }}` braces |
| `type_mismatch` | Wrong data type | Convert or restructure |

## Node Configuration Tips

1. **Start minimal** - Add only required fields first
2. **Use standard detail** - `get_node` with default detail covers 95% of cases
3. **Validate iteratively** - Validate after each significant change
4. **Check operation context** - Fields change based on selected operation

## Common Mistakes to Avoid

1. **Wrong nodeType format** - Use correct prefix for the tool
2. **Missing webhook body** - Always access `$json.body.field` for webhook data
3. **Forgetting return** - Code nodes must return array format
4. **Expression without braces** - Dynamic values need `{{ }}`
5. **Skipping validation** - Always validate before activating

## Webhook Input/Output Patterns

### Standard Input (Frontend → n8n)
```json
{
  "action": "process",
  "data": {
    "field1": "value1",
    "field2": "value2"
  }
}
```

### Standard Output (n8n → Frontend)
```json
{
  "success": true,
  "result": { ... },
  "error": null
}
```

### Webhook Node Settings
- **HTTP Method**: POST
- **Response Mode**: "Last Node" (to return processed data)
- **Path**: Unique identifier for the endpoint
