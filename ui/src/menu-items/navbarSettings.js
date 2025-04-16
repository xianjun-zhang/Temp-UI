import { 
    IconBuildingStore, 
    IconFiles, 
    IconTool,
    IconLayoutDashboard,
    IconApi
} from '@tabler/icons-react'

import { WORKSPACE_PATHS, DOCUMENT_STORE_PATHS, TOOLS_PATHS, API_PATHS, MARKETPLACE_PATHS } from '@/routes/path'

export const navbarItems = [
    {
        id: 'workspace',
        title: 'Workspace',
        icon: IconLayoutDashboard,
        path: WORKSPACE_PATHS.ROOT
    },
    {
        id: 'document-stores',
        title: 'Document Stores',
        icon: IconFiles,
        path: DOCUMENT_STORE_PATHS.ROOT
    },
    {
        id: 'tools',
        title: 'Tools',
        icon: IconTool,
        path: TOOLS_PATHS.ROOT
    },
    {
        id: 'api',
        title: 'API',
        icon: IconApi,
        path: API_PATHS.ROOT
    },
    {
        id: 'marketplace',
        title: 'Marketplace',
        icon: IconBuildingStore,
        path: MARKETPLACE_PATHS.ROOT
    }
]