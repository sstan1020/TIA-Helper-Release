# TIA Helper — User Guide

A small floating toolbar that sits on top of your other windows and talks to Siemens
TIA Portal. Every button does one thing; right-click most of them for more options.

## The toolbar

![Expanded toolbar](images/toolbar-expanded.png)

Top to bottom, the buttons are:

1. **T badge** — drag to move the toolbar, click to collapse/expand it, right-click for
   the license/settings menu.
2. **Usage gauge** (∞ / progress ring) — click to see your license tier and remaining
   usage quota.
3. **Export / Import** (shared slot — shows one or the other depending on which you used
   last) — **left-click runs it immediately** with your last saved selection;
   **right-click** opens the picker to choose what to export/import.
4. **Auto mode** (eye icon) — left-click toggles Auto Import/Export on and off;
   right-click opens the mode picker.
5. **Run** (checkmark) — left-click compiles (and optionally downloads); right-click for
   compile/download settings and the PG/PC interface picker.

Click the T badge once (without dragging) to collapse the toolbar down to just the badge:

![Collapsed toolbar](images/toolbar-collapsed.png)

## Right-click the T badge for licensing and settings

![Badge context menu](images/badge-context-menu.png)

- **License code...** — shows your hardware code. Send this to whoever issues your
  license.
- **Import license...** — paste in the license file you were sent.
- **License status...** — opens the usage popup (see below).
- **Run at Windows startup** — launch TIA Helper automatically when you log in.

## Export — send PLC blocks out to files

Right-click the Export button to pick which blocks/UDTs to export and where:

![Export popup](images/export-popup.png)

- Check the blocks/UDTs you want in the tree (checking a folder checks everything under
  it).
- **Change...** picks the destination folder. TIA Helper automatically creates a
  subfolder matching your TIA project's name, so exports from different projects never
  mix.
- The folder icons (top row) are **Select all / Clear / Expand all / Collapse all**.
  The 🔄 checkbox syncs your Export selection straight into Import's own selection.
- Re-exporting only touches blocks that actually changed in TIA Portal since the last
  export (compared by TIA's own modified-date) — unchanged blocks are skipped, so a
  re-export of a large project is fast.
- Click the export icon at the bottom to run it right now.

## Import — bring SCL files into TIA Portal

Right-click the Import button (or click the Import segment inside any of these popups)
for the same kind of picker, pointed at a local folder instead of your TIA project:

![Import popup](images/import-popup.png)

- Checking a file here queues it for import.
- Left-clicking the toolbar's Import button re-imports whichever file was last active —
  handy after editing it in your own editor.
- **Auto mode** (see below) can watch every checked file and re-import automatically the
  moment you save it.

## Custom — a second, independent import folder

Reached via the small toolbox icon inside Export/Import's own popup. Custom works exactly
like Import, but remembers its own separate folder — useful for one-off imports that
shouldn't touch your regular Import destination.

![Custom popup](images/custom-popup.png)

## Auto mode — hands-free Import/Export

Right-click the eye icon for the mode picker:

![Auto mode popup](images/auto-mode-popup.png)

- **Off** — nothing runs automatically.
- **Auto Import only** — watches every file checked in Import's/Custom's tree; the
  moment one changes on disk, it's re-imported into TIA Portal automatically.
- **Auto Export only** — watches your TIA project file itself; the moment you save in
  TIA Portal, your saved Export selection is re-exported automatically.
- **Import + Export** — both at once.

Left-clicking the eye icon is a quick on/off switch that remembers whichever mode you
last picked.

## Run — Compile and Download

Right-click the checkmark button for compile/download options:

![Run button menu](images/run-button-menu.png)

- **Compile only / Download only / Compile then Download** — what left-clicking Run
  actually does.
- **Choose download interface...** — pick which PG/PC interface to use, or let TIA
  Helper auto-search for one that works.
- **Don't ask before every download** — skips the confirmation dialog. Downloading
  always writes to real hardware, so leave this on unless you're sure.

## License and usage

Click the usage gauge (or **License status...** from the badge menu) to see your current
tier and how much of your usage quota is left:

![License and usage popup](images/license-usage-popup.png)

## Working with an AI assistant

TIA Helper also exposes every one of these actions over a local named pipe, so an AI
coding assistant (Claude, GPT, or anything that can run a small script) can drive it the
same way you do by clicking — list running TIA Portal instances, attach to the right
project, import code it just wrote, compile, and read back the result. Ask your AI
assistant to check whether TIA Helper is running if you want to try this.

**Downloading to hardware is always a manual step** — an AI assistant can tell you what a
download would target, but it can never trigger one itself. That confirmation always
happens in this app's own window.
