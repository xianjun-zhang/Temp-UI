import PropTypes from 'prop-types'
import { useEffect, useState, useRef } from 'react'
import { useTheme, styled, alpha } from '@mui/material/styles'
import {
    Box,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Popover,
    Divider,
    Stack
} from '@mui/material'

import {
    IconDownload,
    IconUpload,
    IconTrash,
    IconMessage,
    IconUsers,
    IconHistory,
    IconSettings,
    IconFileExport,
    IconDatabaseImport,
    IconCopy
} from '@tabler/icons-react'

const StyledPopover = styled(Popover)(({ theme }) => ({
    '& .MuiPaper-root': {
        borderRadius: 12,
        minWidth: 280,
        boxShadow: 'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
        '& .MuiList-root': {
            padding: '4px 0'
        }
    }
}))

const MenuGroup = styled(Box)(({ theme }) => ({
    padding: theme.spacing(1.5, 1)
}))

const MenuGroupHeader = styled(Typography)(({ theme }) => ({
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: theme.palette.text.secondary,
    letterSpacing: '0.5px',
    padding: theme.spacing(0, 1.5, 1)
}))

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
    borderRadius: 6,
    margin: theme.spacing(0, 1, 0.5),
    padding: theme.spacing(1, 1.5),
    display: 'flex',
    justifyContent: 'space-between',
    transition: 'all 0.2s ease-in-out',
    '& .MuiListItemIcon-root': {
        minWidth: 32,
        color: theme.palette.text.secondary,
        transition: 'color 0.2s ease-in-out'
    },
    '& svg': {
        transition: 'fill 0.2s ease-in-out',
        fill: 'transparent'
    },
    '&.danger': {
        '& .MuiListItemIcon-root': {
            color: theme.palette.error.main
        }
    },
    '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.hoverOpacity),
        '& .MuiListItemIcon-root': {
            color: theme.palette.primary.main
        },
        '& .MuiTypography-root': {
            color: theme.palette.primary.main
        },
        '& svg': {
            fill: alpha(theme.palette.primary.main, 0.7)
        }
    },
    '&.danger:hover': {
        backgroundColor: alpha(theme.palette.error.main, theme.palette.action.hoverOpacity),
        '& .MuiListItemIcon-root': {
            color: theme.palette.error.main
        },
        '& .MuiTypography-root': {
            color: theme.palette.error.main
        },
        '& svg': {
            fill: alpha(theme.palette.error.main, 0.7)
        }
    }
}))

const StyledDivider = styled(Divider)(({ theme }) => ({
    margin: theme.spacing(0.5, 2)
}))

const Settings = ({ chatflow, isSettingsOpen, anchorEl, onClose, onSettingsItemClick, onFileUpload, isAgentCanvas }) => {
    const theme = useTheme()
    const inputFile = useRef(null)

    const menuGroups = [
        {
            title: 'General',
            items: [
                {
                    id: 'chatflowConfiguration',
                    title: 'Configuration',
                    icon: IconSettings
                },
                {
                    id: 'duplicateChatflow',
                    title: isAgentCanvas ? 'Duplicate Agent' : 'Duplicate Chatflow',
                    icon: IconCopy
                },
            ]
        },
        {
            title: 'Data Management',
            items: [
                {
                    id: 'viewMessages',
                    title: 'View Messages',
                    icon: IconMessage
                },
                {
                    id: 'viewLeads',
                    title: 'View Leads',
                    icon: IconUsers
                },
                {
                    id: 'viewUpsertHistory',
                    title: 'Upsert History',
                    icon: IconHistory
                },
                {
                    id: 'loadChatflow',
                    title: 'Import Flow',
                    icon: IconDatabaseImport
                },
                {
                    id: 'exportChatflow',
                    title: 'Export Flow',
                    icon: IconFileExport
                },
            ]
        },
        {
            title: 'Danger Zone',
            items: [
                {
                    id: 'deleteChatflow',
                    title: 'Delete Flow',
                    icon: IconTrash,
                    color: theme.palette.error.main
                }
            ]
        }
    ]

    const handleFileChange = (event) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0]
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const fileData = e.target.result
                    onFileUpload(fileData)
                } catch (error) {
                    console.error('Error reading file:', error)
                }
            }
            reader.readAsText(file)
            event.target.value = null
        }
    }

    return (
        <StyledPopover
            open={isSettingsOpen}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
            }}
        >
            {menuGroups.map((group, index) => (
                <Box key={group.title}>
                    {index > 0 && <StyledDivider />}
                    <MenuGroup>
                        <MenuGroupHeader>{group.title}</MenuGroupHeader>
                        <List sx={{ p: 0 }}>
                            {group.items.map((item) => (
                                <StyledListItemButton
                                    key={item.id}
                                    className={group.title === 'Danger Zone' ? 'danger' : ''}
                                    onClick={() => {
                                        if (item.id === 'loadChatflow') {
                                            inputFile?.current?.click()
                                        } else {
                                            onSettingsItemClick(item.id)
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <ListItemIcon>
                                            <item.icon 
                                                size={18} 
                                                stroke={1.5}
                                                color={item.color || theme.palette.text.primary}
                                            />
                                        </ListItemIcon>
                                        <ListItemText 
                                            primary={
                                                <Typography 
                                                    sx={{ 
                                                        fontSize: '0.875rem',
                                                        fontWeight: 400,
                                                        color: item.color || theme.palette.text.primary,
                                                        transition: 'color 0.2s ease-in-out'
                                                    }}
                                                >
                                                    {item.title}
                                                </Typography>
                                            }
                                        />
                                    </Box>
                                </StyledListItemButton>
                            ))}
                        </List>
                    </MenuGroup>
                </Box>
            ))}
            <input
                ref={inputFile}
                type="file"
                style={{ display: 'none' }}
                accept=".json"
                onChange={handleFileChange}
            />
        </StyledPopover>
    )
}

Settings.propTypes = {
    chatflow: PropTypes.object,
    isSettingsOpen: PropTypes.bool,
    anchorEl: PropTypes.object,
    onClose: PropTypes.func,
    onSettingsItemClick: PropTypes.func,
    onFileUpload: PropTypes.func,
    isAgentCanvas: PropTypes.bool
}

export default Settings
