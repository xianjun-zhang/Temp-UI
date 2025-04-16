import logo from '@/assets/images/logo/NexEnt.png'
import logoDark from '@/assets/images/logo/NexEnt.png'

import { useSelector } from 'react-redux'
import { Avatar, Typography, Box } from '@mui/material'

// ==============================|| LOGO ||============================== //

const Logo = () => {
    const customization = useSelector((state) => state.customization)

    return (
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row' }}>
            <Avatar 
                variant="rounded" 
                src={logo} 
                alt='Bitflow' 
                sx={{ 
                    height: 50, 
                    width: 50,
                    borderRadius: '10px'
                }} 
            />
        </div>
    )
}

export default Logo
