import {
  checkSquirrel,
  checkUpdate,
  ElectronHost,
  getIconExt,
  isDev,
  onChildWindowOpenUrl,
  showAndFocus,
} from '@peiyanlu/electron-ipc/backend'
import { app, BrowserWindow, dialog, globalShortcut, Menu } from 'electron'
import { join } from 'path'


const file = join(__dirname, '..', `renderer/${ MAIN_WINDOW_VITE_NAME }/index.html`)
const frontendURL = MAIN_WINDOW_VITE_DEV_SERVER_URL ?? file


const getIcon = (root: string, tray?: boolean) => join(root, 'icons', `icon.${ getIconExt(tray) }`)

const appIcon = getIcon(__dirname)
const trayIcon = getIcon(isDev ? __dirname : process.resourcesPath, true)

const guidDev = '60a9adb4-5835-4e72-9b46-b5f14c6cf632'
const guidProd = 'e4b4a36b-3a27-4ffa-96ad-b9f9df98dfc6'

if (checkSquirrel()) {
  ElectronHost.shutdown()
}

ElectronHost.startup({
  ipcHandlers: [],
})

ElectronHost.openMainWindow({
    webPreferences: {
      preload: require.resolve('./preload.js'),
      sandbox: true,
    },
    width: 1200,
    height: 750,
    icon: appIcon,
    frontendURL,
    hideAppMenu: true,
    singleInstance: true,
    devTools: true,
    backgroundColor: '#141218',
    beforeReady: () => {
      app.commandLine.appendSwitch('log-level', '3')
      app.commandLine.appendSwitch('enable-features', 'GlobalShortcutsPortal')
      
      onChildWindowOpenUrl()
    },
    tray: {
      icon: trayIcon,
      menu: Menu.buildFromTemplate([
        {
          label: '打开',
          click: () => {
            showAndFocus(ElectronHost.mainWindow)
          },
        },
        {
          label: '退出',
          click: () => {
            ElectronHost.shutdown()
          },
        },
      ]),
      title: `${ APP_NAME } ${ APP_VERSION }`,
      guid: isDev ? guidDev : guidProd,
    },
  })
  .then(async (window) => {
    if (!window) return
    
    if (isDev) {
      globalShortcut.register('CmdOrCtrl+Shift+I', () => {
        BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools()
      })
    }
    
  })


if (!isDev) {
  checkUpdate({
    repo: 'xxx/xxx',
    onNotifyUser: async ({ done }) => {
      const { response } = await dialog.showMessageBox({
        icon: trayIcon,
        title: APP_NAME,
        message: '新版本已准备好，确定重启并安装？',
        detail: '关闭后，更新将在下次启动时应用',
      })
      if (0 === response) {
        done()
      }
    },
  })
}
