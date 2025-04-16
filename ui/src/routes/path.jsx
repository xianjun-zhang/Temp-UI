// Route parameter names
export const PARAMS = {
    ID: ':id',
    STORE_ID: ':storeId',
    LOADER_ID: ':loaderId',
    FILE_ID: ':fileId',
    CHUNK_ID: ':chunkId',
    NEW: 'new'
}

// Base paths
export const BASE_PATHS = {
    // Main paths
    ROOT: '/',
    WORKSPACE: '/workspace',
    DOCUMENT_STORE: '/document-stores',
    TOOLS: '/tools',
    API: '/api',
    MARKETPLACE: '/marketplace',

    // Chatbot paths
    CHATBOT: '/chatbot',

    // Error paths
    ERROR: '/error',

    // Settings paths
    SETTINGS: '/settings',
}

// Workspace related paths
export const WORKSPACE_PATHS = {
    ROOT: BASE_PATHS.WORKSPACE,
    CHILDREN: {
        CHATFLOWS: {
            ROOT: 'chatflows',
            CHILDREN: {
                NEW: `${PARAMS.NEW}`,
                DETAIL: `${PARAMS.ID}`
            }
        },
        AGENTFLOWS: {
            ROOT: 'agentflows',
            CHILDREN: {
                NEW: `${PARAMS.NEW}`,
                DETAIL: `${PARAMS.ID}`
            }
        },
        VARIABLES: 'variables',
        ASSISTANTS: 'assistants'
    }
}

// Document store related paths
export const DOCUMENT_STORE_PATHS = {
    ROOT: BASE_PATHS.DOCUMENT_STORE,
    CHILDREN: {
        DETAIL: `${PARAMS.STORE_ID}`,
        LOADER: `${PARAMS.STORE_ID}/loader/${PARAMS.LOADER_ID}`,
        CHUNKS: `${PARAMS.STORE_ID}/chunks/${PARAMS.FILE_ID}`,
    }
}

// API related paths
export const API_PATHS = {
    ROOT: BASE_PATHS.API,
    CHILDREN: {
        CREDENTIALS: 'credentials',
        APIKEYS: 'apikeys'
    }
}
// TOOLS related paths
export const TOOLS_PATHS = {
    ROOT: BASE_PATHS.TOOLS
}

// Marketplace related paths
export const MARKETPLACE_PATHS = {
    ROOT: BASE_PATHS.MARKETPLACE,
    CHILDREN: {
        DETAIL: `${PARAMS.ID}`
    }
}

// Chatbot related paths
export const CHATBOT_PATHS = {
    ROOT: BASE_PATHS.CHATBOT,
    CHILDREN: {
        DETAIL: `/${PARAMS.ID}`
    }
}

// Auth related paths
export const AUTH_PATHS = {
    ROOT: BASE_PATHS.ROOT,
    CHILDREN: {
        SIGN_IN: 'signin',
        SIGN_UP: 'signup',
        PROFILE: 'profile'
    }
}

// Define error paths
export const ERROR_PATHS = {
    ROOT: BASE_PATHS.ERROR,
    CHILDREN: {
        MISSING_PARAM: 'missing-param',
        NOT_FOUND: 'not-found',
        INVALID_ID: 'invalid-id'
    }
}

// Add this simple utility function at the top of the file
const joinPaths = (...paths) => '/' + paths
    .map(path => path.toString().replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');

// Convert value to string
const ensureString = (value) => {
    if (value === null || value === undefined) return ''
    return String(value)
}

// Navigation path generators
export const navigationPaths = {
    // Workspace paths
    workspace: {
        root: () => BASE_PATHS.WORKSPACE,
        chatflows: {
            root: () => joinPaths(WORKSPACE_PATHS.ROOT, WORKSPACE_PATHS.CHILDREN.CHATFLOWS.ROOT),
            new: () => joinPaths(
                WORKSPACE_PATHS.ROOT,
                WORKSPACE_PATHS.CHILDREN.CHATFLOWS.ROOT,
                WORKSPACE_PATHS.CHILDREN.CHATFLOWS.CHILDREN.NEW
            ),
            detail: (id) => {
                const stringId = ensureString(id)
                if (!stringId) {
                    console.warn('Missing required parameter: chatflow id')
                    return joinPaths(ERROR_PATHS.ROOT, ERROR_PATHS.CHILDREN.MISSING_PARAM)
                }
                return joinPaths(
                    WORKSPACE_PATHS.ROOT,
                    WORKSPACE_PATHS.CHILDREN.CHATFLOWS.ROOT,
                    stringId
                )
            }
        },
        agentflows: {
            root: () => joinPaths(WORKSPACE_PATHS.ROOT, WORKSPACE_PATHS.CHILDREN.AGENTFLOWS.ROOT),
            new: () => joinPaths(
                WORKSPACE_PATHS.ROOT,
                WORKSPACE_PATHS.CHILDREN.AGENTFLOWS.ROOT,
                WORKSPACE_PATHS.CHILDREN.AGENTFLOWS.CHILDREN.NEW
            ),
            detail: (id) => {
                const stringId = ensureString(id)
                if (!stringId) {
                    console.warn('Missing required parameter: agentflow id')
                    return joinPaths(ERROR_PATHS.ROOT, ERROR_PATHS.CHILDREN.MISSING_PARAM)
                }
                return joinPaths(
                    WORKSPACE_PATHS.ROOT,
                    WORKSPACE_PATHS.CHILDREN.AGENTFLOWS.ROOT,
                    stringId
                )
            }
        },
        variables: () => joinPaths(WORKSPACE_PATHS.ROOT, WORKSPACE_PATHS.CHILDREN.VARIABLES),
        assistants: () => joinPaths(WORKSPACE_PATHS.ROOT, WORKSPACE_PATHS.CHILDREN.ASSISTANTS)
    },

    // Document store paths
    documentStore: {
        root: () => DOCUMENT_STORE_PATHS.ROOT,
        detail: (storeId) => {
            const stringStoreId = ensureString(storeId)
            if (!stringStoreId) {
                console.warn('Missing required parameter: store id')
                return joinPaths(ERROR_PATHS.ROOT, ERROR_PATHS.CHILDREN.MISSING_PARAM)
            }
            return joinPaths(
                DOCUMENT_STORE_PATHS.ROOT,
                stringStoreId
            )
        },
        loader: (storeId, loaderId) => {
            const stringStoreId = ensureString(storeId)
            const stringLoaderId = ensureString(loaderId)
            if (!stringStoreId || !stringLoaderId) {
                console.warn('Missing required parameters: store id or loader id')
                return joinPaths(ERROR_PATHS.ROOT, ERROR_PATHS.CHILDREN.MISSING_PARAM)
            }
            return joinPaths(
                DOCUMENT_STORE_PATHS.ROOT,
                stringStoreId,
                'loader',
                stringLoaderId
            )
        },
        chunks: (storeId, fileId) => {
            const stringStoreId = ensureString(storeId)
            const stringFileId = ensureString(fileId)
            if (!stringStoreId || !stringFileId) {
                console.warn('Missing required parameters: store id or chunk id')
                return joinPaths(ERROR_PATHS.ROOT, ERROR_PATHS.CHILDREN.MISSING_PARAM)
            }
            return joinPaths(
                DOCUMENT_STORE_PATHS.ROOT,
                stringStoreId,
                'chunks',
                stringFileId
            )
        }
    },

    // API paths
    api: {
        root: () => API_PATHS.ROOT,
        credentials: () => joinPaths(API_PATHS.ROOT, API_PATHS.CHILDREN.CREDENTIALS),
        apikeys: () => joinPaths(API_PATHS.ROOT, API_PATHS.CHILDREN.APIKEYS)
    },

    // Marketplace paths
    marketplace: {
        root: () => MARKETPLACE_PATHS.ROOT,
        detail: (id) => {
            const stringId = ensureString(id)
            if (!stringId) {
                console.warn('Missing required parameter: marketplace id')
                return joinPaths(ERROR_PATHS.ROOT, ERROR_PATHS.CHILDREN.MISSING_PARAM)
            }
            return joinPaths(
                MARKETPLACE_PATHS.ROOT,
                stringId
            )
        }
    },

    // Chatbot paths
    chatbot: {
        root: () => CHATBOT_PATHS.ROOT,
        detail: (id) => {
            const stringId = ensureString(id)
            if (!stringId) {
                console.warn('Missing required parameter: chatbot id')
                return joinPaths(ERROR_PATHS.ROOT, ERROR_PATHS.CHILDREN.MISSING_PARAM)
            }
            return joinPaths(
                CHATBOT_PATHS.ROOT,
                stringId
            )
        }
    },

    // Auth paths
    auth: {
        root: () => AUTH_PATHS.ROOT,
        signIn: () => joinPaths(AUTH_PATHS.ROOT, AUTH_PATHS.CHILDREN.SIGN_IN),
        signUp: () => joinPaths(AUTH_PATHS.ROOT, AUTH_PATHS.CHILDREN.SIGN_UP),
        profile: () => joinPaths(AUTH_PATHS.ROOT, AUTH_PATHS.CHILDREN.PROFILE)
    }
}