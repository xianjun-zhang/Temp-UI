import PropTypes from 'prop-types'
import { useState } from 'react'
import { styled, alpha } from '@mui/material/styles'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { IconButton } from '@mui/material'
import { IconCopy, IconTrash, IconFileText, IconDots, IconInfoCircle } from '@tabler/icons-react'

const StyledMenu = styled((props) => (
    <Menu
        elevation={0}
        anchorOrigin={{
            vertical: 'top',
            horizontal: 'right'
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'left'
        }}
        {...props}
    />
))(({ theme }) => ({
    '& .MuiPaper-root': {
        borderRadius: 6,
        marginLeft: theme.spacing(1),
        minWidth: 180,
        boxShadow:
            'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
        '& .MuiMenu-list': {
            padding: '4px 0'
        },
        '& .MuiMenuItem-root': {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 16px',
            '& .left-section': {
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing(1.5)
            },
            '& .shortcut': {
                color: theme.palette.text.secondary,
                fontSize: '0.75rem'
            },
            '&:active': {
                backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity)
            }
        }
    }
}))

export const NodeActionButtons = ({ onCopy, onDuplicate, onDelete, onDocs, onInfo, hasDocumentation = false }) => {
    const [anchorEl, setAnchorEl] = useState(null)
    const open = Boolean(anchorEl)

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const menuItems = [
        { icon: <IconInfoCircle size={18} />, label: 'Info', shortcut: '⌘ I', onClick: onInfo },
        { icon: <IconCopy size={18} />, label: 'Copy', shortcut: '⌘ C', onClick: onCopy },
        { icon: <IconCopy size={18} />, label: 'Duplicate', shortcut: '⌘ D', onClick: onDuplicate },
        { 
            icon: <IconFileText size={18} />, 
            label: 'Docs', 
            shortcut: '⌘ F', 
            onClick: onDocs,
            disabled: !hasDocumentation 
        },
        { icon: <IconTrash size={18} />, label: 'Delete', shortcut: '⌫', onClick: onDelete }
    ]

    return (
        <>
            <IconButton
                id='node-action-button'
                aria-controls={open ? 'node-action-menu' : undefined}
                aria-haspopup='true'
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                sx={{ 
                    height: '24px',
                    width: '24px',
                    padding: '2px',
                    '&:hover': { 
                        backgroundColor: 'rgba(0, 0, 0, 0.04)' 
                    }
                }}
            >
                <IconDots size={18} />
            </IconButton>
            <StyledMenu
                id='node-action-menu'
                MenuListProps={{
                    'aria-labelledby': 'node-action-button'
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                {menuItems.map((item, index) => (
                    <MenuItem
                        key={index}
                        onClick={() => {
                            if (!item.disabled) {
                                item.onClick()
                                handleClose()
                            }
                        }}
                        disabled={item.disabled}
                        sx={{
                            opacity: item.disabled ? 0.5 : 1,
                            '&.Mui-disabled': {
                                color: 'text.secondary'
                            }
                        }}
                    >
                        <div className="left-section">
                            {item.icon}
                            {item.label}
                        </div>
                        <span className="shortcut">{item.shortcut}</span>
                    </MenuItem>
                ))}
            </StyledMenu>
        </>
    )
}

NodeActionButtons.propTypes = {
    onCopy: PropTypes.func.isRequired,
    onDuplicate: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onDocs: PropTypes.func.isRequired,
    onInfo: PropTypes.func.isRequired,
    hasDocumentation: PropTypes.bool
}
