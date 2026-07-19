# TIA Helper MCP Server

An MCP (Model Context Protocol) server that exposes TIA Helper's named-pipe protocol as
MCP tools, so any MCP-compatible client (Claude Desktop, Claude Code, etc.) can drive TIA
Portal through TIA Helper without a human clicking the toolbar.

This is a second, alternative interface to the exact same protocol documented in
`release-repo/docs/NAMED_PIPE.md` - it doesn't reimplement any TIA logic, it just forwards
each tool call to the already-running `TiaHelper.exe` over its `tia_helper` named pipe,
the same way `tia.ps1` does. Use whichever fits your client better: the MD doc for a
shell-command-capable assistant, this MCP server for an MCP-native one.

## Requirements

- TIA Helper (`TiaHelper.exe`) already running on the same machine.
- Node.js.

## Setup

```powershell
cd mcp-server
npm install
```

## Running

Point your MCP client at:

```json
{
  "mcpServers": {
    "tiahelper": {
      "command": "node",
      "args": ["D:\\claude code\\TiaHelper\\mcp-server\\index.js"]
    }
  }
}
```

(Adjust the path to wherever this folder actually lives.)

## Tools

Each tool mirrors one pipe command 1:1 - see `release-repo/docs/NAMED_PIPE.md` for the full
protocol reference, including safety rules (never guess a project name, `import` overwrites
existing blocks, `download` always refuses over this interface by design). The tool names
here are `tia_<command>`, e.g. `tia_list`, `tia_status`, `tia_export`, `tia_exportxml`.

There is deliberately no `tia_download` tool - `download` always refuses over the pipe by
design (writing to real hardware needs the app's own on-screen confirmation dialog, which
no MCP/pipe caller can show), so exposing it would just forward to a command that always
says no.
