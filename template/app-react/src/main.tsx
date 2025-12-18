import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router'

import './index.css'
import { router } from './router'
import { store } from './store'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      locale={ zhCN }
      theme={ {
        algorithm: [ theme.darkAlgorithm ],
      } }
    >
      <Provider store={ store }>
        <Suspense fallback={ <div>Loading..</div> }>
          <RouterProvider router={ router } />
        </Suspense>
      </Provider>
    </ConfigProvider>
  </StrictMode>,
)
