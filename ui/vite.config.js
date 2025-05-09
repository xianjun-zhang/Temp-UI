import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import dotenv from 'dotenv'
import config from './src/config'

/**
 * Load environment variables from the specified file
 * @param {string} path - Path to the env file
 * @returns {Object} Parsed environment variables or empty object
 */
function loadEnvFile(path) {
    try {
        return dotenv.config({ processEnv: {}, path }).parsed || {}
    } catch (error) {
        console.error(`Error loading env file from ${path}:`, error.message)
        return {}
    }
}

export default defineConfig(async ({ mode }) => {
    // Load UI project environment variables
    dotenv.config()
    
    const developmentConfig = mode === 'development' ? getDevelopmentConfig() : {}
    
    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src')
            }
        },
        root: resolve(__dirname),
        build: {
            outDir: './build'
        },
        server: {
            open: true,
            ...developmentConfig,
            port: process.env.VITE_PORT ?? 8080,
            host: process.env.VITE_HOST,
            watch: {
                usePolling: true,
                interval: 5 * 1000
            }
        }
    }
})

/**
 * Get development-specific configuration
 * @returns {Object} Development configuration including proxy
 */
function getDevelopmentConfig() {
    const serverUrl = getServerUrl()
    
    if (!serverUrl) {
        console.warn('No server URL configured. API requests will not be proxied.')
        return {}
    }
    
    console.log(`Development mode: Proxying API requests to ${serverUrl}`)
    
    return {
        proxy: {
            [config.apiRequestPrefix + '/']: {
                target: serverUrl,
                changeOrigin: true,
                rewrite: (path) => path.replace(new RegExp(`^${config.apiRequestPrefix}\/`), `${config.apiRequestPrefix}/`)
            },
            '/socket.io': {
                target: serverUrl,
                changeOrigin: true
            }
        }
    }
}

/**
 * Determine the server URL from environment variables
 * @returns {string|null} The server URL or null if not configured
 */
function getServerUrl() {
    // First priority: Explicitly set DEV_SERVER_URL
    if (process.env.DEV_SERVER_URL) {
        return process.env.DEV_SERVER_URL.replace(/\/$/, '')
    }
    
    // Second priority: Server environment variables
    const serverEnv = loadEnvFile('../server/.env')
    if (Object.keys(serverEnv).length > 0) {
        const serverHost = serverEnv.HOST ?? 'localhost'
        const serverPort = parseInt(serverEnv.PORT ?? 3000)
        
        if (!isNaN(serverPort) && serverPort > 0 && serverPort < 65536) {
            return `http://${serverHost}:${serverPort}`
        }
    }
    
    // Third priority: Default localhost server
    return 'http://localhost:3000'
}
