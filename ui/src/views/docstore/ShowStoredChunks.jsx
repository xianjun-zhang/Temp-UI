import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation, useParams, matchPath } from 'react-router-dom'
import ReactJson from 'flowise-react-json-view'

// material-ui
import { Box, Card, Button, Grid, IconButton, Stack, Typography } from '@mui/material'
import { useTheme, styled } from '@mui/material/styles'
import CardContent from '@mui/material/CardContent'
import { IconLanguage, IconX, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import chunks_emptySVG from '@/assets/images/chunks_empty.svg'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import { BackdropLoader } from '@/ui-component/loading/BackdropLoader'
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'
import ExpandedChunkDialog from './ExpandedChunkDialog'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import { navigationPaths, PARAMS } from '@/routes/path'

// API
import documentsApi from '@/api/documentstore'

// Hooks
import useApi from '@/hooks/useApi'
import useConfirm from '@/hooks/useConfirm'
import useNotifier from '@/utils/useNotifier'

// store
import { closeSnackbar as closeSnackbarAction, enqueueSnackbar as enqueueSnackbarAction } from '@/store/actions'

const CardWrapper = styled(MainCard)(({ theme }) => ({
    background: theme.palette.card.main,
    color: theme.darkTextPrimary,
    overflow: 'auto',
    position: 'relative',
    boxShadow: '0 2px 14px 0 rgb(32 40 45 / 8%)',
    cursor: 'pointer',
    '&:hover': {
        background: theme.palette.card.hover,
        boxShadow: '0 2px 14px 0 rgb(32 40 45 / 20%)'
    },
    maxHeight: '250px',
    minHeight: '250px',
    maxWidth: '100%',
    overflowWrap: 'break-word',
    whiteSpace: 'pre-line',
    padding: 1
}))

const ShowStoredChunks = () => {
    const customization = useSelector((state) => state.customization)
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const theme = useTheme()
    const { confirm } = useConfirm()

    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const getChunksApi = useApi(documentsApi.getFileChunks)

    const { storeId, fileId } = useParams()

    if (!storeId || !fileId) {
        if (!storeId) {
            navigate(navigationPaths.documentStore.root())
        } else {
            navigate(navigationPaths.documentStore.detail(storeId))
        }
    }

    const [documentChunks, setDocumentChunks] = useState([])
    const [totalChunks, setTotalChunks] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [start, setStart] = useState(1)
    const [end, setEnd] = useState(50)
    const [loading, setLoading] = useState(false)
    const [showExpandedChunkDialog, setShowExpandedChunkDialog] = useState(false)
    const [expandedChunkDialogProps, setExpandedChunkDialogProps] = useState({})
    const [fileNames, setFileNames] = useState([])

    
    // Add new state for files
    const location = useLocation()
    const fileSources = location.state?.fileSources
    const [selectedFileId, setSelectedFileId] = useState(fileId) // Initialize with current fileId

    const chunkSelected = (chunkId) => {
        const selectedChunk = documentChunks.find((chunk) => chunk.id === chunkId)
            
        if (!selectedChunk) {
                console.error('No chunk found with id:', chunkId);
                return;
        }

        const selectedChunkNumber = documentChunks.findIndex((chunk) => chunk.id === chunkId) + start
        
        const dialogProps = {
            data: {
                selectedChunk,
                selectedChunkNumber
            }
        }

        setExpandedChunkDialogProps(dialogProps)
        setShowExpandedChunkDialog(true)
    }

    const onChunkEdit = async (newPageContent, newMetadata, chunk) => {
        setLoading(true)
        setShowExpandedChunkDialog(false)
        try {
            const editResp = await documentsApi.editChunkFromStore(
                storeId,
                chunk.fileId,
                chunk.id,
                { pageContent: newPageContent, metadata: newMetadata },
                true
            )
            if (editResp.data) {
                enqueueSnackbar({
                    message: 'Document chunk successfully edited!',
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
                getChunksApi.request(storeId, selectedFileId || fileId, currentPage)
            }
            setLoading(false)
        } catch (error) {
            setLoading(false)
            enqueueSnackbar({
                message: `Failed to edit chunk: ${
                    typeof error.response.data === 'object' ? error.response.data.message : error.response.data
                }`,
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'error',
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
        }
    }

    const onDeleteChunk = async (chunk) => {
        const confirmPayload = {
            title: `Delete`,
            description: `Delete chunk ${chunk.id} ? This action cannot be undone.`,
            confirmButtonName: 'Delete',
            cancelButtonName: 'Cancel'
        }
        const isConfirmed = await confirm(confirmPayload)

        if (isConfirmed) {
            setLoading(true)
            setShowExpandedChunkDialog(false)
            try {
                const delResp = await documentsApi.deleteChunkFromStore(storeId, chunk.fileId, chunk.id)
                if (delResp.data) {
                    enqueueSnackbar({
                        message: 'Document chunk successfully deleted!',
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
                    getChunksApi.request(storeId, selectedFileId || fileId, currentPage)
                }
                setLoading(false)
            } catch (error) {
                setLoading(false)
                enqueueSnackbar({
                    message: `Failed to delete chunk: ${
                        typeof error.response.data === 'object' ? error.response.data.message : error.response.data
                    }`,
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'error',
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

    useEffect(() => {
        if (fileSources) {
            try {
                // Parse the file sources and create file name mapping
                const filesData = fileSources.map(source => {
                    const parsed = JSON.parse(source)
                    return {
                        id: parsed.id,
                        name: parsed.originalFileName,
                        // Keep other data if needed
                        data: parsed
                    }
                })
                setFileNames(filesData)
            } catch (error) {
                console.error('Error parsing file sources:', error)
            }
        }
        setLoading(true)
        getChunksApi.request(storeId, selectedFileId || fileId, currentPage)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Add handler for file selection
    const handleFileChange = (newFileId) => {
        setSelectedFileId(newFileId)
        setCurrentPage(1) // Reset to first page
        setLoading(true)
        getChunksApi.request(storeId, newFileId, 1) // Use page 1 since we're resetting
    }


    const changePage = (newPage) => {
        setLoading(true)
        setCurrentPage(newPage)
        getChunksApi.request(storeId, selectedFileId || fileId, newPage)
    }

    useEffect(() => {
        if (getChunksApi.data) {
            const data = getChunksApi.data
            
            setTotalChunks(data.totalChunksInFile)
            setDocumentChunks(data.chunks)
            setLoading(false)
            setCurrentPage(data.currentPage)
            // Update start and end based on current page and total count
            const newStart = data.currentPage * 50 - 49
            const newEnd = Math.min(data.currentPage * 50, data.totalChunksInFile)

            setStart(newStart)
            setEnd(newEnd)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getChunksApi.data])

    return (
        <>
            <MainCard style={{ position: 'relative' }}>
                <Stack flexDirection='column' sx={{ gap: 1 }}>
                    <ViewHeader
                        isBackButton={true}
                        search={false}
                        title={getChunksApi.data?.file?.loaders[0]?.loaderTypeName || getChunksApi.data?.storeName}
                        description={getChunksApi.data?.file?.loaders[0]?.chunkSplitter?.splitterName || getChunksApi.data?.description}
                        onBack={() => navigate(-1)}
                    ></ViewHeader>
                    <div style={{ width: '100%' }}>
                        {fileNames.length > 0 && (
                            <Grid sx={{ mt: 1 }} container>
                                {fileNames.map((file, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleFileChange(file.id)}
                                        style={{
                                            paddingLeft: '15px',
                                            paddingRight: '15px',
                                            paddingTop: '10px',
                                            paddingBottom: '10px',
                                            fontSize: '0.9rem',
                                            width: 'max-content',
                                            borderRadius: '25px',
                                            boxShadow: customization.isDarkMode
                                                ? '0 2px 14px 0 rgb(255 255 255 / 20%)'
                                                : '0 2px 14px 0 rgb(32 40 45 / 20%)',
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginRight: '10px',
                                            cursor: 'pointer',
                                            backgroundColor: selectedFileId === file.id ? theme.palette.primary.main : 'transparent',
                                            color: selectedFileId === file.id ? 'white' : 'inherit'
                                        }}
                                    >
                                        {file.name}
                                    </div>
                                ))}
                            </Grid>
                        )}
                        <div
                            style={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                alignContent: 'center',
                                overflow: 'hidden',
                                marginTop: 15,
                                marginBottom: 10
                            }}
                        >
                            <div style={{ marginRight: 20, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                <IconButton
                                    size='small'
                                    onClick={() => changePage(currentPage - 1)}
                                    style={{ marginRight: 10 }}
                                    variant='outlined'
                                    disabled={currentPage === 1}
                                >
                                    <IconChevronLeft
                                        color={
                                            customization.isDarkMode
                                                ? currentPage === 1
                                                    ? '#616161'
                                                    : 'white'
                                                : currentPage === 1
                                                ? '#e0e0e0'
                                                : 'black'
                                        }
                                    />
                                </IconButton>
                                Showing {Math.min(start, totalChunks)}-{end} of {totalChunks} chunks
                                <IconButton
                                    size='small'
                                    onClick={() => changePage(currentPage + 1)}
                                    style={{ marginLeft: 10 }}
                                    variant='outlined'
                                    disabled={end >= totalChunks}
                                >
                                    <IconChevronRight
                                        color={
                                            customization.isDarkMode
                                                ? end >= totalChunks
                                                    ? '#616161'
                                                    : 'white'
                                                : end >= totalChunks
                                                ? '#e0e0e0'
                                                : 'black'
                                        }
                                    />
                                </IconButton>
                            </div>
                            <div style={{ marginRight: 20, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                <IconLanguage style={{ marginRight: 10 }} size={20} />
                                {getChunksApi.data?.file?.stats?.totalChars?.toLocaleString()} characters
                            </div>
                        </div>
                    </div>
                    <div>
                        <Grid container spacing={2}>
                            {!documentChunks.length && (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        width: '100%'
                                    }}
                                >
                                    <Box sx={{ mt: 5, p: 2, height: 'auto' }}>
                                        <img
                                            style={{ objectFit: 'cover', height: '16vh', width: 'auto' }}
                                            src={chunks_emptySVG}
                                            alt='chunks_emptySVG'
                                        />
                                    </Box>
                                    <div>No Chunks</div>
                                </div>
                            )}
                            {documentChunks.length > 0 &&
                                documentChunks.map((row, index) => (
                                    <Grid item lg={4} md={4} sm={6} xs={6} key={index}>
                                        <CardWrapper
                                            content={false}
                                            onClick={() => chunkSelected(row.id)}
                                            sx={{ border: 1, borderColor: theme.palette.grey[900] + 25, borderRadius: 2 }}
                                        >
                                            <Card>
                                                <CardContent sx={{ p: 2 }}>
                                                    <Typography sx={{ wordWrap: 'break-word', mb: 1 }} variant='h5'>
                                                        {`#${row.chunkIndex}. Characters: ${row.pageContent.length}`}
                                                    </Typography>
                                                    <Typography sx={{ wordWrap: 'break-word' }} variant='body2'>
                                                        {row.pageContent}
                                                    </Typography>
                                                    <ReactJson
                                                        theme={customization.isDarkMode ? 'ocean' : 'rjv-default'}
                                                        style={{ paddingTop: 10 }}
                                                        src={row.metadata ? JSON.parse(row.metadata) : {}}
                                                        name={null}
                                                        quotesOnKeys={false}
                                                        enableClipboard={false}
                                                        displayDataTypes={false}
                                                        collapsed={1}
                                                    />
                                                </CardContent>
                                            </Card>
                                        </CardWrapper>
                                    </Grid>
                                ))}
                        </Grid>
                    </div>
                </Stack>
            </MainCard>
            <ConfirmDialog />
            <ExpandedChunkDialog
                show={showExpandedChunkDialog}
                dialogProps={expandedChunkDialogProps}
                onCancel={() => setShowExpandedChunkDialog(false)}
                onChunkEdit={(newPageContent, newMetadata, selectedChunk) => onChunkEdit(newPageContent, newMetadata, selectedChunk)}
                onDeleteChunk={(selectedChunk) => onDeleteChunk(selectedChunk)}
            ></ExpandedChunkDialog>
            {loading && <BackdropLoader open={loading} />}
        </>
    )
}

export default ShowStoredChunks
