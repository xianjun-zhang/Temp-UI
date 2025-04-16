import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { styled, alpha } from '@mui/material/styles'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import EditIcon from '@mui/icons-material/Edit'
import Divider from '@mui/material/Divider'
import FileCopyIcon from '@mui/icons-material/FileCopy'
import FileDownloadIcon from '@mui/icons-material/Downloading'
import FileDeleteIcon from '@mui/icons-material/Delete'
import FileCategoryIcon from '@mui/icons-material/Category'
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined'
import PictureInPictureAltIcon from '@mui/icons-material/PictureInPictureAlt'
import ThumbsUpDownOutlinedIcon from '@mui/icons-material/ThumbsUpDownOutlined'
import VpnLockOutlinedIcon from '@mui/icons-material/VpnLockOutlined'
import MicNoneOutlinedIcon from '@mui/icons-material/MicNoneOutlined'
import Button from '@mui/material/Button'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { IconX, IconCategory } from '@tabler/icons-react'

import chatflowsApi from '@/api/chatflows'

import useApi from '@/hooks/useApi'
import useConfirm from '@/hooks/useConfirm'
import { uiBaseURL } from '@/store/constant'
import { closeSnackbar as closeSnackbarAction, enqueueSnackbar as enqueueSnackbarAction } from '@/store/actions'

import SaveChatflowDialog from '@/ui-component/dialog/SaveChatflowDialog'
import TagDialog from '@/ui-component/dialog/TagDialog'
import StarterPromptsDialog from '@/ui-component/dialog/StarterPromptsDialog'

import useNotifier from '@/utils/useNotifier'
import ChatFeedbackDialog from '../dialog/ChatFeedbackDialog'
import AllowedDomainsDialog from '../dialog/AllowedDomainsDialog'
import SpeechToTextDialog from '../dialog/SpeechToTextDialog'
import { navigationPaths } from '@/routes/path'
import { exportToJSON } from '@/utils/exportHelper'

const StyledMenu = styled((props) => (
    <Menu
        elevation={0}
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'right'
        }}
        {...props}
    />
))(({ theme }) => ({
    '& .MuiPaper-root': {
        borderRadius: 6,
        marginTop: theme.spacing(1),
        minWidth: 180,
        boxShadow:
            'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
        '& .MuiMenu-list': {
            padding: '4px 0'
        },
        '& .MuiMenuItem-root': {
            '& .MuiSvgIcon-root': {
                fontSize: 18,
                color: theme.palette.text.secondary,
                marginRight: theme.spacing(1.5)
            },
            '&:active': {
                backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity)
            }
        }
    }
}))

export default function FlowListMenu({ chatflow, isAgentCanvas, setError, updateFlowsApi, isCard, menuAnchorEl, onMenuClose }) {
    const { confirm } = useConfirm()
    const dispatch = useDispatch()
    const updateChatflowApi = useApi(chatflowsApi.updateChatflow)

    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const [flowDialogOpen, setFlowDialogOpen] = useState(false)
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
    const [categoryDialogProps, setCategoryDialogProps] = useState({})
    const [anchorEl, setAnchorEl] = useState(null)
    const open = Boolean(isCard ? menuAnchorEl : anchorEl)
    const [conversationStartersDialogOpen, setConversationStartersDialogOpen] = useState(false)
    const [conversationStartersDialogProps, setConversationStartersDialogProps] = useState({})
    const [chatFeedbackDialogOpen, setChatFeedbackDialogOpen] = useState(false)
    const [chatFeedbackDialogProps, setChatFeedbackDialogProps] = useState({})
    const [allowedDomainsDialogOpen, setAllowedDomainsDialogOpen] = useState(false)
    const [allowedDomainsDialogProps, setAllowedDomainsDialogProps] = useState({})
    const [speechToTextDialogOpen, setSpeechToTextDialogOpen] = useState(false)
    const [speechToTextDialogProps, setSpeechToTextDialogProps] = useState({})

    const title = isAgentCanvas ? 'Agents' : 'Chatflow'

    const handleClick = (event) => {
        event.stopPropagation()
        setAnchorEl(event.currentTarget)
    }

    const handleClose = (event) => {
        if (event) {
            event.stopPropagation()
        }
        if (isCard) {
            onMenuClose()
        } else {
            setAnchorEl(null)
        }
    }

    const handleFlowRename = (event) => {
        event.stopPropagation()
        if (isCard) {
            onMenuClose()
        } else {
            setAnchorEl(null)
        }
        setFlowDialogOpen(true)
    }

    const handleFlowStarterPrompts = (event) => {
        event.stopPropagation()
        if (isCard) {
            onMenuClose()
        } else {
            setAnchorEl(null)
        }
        setConversationStartersDialogProps({
            title: 'Starter Prompts - ' + chatflow.name,
            chatflow: chatflow,
            updateFlowsApi: updateFlowsApi
        })
        setConversationStartersDialogOpen(true)
    }

    const handleFlowChatFeedback = (event) => {
        event.stopPropagation()
        if (isCard) {
            onMenuClose()
        } else {
            setAnchorEl(null)
        }
        setChatFeedbackDialogProps({
            title: 'Chat Feedback - ' + chatflow.name,
            chatflow: chatflow,
            updateFlowsApi: updateFlowsApi
        })
        setChatFeedbackDialogOpen(true)
    }

    const handleAllowedDomains = (event) => {
        event.stopPropagation()
        if (isCard) {
            onMenuClose()
        } else {
            setAnchorEl(null)
        }
        setAllowedDomainsDialogProps({
            title: 'Allowed Domains - ' + chatflow.name,
            chatflow: chatflow,
            updateFlowsApi: updateFlowsApi
        })
        setAllowedDomainsDialogOpen(true)
    }

    const handleSpeechToText = (event) => {
        event.stopPropagation()
        if (isCard) {
            onMenuClose()
        } else {
            setAnchorEl(null)
        }
        setSpeechToTextDialogProps({
            title: 'Speech To Text - ' + chatflow.name,
            chatflow: chatflow,
            updateFlowsApi: updateFlowsApi
        })
        setSpeechToTextDialogOpen(true)
    }

    const saveFlowRename = async (chatflowName) => {
        const updateBody = {
            name: chatflowName,
            chatflow
        }
        try {
            await updateChatflowApi.request(chatflow.id, updateBody)
            await updateFlowsApi.request()
            setFlowDialogOpen(false)
            if (isCard) {
                onMenuClose()
            } else {
                setAnchorEl(null)
            }
        } catch (error) {
            if (setError) setError(error)
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

    const handleFlowCategory = (event) => {
        event.stopPropagation()
        setAnchorEl(null)
        if (chatflow.category) {
            setCategoryDialogProps({
                category: chatflow.category.split(';')
            })
        }
        setCategoryDialogOpen(true)
    }

    const saveFlowCategory = async (categories) => {
        setCategoryDialogOpen(false)
        // save categories as string
        const categoryTags = categories.join(';')
        const updateBody = {
            category: categoryTags,
            chatflow
        }
        try {
            await updateChatflowApi.request(chatflow.id, updateBody)
            await updateFlowsApi.request()
        } catch (error) {
            if (setError) setError(error)
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

    // TODO: [p2] consider refactoring onSave action similar to saveFlowCategory in the future.
    // const saveFlowStarterPrompts = async (starterPrompts) => {
    //     setConversationStartersDialogOpen(false)
    //     const updateBody = {
    //         chatbotConfig: JSON.stringify({
    //             ...chatflow.chatbotConfig,
    //             starterPrompts: starterPrompts
    //         })
    //     }
    //     try {
    //         await updateChatflowApi.request(chatflow.id, updateBody)
    //         await updateFlowsApi.request()
    //     } catch (error) {
    //         if (setError) setError(error)
    //         enqueueSnackbar({
    //             message: typeof error.response.data === 'object' ? error.response.data.message : error.response.data,
    //             options: {
    //                 key: new Date().getTime() + Math.random(),
    //                 variant: 'error',
    //                 persist: true,
    //                 action: (key) => (
    //                     <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
    //                         <IconX />
    //                     </Button>
    //                 )
    //             }
    //         })
    //     }
    // }

    const handleDelete = async (event) => {
        event.stopPropagation()
        setAnchorEl(null)
        const confirmPayload = {
            title: `Delete`,
            description: `Delete ${title} ${chatflow.name}?`,
            confirmButtonName: 'Delete',
            cancelButtonName: 'Cancel'
        }
        const isConfirmed = await confirm(confirmPayload)

        if (isConfirmed) {
            try {
                await chatflowsApi.deleteChatflow(chatflow.id)
                await updateFlowsApi.request()
            } catch (error) {
                if (setError) setError(error)
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

    const handleDuplicate = (event) => {
        event.stopPropagation()
        setAnchorEl(null)
        try {
            localStorage.setItem('duplicatedFlowData', chatflow.flowData)
            const pathToNavigate = isAgentCanvas ? navigationPaths.workspace.agentflows.new() : navigationPaths.workspace.chatflows.new()
            window.open(`${uiBaseURL}${pathToNavigate}`, '_blank')
        } catch (e) {
            console.error(e)
        }
    }

    const handleExport = async (event) => {
        event.stopPropagation()
        if (isCard) {
            onMenuClose()
        } else {
            setAnchorEl(null)
        }
        try {
            const response = await chatflowsApi.exportChatflow(chatflow.id)
            const exportData = response.data
            if (!exportData) {
                throw new Error('No data received from server')
            }

            exportToJSON(exportData, `${chatflow.name}`)

            enqueueSnackbar({
                message: 'Chatflow exported successfully',
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'success',
                    autoHideDuration: 2000,
                    persist: false,
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
        } catch (error) {
            console.error('Export error:', error)
            enqueueSnackbar({
                message: `Failed to export chatflow: ${error.message}`,
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

    // Add useEffect to update dialog props when chatflow changes
    useEffect(() => {
        if (conversationStartersDialogOpen) {
            setConversationStartersDialogProps({
                title: 'Starter Prompts - ' + chatflow.name,
                chatflow: chatflow,
                updateFlowsApi: updateFlowsApi
            })
        }
    }, [chatflow, updateFlowsApi, conversationStartersDialogOpen])

    // Add useEffect for ChatFeedback
    useEffect(() => {
        if (chatFeedbackDialogOpen) {
            setChatFeedbackDialogProps({
                title: 'Chat Feedback - ' + chatflow.name,
                chatflow: chatflow,
                updateFlowsApi: updateFlowsApi
            })
        }
    }, [chatflow, updateFlowsApi, chatFeedbackDialogOpen])

    // Add useEffect for SpeechToText
    useEffect(() => {
        if (speechToTextDialogOpen) {
            setSpeechToTextDialogProps({
                title: 'Speech To Text - ' + chatflow.name,
                chatflow: chatflow,
                updateFlowsApi: updateFlowsApi
            })
        }
    }, [chatflow, updateFlowsApi, speechToTextDialogOpen])

    // Add useEffect for AllowedDomains
    useEffect(() => {
        if (allowedDomainsDialogOpen) {
            setAllowedDomainsDialogProps({
                title: 'Allowed Domains - ' + chatflow.name,
                chatflow: chatflow,
                updateFlowsApi: updateFlowsApi
            })
        }
    }, [chatflow, updateFlowsApi, allowedDomainsDialogOpen])
    

    return (
        <div onClick={(e) => e.stopPropagation()}>
            {!isCard && (
                <Button
                    id='demo-customized-button'
                    aria-controls={open ? 'demo-customized-menu' : undefined}
                    aria-haspopup='true'
                    aria-expanded={open ? 'true' : undefined}
                    disableElevation
                    onClick={handleClick}
                    endIcon={<KeyboardArrowDownIcon />}
                >
                    Options
                </Button>
            )}
            <StyledMenu
                id='demo-customized-menu'
                MenuListProps={{
                    'aria-labelledby': 'demo-customized-button',
                    onClick: (e) => e.stopPropagation()
                }}
                anchorEl={isCard ? menuAnchorEl : anchorEl}
                open={open}
                onClose={handleClose}
            >
                <MenuItem onClick={handleFlowRename} disableRipple>
                    <EditIcon />
                    Rename
                </MenuItem>
                <MenuItem onClick={handleFlowCategory} disableRipple>
                    <CategoryOutlinedIcon />
                    Edit Tags
                </MenuItem>
                <MenuItem onClick={handleDuplicate} disableRipple>
                    <FileCopyIcon />
                    Duplicate
                </MenuItem>
                <MenuItem onClick={handleExport} disableRipple>
                    <FileDownloadIcon />
                    Export
                </MenuItem>

                <Divider sx={{ my: 0.5 }} />

                <MenuItem onClick={handleFlowStarterPrompts} disableRipple>
                    <PictureInPictureAltIcon />
                    Starter Prompts
                </MenuItem>
                <MenuItem onClick={handleFlowChatFeedback} disableRipple>
                    <ThumbsUpDownOutlinedIcon />
                    Chat Feedback
                </MenuItem>
                <MenuItem onClick={handleAllowedDomains} disableRipple>
                    <VpnLockOutlinedIcon />
                    Allowed Domains
                </MenuItem>
                <MenuItem onClick={handleSpeechToText} disableRipple>
                    <MicNoneOutlinedIcon />
                    Speech To Text
                </MenuItem>

                <Divider sx={{ my: 0.5 }} />

                <MenuItem onClick={handleDelete} disableRipple>
                    <FileDeleteIcon />
                    Delete
                </MenuItem>
            </StyledMenu>

            <SaveChatflowDialog
                show={flowDialogOpen}
                dialogProps={{
                    title: `Rename ${title}`,
                    confirmButtonName: 'Rename',
                    cancelButtonName: 'Cancel'
                }}
                onCancel={() => setFlowDialogOpen(false)}
                onConfirm={saveFlowRename}
            />
            <TagDialog
                isOpen={categoryDialogOpen}
                dialogProps={categoryDialogProps}
                onClose={() => setCategoryDialogOpen(false)}
                onSubmit={saveFlowCategory}
            />
            <StarterPromptsDialog
                show={conversationStartersDialogOpen}
                dialogProps={conversationStartersDialogProps}
                onCancel={() => setConversationStartersDialogOpen(false)}
            />
            <ChatFeedbackDialog
                show={chatFeedbackDialogOpen}
                dialogProps={chatFeedbackDialogProps}
                onCancel={() => setChatFeedbackDialogOpen(false)}
            />
            <AllowedDomainsDialog
                show={allowedDomainsDialogOpen}
                dialogProps={allowedDomainsDialogProps}
                onCancel={() => setAllowedDomainsDialogOpen(false)}
            />
            <SpeechToTextDialog
                show={speechToTextDialogOpen}
                dialogProps={speechToTextDialogProps}
                onCancel={() => setSpeechToTextDialogOpen(false)}
            />
        </div>
    )
}

FlowListMenu.propTypes = {
    chatflow: PropTypes.object,
    isAgentCanvas: PropTypes.bool,
    setError: PropTypes.func,
    updateFlowsApi: PropTypes.object,
    isCard: PropTypes.bool,
    menuAnchorEl: PropTypes.object,
    onMenuClose: PropTypes.func
}
