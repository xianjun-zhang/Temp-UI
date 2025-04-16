import { closeSnackbar as closeSnackbarAction, enqueueSnackbar as enqueueSnackbarAction, MENU_OPEN, REMOVE_DIRTY } from '@/store/actions'
import useNotifier from '@/utils/useNotifier'
import PropTypes from 'prop-types'
import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
// material-ui
import {
    Avatar,
    Box,
    Button,
    ButtonBase,
    ClickAwayListener,
    Divider,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Paper,
    Popper,
    Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

// third-party
import PerfectScrollbar from 'react-perfect-scrollbar'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import AboutDialog from '@/ui-component/dialog/AboutDialog'
import Transitions from '@/ui-component/extended/Transitions'
import { navigationPaths } from '@/routes/path'
import { exportToJSON } from '@/utils/exportHelper'

// assets
import { IconFileExport, IconFileUpload, IconInfoCircle, IconLogout, IconSettings, IconX } from '@tabler/icons-react'
import './index.css'

//API
import chatFlowsApi from '@/api/chatflows'

// Hooks
import useApi from '@/hooks/useApi'
import { useLocation, useNavigate } from 'react-router-dom'

// Import Clerk user button component
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { FALSE } from 'sass'

// ==============================|| PROFILE MENU ||============================== //

const ProfileSection = ({ username, handleLogout }) => {
    const theme = useTheme()

    const customization = useSelector((state) => state.customization)

    const [open, setOpen] = useState(false)
    const [aboutDialogOpen, setAboutDialogOpen] = useState(false)

    const anchorRef = useRef(null)
    const inputRef = useRef()

    const navigate = useNavigate()
    const location = useLocation()

    // ==============================|| Snackbar ||============================== //

    useNotifier()
    const dispatch = useDispatch()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const handleClose = (event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) {
            return
        }
        setOpen(false)
    }

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen)
    }

    const errorFailed = (message) => {
        enqueueSnackbar({
            message: message,
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
    const importChatflowsApi = useApi(chatFlowsApi.importChatflows)
    const fileChange = (e) => {
        if (!e.target.files) return

        const file = e.target.files[0]

        const reader = new FileReader()
        reader.onload = (evt) => {
            if (!evt?.target?.result) {
                return
            }
            const chatflows = JSON.parse(evt.target.result)
            importChatflowsApi.request(chatflows)
        }
        reader.readAsText(file)
    }

    const importChatflowsSuccess = () => {
        dispatch({ type: REMOVE_DIRTY })
        enqueueSnackbar({
            message: `Import Workflows successful`,
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
    }
    useEffect(() => {
        if (importChatflowsApi.error) errorFailed(`Failed to Import Workflows: ${importChatflowsApi.error.response.data.message}`)
        if (importChatflowsApi.data) {
            importChatflowsSuccess()
            // if current location is /chatflows, refresh the page
            if (location.pathname === navigationPaths.workspace.chatflows.root() || 
                location.pathname === navigationPaths.workspace.agentflows.root()) {
                navigate(0)
            }
            else {
                // if not redirect to /chatflows
                dispatch({ type: MENU_OPEN, id: 'chatflows' })
                navigate(navigationPaths.workspace.chatflows.root())
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [importChatflowsApi.error, importChatflowsApi.data])
    
    const importAllChatflows = () => {
        inputRef.current.click()
    }

    const exportChatflowsSuccess = () => {
        dispatch({ type: REMOVE_DIRTY })
        enqueueSnackbar({
            message: `Export All Chatflows successful`,
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
    }

    const handleExport = async () => {
        try {
            const response = await chatFlowsApi.exportAllChatflows()
            const exportData = response.data
            if (!exportData) {
                throw new Error('No data received from server')
            }
            console.log('exportData', exportData)

            const exportFileDefaultName = 'AllChatflows'
            
            exportToJSON(exportData, exportFileDefaultName)
            
            exportChatflowsSuccess()
        } catch (error) {
            console.error('Export error:', error)
            enqueueSnackbar({
                message: `Failed to export chatflows: ${error.message}`,
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error',
                    autoHideDuration: 5000,
                    persist: false,
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
        }
    }

    // useEffect(() => {
    //     const exportChatflows = async () => {
    //         try {
    //             if (getAllChatflowsApi.error) {
    //                 errorFailed(`Failed to export Chatflows: ${getAllChatflowsApi.error.response.data.message}`)
    //                 return
    //             }
    //             if (getAllChatflowsApi.data) {
    //                 const response = await chatFlowsApi.exportAllChatflows().data
    //                 const dataStr = JSON.stringify(response.data, null, 2)
    //                 const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
                    
    //                 const exportFileDefaultName = 'AllChatflows.json'
                    
    //                 const linkElement = document.createElement('a')
    //                 linkElement.setAttribute('href', dataUri)
    //                 linkElement.setAttribute('download', exportFileDefaultName)
    //                 linkElement.click()
    //                 exportChatflowsSuccess()
    //             }
    //         } catch (error) {
    //             errorFailed(`Failed to export Chatflows: ${error.message}`)
    //         }
    //     }
    //     exportChatflows()
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [getAllChatflowsApi.error, getAllChatflowsApi.data])

    const prevOpen = useRef(open)
    useEffect(() => {
        if (prevOpen.current === true && open === false) {
            anchorRef.current.focus()
        }

        prevOpen.current = open
    }, [open])

    return (
        <>
            {/* Clerk customerize UserButton https://clerk.com/docs/components/user/user-button
                https://clerk.com/docs/customization/user-button */}
            
            <input ref={inputRef} type='file' hidden onChange={fileChange} />
            <AboutDialog show={aboutDialogOpen} onCancel={() => setAboutDialogOpen(false)} />

            <SignedIn>
                <UserButton showName={false} userProfileMode='modal' userProfileUrl='/profile'>
                    <UserButton.MenuItems>
                        <UserButton.Action 
                            label='Export All Workflows' 
                            labelIcon={<IconFileExport stroke={2} size='1rem'  />}
                            onClick={() => {
                                handleExport()
                            }}
                        />
                    </UserButton.MenuItems>

                    <UserButton.MenuItems>
                        <UserButton.Action 
                            label='Import Workflows' 
                            labelIcon={<IconFileUpload stroke={2} size='1rem'  />}
                            onClick={() => {
                                importAllChatflows()
                            }}
                        />
                    </UserButton.MenuItems>

                    <UserButton.MenuItems>
                        <UserButton.Action 
                            label='About' 
                            labelIcon={<IconInfoCircle stroke={2} size='1rem'  />}
                            onClick={() => {
                                setOpen(false)
                                setAboutDialogOpen(true)
                            }}
                        />
                    </UserButton.MenuItems>
                </UserButton>
            </SignedIn>

            <SignedOut>
                <SignInButton mode="modal">
                    <Box
                        component="button"
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: 500,
                            height: '40px',
                            paddingLeft: '16px',
                            paddingRight: '16px',
                            background: theme.palette.secondary.light,
                            color: theme.palette.secondary.dark,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all .2s ease-in-out',
                            '&:hover': {
                                background: theme.palette.secondary.dark,
                                color: theme.palette.secondary.light
                            },
                        }}
                    >
                        Sign In
                    </Box>
                </SignInButton>
            </SignedOut>
        </>
    )
}

ProfileSection.propTypes = {
    username: PropTypes.string,
    handleLogout: PropTypes.func
}

export default ProfileSection
