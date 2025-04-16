import { lazy } from 'react'

// project imports
import Loadable from '@/ui-component/loading/Loadable'
import MinimalLayout from '@/layout/MinimalLayout'

// canvas routing
const ChatbotFull = Loadable(lazy(() => import('@/views/chatbot')))

// Path constants 
import { BASE_PATHS, CHATBOT_PATHS, navigationPaths } from './path'

// ==============================|| CANVAS ROUTING ||============================== //

export const ChatbotRoutes = {
    path: BASE_PATHS.ROOT,
    element: <MinimalLayout />,
    children: [
        {
            path: `${CHATBOT_PATHS.ROOT}${CHATBOT_PATHS.CHILDREN.DETAIL}`, //'/chatbot/:id',
            element: <ChatbotFull />
        }
    ]
}

