import { lazy } from 'react'
import Loadable from '@/ui-component/loading/Loadable'

const NotFound = Loadable(lazy(() => import('@/views/errorpage/error404')))

export const NotFoundRoutes = {
    path: '*',
    element: <NotFound />   
}
