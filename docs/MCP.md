# TIA Helper — MCP Server

If your AI client speaks [MCP (Model Context Protocol)](https://modelcontextprotocol.io)
natively — Claude Desktop, Claude Code, and others — you can skip shell scripting entirely
and let it call TIA Helper's actions as real tools.

📥 **[Download the mcp-server folder](../mcp-server)** from this repo.

This is a second, alternative interface to the exact same protocol documented in
[NAMED_PIPE.md](NAMED_PIPE.md) — it doesn't reimplement any TIA logic, it just forwards
each tool call to the already-running `TiaHelper.exe` over its `tia_helper` named pipe,
the same way `tia.ps1` does. Use whichever fits your client better: the MD doc for a
shell-command-capable assistant, this MCP server for an MCP-native one.

## Requirements

- TIA Helper (`TiaHelper.exe`) already running on the same machine.
- [Node.js](https://nodejs.org).

## Setup

```powershell
cd mcp-server
npm install
```

## Point your MCP client at it

```json
{
  "mcpServers": {
    "tiahelper": {
      "command": "node",
      "args": ["C:\\path\\to\\mcp-server\\index.js"]
    }
  }
}
```

(Adjust the path to wherever you saved the `mcp-server` folder.)

## Tools

Each tool mirrors one pipe command 1:1 — see [NAMED_PIPE.md](NAMED_PIPE.md) for the full
protocol reference, including safety rules (never guess a project name, `import`
overwrites existing blocks, `download` always refuses over this interface by design). The
tool names here are `tia_<command>`, e.g. `tia_list`, `tia_status`, `tia_export`,
`tia_exportxml`.

There is deliberately no `tia_download` tool — `download` always refuses over the pipe by
design (writing to real hardware needs the app's own on-screen confirmation dialog, which
no MCP/pipe caller can show), so exposing it would just forward to a command that always
says no.
