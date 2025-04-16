import { useLocation, useNavigate, matchPath, generatePath } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
import { Box, Button } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { SET_SIDEBAR_ID, MENU_OPEN } from '@/store/actions'
import { siderbarMenuConfig } from '@/menu-items/sidebarSettings'
import { navbarItems } from '@/menu-items/navbarSettings'
import { useEffect } from 'react'

const HeaderNav = () => {
    const theme = useTheme()
    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useDispatch()
    const customization = useSelector((state) => state.customization)

    // Initialize sidebar state based on current path
    useEffect(() => {
        const normalizedPath = generatePath(location.pathname)
        
        // Handle root path
        if (normalizedPath === '/') {
            dispatch({ type: SET_SIDEBAR_ID, SidebarId: 'workspace' })
            dispatch({ type: MENU_OPEN, id: 'chatflows' })
            return
        }

        // Check if current path matches any sidebar config
        Object.entries(siderbarMenuConfig).forEach(([id, config]) => {
            if (normalizedPath.startsWith(generatePath(config.path))) {
                dispatch({ type: SET_SIDEBAR_ID, SidebarId: id })
                // Find the matching child path to set the correct menu item
                const matchingChild = config.children.find(child => 
                    generatePath(child.path) === normalizedPath
                )
                dispatch({ type: MENU_OPEN, id: matchingChild?.id || config.defaultOpenMenu })
            }
        })
    }, [location.pathname, dispatch])

    const getButtonStyles = (isSelected) => ({
        color: isSelected ? theme.palette.primary.main : theme.palette.text.primary,
        // backgroundColor: isSelected ? theme.palette.primary.light : 'transparent',
        backgroundColor: isSelected ? theme.palette.grey[200] : 'transparent',
        '&:hover': {
            backgroundColor: isSelected 
                ? theme.palette.primary.light 
                : theme.palette.action.hover
        },
        textTransform: 'none',
        fontWeight: isSelected ? 600 : 400,
        padding: '4px 12px',
        fontSize: '0.85rem',
        minWidth: 100,
        height: 36,
        borderRadius: '8px'
    })

    // Check if header nav item is selected based on the current menu type and the sidebar config
    const getIsSelected = (item) => {
        const currentMenuType = customization.SidebarId
        const currentPath = location.pathname

        // Helper function to check if path matches or is a subpath
        const isPathMatch = (basePath) => {
            try {
                // Add leading slash if not present
                const normalizedPath = basePath.startsWith('/') ? basePath : '/' + basePath
                // Match exact path or path with trailing segments
                const result = matchPath(
                    {
                        path: normalizedPath + '/*',
                        end: false
                    },
                    currentPath
                )
                return result !== null
            } catch (error) {
                console.error('Path matching error:', error)
                return false
            }
        }

        // Check if this nav item has a corresponding sidebar config
        if (Object.keys(siderbarMenuConfig).includes(item.id)) {
            // Get all paths from the sidebar config's children
            const sidebarPaths = siderbarMenuConfig[item.id]?.children.map(child => child.path) || []

            // append the header nav path (parent path)
            sidebarPaths.push(item.path)

            return currentMenuType === item.id && (
                sidebarPaths.some(path => location.pathname.startsWith(path)) ||
                location.pathname === '/' // Also highlight workspace when on root path
            )
        } else {
            return item.path ? isPathMatch(item.path) : false
        }
    }


    const handleNavigation = (path, id) => {
        if (Object.keys(siderbarMenuConfig).includes(id)) {
            const sidebarConfig = siderbarMenuConfig[id]
            dispatch({ type: SET_SIDEBAR_ID, SidebarId: id })
            // Use defaultOpenMenu from sidebar config
            dispatch({ type: MENU_OPEN, id: sidebarConfig.defaultOpenMenu })
            navigate(sidebarConfig.path)
        } else {
            dispatch({ type: SET_SIDEBAR_ID, SidebarId: null })
            navigate(path)
        }
    }

    return (
        <Box sx={{ display: 'flex', gap: 2 }}>
            {navbarItems.map((item) => {
                const Icon = item.icon
                const isSelected = getIsSelected(item)

                return (
                    <Button
                        key={item.id}
                        onClick={() => handleNavigation(item.path, item.id)}
                        startIcon={<Icon 
                            size="1.3rem"
                            // stroke={1.2}
                            style={{
                                fill: isSelected ? 
                                    theme.palette.primary.main : 
                                    'transparent'
                            }}
                        />}
                        sx={getButtonStyles(isSelected)}
                    >
                        {item.title}
                    </Button>
                )
            })}
        </Box>
    )
}

export default HeaderNav
