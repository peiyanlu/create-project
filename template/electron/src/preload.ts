import { contextBridge, ipcRenderer } from 'electron'
import { frontendApiKey, getFrontendApi } from '@peiyanlu/electron-ipc/preload'


contextBridge.exposeInMainWorld(frontendApiKey, getFrontendApi(ipcRenderer))

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }
  
  for (const dependency of [ 'chrome', 'node', 'electron' ]) {
    replaceText(`${ dependency }-version`, process.versions[dependency])
  }
})
