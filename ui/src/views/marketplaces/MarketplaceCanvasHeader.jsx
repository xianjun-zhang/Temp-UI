import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'

// material-ui
import { useTheme } from '@mui/material/styles'
import { Avatar, Box, ButtonBase, Typography, Stack, Button, IconButton, Tooltip, Chip } from '@mui/material'
import { StyledButton } from '@/ui-component/button/StyledButton'

// icons
import { IconCopy, IconChevronLeft, IconArrowLeft, IconLayoutDashboard } from '@tabler/icons-react'

// ==============================|| CANVAS HEADER ||============================== //

const MarketplaceCanvasHeader = ({ templateData, onChatflowCopy }) => {
    const theme = useTheme()
    const navigate = useNavigate()

    const isAgentFlow = templateData.templateType === 'Agentflow'

    return (
        <Stack 
            direction="row" 
            alignItems="center" 
            justifyContent="space-between"
            sx={{ 
                width: '100%', 
                height: 72,
                px: 3,
                backgroundColor: 'transparent',
            }}
        >
            <Stack direction="row" alignItems="center" spacing={3}>
                <Tooltip title="Back to Dashboard">
                    <IconButton
                        onClick={() => navigate(-1)}
                        sx={{
                            width: 42,
                            height: 42,
                            borderRadius: theme.shape.borderRadius,
                            backgroundColor: theme.palette.background.neutral,
                            color: theme.palette.text.primary,
                            '&:hover': {
                                backgroundColor: theme.palette.action.hover
                            }
                        }}
                    >
                        <IconArrowLeft size={24} />
                    </IconButton>
                </Tooltip>

                <Stack direction="column" spacing={0.5}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <IconLayoutDashboard size={24} stroke={1.5} />
                            <Typography 
                                variant="h4" 
                                sx={{ 
                                    fontSize: theme.typography.h4.fontSize,
                                    fontWeight: 600,
                                    color: theme.palette.text.primary,
                                    maxWidth: 400,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {templateData?.name || "Untitled"}
                            </Typography>
                        </Stack>
                        <Chip
                            label={isAgentFlow ? 'Agent Flow' : 'Chat Flow'}
                            size="small"
                            sx={{
                                backgroundColor: isAgentFlow 
                                    ? theme.palette.warning.light
                                    : theme.palette.primary.light,
                                color: isAgentFlow 
                                    ? theme.palette.warning.dark 
                                    : theme.palette.primary.dark,
                                fontWeight: 500,
                                fontSize: '0.75rem',
                                height: 24,
                                borderRadius: '6px'
                            }}
                        />
                    </Stack>

                    {templateData?.description && (
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: theme.palette.text.secondary,
                                maxWidth: '800px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {templateData.description}
                        </Typography>
                    )}
                </Stack>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
                <Button
                    variant="contained"
                    onClick={() => onChatflowCopy(templateData)}
                    startIcon={<IconCopy size={20} />}
                    sx={{
                        height: 42,
                        backgroundColor: theme.palette.success.lighter,
                        color: theme.palette.success.darker,
                        '&:hover': {
                            backgroundColor: theme.palette.success.dark,
                            color: theme.palette.common.white,
                        },
                        borderRadius: theme.shape.borderRadius,
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        px: 2.5,
                        boxShadow: 'none',
                        border: `1px solid ${theme.palette.success.light}`,
                        '.MuiSvgIcon-root': {
                            color: 'inherit'
                        }
                    }}
                >
                    Use Template
                </Button>
            </Stack>
        </Stack>
    )
}

MarketplaceCanvasHeader.propTypes = {
    templateData: PropTypes.object,
    onChatflowCopy: PropTypes.func
}

export default MarketplaceCanvasHeader
