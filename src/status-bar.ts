import * as vscode from 'vscode'
import commandMap from './command-map'
import {getColorTheme, hasFavoritedColorTheme} from './color-themes'
import {getFontFamily, hasFavoritedFontFamily} from './font-families'

const STATUS_BAR_DISPLAY_TEXT = '$(color-mode) shifty'
const STATUS_BAR_PRIORITY = 0

let statusBar: vscode.StatusBarItem

export function activateStatusBar(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(commandMap.SHOW_STATUS, () => {
      const fontFamily = getFontFamily()
      const colorTheme = getColorTheme()

      const actionTextMap = {
        UNFAVORITE: 'Unfavorite',
        FAVORITE: 'Favorite',
        IGNORE: 'Ignore',
        SHIFT: 'Shift',
      }

      vscode.window
        .showInformationMessage(
          `Using "${fontFamily}" font family`,
          hasFavoritedFontFamily(fontFamily)
            ? actionTextMap.UNFAVORITE
            : actionTextMap.FAVORITE,
          actionTextMap.IGNORE,
          actionTextMap.SHIFT,
        )
        .then(action => {
          if (action) {
            vscode.commands.executeCommand(
              // eslint-disable-next-line no-use-extend-native/no-use-extend-native
              {
                [actionTextMap.FAVORITE]:
                  commandMap.TOGGLE_FAVORITE_FONT_FAMILY,
                [actionTextMap.UNFAVORITE]:
                  commandMap.TOGGLE_FAVORITE_FONT_FAMILY,
                [actionTextMap.IGNORE]: commandMap.IGNORE_FONT_FAMILY,
                [actionTextMap.SHIFT]: commandMap.SHIFT_FONT_FAMILY,
              }[action],
            )
          }
        })

      vscode.window
        .showInformationMessage(
          `Using "${colorTheme}" color theme`,
          hasFavoritedColorTheme(colorTheme)
            ? actionTextMap.UNFAVORITE
            : actionTextMap.FAVORITE,
          actionTextMap.IGNORE,
          actionTextMap.SHIFT,
        )
        .then(action => {
          if (action) {
            vscode.commands.executeCommand(
              // eslint-disable-next-line no-use-extend-native/no-use-extend-native
              {
                [actionTextMap.FAVORITE]:
                  commandMap.TOGGLE_FAVORITE_COLOR_THEME,
                [actionTextMap.UNFAVORITE]:
                  commandMap.TOGGLE_FAVORITE_COLOR_THEME,
                [actionTextMap.IGNORE]: commandMap.IGNORE_COLOR_THEME,
                [actionTextMap.SHIFT]: commandMap.SHIFT_COLOR_THEME,
              }[action],
            )
          }
        })
    }),
  )

  statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    STATUS_BAR_PRIORITY,
  )

  statusBar.command = commandMap.SHOW_STATUS
  statusBar.text = STATUS_BAR_DISPLAY_TEXT
  context.subscriptions.push(statusBar)

  statusBar.show()
}

export function updateStatusBarText(text: string): void {
  if (!statusBar) return
  statusBar.text = `${STATUS_BAR_DISPLAY_TEXT}: ${text}`
}
