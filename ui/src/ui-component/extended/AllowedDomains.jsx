import { useDispatch } from 'react-redux'
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction, SET_CHATFLOW } from '@/store/actions'

// material-ui
import { Button, IconButton, OutlinedInput, Box, List, InputAdornment, Typography, Stack } from '@mui/material'
import { IconX, IconTrash, IconPlus } from '@tabler/icons-react'

// Project import
import { StyledButton } from '@/ui-component/button/StyledButton'
import { TooltipWithParser } from '@/ui-component/tooltip/TooltipWithParser'
import MainCard from '@/ui-component/cards/MainCard'

// store
import useNotifier from '@/utils/useNotifier'

// API
import chatflowsApi from '@/api/chatflows'

const AllowedDomains = ({ dialogProps, onCancel, isCloseAfterSave = true }) => {
    const dispatch = useDispatch()
    useNotifier()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const defaultInputFields = ['']
    const [inputFields, setInputFields] = useState(defaultInputFields)
    const [errorMessage, setErrorMessage] = useState('')

    const [chatbotConfig, setChatbotConfig] = useState({})

    const addInputField = () => {
        setInputFields([...inputFields, ''])
    }

    const removeInputFields = (index) => {
        const rows = [...inputFields]
        rows.splice(index, 1)
        setInputFields(rows)
    }

    const handleChange = (index, evnt) => {
        const { value } = evnt.target
        const list = [...inputFields]
        list[index] = value
        setInputFields(list)
    }

    useEffect(() => {
        if (dialogProps.chatflow?.chatbotConfig) {
            try {
                const chatbotConfig = JSON.parse(dialogProps.chatflow.chatbotConfig)
                setChatbotConfig(chatbotConfig || {})

                const allowedOrigins = chatbotConfig.allowedOrigins ? [...chatbotConfig.allowedOrigins] : ['']
                setInputFields(allowedOrigins)

                const allowedOriginsError = chatbotConfig.allowedOriginsError || 'Unauthorized domain!'
                setErrorMessage(allowedOriginsError)
            } catch (error) {
                setInputFields(defaultInputFields)
                setErrorMessage('')
                console.error('Error parsing chatbotConfig:', error)
            }
        }
    }, [dialogProps.chatflow])

    const onSave = async () => {
        try {
            let value = {
                allowedOrigins: [...inputFields],
                allowedOriginsError: errorMessage
            }

            const newConfig = {
                ...chatbotConfig,
                allowedOrigins: value.allowedOrigins,
                allowedOriginsError: value.allowedOriginsError
            }
            
            const saveResp = await chatflowsApi.updateChatflow(dialogProps.chatflow.id, {
                chatbotConfig: JSON.stringify(newConfig)
            })
            
            if (saveResp.data) {
                enqueueSnackbar({
                    message: 'Allowed Domains Saved',
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
                message: `Failed to save Allowed Domains: ${
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

    return (
        <MainCard>
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <Typography sx={{ mb: 1 }}>
                        Allowed Domains
                        <TooltipWithParser
                            style={{ mb: 1, mt: 2, marginLeft: 10 }}
                            title={'Your chatbot will only work when used from the following domains.'}
                        />
                    </Typography>
                </Box>
                <List>
                    {inputFields.map((origin, index) => {
                        return (
                            <div key={index} style={{ display: 'flex', width: '100%' }}>
                                <Box sx={{ width: '100%', mb: 1 }}>
                                    <OutlinedInput
                                        sx={{ width: '100%' }}
                                        key={index}
                                        type='text'
                                        onChange={(e) => handleChange(index, e)}
                                        size='small'
                                        value={origin}
                                        name='origin'
                                        placeholder='https://example.com'
                                        endAdornment={
                                            <InputAdornment position='end' sx={{ padding: '2px' }}>
                                                {inputFields.length > 1 && (
                                                    <IconButton
                                                        sx={{ height: 30, width: 30 }}
                                                        size='small'
                                                        color='error'
                                                        disabled={inputFields.length === 1}
                                                        onClick={() => removeInputFields(index)}
                                                        edge='end'
                                                    >
                                                        <IconTrash />
                                                    </IconButton>
                                                )}
                                            </InputAdornment>
                                        }
                                    />
                                </Box>
                                <Box sx={{ width: '5%', mb: 1 }}>
                                    {index === inputFields.length - 1 && (
                                        <IconButton color='primary' onClick={addInputField}>
                                            <IconPlus />
                                        </IconButton>
                                    )}
                                </Box>
                            </div>
                        )
                    })}
                </List>
                </Box>
            <Box sx={{ pt: 2, pb: 2 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography sx={{ mb: 1 }}>
                        Error Message
                        <TooltipWithParser
                            style={{ mb: 1, mt: 2, marginLeft: 10 }}
                            title={'Custom error message that will be shown when for unauthorized domain'}
                        />
                    </Typography>
                    <OutlinedInput
                        sx={{ width: '100%' }}
                        type='text'
                        size='small'
                        fullWidth
                        placeholder='Unauthorized domain!'
                        value={errorMessage}
                        onChange={(e) => {
                            setErrorMessage(e.target.value)
                        }}
                    />
                </div>
            </Box>
            <Box sx={{ pt: 2 }}>
                <Stack direction='row' spacing={1} justifyContent='flex-end' alignItems='center'>
                    <Button variant='outlined' onClick={onCancel}>
                        Cancel
                    </Button>
                    <StyledButton  variant='contained' onClick={onSave}>
                        Save Changes
                    </StyledButton >
                </Stack>
            </Box>
        </MainCard>
    )
}

AllowedDomains.propTypes = {
    dialogProps: PropTypes.object,
    onCancel: PropTypes.func
}

export default AllowedDomains
