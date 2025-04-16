import { useSelector } from 'react-redux'

import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline, StyledEngineProvider } from '@mui/material'

// routing
import Routes from '@/routes'

// defaultTheme
import themes from '@/themes'

// project imports
import NavigationScroll from '@/layout/NavigationScroll'

// Import ClerkProvider for authentication
import { ClerkProvider } from '@clerk/clerk-react'
// Clerk themes, more details: https://clerk.com/docs/customization/themes
import { dark as clerkDarkTheme, default as clerkDefaultTheme } from '@clerk/themes'

// Import clerk publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
    throw new Error('Missing Publishable Key')
}

// Import the FeedbackButton component
import FeedbackButton from '@/ui-component/feedback/FeedbackButton'

// ==============================|| APP ||============================== //

const App = () => {
    const customization = useSelector((state) => state.customization)

    return (
        <ClerkProvider 
            afterSignOutUrl='/'
            publishableKey={PUBLISHABLE_KEY}
            appearance={{
                baseTheme: customization.isDarkMode ? clerkDarkTheme : clerkDefaultTheme
            }}
            telemetry={false}
        >
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={themes(customization)}>
                    <CssBaseline />
                    <NavigationScroll>
                        <Routes />
                        <FeedbackButton />
                    </NavigationScroll>
                </ThemeProvider>
            </StyledEngineProvider>
        </ClerkProvider>
    )
}

export default App
