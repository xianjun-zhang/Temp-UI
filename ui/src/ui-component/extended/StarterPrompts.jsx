import { useDispatch } from 'react-redux'
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction, SET_CHATFLOW } from '@/store/actions'

// material-ui
import { Button, IconButton, OutlinedInput, Box, List, InputAdornment, Stack } from '@mui/material'
import { IconX, IconTrash, IconPlus, IconBulb } from '@tabler/icons-react'

// Project import
import { StyledButton } from '@/ui-component/button/StyledButton'
import MainCard from '@/ui-component/cards/MainCard'
import chatflowsApi from '@/api/chatflows'

// store
import useNotifier from '@/utils/useNotifier'

const StarterPrompts = ({ dialogProps, onCancel, isCloseAfterSave = true }) => {
    const dispatch = useDispatch()

    useNotifier()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const defaultInputFields = [
        {
            prompt: ''
        }
    ]
    const [inputFields, setInputFields] = useState(defaultInputFields)
    const [chatbotConfig, setChatbotConfig] = useState({})

    const addInputField = () => {
        setInputFields([
            ...inputFields,
            {
                prompt: ''
            }
        ])
    }
    const removeInputFields = (index) => {
        const rows = [...inputFields]
        rows.splice(index, 1)
        setInputFields(rows)
    }

    const handleChange = (index, evnt) => {
        const { name, value } = evnt.target
        const list = [...inputFields]
        list[index][name] = value
        setInputFields(list)
    }

    useEffect(() => {
        if (dialogProps.chatflow?.chatbotConfig) {
            try {
                const chatbotConfig = JSON.parse(dialogProps.chatflow.chatbotConfig)
                setChatbotConfig(chatbotConfig || {})
                if (chatbotConfig.starterPrompts) {
                    setInputFields(Object.values(chatbotConfig.starterPrompts))
                }
            } catch (error) {
                setInputFields(defaultInputFields)
                console.error('Error parsing chatbotConfig:', error)
            }
        }
    }, [dialogProps.chatflow])

    const onSave = async () => {
        try {
            let value = {
                starterPrompts: {
                    ...inputFields
                }
            }
            const newConfig = {
                ...chatbotConfig,
                starterPrompts: value.starterPrompts
            }
            
            const saveResp = await chatflowsApi.updateChatflow(dialogProps.chatflow.id, {
                chatbotConfig: JSON.stringify(newConfig)
            })
            
            if (saveResp.data) {
                enqueueSnackbar({
                    message: 'Conversation Starter Prompts Saved',
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
                message: `Failed to save Conversation Starter Prompts: ${
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
        <MainCard
            style={{
                minHeight: 'auto',
                maxWidth: 900,
                margin: '0 auto'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 10,
                    background: '#d8f3dc',
                    padding: 10
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center'
                    }}
                >
                    <IconBulb size={30} color='#2d6a4f' />
                    <span style={{ color: '#2d6a4f', marginLeft: 10, fontWeight: 500 }}>
                        Starter prompts will only be shown when there is no messages on the chat
                    </span>
                </div>
            </div>
            <Box sx={{ '& > :not(style)': { m: 1 }, pt: 2 }}>
                <List>
                    {inputFields.map((data, index) => {
                        return (
                            <div key={index} style={{ display: 'flex', width: '100%' }}>
                                <Box sx={{ width: '95%', mb: 1 }}>
                                    <OutlinedInput
                                        sx={{ width: '100%' }}
                                        key={index}
                                        type='text'
                                        onChange={(e) => handleChange(index, e)}
                                        size='small'
                                        value={data.prompt}
                                        name='prompt'
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

StarterPrompts.propTypes = {
    dialogProps: PropTypes.object,
    onCancel: PropTypes.func
}

export default StarterPrompts
