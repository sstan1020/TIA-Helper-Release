#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { sendCommand } from "./pipeClient.js";

// Every tool here is a thin wrapper around TiaWpf/PipeServer.cs's own command table -
// see release-repo/docs/NAMED_PIPE.md for the authoritative protocol reference. This
// server does not reimplement any TIA logic; it only forwards to the already-running
// TiaHelper.exe over its "tia_helper" named pipe, exactly like tia.ps1 does.

const server = new Server(
  { name: "tiahelper-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

const tools = [
  {
    name: "tia_list",
    description: "List running TIA Portal instances and their project paths.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "tia_attach",
    description:
      "Connect to a specific TIA Portal instance by keyword (matched against its project path) or index from tia_list. Requires an explicit keyword from the user - never guess which project to attach to.",
    inputSchema: {
      type: "object",
      properties: { keyword: { type: "string", description: "Keyword matching part of the project path, or a numeric index from tia_list" } },
      required: ["keyword"],
    },
  },
  {
    name: "tia_autoattach",
    description: "Auto-connect, but only if exactly one TIA Portal instance has a project open.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "tia_status",
    description: "Get the currently connected project, PLC name, and current SCL file.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "tia_detach",
    description: "Explicitly release the connection (TIA Portal keeps running).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "tia_exportlist",
    description: "List every block/UDT name that tia_export can target, indexed.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "tia_import",
    description: "Import an SCL file, generating or overwriting the matching block. Overwrites any existing block with the same name - export or show a diff first unless the user has said to just overwrite it.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "Full path to the .scl file to import" } },
      required: ["path"],
    },
  },
  {
    name: "tia_export",
    description: "Export a block/UDT's source to an SCL/DB/UDT file (whichever extension matches its type).",
    inputSchema: {
      type: "object",
      properties: {
        blockName: { type: "string", description: "Qualified block/UDT name, from tia_exportlist" },
        destinationPath: { type: "string", description: "Full destination file path" },
      },
      required: ["blockName", "destinationPath"],
    },
  },
  {
    name: "tia_exportxml",
    description:
      "Export ANY block as lossless SimaticML XML via PlcBlock.Export() - including LAD/FBD/GRAPH/CFC/SFC and know-how-protected blocks, which tia_export can never handle (GenerateSource only supports SCL/STL). NOT human-readable source text - a complete, lossless, re-importable XML capture of the block instead.",
    inputSchema: {
      type: "object",
      properties: {
        blockName: { type: "string", description: "Qualified block name, from tia_exportlist" },
        destinationPath: { type: "string", description: "Full destination .xml file path" },
      },
      required: ["blockName", "destinationPath"],
    },
  },
  {
    name: "tia_exportxmlall",
    description:
      "Bulk version of tia_exportxml - exports every block that tia_export/GenerateSource can't handle (LAD/FBD/GRAPH/etc) as SimaticML XML in one pass, mirroring the same folder structure tia_export uses. Skips anything already exportable as SCL/STL.",
    inputSchema: {
      type: "object",
      properties: { destinationRootDir: { type: "string", description: "Destination root folder" } },
      required: ["destinationRootDir"],
    },
  },
  {
    name: "tia_compile",
    description: "Compile the PLC software and return an error/warning summary.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "tia_downloadpreview",
    description: "Read-only preview of what a download would target (device/PLC/online state) - does not touch hardware.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "tia_downloadinterfaces",
    description: "List available PG/PC interfaces (mode/PC interface/target), indexed. Follow up with tia_selectdownloadinterface soon after.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "tia_selectdownloadinterface",
    description: "Save which listed interface Download should use, by index from tia_downloadinterfaces.",
    inputSchema: {
      type: "object",
      properties: { index: { type: "number", description: "Index from tia_downloadinterfaces" } },
      required: ["index"],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const quote = (p) => (p && p.includes(" ") ? `"${p}"` : p);

  let command;
  switch (name) {
    case "tia_list": command = "list"; break;
    case "tia_attach": command = `attach ${args.keyword}`; break;
    case "tia_autoattach": command = "autoattach"; break;
    case "tia_status": command = "status"; break;
    case "tia_detach": command = "detach"; break;
    case "tia_exportlist": command = "exportlist"; break;
    case "tia_import": command = `import ${quote(args.path)}`; break;
    case "tia_export": command = `export ${args.blockName} ${quote(args.destinationPath)}`; break;
    case "tia_exportxml": command = `exportxml ${args.blockName} ${quote(args.destinationPath)}`; break;
    case "tia_exportxmlall": command = `exportxmlall ${quote(args.destinationRootDir)}`; break;
    case "tia_compile": command = "compile"; break;
    case "tia_downloadpreview": command = "downloadpreview"; break;
    case "tia_downloadinterfaces": command = "downloadinterfaces"; break;
    case "tia_selectdownloadinterface": command = `selectdownloadinterface ${args.index}`; break;
    // Deliberately no "tia_download" tool - TiaWpf/PipeServer.cs always refuses this
    // command by design (writing to real hardware needs the app's own on-screen
    // confirmation dialog, which no pipe/MCP caller can show). Exposing it here would
    // just forward to a command that always says no - not useful, and risks implying
    // this is a real capability worth trying.
    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
  }

  try {
    const result = await sendCommand(command);
    return { content: [{ type: "text", text: result }] };
  } catch (err) {
    return { content: [{ type: "text", text: err.message }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
