'use strict'

import * as vscode from 'vscode'

const { lstatSync, readdirSync } = require('fs')
const { join, relative } = require('path')
const untildify = require('untildify');

export function activate(context: vscode.ExtensionContext) {
    if (!vscode.workspace.workspaceFolders) {
        let disposable = vscode.commands.registerCommand(
            'simple-project-switcher.switch',
            () => {
                vscode.window.showErrorMessage(
                    'Project Switcher requires at least one folder to be open.'
                )
            }
        )
        context.subscriptions.push(disposable)

        return
    }

    let projectsFolder = normalizePath(
        config(
            'simple-project-switcher.directory',
            normalizePath(
                vscode.workspace.workspaceFolders[0].uri.path.concat('/../')
            )
        )
    )

    let currentProject = normalizePath(
        relative(
            projectsFolder,
            normalizePath(vscode.workspace.workspaceFolders[0].uri.path)
        )
    )

    // Store the current window globally.
    if (vscode.window.state.focused)
        updateMostRecentProject(context, currentProject)

    vscode.window.onDidChangeWindowState(function (event) {
        if (event.focused) updateMostRecentProject(context, currentProject)
    })

    let disposable = vscode.commands.registerCommand(
        'simple-project-switcher.switch',
        () => {
            let recentlyAccessedProjects = context.globalState.get(
                'simple-project-switcher.recent',
                []
            )

            if (
                !vscode.workspace.workspaceFolders &&
                !recentlyAccessedProjects
            ) {
                vscode.window.showErrorMessage(
                    'Project Switcher requires at least one folder to be open.'
                )
                return
            }

            let projects = getProjectsFromDirectory(projectsFolder)
            let projectsSortedByRecentlyAccessed = Array.from(
                new Set(recentlyAccessedProjects.concat(Object.keys(projects)))
            )

            const quickPick = vscode.window.createQuickPick()

            quickPick.items = projectsSortedByRecentlyAccessed.map(project => ({
                label: project,
                project: project,
            }))

            quickPick.onDidChangeSelection(selections => {
                let project = selections[0].label
                if (!project) return
                updateMostRecentProject(context, project)

                vscode.commands.executeCommand(
                    'vscode.openFolder',
                    vscode.Uri.file(projects[project]),
                    true
                )
            })
            quickPick.onDidHide(() => quickPick.dispose())
            quickPick.show()
        }
    )

    context.subscriptions.push(disposable)
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
    currentProject = normalizePath(currentProject)

    context.globalState.update(
        'simple-project-switcher.focused',
        currentProject
    )

    let recentlyAccessedProjects = context.globalState.get(
        'simple-project-switcher.recent',
        []
    )

    recentlyAccessedProjects.unshift(normalizePath(currentProject))

    context.globalState.update(
        'simple-project-switcher.recent',
        Array.from(new Set(recentlyAccessedProjects))
    )
}

function config(setting, fallback) {
    return vscode.workspace.getConfiguration().get(setting) || fallback
}

function normalizePath(path) {
    path = untildify(path)

    path = path.replace('/c:/', 'c:/').replace('/C:/', 'C:/')

    // Convert backslashes from windows paths to forward slashes, otherwise the shell will ignore them.
    return path.replace(/\\/g, '/')
}

export function deactivate() {
    //
}
