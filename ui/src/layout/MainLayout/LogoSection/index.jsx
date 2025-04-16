import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'

// material-ui
import { ButtonBase, Typography, Box } from '@mui/material'

// project imports
import config from '@/config'
import Logo from '@/ui-component/extended/Logo'
import { MENU_OPEN } from '@/store/actions'

// ==============================|| MAIN LOGO ||============================== //

const LogoSection = () => {
    const dispatch = useDispatch()

    const handleLogoClick = () => {
        dispatch({ type: MENU_OPEN, id: 'chatflows' })
    }

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ButtonBase 
                disableRipple 
                component={Link} 
                to={config.defaultPath}
                onClick={handleLogoClick}
            >
                <Logo />
            </ButtonBase>

            <Typography variant='h2' sx={{ fontWeight: 1000 }}>BitFlow</Typography>
        </Box>
    )
}

export default LogoSection
