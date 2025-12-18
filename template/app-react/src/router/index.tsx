import { lazy } from 'react'
import { createBrowserRouter } from 'react-router'
import { FullscreenLayout, MainLayout } from '../App.tsx'


export const router = createBrowserRouter([
  {
    path: '/',
    children: [
      {
        Component: FullscreenLayout,
        children: [
          {
            path: 'demo',
            Component: lazy(() => import('../views/demo/Demo.tsx')),
            handle: {
              isFullScreen: true,
            },
          },
        ],
      },
      {
        Component: MainLayout,
        children: [
          {
            path: '/',
            Component: lazy(() => import('../views/About.tsx')),
          },
        ],
      },
    ],
  },
])
