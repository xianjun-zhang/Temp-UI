import { IconButton } from '@mui/material'
import { IconDotsVertical } from '@tabler/icons-react'
import FlowListMenu from '@/ui-component/button/FlowListMenu'
import { useState } from 'react'

const CardOptionsButton = ({ chatflow, updateFlowsApi, setError, isAgentCanvas }) => {
    const [menuAnchorEl, setMenuAnchorEl] = useState(null)

    const handleClick = (event) => {
        event.stopPropagation() // Prevent card click event
        setMenuAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setMenuAnchorEl(null)
    }

    return (
        <>
            <IconButton
                onClick={handleClick}
                sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    color: 'inherit'
                }}
            >
                <IconDotsVertical size="1.2rem" />
            </IconButton>
            <FlowListMenu
                chatflow={chatflow}
                updateFlowsApi={updateFlowsApi}
                setError={setError}
                isAgentCanvas={isAgentCanvas}
                isCard={true}
                menuAnchorEl={menuAnchorEl}
                onMenuClose={handleClose}
            />
        </>
    )
}

export default CardOptionsButton
