const os = require('os')
const assert = require('assert')
const vscode = require('vscode')
const {
  maybeShiftFontFamilyOnStartup,
  getFontFamilies,
  getCurrentFontFamily,
  allFontFamilies,
  __getFontFamiliesCache,
} = require('../src/font-families')
const {
  CODEFACE,
  LINUX,
  MAC_OS,
  WINDOWS,
} = require('../src/font-families/font-family-types')
const {
  setupTest,
  teardownTest,
  getConfig,
  setConfig,
  DEFAULT_FONT_FAMILY,
  DEFAULT_PLATFORM,
} = require('./test-utils')

suite('font-families.test.js', () => {
  setup(async () => {
    await setupTest()
  })

  teardown(async () => {
    await teardownTest()
  })

  test('should include the fallback font family', async () => {
    const editorFontFamily = getConfig('editor.fontFamily')
    assert.strictEqual(editorFontFamily, `${DEFAULT_FONT_FAMILY}, monospace`)
  })

  test(`should set the font family with out a fallback`, async () => {
    await setConfig('shifty.fontFamilies.fallbackFontFamily', null)
    await vscode.commands.executeCommand('shifty.shiftFontFamily')
    const editorFontFamily = getConfig('editor.fontFamily')
    assert.ok(!editorFontFamily.includes(', '))
  })

  test('should not shift the font family when VS Code starts up if "shifty.startup.shiftFontFamilyOnStartup" is disabled', async () => {
    await maybeShiftFontFamilyOnStartup()
    assert.strictEqual(getCurrentFontFamily(), DEFAULT_FONT_FAMILY)
  })

  test('should shift the font family when VS Code starts up if "shifty.startup.shiftFontFamilyOnStartup" is enabled', async () => {
    await setConfig('shifty.startup.shiftFontFamilyOnStartup', true)
    await maybeShiftFontFamilyOnStartup()
    assert.notStrictEqual(getCurrentFontFamily(), DEFAULT_FONT_FAMILY)
  })

  test('should register font family commands when VS Code starts up', async () => {
    const commands = await vscode.commands.getCommands()
    assert.ok(commands.includes('shifty.shiftFontFamily'))
    assert.ok(commands.includes('shifty.favoriteCurrentFontFamily'))
    assert.ok(commands.includes('shifty.ignoreCurrentFontFamily'))
  })

  test('should shift the font family when running the "shifty.shiftFontFamily" command', async () => {
    await vscode.commands.executeCommand('shifty.shiftFontFamily')
    assert.notStrictEqual(getCurrentFontFamily(), DEFAULT_FONT_FAMILY)
  })

  test('should favorite the current font family when running the "shifty.favoriteCurrentFontFamily" command', async () => {
    await vscode.commands.executeCommand('shifty.favoriteCurrentFontFamily')
    const config = vscode.workspace.getConfiguration('shifty.fontFamilies')
    assert.ok(config.favoriteFontFamilies.includes(DEFAULT_FONT_FAMILY))
    assert.strictEqual(
      vscode.window.showInformationMessage.firstCall.lastArg,
      `Added "${DEFAULT_FONT_FAMILY}" to favorites`,
    )
  })

  test('should ignore the current font family and shift the font family when running the "shifty.ignoreCurrentFontFamily" command', async () => {
    await vscode.commands.executeCommand('shifty.ignoreCurrentFontFamily')
    const config = vscode.workspace.getConfiguration('shifty.fontFamilies')
    assert.ok(config.ignoreFontFamilies.includes(DEFAULT_FONT_FAMILY))
    assert.notStrictEqual(getCurrentFontFamily(), DEFAULT_FONT_FAMILY)
  })

  test('should prime the font families cache after the "shifty.fontFamilies" config changes', async () => {
    const originalFontFamiliesCache = __getFontFamiliesCache()
    await setConfig('shifty.fontFamilies.ignoreCodefaceFontFamilies', true)
    assert.notDeepStrictEqual(
      __getFontFamiliesCache(),
      originalFontFamiliesCache,
    )
  })

  test('should return all font families when no font families are ignored', () => {
    const fontFamilies = getFontFamilies()
    assert.strictEqual(
      fontFamilies.length,
      allFontFamilies.filter(ff =>
        ff.supportedPlatforms.includes(DEFAULT_PLATFORM),
      ).length - 1,
    )
  })

  test('should return all font families except the current font family', () => {
    const fontFamilies = getFontFamilies()
    assert.ok(fontFamilies.every(ff => ff.id !== DEFAULT_FONT_FAMILY))
  })

  test('should return all font families except the ignored font families', async () => {
    const sfMono = 'SF Mono'
    await setConfig('shifty.fontFamilies.ignoreFontFamilies', [sfMono])
    const fontFamilies = getFontFamilies()
    assert.ok(fontFamilies.every(ff => ff.id !== sfMono))
  })

  test('should return no codeface font families when ignored', async () => {
    await setConfig('shifty.fontFamilies.ignoreCodefaceFontFamilies', true)
    const fontFamilies = getFontFamilies()
    assert.ok(fontFamilies.every(ff => ff.type !== CODEFACE))
  })

  test('should return font families that are supported on linux', async () => {
    os.type.returns(LINUX)

    // change any shifty.fontFamilies config to reprime the cache
    await setConfig('shifty.fontFamilies.includeFontFamilies', ['Dank Mono'])
    const fontFamilies = getFontFamilies()
    assert.ok(fontFamilies.every(ff => ff.supportedPlatforms.includes(LINUX)))
  })

  test('should return font families that are supported on mac os', async () => {
    os.type.returns(MAC_OS)

    // change any shifty.fontFamilies config to reprime the cache
    await setConfig('shifty.fontFamilies.includeFontFamilies', ['Dank Mono'])
    const fontFamilies = getFontFamilies()
    assert.ok(fontFamilies.every(ff => ff.supportedPlatforms.includes(MAC_OS)))
  })

  test('should return font families that are supported on windows', async () => {
    os.type.returns(WINDOWS)

    // change any shifty.fontFamilies config to reprime the cache
    await setConfig('shifty.fontFamilies.includeFontFamilies', ['Dank Mono'])
    const fontFamilies = getFontFamilies()
    assert.ok(fontFamilies.every(ff => ff.supportedPlatforms.includes(WINDOWS)))
  })

  test('should return no font families when dealing with an unsupported platform', async () => {
    os.type.returns('Unsupported platform')

    // change any shifty.fontFamilies config to reprime the cache
    await setConfig(
      'shifty.fontFamilies.fallbackFontFamily',
      'SF Mono, monospace',
    )
    const fontFamilies = getFontFamilies()
    assert.strictEqual(fontFamilies.length, 0)
  })

  test('should return user specified font families', async () => {
    const dankMono = 'Dank Mono'
    await setConfig('shifty.fontFamilies.includeFontFamilies', [dankMono])
    const fontFamilies = getFontFamilies()
    assert.ok(fontFamilies.find(ff => ff.id === dankMono))
  })

  test('should return favorite font familes when favorites are enabled', async () => {
    const favorites = ['Dank Mono', 'monofur', 'Operator Mono']
    await setConfig('shifty.fontFamilies.favoriteFontFamilies', favorites)
    await setConfig('shifty.favoritesEnabled', true)
    assert.deepStrictEqual(getFontFamilies(), favorites)
  })
})
