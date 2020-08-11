'use strict';
import * as vscode from 'vscode';
const { lstatSync, readdirSync } = require('fs')
const { join, relative } = require('path')

export function activate(context: vscode.ExtensionContext) {
    if (! vscode.workspace.workspaceFolders) return

    let projectsFolder = normalizePath(config('simple-project-switcher.directory', vscode.workspace.workspaceFolders[0].uri.path.concat('/../')))
    let currentProject = relative(projectsFolder, vscode.workspace.workspaceFolders[0].uri.path)

    // Store the current window globally.
    if (vscode.window.state.focused) updateMostRecentProject(context, currentProject)

    vscode.window.onDidChangeWindowState(event => {
        if (event.focused) updateMostRecentProject(context, currentProject)
    })

    let disposable = vscode.commands.registerCommand('simple-project-switcher.switch', () => {
        let recentlyAccessedProjects = context.globalState.get('simple-project-switcher.recent', [])

        if (! vscode.workspace.workspaceFolders && ! recentlyAccessedProjects) {
            vscode.window.showErrorMessage('Project Switcher requires at least one folder to be open.')
            return
        }

        let projects = getProjectsFromDirectory(projectsFolder)
        let projectsSortedByRecentlyAccessed = Array.from(new Set(recentlyAccessedProjects.concat(Object.keys(projects))))

        const quickPick = vscode.window.createQuickPick();

        quickPick.items = projectsSortedByRecentlyAccessed.map(project => ({ label: project, project: project }))

		quickPick.onDidChangeSelection(selections => {
            let project = selections[0].label

            if (! project) return

            updateMostRecentProject(context, project)

            vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(projects[project]), true);
		});
		quickPick.onDidHide(() => quickPick.dispose());
		quickPick.show();
    });

    context.subscriptions.push(disposable);
}

function getProjectsFromDirectory(projectsFolder) {
    let projects = {}

    readdirSync(projectsFolder)
        .map(name => join(projectsFolder, name))
        .filter(path => lstatSync(path).isDirectory())
        .forEach(path => {
            projects[relative(projectsFolder, path)] = path
        })

    return projects
}

function updateMostRecentProject(context, currentProject) {
    context.globalState.update('simple-project-switcher.focused', currentProject)
    let recentlyAccessedProjects = context.globalState.get('simple-project-switcher.recent', [])
    recentlyAccessedProjects.unshift(currentProject)
    context.globalState.update('simple-project-switcher.recent', Array.from(new Set(recentlyAccessedProjects)))
}

function config(setting, fallback) {
    return vscode.workspace.getConfiguration().get(setting) || fallback
}

function normalizePath(path) {
    return path
        .replace(/\\/g, '/') // Convert backslashes from windows paths to forward slashes, otherwise the shell will ignore them.
}

export function deactivate() {
    //
}
