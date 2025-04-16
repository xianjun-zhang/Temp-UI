import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect, useRef, useState } from 'react'

// material-ui
import { useTheme, styled } from '@mui/material/styles'
import { 
    AppBar,
    Box, 
    IconButton,
    Stack,
    TextField,
    Toolbar,
    Tooltip,
    Typography,
    Chip,
    Badge
} from '@mui/material'

// icons
import { 
    IconArrowLeft,
    IconSettings,
    IconDeviceFloppy,
    IconPencil,
    IconCheck,
    IconX,
    IconCode,
    IconPointFilled,
    IconBrandGithub,
    IconExternalLink,
    IconLayoutDashboard
} from '@tabler/icons-react'

// project imports
import Settings from '@/views/settings'
import SaveChatflowDialog from '@/ui-component/dialog/SaveChatflowDialog'
import APICodeDialog from '@/views/chatflows/APICodeDialog'
import ViewMessagesDialog from '@/ui-component/dialog/ViewMessagesDialog'
import ChatflowConfigurationDialog from '@/ui-component/dialog/ChatflowConfigurationDialog'
import UpsertHistoryDialog from '@/views/vectorstore/UpsertHistoryDialog'
import { navigationPaths } from '@/routes/path'
import { exportToJSON } from '@/utils/exportHelper'

// API
import chatflowsApi from '@/api/chatflows'

// Hooks
import useApi from '@/hooks/useApi'

// utils
import { uiBaseURL } from '@/store/constant'
import { SET_CHATFLOW } from '@/store/actions'
import ViewLeadsDialog from '@/ui-component/dialog/ViewLeadsDialog'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'

// ==============================|| CANVAS HEADER ||============================== //

const StyledAppBar = styled(AppBar)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[2],
    height: 72,
    zIndex: theme.zIndex.drawer + 1
}))

const ActionIconButton = styled(IconButton)(({ theme }) => ({
    width: 42,
    height: 42,
    borderRadius: theme.shape.borderRadius,
    marginLeft: theme.spacing(1),
    backgroundColor: theme.palette.background.neutral,
    '&:hover': {
        backgroundColor: theme.palette.action.hover
    }
}))

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: theme.shape.borderRadius,
        height: 48,
        width: '100%',
        backgroundColor: theme.palette.background.paper,
        '& fieldset': {
            borderColor: theme.palette.divider
        },
        '&:hover fieldset': {
            borderColor: theme.palette.primary.main
        }
    }
}))

const CanvasHeader = ({ chatflow, isAgentCanvas, handleSaveFlow, handleDeleteFlow, handleLoadFlow }) => {
    const theme = useTheme()
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const flowNameRef = useRef()
    const settingsRef = useRef()

    const [isEditingFlowName, setEditingFlowName] = useState(null)
    const [flowName, setFlowName] = useState('')
    const [isSettingsOpen, setSettingsOpen] = useState(false)
    const [flowDialogOpen, setFlowDialogOpen] = useState(false)
    const [apiDialogOpen, setAPIDialogOpen] = useState(false)
    const [apiDialogProps, setAPIDialogProps] = useState({})
    const [viewMessagesDialogOpen, setViewMessagesDialogOpen] = useState(false)
    const [viewMessagesDialogProps, setViewMessagesDialogProps] = useState({})
    const [viewLeadsDialogOpen, setViewLeadsDialogOpen] = useState(false)
    const [viewLeadsDialogProps, setViewLeadsDialogProps] = useState({})
    const [upsertHistoryDialogOpen, setUpsertHistoryDialogOpen] = useState(false)
    const [upsertHistoryDialogProps, setUpsertHistoryDialogProps] = useState({})
    const [chatflowConfigurationDialogOpen, setChatflowConfigurationDialogOpen] = useState(false)
    const [chatflowConfigurationDialogProps, setChatflowConfigurationDialogProps] = useState({})

    const flowType = isAgentCanvas ? 'Agentflow' : 'Chatflow'

    const updateChatflowApi = useApi(chatflowsApi.updateChatflow)
    const canvas = useSelector((state) => state.canvas)

    const onSettingsItemClick = async (setting) => {
        setSettingsOpen(false)

        if (setting === 'deleteChatflow') {
            handleDeleteFlow()
        } else if (setting === 'viewMessages') {
            setViewMessagesDialogProps({
                title: 'View Messages',
                chatflow: chatflow
            })
            setViewMessagesDialogOpen(true)
        } else if (setting === 'viewLeads') {
            setViewLeadsDialogProps({
                title: 'View Leads',
                chatflow: chatflow
            })
            setViewLeadsDialogOpen(true)
        } else if (setting === 'viewUpsertHistory') {
            setUpsertHistoryDialogProps({
                title: 'View Upsert History',
                chatflow: chatflow
            })
            setUpsertHistoryDialogOpen(true)
        } else if (setting === 'chatflowConfiguration') {
            setChatflowConfigurationDialogProps({
                title: `${flowType} Configuration`,
                chatflow: chatflow
            })
            setChatflowConfigurationDialogOpen(true)
        } else if (setting === 'duplicateChatflow') {
            try {
                let flowData = chatflow.flowData
                const parsedFlowData = JSON.parse(flowData)
                flowData = JSON.stringify(parsedFlowData)
                localStorage.setItem('duplicatedFlowData', flowData)

                const pathToNavigate = isAgentCanvas ? navigationPaths.workspace.agentflows.new() : navigationPaths.workspace.chatflows.new()
                window.open(`${uiBaseURL}${pathToNavigate}`, '_blank')
            } catch (e) {
                console.error(e)
            }
        } else if (setting === 'exportChatflow') {
            try {
                const response = await chatflowsApi.exportChatflow(chatflow.id)
                const exportData = response.data
                if (!exportData) {
                    throw new Error('No data received from server')
                }

                exportToJSON(exportData, `${chatflow.name}`)

                // Show success notification
                dispatch(enqueueSnackbarAction({
                    message: 'Chatflow exported successfully',
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'success',
                        autoHideDuration: 2000,
                        persist: false,
                        action: (key) => (
                            <IconButton
                                size="small"
                                onClick={() => dispatch(closeSnackbarAction(key))}
                                sx={{ color: 'inherit' }}
                            >
                                <IconX size={18} />
                            </IconButton>
                        )
                    }
                }))
            } catch (error) {
                console.error('Export error:', error)
                dispatch(enqueueSnackbarAction({
                    message: `Failed to export chatflow: ${error.response?.data?.message || error.message}`,
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'error',
                        persist: true,
                        action: (key) => (
                            <IconButton
                                size="small"
                                onClick={() => dispatch(closeSnackbarAction(key))}
                                sx={{ color: 'inherit' }}
                            >
                                <IconX size={18} />
                            </IconButton>
                        )
                    }
                }))
            }
        }
    }

    const onFileUpload = (file) => {
        setSettingsOpen(false)
        handleLoadFlow(file)
    }

    const submitFlowName = () => {
        if (chatflow.id) {
            const updateBody = {
                name: flowNameRef.current.value
            }
            updateChatflowApi.request(chatflow.id, updateBody)
        }
    }

    const onAPIDialogClick = () => {
        // If file type is file, isFormDataRequired = true
        let isFormDataRequired = false
        try {
            const flowData = JSON.parse(chatflow.flowData)
            const nodes = flowData.nodes
            for (const node of nodes) {
                if (node.data.inputParams.find((param) => param.type === 'file')) {
                    isFormDataRequired = true
                    break
                }
            }
        } catch (e) {
            console.error(e)
        }

        // If sessionId memory, isSessionMemory = true
        let isSessionMemory = false
        try {
            const flowData = JSON.parse(chatflow.flowData)
            const nodes = flowData.nodes
            for (const node of nodes) {
                if (node.data.inputParams.find((param) => param.name === 'sessionId')) {
                    isSessionMemory = true
                    break
                }
            }
        } catch (e) {
            console.error(e)
        }

        setAPIDialogProps({
            title: 'Embed in website or use as API',
            chatflowid: chatflow.id,
            chatflowApiKeyId: chatflow.apikeyId,
            isFormDataRequired,
            isSessionMemory,
            isAgentCanvas
        })
        setAPIDialogOpen(true)
    }

    const onSaveChatflowClick = () => {
        if (chatflow.id) handleSaveFlow(flowName)
        else setFlowDialogOpen(true)
    }

    const onConfirmSaveName = (flowName) => {
        setFlowDialogOpen(false)
        handleSaveFlow(flowName)
    }

    const handleDocumentationClick = () => {
        const snackbarKey = new Date().getTime() + Math.random()
        dispatch(
            enqueueSnackbarAction({
                message: 'Documentation is coming soon! Stay tuned for updates.',
                options: {
                    key: snackbarKey,
                    variant: 'info',
                    anchorOrigin: {
                        vertical: 'top',
                        horizontal: 'center'
                    },
                    autoHideDuration: 3000,
                    action: (key) => (
                        <IconButton
                            size="small"
                            onClick={() => dispatch(closeSnackbarAction(key))}
                            sx={{ color: 'inherit' }}
                        >
                            <IconX size={18} />
                        </IconButton>
                    ),
                }
            })
        )
    }

    useEffect(() => {
        if (updateChatflowApi.data) {
            setFlowName(updateChatflowApi.data.name)
            dispatch({ type: SET_CHATFLOW, chatflow: updateChatflowApi.data })
        }
        setEditingFlowName(false)

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [updateChatflowApi.data])

    useEffect(() => {
        if (chatflow) {
            setFlowName(chatflow.name)
            // if configuration dialog is open, update its data
            if (chatflowConfigurationDialogOpen) {
                setChatflowConfigurationDialogProps({
                    title: `${flowType} Configuration`,
                    chatflow
                })
            }
        }
    }, [chatflow, flowType, chatflowConfigurationDialogOpen])

    return (
        <StyledAppBar position="fixed">
            <Toolbar sx={{ minHeight: 72 }}>
                <Stack 
                    direction="row" 
                    alignItems="center" 
                    justifyContent="space-between" 
                    sx={{ width: '100%' }}
                >
                    <Stack direction="row" alignItems="center" spacing={3}>
                        <Tooltip title="Back to Dashboard">
                            <ActionIconButton
                                onClick={() => window.history.state && window.history.state.idx > 0 
                                    ? navigate(-1) 
                                    : navigate('/', { replace: true })}
                            >
                                <IconArrowLeft size={24} />
                            </ActionIconButton>
                        </Tooltip>

                        {!isEditingFlowName ? (
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <IconLayoutDashboard size={24} stroke={1.5} />
                                    <Typography variant="h4" sx={{ 
                                        fontSize: theme.typography.h4.fontSize,
                                        fontWeight: 600,
                                        maxWidth: 400,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {flowName}
                                    </Typography>
                                </Stack>
                                {canvas.isDirty && (
                                    <Chip 
                                        icon={<IconPointFilled size={16} color={theme.palette.warning.dark} />}
                                        label="Unsaved Changes"
                                        size="small"
                                        // color='warning'
                                        variant="outlined"
                                        sx = {{
                                            backgroundColor: theme.palette.warning.light,
                                            color: theme.palette.warning.dark,
                                            borderColor: theme.palette.warning.dark
                                        }}
                                    />
                                )}
                                {chatflow?.id && (
                                    <Tooltip title="Edit Name">
                                        <ActionIconButton 
                                            onClick={() => setEditingFlowName(true)}
                                            size="small"
                                        >
                                            <IconPencil size={20} />
                                        </ActionIconButton>
                                    </Tooltip>
                                )}
                            </Stack>
                        ) : (
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <StyledTextField
                                    inputRef={flowNameRef}
                                    defaultValue={flowName}
                                    size="small"
                                    sx={{ width: 400 }}
                                />
                                <Tooltip title="Save">
                                    <ActionIconButton
                                        onClick={submitFlowName}
                                        color="primary"
                                    >
                                        <IconCheck size={22} />
                                    </ActionIconButton>
                                </Tooltip>
                                <Tooltip title="Cancel">
                                    <ActionIconButton
                                        onClick={() => setEditingFlowName(false)}
                                        color="error"
                                    >
                                        <IconX size={22} />
                                    </ActionIconButton>
                                </Tooltip>
                            </Stack>
                        )}
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Tooltip title="Documentation (Coming Soon)">
                            <ActionIconButton
                                // onClick={() => window.open('https://docs.bit-flow.ai', '_blank')}
                                onClick={handleDocumentationClick}
                                sx={{ 
                                    backgroundColor: theme.palette.info.lighter,
                                    '&:hover': {
                                        backgroundColor: theme.palette.info.light
                                    }
                                }}
                            >
                                <IconExternalLink size={22} />
                            </ActionIconButton>
                        </Tooltip>
                        {chatflow?.id && (
                            <Tooltip title="API Endpoint">
                                <ActionIconButton 
                                    onClick={onAPIDialogClick}
                                    sx={{ 
                                        backgroundColor: theme.palette.primary.lighter,
                                        '&:hover': {
                                            backgroundColor: theme.palette.primary.light
                                        }
                                    }}
                                >
                                    <IconCode size={22} />
                                </ActionIconButton>
                            </Tooltip>
                        )}
                        <Tooltip title={`Save ${flowType}`}>
                            <Badge color="error" variant="dot" invisible={!canvas.isDirty}>
                                <ActionIconButton 
                                    onClick={onSaveChatflowClick}
                                    sx={{ 
                                        backgroundColor: theme.palette.success.lighter,
                                        '&:hover': {
                                            backgroundColor: theme.palette.success.light
                                        }
                                    }}
                                >
                                    <IconDeviceFloppy size={22} />
                                </ActionIconButton>
                            </Badge>
                        </Tooltip>
                        <Tooltip title="Settings">
                            <ActionIconButton 
                                ref={settingsRef}
                                onClick={() => setSettingsOpen(!isSettingsOpen)}
                                sx={{ 
                                    backgroundColor: theme.palette.secondary.lighter,
                                    '&:hover': {
                                        backgroundColor: theme.palette.secondary.light
                                    }
                                }}
                            >
                                <IconSettings size={22} />
                            </ActionIconButton>
                        </Tooltip>
                    </Stack>
                </Stack>
            </Toolbar>

            <Settings
                chatflow={chatflow}
                isSettingsOpen={isSettingsOpen}
                anchorEl={settingsRef.current}
                onClose={() => setSettingsOpen(false)}
                onSettingsItemClick={onSettingsItemClick}
                onFileUpload={onFileUpload}
                isAgentCanvas={isAgentCanvas}
            />
            <SaveChatflowDialog
                show={flowDialogOpen}
                dialogProps={{
                    title: `Save New ${flowType}`,
                    confirmButtonName: 'Save',
                    cancelButtonName: 'Cancel'
                }}
                onCancel={() => setFlowDialogOpen(false)}
                onConfirm={onConfirmSaveName}
            />
            <APICodeDialog show={apiDialogOpen} dialogProps={apiDialogProps} onCancel={() => setAPIDialogOpen(false)} />
            <ViewMessagesDialog
                show={viewMessagesDialogOpen}
                dialogProps={viewMessagesDialogProps}
                onCancel={() => setViewMessagesDialogOpen(false)}
            />
            <ViewLeadsDialog show={viewLeadsDialogOpen} dialogProps={viewLeadsDialogProps} onCancel={() => setViewLeadsDialogOpen(false)} />
            <UpsertHistoryDialog
                show={upsertHistoryDialogOpen}
                dialogProps={upsertHistoryDialogProps}
                onCancel={() => setUpsertHistoryDialogOpen(false)}
            />
            <ChatflowConfigurationDialog
                key='chatflowConfiguration'
                show={chatflowConfigurationDialogOpen}
                dialogProps={chatflowConfigurationDialogProps}
                onCancel={() => setChatflowConfigurationDialogOpen(false)}
            />
        </StyledAppBar>
    )
}

CanvasHeader.propTypes = {
    chatflow: PropTypes.object,
    handleSaveFlow: PropTypes.func,
    handleDeleteFlow: PropTypes.func,
    handleLoadFlow: PropTypes.func,
    isAgentCanvas: PropTypes.bool
}

export default CanvasHeader
