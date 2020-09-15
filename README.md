# Simple Project Switcher

Simple Project Switcher aims to provide for projects the same "switching" experience that **Cmd+P** provides for files.

## Installation

This extension is private and not publicly available on VS Code's extension marketplace.

To install the extension, search for and select `Extensions: Install from VSIX...` from VS Code's command palette (**Cmd+Shift+P**).

## Basic Usage

- From within a project in VS Code, press **Cmd+;** (or **Ctrl+**; on Windows)
- A "Quick Switcher" dialogue will pop up with a list of all the folders in your
current project's parent directory
- Search for a project, and press **Enter**

## Switching back and forth between two projects

- While holding **Cmd**, press the `;` key twice to switch the most recently accessed project
- Repeat the above sequence to switch back

## Configuring a custom directory

By default, this extension uses the parent directory of the current project for the project list.

You can customize this behavior by setting an explicit projects directory in your `settings.json` file:

```json
{
    "simple-project-switcher.directory": "/Users/calebporzio/Sites",
}
```
