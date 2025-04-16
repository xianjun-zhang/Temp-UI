import PropTypes from 'prop-types'
import { useState, useRef } from 'react'
import { Box, Stack, Button, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { 
    IconDatabaseImport, 
    IconMessage, 
    IconExternalLink 
} from '@tabler/icons-react'
import React from 'react'
import { useSnackbar } from 'notistack'

// Import the dialogs
import UpsertDialog from '@/views/canvas/UpsertDialog'
import ChatDialog from '@/views/canvas/ChatDialog'
import PublishTemplateDialog from './PublishTemplateDialog'

const ActionButton = React.forwardRef(({ icon: Icon, label, onClick, disabled }, ref) => {
    const theme = useTheme()
    
    return (
        <Button
            ref={ref}
            variant="text"
            size="small"
            startIcon={<Icon size={18} stroke={1.5} />}
            onClick={onClick}
            disabled={disabled}
            sx={{
                color: theme.palette.grey[700],
                textTransform: 'none',
                px: 2,
                '&:hover': {
                    backgroundColor: theme.palette.grey[100],
                }
            }}
        >
            {label}
        </Button>
    )
});

// Add displayName
ActionButton.displayName = 'ActionButton';

const CanvasActionButtons = ({ isUpsertButtonEnabled, isAgentCanvas, chatflowId, isDirty }) => {
    const theme = useTheme()
    const [showUpsertDialog, setShowUpsertDialog] = useState(false)
    const [showChatDialog, setShowChatDialog] = useState(false)
    const [showPublishDialog, setShowPublishDialog] = useState(false)
    const chatButtonRef = useRef(null)
    const { enqueueSnackbar } = useSnackbar()

    const handleUpsertClick = () => {
        setShowUpsertDialog(true)
    }

    const handleChatClick = () => {
        setShowChatDialog(true)
    }

    const handlePublishClick = () => {
        // Only allow publishing if chatflow has been saved (has an ID)
        if (!chatflowId) {
            enqueueSnackbar('Please save your flow before publishing', { variant: 'warning' })
            return
        }
        setShowPublishDialog(true)
    }

    const handlePublishDialogClose = (publishedTemplate) => {
        setShowPublishDialog(false)
        // Additional actions on successful publish can be handled here if needed
    }

    return (
        <>
            <Box
                sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 50,
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '4px',
                    border: `1px solid ${theme.palette.grey[300]}`,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                }}
            >
                <Stack direction="row" spacing={1}>
                    {isUpsertButtonEnabled && (
                        <Tooltip title="Vector Store" placement="bottom" arrow>
                            <span>
                                <ActionButton
                                    icon={IconDatabaseImport}
                                    label="Upsert"
                                    onClick={handleUpsertClick}
                                />
                            </span>
                        </Tooltip>
                    )}
                    <Tooltip title="Open Chat" placement="bottom" arrow>
                        <span>
                            <ActionButton
                                ref={chatButtonRef}
                                icon={IconMessage}
                                label="Chat"
                                onClick={handleChatClick}
                            />
                        </span>
                    </Tooltip>
                    <Tooltip title="Publish Flow" placement="bottom" arrow>
                        <span>
                            <ActionButton
                                icon={IconExternalLink}
                                label="Publish"
                                onClick={handlePublishClick}
                                disabled={!chatflowId}
                            />
                        </span>
                    </Tooltip>
                </Stack>
            </Box>

            {/* Dialogs */}
            <UpsertDialog 
                show={showUpsertDialog}
                chatflowid={chatflowId}
                onClose={() => setShowUpsertDialog(false)}
            />
            <ChatDialog
                show={showChatDialog}
                buttonRef={chatButtonRef.current}
                chatflowid={chatflowId}
                isAgentCanvas={isAgentCanvas}
                onClose={() => setShowChatDialog(false)}
            />
            <PublishTemplateDialog
                open={showPublishDialog}
                onClose={handlePublishDialogClose}
                chatflowId={chatflowId}
                chatflowType={isAgentCanvas ? 'Agentflow' : 'Chatflow'}
                isCanvasDirty={isDirty}
            />
        </>
    )
}

CanvasActionButtons.propTypes = {
    isUpsertButtonEnabled: PropTypes.bool,
    isAgentCanvas: PropTypes.bool,
    chatflowId: PropTypes.string,
    isDirty: PropTypes.bool
}

CanvasActionButtons.defaultProps = {
    isUpsertButtonEnabled: false,
    isAgentCanvas: false,
    isDirty: false
}

export default CanvasActionButtons
