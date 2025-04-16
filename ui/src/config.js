const config = {
    // basename: only at build time to set, and Don't add '/' at end off BASENAME for breadcrumbs, also Don't put only '/' use blank('') instead,
    basename: '',
    defaultPath: '/workspace',
    fontFamily: `'Roboto', sans-serif`,
    borderRadius: 8,
    // IMPORTANT: This prefix is used for all server requests.
    // See more in packages/ui/vite.config.js.
    // Avoid using this prefix for client-side routes to prevent unintended server
    // requests. Even /api/v1abc will match.
    apiRequestPrefix: '/api/v1'
}

export default config
