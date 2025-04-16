import { lazy } from 'react'
import { Navigate } from 'react-router-dom'

// project imports
import MainLayout from '@/layout/MainLayout'
import MinimalLayout from '@/layout/MinimalLayout'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import Loadable from '@/ui-component/loading/Loadable'

// Views
const Chatflows = Loadable(lazy(() => import('@/views/chatflows')))
const Agentflows = Loadable(lazy(() => import('@/views/agentflows')))
const Marketplaces = Loadable(lazy(() => import('@/views/marketplaces')))
const APIKey = Loadable(lazy(() => import('@/views/apikey')))
const Tools = Loadable(lazy(() => import('@/views/tools')))
const Assistants = Loadable(lazy(() => import('@/views/assistants')))
const Credentials = Loadable(lazy(() => import('@/views/credentials')))
const Variables = Loadable(lazy(() => import('@/views/variables')))
const Documents = Loadable(lazy(() => import('@/views/docstore')))
const DocumentStoreDetail = Loadable(lazy(() => import('@/views/docstore/DocumentStoreDetail')))
const ShowStoredChunks = Loadable(lazy(() => import('@/views/docstore/ShowStoredChunks')))
const LoaderConfigPreviewChunks = Loadable(lazy(() => import('@/views/docstore/LoaderConfigPreviewChunks')))
const Canvas = Loadable(lazy(() => import('@/views/canvas')))
const TemplateCanvas = Loadable(lazy(() => import('@/views/marketplaces/MarketplaceCanvas')))

// Path constants 
import { BASE_PATHS, WORKSPACE_PATHS, DOCUMENT_STORE_PATHS, API_PATHS, MARKETPLACE_PATHS, TOOLS_PATHS } from './path'

// ==============================|| MAIN ROUTING ||============================== //

// Root route: /
const MainRoutesRoot = {
    index: true,
    element: <Navigate to={WORKSPACE_PATHS.ROOT} replace />
}

// Workspace routes: /workspace
const WorkspaceRoutes = {
    path: WORKSPACE_PATHS.ROOT,
    element: <MainLayout />,
    children: [
        {
            index: true,
            element: <Chatflows />
        },
        {
            path: WORKSPACE_PATHS.CHILDREN.CHATFLOWS.ROOT,
            element: <Chatflows />
        },
        {
            path: WORKSPACE_PATHS.CHILDREN.AGENTFLOWS.ROOT,
            element: <Agentflows />
        },
        {
            path: WORKSPACE_PATHS.CHILDREN.VARIABLES,
            element: <Variables />
        },
        {
            path: WORKSPACE_PATHS.CHILDREN.ASSISTANTS,
            element: <Assistants />
        }
    ]
}

// Separate routes for Canvas views
const WorkspaceCanvasRoutes = {
    path: WORKSPACE_PATHS.ROOT,
    element: <MinimalLayout />,
    children: [
        {
            path: `${WORKSPACE_PATHS.CHILDREN.CHATFLOWS.ROOT}/${WORKSPACE_PATHS.CHILDREN.CHATFLOWS.CHILDREN.DETAIL}`,
            element: <Canvas />
        },
        {
            path: `${WORKSPACE_PATHS.CHILDREN.CHATFLOWS.ROOT}/${WORKSPACE_PATHS.CHILDREN.CHATFLOWS.CHILDREN.NEW}`,
            element: <Canvas />
        },
        {
            path: `${WORKSPACE_PATHS.CHILDREN.AGENTFLOWS.ROOT}/${WORKSPACE_PATHS.CHILDREN.AGENTFLOWS.CHILDREN.DETAIL}`,
            element: <Canvas />
        },
        {
            path: `${WORKSPACE_PATHS.CHILDREN.AGENTFLOWS.ROOT}/${WORKSPACE_PATHS.CHILDREN.AGENTFLOWS.CHILDREN.NEW}`,
            element: <Canvas />
        }
    ]
}

// Document store routes: /document-stores
const DocumentStoreRoutes = {
    path: DOCUMENT_STORE_PATHS.ROOT,
    element: <MainLayout />,
    children: [
        {
            index: true,
            element: <Documents />
        },
        {
            path: DOCUMENT_STORE_PATHS.CHILDREN.DETAIL,
            element: <DocumentStoreDetail />
        },
        {
            path: DOCUMENT_STORE_PATHS.CHILDREN.CHUNKS, //'/document-stores/chunks/:id/:id',  -> /:storeId/chunks/:chunkId
            element: <ShowStoredChunks />
        },
        {
            path: DOCUMENT_STORE_PATHS.CHILDREN.LOADER, //'/document-stores/:storeId/:nameOrLoaderId'-> /:storeId/loader/:loaderId
            element: <LoaderConfigPreviewChunks />
        }
    ]
}

// API routes: /api
const APIRoutes = {
    path: API_PATHS.ROOT,
    element: <MainLayout />,
    children: [
        {
            index: true,
            element: <Credentials />
        },
        {
            path: API_PATHS.CHILDREN.CREDENTIALS,
            element: <Credentials />
        },
        {
            path: API_PATHS.CHILDREN.APIKEYS,
            element: <APIKey />
        }
    ]
}

// Marketplace routes: /marketplaces
const MarketplaceRoutes = {
    path: MARKETPLACE_PATHS.ROOT,
    element: <MainLayout />,
    children: [
        {
            index: true,
            element: <Marketplaces />
        }
    ]
}

// Separate routes for MarketplaceCanvas without layout
const MarketplaceCanvasRoutes = {
    path: MARKETPLACE_PATHS.ROOT, //'marketplace', // 
    element: <MinimalLayout />,
    children: [
        {
            path: MARKETPLACE_PATHS.CHILDREN.DETAIL,
            element: <TemplateCanvas />
        }
    ]
}

// Tools routes: /tools
const ToolsRoutes = {
    path: TOOLS_PATHS.ROOT,
    element: <MainLayout />,
    children: [
        {
            index: true,
            element: <Tools />
        }
    ]
}

// Main routes: /
export const MainRoutes = {
    path: BASE_PATHS.ROOT,
    element: <ProtectedRoute />,
    children: [
        MainRoutesRoot,
        WorkspaceRoutes,
        WorkspaceCanvasRoutes,
        DocumentStoreRoutes,
        APIRoutes,
        MarketplaceRoutes,
        MarketplaceCanvasRoutes,
        ToolsRoutes,
    ]
}