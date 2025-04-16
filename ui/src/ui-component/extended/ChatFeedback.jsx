import { useDispatch } from 'react-redux'
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

// material-ui
import { Button, Box, Stack } from '@mui/material'
import { IconX } from '@tabler/icons-react'

// Project import
import { StyledButton } from '@/ui-component/button/StyledButton'
import { SwitchInput } from '@/ui-component/switch/Switch'
import MainCard from '@/ui-component/cards/MainCard'

// store
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction, SET_CHATFLOW } from '@/store/actions'
import useNotifier from '@/utils/useNotifier'

// API
import chatflowsApi from '@/api/chatflows'

const ChatFeedback = ({ dialogProps, onCancel, isCloseAfterSave = true }) => {
    const dispatch = useDispatch()

    useNotifier()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [chatFeedbackStatus, setChatFeedbackStatus] = useState(false)
    const [chatbotConfig, setChatbotConfig] = useState({})

    const handleChange = (value) => {
        setChatFeedbackStatus(value)
    }

    const onSave = async () => {
        try {
            let value = {
                chatFeedback: {
                    status: chatFeedbackStatus
                }
            }
            const newConfig = {
                ...chatbotConfig,
                chatFeedback: value.chatFeedback
            }
            
            const saveResp = await chatflowsApi.updateChatflow(dialogProps.chatflow.id, {
                chatbotConfig: JSON.stringify(newConfig)
            })
            
            if (saveResp.data) {
                enqueueSnackbar({
                    message: 'Chat Feedback Settings Saved',
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
                setChatbotConfig(newConfig)
                dispatch({ type: SET_CHATFLOW, chatflow: saveResp.data })
                if (dialogProps.updateFlowsApi) {
                    await dialogProps.updateFlowsApi.request()
                }
                if (isCloseAfterSave) {
                    onCancel()
                }
            }
        } catch (error) {
            enqueueSnackbar({
                message: `Failed to save Chat Feedback Settings: ${
                    typeof error.response.data === 'object' ? error.response.data.message : error.response.data
                }`,
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

    useEffect(() => {
        if (dialogProps.chatflow && dialogProps.chatflow.chatbotConfig) {
            try {
                const chatbotConfig = JSON.parse(dialogProps.chatflow.chatbotConfig)
                setChatbotConfig(chatbotConfig || {})
                if (chatbotConfig.chatFeedback) {
                    setChatFeedbackStatus(chatbotConfig.chatFeedback.status)
                }
            } catch (error) {
                console.error('Error parsing chatbotConfig:', error)
            }
        }
    }, [dialogProps.chatflow])

    return (
        <MainCard>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <SwitchInput label='Enable chat feedback' onChange={handleChange} value={chatFeedbackStatus} />
            </Box>
            <Stack direction='row' spacing={1} justifyContent='flex-end' alignItems='center' sx={{ mt: 2 }}>
                <Button variant='outlined' onClick={onCancel}>
                    Cancel
                </Button>
                <Button variant='contained' onClick={onSave}>
                    Save Changes
                </Button>
            </Stack>
        </MainCard>
    )
}

ChatFeedback.propTypes = {
    dialogProps: PropTypes.object,
    onCancel: PropTypes.func
}

export default ChatFeedback
