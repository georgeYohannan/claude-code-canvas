# n8n Workflow Apps

Convert n8n workflows into deployable web applications.

## Stack
- **Frontend**: Next.js/React
- **Backend**: n8n (self-hosted, custom domain webhooks)
- **Deploy**: GitHub Actions → SSH to server

## Tools
- n8n MCP - view/edit workflows
- GitHub MCP - push changes
- Skills: `/n8n`, `/frontend-designer`

## Workflow
1. **Optimize n8n workflow** - ensure webhook input/output is correct
2. **Build frontend** - create UI that calls the webhook
3. **Test locally** - verify integration works
4. **Push to GitHub** - triggers auto-deploy to server

## n8n Webhook Patterns

### Input (Frontend → n8n)
```json
{
  "action": "process",
  "data": {
    "field1": "value1",
    "field2": "value2"
  }
}
```

### Output (n8n → Frontend)
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
- **Authentication**: As needed per workflow

## File Structure
```
src/
├── app/           # Next.js pages
├── components/    # UI components
├── stores/        # State management
└── types/         # TypeScript types
```

## Environment
```
N8N_WEBHOOK_URL=https://n8n.srv846970.hstgr.cloud/webhook
```

## MCP Servers (configured in .mcp.json)

### n8n-mcp
- **URL**: https://n8n.srv846970.hstgr.cloud
- **Tools**: search_nodes, get_node, validate_node, list_workflows, get_workflow, create_workflow, update_workflow
- **Usage**: `/n8n` skill or direct MCP tool calls

### GitHub MCP
- **Tools**: Repository management, issues, PRs, file operations
- **Usage**: Direct MCP tool calls for GitHub operations

## Skills (in .claude/skills/)

### `/n8n`
Expert guidance for n8n workflow development including:
- Node discovery and configuration
- Expression syntax and code nodes
- Workflow patterns and validation

### `/frontend-design`
Create distinctive, production-grade frontend interfaces:
- Bold aesthetic directions
- Typography and color systems
- Motion and spatial composition
- Avoids generic AI aesthetics
