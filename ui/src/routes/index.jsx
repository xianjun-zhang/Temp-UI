import { useRoutes } from 'react-router-dom'

// routes
import { MainRoutes } from './MainRoutes'
// import { CanvasRoutes } from './CanvasRoutes'
import { ChatbotRoutes } from './ChatbotRoutes'
import { AuthRoutes } from './AuthRoutes'
import { NotFoundRoutes } from './NotFoundRoutes'
import config from '@/config'

// ==============================|| ROUTING RENDER ||============================== //

export default function ThemeRoutes() {
    return useRoutes([MainRoutes,  ChatbotRoutes, AuthRoutes, NotFoundRoutes], config.basename) 
}
