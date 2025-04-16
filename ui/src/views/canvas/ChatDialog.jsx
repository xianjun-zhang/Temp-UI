import { useState, useRef, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { ClickAwayListener, Paper, Dialog, Box, Button, Stack, IconButton, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { IconMessage, IconX, IconEraser, IconArrowsMaximize } from '@tabler/icons-react'

// project import
import MainCard from '@/ui-component/cards/MainCard'
import Transitions from '@/ui-component/extended/Transitions'
import { ChatMessage } from '@/views/chatmessage/ChatMessage'
import ChatExpandDialog from '@/views/chatmessage/ChatExpandDialog'

// api
import chatmessageApi from '@/api/chatmessage'

// Hooks
import useConfirm from '@/hooks/useConfirm'
import useNotifier from '@/utils/useNotifier'

// Const
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'

// Utils
import { getLocalStorageChatflow, removeLocalStorageChatHistory } from '@/utils/genericHelper'

const ChatDialog = ({ show, buttonRef, chatflowid, isAgentCanvas, onClose }) => {
    const theme = useTheme()
    const { confirm } = useConfirm()
    const dispatch = useDispatch()

    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))
    
    // States from the original ChatDialog component
    const [previews, setPreviews] = useState([])
    const [showExpandDialog, setShowExpandDialog] = useState(false)
    const [expandDialogProps, setExpandDialogProps] = useState({})
    
    const expandChat = () => {
        const props = {
            title: 'Chat',
            open: true,
            chatflowid: chatflowid
        }
        setExpandDialogProps(props)
        setShowExpandDialog(true)
    }

    const resetChatDialog = () => {
        const props = {
            ...expandDialogProps,
            open: false
        }
        setExpandDialogProps(props)
        setTimeout(() => {
            const resetProps = {
                ...expandDialogProps,
                open: true
            }
            setExpandDialogProps(resetProps)
        }, 500)
    }

    const clearChat = async () => {
        const confirmPayload = {
            title: `Clear Chat History`,
            description: `Are you sure you want to clear all chat history?`,
            confirmButtonName: 'Clear',
            cancelButtonName: 'Cancel'
        }
        const isConfirmed = await confirm(confirmPayload)

        if (isConfirmed) {
            try {
                const objChatDetails = getLocalStorageChatflow(chatflowid)
                if (!objChatDetails.chatId) return
                await chatmessageApi.deleteChatmessage(chatflowid, { chatId: objChatDetails.chatId, chatType: 'INTERNAL' })
                removeLocalStorageChatHistory(chatflowid)
                resetChatDialog()
                enqueueSnackbar({
                    message: 'Succesfully cleared all chat history',
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'success',
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
            } catch (error) {
                enqueueSnackbar({
                    message: typeof error.response.data === 'object' ? error.response.data.message : error.response.data,
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'error',
                        persist: true,
                        action: (key) => (
                            <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                                <IconX />
                            </Button>
                        )
                    }
                })
            }
        }
    }

    if (!show) return null

    return (
        <>
            <Dialog
                open={show && !showExpandDialog}
                onClose={onClose}
                BackdropProps={{
                    sx: {
                        backgroundColor: 'transparent'
                    }
                }}
                PaperProps={{
                    sx: {
                        position: 'absolute',
                        width: '400px',
                        maxWidth: '80vw',
                        maxHeight: '100vh',
                        overflow: 'hidden',
                        m: 0,
                        right: '10px',
                        top: `${buttonRef?.getBoundingClientRect().bottom + 10}px`,
                        boxShadow: theme.shadows[16]
                    }
                }}
            >
                <ClickAwayListener onClickAway={onClose}>
                    <MainCard
                        border={false}
                        elevation={16}
                        content={false}
                        boxShadow
                        shadow={theme.shadows[16]}
                        sx={{ 
                            width: '100%',
                            height: '100%', 
                            maxHeight: '80vh',
                            display: 'flex', 
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}
                    >
                        <Box 
                            sx={{ 
                                display: 'flex', 
                                justifyContent: 'flex-end', 
                                p: 1,
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                flexShrink: 0
                            }}
                        >
                            <Stack direction="row" spacing={1}>
                                <IconButton
                                    size='small'
                                    color='error'
                                    onClick={clearChat}
                                    title='Clear Chat History'
                                >
                                    <IconEraser size={18} />
                                </IconButton>
                                <IconButton
                                    size='small'
                                    color='primary'
                                    onClick={expandChat}
                                    title='Expand Chat'
                                >
                                    <IconArrowsMaximize size={18} />
                                </IconButton>
                                <IconButton
                                    size='small'
                                    onClick={onClose}
                                    title='Close'
                                >
                                    <IconX size={18} />
                                </IconButton>
                            </Stack>
                        </Box>
                        
                        <Box className='cloud-wrapper' sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>   {/* sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }} */}
                            <ChatMessage
                                isAgentCanvas={isAgentCanvas}
                                chatflowid={chatflowid}
                                open={show}
                                previews={previews}
                                setPreviews={setPreviews}
                                // sx={{ flex: 1, overflow: 'auto' }}
                            />
                        </Box>
                    </MainCard>
                </ClickAwayListener>
            </Dialog>
            <ChatExpandDialog
                show={showExpandDialog}
                dialogProps={expandDialogProps}
                isAgentCanvas={isAgentCanvas}
                onClear={clearChat}
                onCancel={() => setShowExpandDialog(false)}
                previews={previews}
                setPreviews={setPreviews}
            />
        </>
    )
}

ChatDialog.propTypes = {
    show: PropTypes.bool,
    buttonRef: PropTypes.object,
    chatflowid: PropTypes.string,
    isAgentCanvas: PropTypes.bool,
    onClose: PropTypes.func
}

export default ChatDialog
