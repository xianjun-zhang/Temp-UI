// assets
import {
    IconUsersGroup,
    IconHierarchy,
    IconBuildingStore,
    IconKey,
    IconTool,
    IconLock,
    IconRobot,
    IconVariable,
    IconFiles,
    IconUsers
} from '@tabler/icons-react'

import { navigationPaths } from '@/routes/path'

const workspaceSidebar = {
    id: 'workspacesiderbar',
    title: 'Workspace',
    type: 'group',
    path: navigationPaths.workspace.root(),
    defaultOpenMenu: 'chatflows',
    children: [
        {
            id: 'chatflows',
            title: 'Chatflows',
            type: 'item',
            path: navigationPaths.workspace.chatflows.root(),
            icon: IconHierarchy,
            breadcrumbs: true
        },
        {
            id: 'agentflows',
            title: 'Multi-Agents',
            type: 'item',
            path: navigationPaths.workspace.agentflows.root(),
            icon: IconUsers,
            breadcrumbs: true
        },
        {
            id: 'variables',
            title: 'Variables',
            type: 'item',
            path: navigationPaths.workspace.variables(),
            icon: IconVariable,
            breadcrumbs: true
        },
        {
            id: 'assistants',
            title: 'Assistants',
            type: 'item',
            path: navigationPaths.workspace.assistants(),
            icon: IconRobot,
            breadcrumbs: true
        }
    ]
}


const apiSidebar = {
    id: 'apisiderbar',
    title: 'API',
    type: 'group',
    path: navigationPaths.api.root(),
    defaultOpenMenu: 'credentials',
    children: [
        {
            id: 'credentials',
            title: 'Credentials',
            type: 'item',
            path: navigationPaths.api.credentials(),
            icon: IconLock,
            breadcrumbs: true
        },
        {
            id: 'apikey',
            title: 'API Keys',
            type: 'item',
            path: navigationPaths.api.apikeys(),
            icon: IconKey,
            breadcrumbs: true
        }
    ]
}

export const siderbarMenuConfig = {
    // 'default': dashboard_deprecated,
    'workspace': workspaceSidebar,
    'api': apiSidebar
}