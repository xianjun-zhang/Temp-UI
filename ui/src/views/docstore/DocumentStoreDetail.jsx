import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import * as PropTypes from 'prop-types'
import { useNavigate, useLocation, useParams, matchPath } from 'react-router-dom'
import ReactJson from 'react-json-view'

// material-ui
import {
    Box,
    Stack,
    Typography,
    TableContainer,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Chip,
    Menu,
    MenuItem,
    Divider,
    Button,
    Skeleton,
    IconButton,
    Popover,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material'
import { alpha, styled, useTheme } from '@mui/material/styles'
import { tableCellClasses } from '@mui/material/TableCell'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import AddDocStoreDialog from '@/views/docstore/AddDocStoreDialog'
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'
import DocumentLoaderListDialog from '@/views/docstore/DocumentLoaderListDialog'
import ErrorBoundary from '@/ErrorBoundary'
import { navigationPaths, PARAMS } from '@/routes/path'

// API
import documentsApi from '@/api/documentstore'

// Hooks
import useApi from '@/hooks/useApi'
import useConfirm from '@/hooks/useConfirm'
import useNotifier from '@/utils/useNotifier'

// icons
import { IconPlus, IconRefresh, IconScissors, IconTrash, IconX, IconVectorBezier2 } from '@tabler/icons-react'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import FileDeleteIcon from '@mui/icons-material/Delete'
import FileEditIcon from '@mui/icons-material/Edit'
import FileChunksIcon from '@mui/icons-material/AppRegistration'
import doc_store_details_emptySVG from '@/assets/images/doc_store_details_empty.svg'

// store
import { closeSnackbar as closeSnackbarAction, enqueueSnackbar as enqueueSnackbarAction } from '@/store/actions'
import { StyledButton } from '@/ui-component/button/StyledButton'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import DetailChip from './DetailChip'
import DetailChipsCell from './DetailChipsCell'

// ==============================|| DOCUMENTS ||============================== //
export const StyledTableCell = styled(TableCell)(({ theme }) => ({
    borderColor: theme.palette.grey[900] + 25,
    padding: '6px 16px',

    [`&.${tableCellClasses.head}`]: {
        color: theme.palette.grey[900]
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
        height: 64
    }
}))

const StyledTableRow = styled(TableRow)(() => ({
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0
    }
}))

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

const DocumentStoreDetails = () => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    const navigate = useNavigate()
    const dispatch = useDispatch()
    useNotifier()

    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))
    const { confirm } = useConfirm()

    const getSpecificDocumentStore = useApi(documentsApi.getSpecificDocumentStore)

    const [error, setError] = useState(null)
    const [isLoading, setLoading] = useState(true)
    const [showDialog, setShowDialog] = useState(false)
    const [documentStore, setDocumentStore] = useState({})
    const [dialogProps, setDialogProps] = useState({})
    const [showDocumentLoaderListDialog, setShowDocumentLoaderListDialog] = useState(false)
    const [documentLoaderListDialogProps, setDocumentLoaderListDialogProps] = useState({})

    const { pathname } = useLocation()
    const {storeId, loaderId, fileId} = useParams()

    const openPreviewSettings = (loaderId) => {
        navigate(navigationPaths.documentStore.loader(storeId, loaderId))
    }

    const showStoredChunks = (fileSources) => {
        const file_0 = JSON.parse(fileSources[0])
        navigate(navigationPaths.documentStore.chunks(storeId, file_0.id), {
            state: {fileSources}
        })
    }

    
    const onDocLoaderSelected = (docLoaderComponentName) => {
        setShowDocumentLoaderListDialog(false)
        navigate(navigationPaths.documentStore.loader(storeId, docLoaderComponentName))
    }

    const listLoaders = () => {
        const dialogProp = {
            title: 'Select Document Loader'
        }
        setDocumentLoaderListDialogProps(dialogProp)
        setShowDocumentLoaderListDialog(true)
    }

    const onLoaderDelete = async (file) => {
        const confirmPayload = {
            title: `Delete Loader`,
            description: [
                {
                    text: `Do you want to delete the loader "${file.loaderTypeName}"?`,
                    type: 'normal'
                },
                {
                    text: '- Click "Delete But Keep File": ',
                    type: 'action',
                    explanation: 'Remove only the loader while preserving the file. The file can be reused later or used by other loaders in this document store.'
                },
                {
                    text: '- Click "Fully Delete": ',
                    type: 'action',
                    explanation: 'Permanently remove both the loader and its associated file from the system.',
                    color: theme.palette.error.main
                }
            ],
            confirmButtonName: 'Delete But Keep File',
            cancelButtonName: 'Cancel',
            extraButton: {
                name: 'Fully Delete',
                variant: 'contained',
                color: 'error'
            }
        }
        const result = await confirm(confirmPayload)

        if (result === true || result === 'extra') {
            try {
                // If result is 'extra', it means Fully Delete was clicked
                const isHardDelete = result === 'extra'
                const deleteResp = await documentsApi.deleteLoaderFromStore(storeId, file.id, isHardDelete)
                
                if (deleteResp.data) {
                    enqueueSnackbar({
                        message: isHardDelete 
                            ? 'Loader and file completely deleted'
                            : 'Loader and associated document chunks deleted',
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
                    onConfirm()
                }
            } catch (error) {
                setError(error)
                const errorData = error.response.data || `${error.response.status}: ${error.response.statusText}`
                enqueueSnackbar({
                    message: `Failed to delete loader: ${String(errorData)}`,
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

    const onStoreDelete = async () => {
        const confirmPayload = {
            title: <Typography color="error" fontWeight={700}>{`Warning - Delete Document Store`}</Typography>,
            description: [
                {
                    text: `Do you want to delete document store "${getSpecificDocumentStore.data?.name}"?`,
                    type: 'normal'
                },
                {
                    text: 'If you click "Delete": ',
                    type: 'action',
                    explanation: 'Permanently remove all the associated loaders and document.',
                    color: theme.palette.error.main
                }
            ],
            confirmButtonName: 'Delete',
            cancelButtonName: 'Cancel',
            confirmButtonProps: {
                color: 'error',
                variant: 'contained'
            }
        }
        const isConfirmed = await confirm(confirmPayload)

        if (isConfirmed) {
            try {
                const deleteResp = await documentsApi.deleteDocumentStore(storeId)
                if (deleteResp.data) {
                    enqueueSnackbar({
                        message: 'Store, Loader and associated document chunks deleted',
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
                    navigate(navigationPaths.documentStore.root())
                }
            } catch (error) {
                setError(error)
                const errorData = error.response.data || `${error.response.status}: ${error.response.statusText}`
                enqueueSnackbar({
                    message: `Failed to delete loader: ${errorData}`,
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

    const onEditClicked = () => {
        const data = {
            name: documentStore.name,
            description: documentStore.description,
            id: documentStore.id
        }
        const dialogProp = {
            title: 'Edit Document Store',
            type: 'EDIT',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Update',
            data: data
        }
        setDialogProps(dialogProp)
        setShowDialog(true)
    }

    const onConfirm = () => {
        setShowDialog(false)
        getSpecificDocumentStore.request(storeId)
    }

    useEffect(() => {
        getSpecificDocumentStore.request(storeId)

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getSpecificDocumentStore.data) {
            setDocumentStore(getSpecificDocumentStore.data)
            // total the chunks and chars
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getSpecificDocumentStore.data])

    useEffect(() => {
        if (getSpecificDocumentStore.error) {
            setError(getSpecificDocumentStore.error)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getSpecificDocumentStore.error])

    useEffect(() => {
        setLoading(getSpecificDocumentStore.loading)
    }, [getSpecificDocumentStore.loading])

    return (
        <>
            <MainCard>
                {error ? (
                    <ErrorBoundary error={error} />
                ) : (
                    <Stack flexDirection='column' sx={{ gap: 3 }}>
                        <ViewHeader
                            isBackButton={true}
                            isEditButton={true}
                            search={false}
                            title={documentStore?.name}
                            description={documentStore?.description}
                            onBack={() => navigate(navigationPaths.documentStore.root())}
                            onEdit={() => onEditClicked()}
                        >
                            <IconButton onClick={onStoreDelete} size='small' color='error' title='Delete Document Store' sx={{ mr: 2 }}>
                                <IconTrash />
                            </IconButton>
                            {documentStore?.status === 'STALE' && (
                                <Button variant='outlined' sx={{ mr: 2 }} startIcon={<IconRefresh />} onClick={onConfirm}>
                                    Refresh
                                </Button>
                            )}
                            <StyledButton
                                variant='contained'
                                sx={{ borderRadius: 2, height: '100%', color: 'white' }}
                                startIcon={<IconPlus />}
                                onClick={listLoaders}
                            >
                                Add Document Loader
                            </StyledButton>
                        </ViewHeader>
                        {getSpecificDocumentStore.data?.chatFlows?.length > 0 && (
                            <Stack flexDirection='row' sx={{ gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                <div
                                    style={{
                                        paddingLeft: '15px',
                                        paddingRight: '15px',
                                        paddingTop: '10px',
                                        paddingBottom: '10px',
                                        fontSize: '0.9rem',
                                        width: 'max-content',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center'
                                    }}
                                >
                                    <IconVectorBezier2 style={{ marginRight: 5 }} size={17} />
                                    Used in Chatflow:
                                </div>
                                {getSpecificDocumentStore.data.chatFlows.map((chatflowUsed, index) => (
                                    <Chip
                                        key={index}
                                        clickable
                                        style={{
                                            width: 'max-content',
                                            borderRadius: '25px',
                                            boxShadow: customization.isDarkMode
                                                ? '0 2px 14px 0 rgb(255 255 255 / 10%)'
                                                : '0 2px 14px 0 rgb(32 40 45 / 10%)'
                                        }}
                                        label={chatflowUsed.name}
                                        onClick={() => navigate(
                                            chatflowUsed.type === 'CHATFLOW'
                                                ? navigationPaths.workspace.chatflows.detail(chatflowUsed.id)
                                                : navigationPaths.workspace.agentflows.detail(chatflowUsed.id)
                                        )}
                                    ></Chip>
                                ))}
                            </Stack>
                        )}
                        {!isLoading && documentStore && !documentStore?.loaders?.length ? (
                            <Stack sx={{ alignItems: 'center', justifyContent: 'center' }} flexDirection='column'>
                                <Box sx={{ p: 2, height: 'auto' }}>
                                    <img
                                        style={{ objectFit: 'cover', height: '16vh', width: 'auto' }}
                                        src={doc_store_details_emptySVG}
                                        alt='doc_store_details_emptySVG'
                                    />
                                </Box>
                                <div>No Document Added Yet</div>
                                <StyledButton
                                    variant='contained'
                                    sx={{ borderRadius: 2, height: '100%', mt: 2, color: 'white' }}
                                    startIcon={<IconPlus />}
                                    onClick={listLoaders}
                                >
                                    Add Document Loader
                                </StyledButton>
                            </Stack>
                        ) : (
                            <TableContainer
                                sx={{ border: 1, borderColor: theme.palette.grey[900] + 25, borderRadius: 2 }}
                                component={Paper}
                            >
                                <Table sx={{ minWidth: 650 }} aria-label='simple table'>
                                    <TableHead
                                        sx={{
                                            backgroundColor: customization.isDarkMode
                                                ? theme.palette.common.black
                                                : theme.palette.grey[100],
                                            height: 56
                                        }}
                                    >
                                        <TableRow>
                                            <StyledTableCell>&nbsp;</StyledTableCell>
                                            <StyledTableCell>Loader</StyledTableCell>
                                            <StyledTableCell>Splitter</StyledTableCell>
                                            <StyledTableCell>Source(s)</StyledTableCell>
                                            <StyledTableCell>Chunks</StyledTableCell>
                                            <StyledTableCell>Chars</StyledTableCell>
                                            <StyledTableCell>Actions</StyledTableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {isLoading ? (
                                            <>
                                                <StyledTableRow>
                                                    <StyledTableCell>
                                                        <Skeleton variant='text' />
                                                    </StyledTableCell>
                                                    <StyledTableCell>
                                                        <Skeleton variant='text' />
                                                    </StyledTableCell>
                                                    <StyledTableCell>
                                                        <Skeleton variant='text' />
                                                    </StyledTableCell>
                                                    <StyledTableCell>
                                                        <Skeleton variant='text' />
                                                    </StyledTableCell>
                                                    <StyledTableCell>
                                                        <Skeleton variant='text' />
                                                    </StyledTableCell>
                                                    <StyledTableCell>
                                                        <Skeleton variant='text' />
                                                    </StyledTableCell>
                                                    <StyledTableCell>
                                                        <Skeleton variant='text' />
                                                    </StyledTableCell>
                                                </StyledTableRow>
                                                <StyledTableRow>
                                                    <StyledTableCell>
                                                        <Skeleton variant='text' />
                                                    </StyledTableCell>
                                                    <StyledTableCell>
                                                        <Skeleton variant='text' />
                                                    </StyledTableCell>
                                                    <StyledTableCell>
                                                        <Skeleton variant='text' />
                                                    </StyledTableCell>
                                                    <StyledTableCell>
                                                        <Skeleton variant='text' />
                                                    </StyledTableCell>
                                                    <StyledTableCell>
                                                        <Skeleton variant='text' />
                                                    </StyledTableCell>
                                                    <StyledTableCell>
                                                        <Skeleton variant='text' />
                                                    </StyledTableCell>
                                                    <StyledTableCell>
                                                        <Skeleton variant='text' />
                                                    </StyledTableCell>
                                                </StyledTableRow>
                                            </>
                                        ) : (
                                            <>
                                                {documentStore?.loaders &&
                                                    documentStore?.loaders.length > 0 &&
                                                    documentStore?.loaders.map((loader, index) => (
                                                        <LoaderRow
                                                            key={index}
                                                            index={index}
                                                            loader={loader}
                                                            theme={theme}
                                                            onEditClick={() => openPreviewSettings(loader.id)}
                                                            onViewChunksClick={() => {
                                                                showStoredChunks(loader.dataSource)
                                                            }}
                                                            onDeleteClick={() => onLoaderDelete(loader)}
                                                        />
                                                    ))}
                                            </>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                        {getSpecificDocumentStore.data?.status === 'STALE' && (
                            <div style={{ width: '100%', textAlign: 'center', marginTop: '20px' }}>
                                <Typography
                                    color='warning'
                                    style={{ color: 'darkred', fontWeight: 500, fontStyle: 'italic', fontSize: 12 }}
                                >
                                    Some files are pending processing. Please Refresh to get the latest status.
                                </Typography>
                            </div>
                        )}
                    </Stack>
                )}
            </MainCard>
            {showDialog && (
                <AddDocStoreDialog
                    dialogProps={dialogProps}
                    show={showDialog}
                    onCancel={() => setShowDialog(false)}
                    onConfirm={onConfirm}
                />
            )}
            {showDocumentLoaderListDialog && (
                <DocumentLoaderListDialog
                    show={showDocumentLoaderListDialog}
                    dialogProps={documentLoaderListDialogProps}
                    onCancel={() => setShowDocumentLoaderListDialog(false)}
                    onDocLoaderSelected={onDocLoaderSelected}
                />
            )}
            <ConfirmDialog />
        </>
    )
}

function LoaderRow(props) {
    const [anchorEl, setAnchorEl] = useState(null)
    const open = Boolean(anchorEl)
    const [sourceAnchorEl, setSourceAnchorEl] = useState(null);
    const [sourceDetails, setSourceDetails] = useState(null);
    const [showDialog, setShowDialog] = useState(false);
    const [dialogProps, setDialogProps] = useState({});

    const handleClick = (event) => {
        event.preventDefault()
        event.stopPropagation()
        setAnchorEl(event.currentTarget)
    }

    const handleClose = () => {
        setAnchorEl(null)
    }

    const handleSourceClick = (event, source) => {
        event.stopPropagation();
        try {
            // Parse the source data to show in popover
            const sourceData = JSON.parse(source);
            setSourceDetails(sourceData);
            setSourceAnchorEl(event.currentTarget);
        } catch (error) {
            console.error('Failed to parse source data:', error);
        }
    }

    const handleSourcePopoverClose = () => {
        setSourceAnchorEl(null);
        setSourceDetails(null);
    };

    const formatSourceDetails = (details) => {
        // Format specific fields we want to show
        return {
            'Original File Name': details.originalFileName,
            'File Name': details.fileName,
            'MIME Type': details.mimePrefix,
            'Status': details.status,
            'Storage Type': details.storageType
        };
    };

    return (
        <>
            <TableRow hover key={props.index} sx={{ '&:last-child td, &:last-child th': { border: 0 }, cursor: 'pointer' }}>
                <StyledTableCell onClick={props.onViewChunksClick} scope='row' style={{ width: '5%' }}>
                    <div
                        style={{
                            display: 'flex',
                            width: '20px',
                            height: '20px',
                            backgroundColor: props.loader?.status === 'SYNC' ? '#00e676' : '#ffe57f',
                            borderRadius: '50%'
                        }}
                    ></div>
                </StyledTableCell>

                <StyledTableCell onClick={props.onViewChunksClick} scope='row'>
                    {props.loader.loaderTypeName}
                </StyledTableCell>

                <DetailChipsCell 
                    label={props.loader?.chunkSplitter?.splitterName}
                    title="Splitter Details"
                    data={props.loader?.chunkSplitter}
                />


                <DetailChipsCell
                    labelField="originalFileName"
                    titleField="originalFileName"
                    data={props.loader.dataSource}
                />

                <DetailChipsCell 
                    label={props.loader?.stats?.totalChunks}
                    title="Chunks and Stats"
                    data={props.loader?.stats}
                />

                <DetailChipsCell 
                    label={props.loader?.stats?.totalChars}
                    title="Characters and Stats"
                    data={props.loader?.stats}
                />

                <StyledTableCell>
                    <div>
                        <Button
                            id='document-store-action-button'
                            aria-controls={open ? 'document-store-action-customized-menu' : undefined}
                            aria-haspopup='true'
                            aria-expanded={open ? 'true' : undefined}
                            disableElevation
                            onClick={(e) => handleClick(e)}
                            endIcon={<KeyboardArrowDownIcon />}
                        >
                            Options
                        </Button>
                        <StyledMenu
                            id='document-store-actions-customized-menu'
                            MenuListProps={{
                                'aria-labelledby': 'document-store-actions-customized-button'
                            }}
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleClose}
                        >
                            <MenuItem onClick={props.onEditClick} disableRipple>
                                <FileEditIcon />
                                Preview & Process
                            </MenuItem>
                            <MenuItem onClick={props.onViewChunksClick} disableRipple>
                                <FileChunksIcon />
                                View & Edit Chunks
                            </MenuItem>
                            <Divider sx={{ my: 0.5 }} />
                            <MenuItem onClick={props.onDeleteClick} disableRipple>
                                <FileDeleteIcon />
                                Delete
                            </MenuItem>
                        </StyledMenu>
                    </div>
                </StyledTableCell>
            </TableRow>

        </>
    )
}

LoaderRow.propTypes = {
    loader: PropTypes.any,
    index: PropTypes.number,
    open: PropTypes.bool,
    theme: PropTypes.any,
    onViewChunksClick: PropTypes.func,
    onEditClick: PropTypes.func,
    onDeleteClick: PropTypes.func
}

export default DocumentStoreDetails
