import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import dotenv from 'dotenv'
import config from './src/config'

export default defineConfig(async ({ mode }) => {
    let proxy = undefined
    if (mode === 'development') {
        const serverEnv = dotenv.config({ processEnv: {}, path: '../server/.env' }).parsed
        const serverHost = serverEnv?.['HOST'] ?? 'localhost'
        const serverPort = parseInt(serverEnv?.['PORT'] ?? 3000)
        if (!Number.isNaN(serverPort) && serverPort > 0 && serverPort < 65535) {
            proxy = {
                [config.apiRequestPrefix + '/']: {
                    target: `http://${serverHost}:${serverPort}`,
                    changeOrigin: true,
                    // configure: (proxy, options) => {
                    //     proxy.on('proxyReq', (proxyReq, req, res) => {
                    //         console.log('Proxy matched \x1b[33m/api\x1b[0m :', req.method, '\x1b[33m' + req.url + '\x1b[0m')
                    //     })
                    // }
                    rewrite: (path) => path.replace(new RegExp(`^${config.apiRequestPrefix}\/`), `${config.apiRequestPrefix}/`)
                },
                '/socket.io': {
                    target: `http://${serverHost}:${serverPort}`,
                    changeOrigin: true
                }
            }
        }
    }
    dotenv.config()
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
            proxy,
            port: process.env.VITE_PORT ?? 8080,
            host: process.env.VITE_HOST,
            watch: {
                usePolling: true,
                interval: 5 * 1000, // If you find that the polling is too resource-intensive, you can adjust the interval (in milliseconds)
            }
        }
    }
})
