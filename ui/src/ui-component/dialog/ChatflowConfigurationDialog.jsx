import PropTypes from 'prop-types'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { 
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Stack,
    Typography,
    Divider
} from '@mui/material'
import { styled } from '@mui/material/styles'

// Icons
import { 
    IconX,
    IconGauge,
    IconMessageChatbot,
    IconMicrophone,
    IconThumbUp,
    IconWorld,
    IconChartBar,
    IconUsers
} from '@tabler/icons-react'

// Components
import SpeechToText from '@/ui-component/extended/SpeechToText'
import RateLimit from '@/ui-component/extended/RateLimit'
import AllowedDomains from '@/ui-component/extended/AllowedDomains'
import ChatFeedback from '@/ui-component/extended/ChatFeedback'
import AnalyseFlow from '@/ui-component/extended/AnalyseFlow'
import StarterPrompts from '@/ui-component/extended/StarterPrompts'
import Leads from '@/ui-component/extended/Leads'

const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        borderRadius: 12,
        backgroundColor: theme.palette.background.paper,
        backgroundImage: 'none'
    }
}))

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
    borderRadius: 8,
    marginBottom: 4,
    '&:hover': {
        backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.04)'
    },
    '&.Mui-selected': {
        backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.16)'
            : 'rgba(0, 0, 0, 0.08)',
        '&:hover': {
            backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.2)'
                : 'rgba(0, 0, 0, 0.12)'
        }
    }
}))

const CONFIGURATION_ITEMS = [
    {
        id: 'rateLimiting',
        label: 'Rate Limiting',
        icon: IconGauge,
        component: RateLimit
    },
    {
        id: 'conversationStarters',
        label: 'Starter Prompts',
        icon: IconMessageChatbot,
        component: StarterPrompts
    },
    {
        id: 'speechToText',
        label: 'Speech to Text',
        icon: IconMicrophone,
        component: SpeechToText
    },
    {
        id: 'chatFeedback',
        label: 'Chat Feedback',
        icon: IconThumbUp,
        component: ChatFeedback
    },
    {
        id: 'allowedDomains',
        label: 'Allowed Domains',
        icon: IconWorld,
        component: AllowedDomains
    },
    // {
    //     id: 'analyseChatflow',
    //     label: 'Analyse Chatflow',
    //     icon: IconChartBar,
    //     component: AnalyseFlow
    // },
    {
        id: 'leads',
        label: 'Leads',
        icon: IconUsers,
        component: Leads
    }
]

const ChatflowConfigurationDialog = ({ show, dialogProps, onCancel }) => {
    const portalElement = document.getElementById('portal')
    const [selectedItem, setSelectedItem] = useState('rateLimiting')

    const handleItemClick = (id) => {
        setSelectedItem(id)
    }

    const CurrentComponent = CONFIGURATION_ITEMS.find(item => item.id === selectedItem)?.component

    const component = show ? (
        <StyledDialog
            onClose={onCancel}
            open={show}
            fullWidth
            maxWidth="md"
            aria-labelledby="chatflow-config-dialog"
        >
            <DialogTitle sx={{ 
                fontSize: '1.1rem',
                fontWeight: 500,
                p: 2,
                pb: 1.5
            }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="h4">{dialogProps.title}</Typography>
                    <IconButton
                        onClick={onCancel}
                        size="small"
                        sx={{
                            borderRadius: 1,
                            p: 1,
                            '&:hover': {
                                background: (theme) => 
                                    theme.palette.mode === 'dark' 
                                        ? 'rgba(255,255,255,0.08)'
                                        : 'rgba(0,0,0,0.04)'
                            }
                        }}
                    >
                        <IconX size={18} />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 0, display: 'flex' }}>
                <Box sx={{ width: 220, borderRight: '1px solid', borderColor: 'divider', p: 2 }}>
                    <List component="nav" sx={{ p: 0 }}>
                        {CONFIGURATION_ITEMS.map((item) => {
                            const Icon = item.icon
                            return (
                                <StyledListItemButton
                                    key={item.id}
                                    selected={selectedItem === item.id}
                                    onClick={() => handleItemClick(item.id)}
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <Icon size={20} />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={item.label}
                                        primaryTypographyProps={{
                                            fontSize: '0.875rem'
                                        }}
                                    />
                                </StyledListItemButton>
                            )
                        })}
                    </List>
                </Box>
                <Box sx={{ flex: 1, p: 3 }}>
                    {CurrentComponent && (
                        <CurrentComponent 
                            dialogProps={dialogProps}
                            onCancel={onCancel}
                            isCloseAfterSave={false}
                        />
                    )}
                </Box>
            </DialogContent>
        </StyledDialog>
    ) : null

    return createPortal(component, portalElement)
}

ChatflowConfigurationDialog.propTypes = {
    show: PropTypes.bool,
    dialogProps: PropTypes.object,
    onCancel: PropTypes.func
}

export default ChatflowConfigurationDialog
