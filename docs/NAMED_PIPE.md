# TIA Helper — Named Pipe Protocol (for AI assistants)

This is a reference for an AI coding assistant (Claude, GPT, or any tool that can run a
shell command) that wants to drive TIA Helper programmatically, instead of a human
clicking the toolbar. Both paths — a human's click, or a message through this pipe — call
the exact same underlying logic in the running app, so anything possible by clicking is
possible here too, except downloading to real hardware (see "Safety rules" below).

## How it works

- Pipe name: `tia_helper`
- Protocol: connect → write one line (UTF-8, no newline needed) → read one line back →
  disconnect. One request per connection — there is no persistent session.
- TIA Helper must already be running on the same machine for the pipe to exist.

### Minimal client (PowerShell)

```powershell
param([string]$Command)
$pipe = New-Object System.IO.Pipes.NamedPipeClientStream(".", "tia_helper", [System.IO.Pipes.PipeDirection]::InOut)
$pipe.Connect(10000)
$writer = New-Object System.IO.StreamWriter($pipe)
$writer.AutoFlush = $true
$reader = New-Object System.IO.StreamReader($pipe)
$writer.WriteLine($Command)
Write-Output $reader.ReadLine()
$pipe.Dispose()
```

Save as `tia.ps1`, then call it like:

```powershell
powershell -File tia.ps1 -Command "status"
```

Any language with named-pipe support works the same way (Python's `pywin32`, Node's
`net` module against `\\.\pipe\tia_helper`, etc.) — the protocol itself is just
plain-text request/response over a Windows named pipe.

## Commands

| Command | What it does | Needs a license? |
|---|---|---|
| `list` | List running TIA Portal instances and their project paths | No |
| `attach <keyword or index>` | Connect to the instance whose project path contains `keyword` (or by index from `list`) — explicit rejection if nothing matches, never guesses | No |
| `autoattach` | Connect automatically, but only if exactly one instance has a project open | No |
| `status` | Currently connected project, PLC name, current SCL file | No |
| `detach` | Explicitly release the connection (TIA Portal keeps running) | No |
| `exportlist` | List every block/UDT name `export` can target, indexed | No |
| `downloadpreview` | Read-only: what a download would target (device/PLC/online state) | No |
| `downloadinterfaces` | List available PG/PC interfaces (mode/PC interface/target), indexed | No |
| `import <path>` | Import an SCL file, generating/overwriting the block | **Yes** |
| `export <blockName> <destination path>` | Export a block/UDT's source to an SCL file | **Yes** |
| `compile` | Compile the PLC software, return an error/warning summary | **Yes** |
| `selectdownloadinterface <index>` | Save which listed interface Download should use (index from `downloadinterfaces`) | **Yes** |
| `download` | **Always refuses** — see Safety rules below | — |

### Example session: write code, import it, compile, fix errors

```powershell
powershell -File tia.ps1 -Command "list"
# 0: D:\path\to\project.ap20

powershell -File tia.ps1 -Command "attach project"
# Connected: D:\path\to\project.ap20 | PLC: PLC_1

# (write/edit an .scl file with your own tools)

powershell -File tia.ps1 -Command "import C:\path\to\MyBlock.scl"
# Import succeeded: MyBlock

powershell -File tia.ps1 -Command "compile"
# Compile finished: 0 errors 0 warnings
```

Every command connects, does its one job, and disconnects again on its own — there is no
need to call `attach` before `import`/`compile`/`export`; they auto-connect if exactly
one TIA Portal instance has a project open. `attach`/`autoattach` are mainly useful to
**confirm** which project you'd be working against before doing something destructive
(like `import`, which overwrites a block with the same name).

### `downloadinterfaces` → `selectdownloadinterface`

These two are meant to be called back-to-back in the same short exchange:

```powershell
powershell -File tia.ps1 -Command "downloadinterfaces"
# 0: PN/IE > PLCSIM > 1 X1 ;; 1: PN/IE > PLCSIM > 1 X2 ...

powershell -File tia.ps1 -Command "selectdownloadinterface 0"
# Download target saved: PN/IE > PLCSIM > 1 X1
```

`downloadinterfaces` deliberately stays connected afterward (the only command that does)
so the interface objects it lists are still valid when `selectdownloadinterface` reads
them a moment later. Follow up with `selectdownloadinterface` or `detach` reasonably soon
after calling `downloadinterfaces` — don't leave a long gap between the two.

## Safety rules — read this before scripting anything

1. **`attach` requires an explicit, human-provided keyword.** Never guess a project name
   or hardcode one — always ask the user which project they mean, or use `list` and show
   them the choices, before attaching to anything.
2. **`import` overwrites any existing block with the same name.** Export the current
   version first (or show the user a diff) before importing into a real project, unless
   they've explicitly said to just overwrite it.
3. **`download` always refuses over this pipe, by design — this cannot be changed or
   worked around.** Writing to real PLC hardware is a decision only a human clicking the
   app's own Run button can make, with the on-screen confirmation dialog that implies.
   At most, tell the user what `downloadinterfaces`/`downloadpreview` show so they know
   what clicking Download themselves would do.
4. A block name/path containing spaces should be passed as-is — the destination path in
   `export <blockName> <destination path>` may itself contain spaces; everything after
   the block name is treated as the path.

## Typical AI workflow

1. `list` → confirm with the user which instance, if more than one → `attach <keyword>`
   to verify it resolves to the right project.
2. Write or edit the SCL file with your own tools (to modify an existing block: `export`
   it first to see the current code, edit, then `import`).
3. `import <file>` → `compile` → keep fixing and re-importing until 0 errors.
4. Report the result back to the user. Downloading is their call, made by clicking the
   app's own Run button — at most, tell them what `downloadinterfaces` shows.
