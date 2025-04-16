// material-ui
import { Typography } from '@mui/material'

// project imports
import NavGroup from './NavGroup'
import { siderbarMenuConfig } from '@/menu-items/sidebarSettings'

// ==============================|| SIDEBAR MENU LIST ||============================== //

const SidebarMenuList = ({ SidebarId = 'default' }) => {
    const menuItems = siderbarMenuConfig[SidebarId]
    
    if (!menuItems) return null

    const navItems = [menuItems].map((item) => {
        switch (item.type) {
            case 'group':
                return <NavGroup key={item.id} item={item} />
            default:
                return (
                    <Typography key={item.id} variant='h6' color='error' align='center'>
                        Menu Items Error
                    </Typography>
                )
        }
    })

    return <>{navItems}</>
}

export default SidebarMenuList
