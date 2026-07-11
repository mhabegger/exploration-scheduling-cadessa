import { HeadContent, Outlet, Scripts, createRootRoute, useLocation } from '@tanstack/react-router'
import { AppShell } from '@/components/app-shell'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Cadessa — Every track, right on cue',
      },
      {
        name: 'description',
        content: 'Autonomous, explainable music programming for streaming playlists and linear radio.',
      },
      {
        name: 'theme-color',
        content: '#090a0f',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        href: '/logo.svg',
        type: 'image/svg+xml',
      },
    ],
  }),
  component: RootLayout,
  shellComponent: RootDocument,
})

function RootLayout() {
  const location = useLocation()
  if (location.pathname === '/introduction') return <Outlet />
  return <AppShell><Outlet /></AppShell>
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="dark">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
