import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import { useEffect } from 'react'

// material-ui
import { useTheme } from '@mui/material/styles'
import { Box, Drawer, useMediaQuery } from '@mui/material'

// third-party
import PerfectScrollbar from 'react-perfect-scrollbar'
import { BrowserView, MobileView } from 'react-device-detect'

// project imports
import SidebarMenuList from './MenuList'
import LogoSection from '../LogoSection'
import { drawerWidth, headerHeight } from '@/store/constant'
import { siderbarMenuConfig } from '@/menu-items/sidebarSettings'

// ==============================|| SIDEBAR DRAWER ||============================== //

const Sidebar = ({ drawerOpen, drawerToggle, window }) => {
    const theme = useTheme()
    const matchUpMd = useMediaQuery(theme.breakpoints.up('md'))
    const customization = useSelector((state) => state.customization)
    
    // Check if current SidebarId exists in siderbarMenuConfig
    const shouldShowSidebar = Object.keys(siderbarMenuConfig).includes(customization.SidebarId)
    
    useEffect(() => {
        // Force re-render when SidebarId changes
    }, [customization.SidebarId])

    if (!shouldShowSidebar) return null

    const drawer = (
        <>
            <Box
                sx={{
                    display: { xs: 'block', md: 'none' },
                    height: '80px'
                }}
            >
                <Box sx={{ display: 'flex', p: 2, mx: 'auto' }}>
                    <LogoSection />
                </Box>
            </Box>
            <BrowserView>
                <PerfectScrollbar
                    component='div'
                    style={{
                        height: !matchUpMd ? 'calc(100vh - 56px)' : `calc(100vh - ${headerHeight}px)`,
                        paddingLeft: '16px',
                        paddingRight: '16px'
                    }}
                >
                    <SidebarMenuList SidebarId={customization.SidebarId} />
                </PerfectScrollbar>
            </BrowserView>
            <MobileView>
                <Box sx={{ px: 2 }}>
                    <SidebarMenuList SidebarId={customization.SidebarId} />
                </Box>
            </MobileView>
        </>
    )

    const container = window !== undefined ? () => window.document.body : undefined

    return (
        <Box
            component='nav'
            sx={{
                flexShrink: { md: 0 },
                width: matchUpMd ? drawerWidth : 'auto'
            }}
            aria-label='mailbox folders'
        >
            <Drawer
                container={container}
                variant={matchUpMd ? 'persistent' : 'temporary'}
                anchor='left'
                open={drawerOpen}
                onClose={drawerToggle}
                sx={{
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        background: theme.palette.background.default,
                        color: theme.palette.text.primary,
                        [theme.breakpoints.up('md')]: {
                            top: `${headerHeight}px`
                        },
                        borderRight: drawerOpen ? '1px solid' : 'none',
                        borderColor: drawerOpen ? theme.palette.grey[400] + 75 : 'transparent'
                    }
                }}
                ModalProps={{ keepMounted: true }}
                color='inherit'
            >
                {drawer}
            </Drawer>
        </Box>
    )
}

Sidebar.propTypes = {
    drawerOpen: PropTypes.bool,
    drawerToggle: PropTypes.func,
    window: PropTypes.object
}

export default Sidebar
