import { cloneDeep } from 'lodash'
import { useEffect, useState } from 'react'
import { validate as uuidValidate, v4 as uuidv4 } from 'uuid'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import ReactJson from 'flowise-react-json-view'

// Hooks
import useApi from '@/hooks/useApi'

// Material-UI
import { Skeleton, Toolbar, Box, Button, Card, CardContent, Grid, OutlinedInput, Stack, Typography, Select, FormControl, MenuItem, InputLabel } from '@mui/material'
import { useTheme, styled } from '@mui/material/styles'
import { IconScissors, IconArrowLeft, IconDatabaseImport, IconBook, IconX, IconEye } from '@tabler/icons-react'

// Project import
import MainCard from '@/ui-component/cards/MainCard'
import { StyledButton } from '@/ui-component/button/StyledButton'
import { BackdropLoader } from '@/ui-component/loading/BackdropLoader'
import DocStoreInputHandler from '@/views/docstore/DocStoreInputHandler'
import { Dropdown } from '@/ui-component/dropdown/Dropdown'
import { StyledFab } from '@/ui-component/button/StyledFab'
import ErrorBoundary from '@/ErrorBoundary'
import ExpandedChunkDialog from './ExpandedChunkDialog'
import { StyledBox } from '@/ui-component/layout/StyledBox'
import { navigationPaths } from '@/routes/path'

// API
import nodesApi from '@/api/nodes'
import documentStoreApi from '@/api/documentstore'
import documentsApi from '@/api/documentstore'

// Const
import { baseURL, gridSpacing } from '@/store/constant'
import { closeSnackbar as closeSnackbarAction, enqueueSnackbar as enqueueSnackbarAction } from '@/store/actions'

// Utils
import { initNode } from '@/utils/genericHelper'
import useNotifier from '@/utils/useNotifier'

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

// ===========================|| DOCUMENT LOADER CHUNKS ||=========================== //

const LoaderConfigPreviewChunks = () => {
    const customization = useSelector((state) => state.customization)
    const navigate = useNavigate()
    const theme = useTheme()

    const getNodeDetailsApi = useApi(nodesApi.getSpecificNode)
    const getNodesByCategoryApi = useApi(nodesApi.getNodesByCategory)
    const getSpecificLoaderApi = useApi(documentsApi.getSpecificDocumentLoader)

    const { storeId, loaderId: docLoaderNodeNameOrLoaderId } = useParams()

    const [selectedDocumentLoader, setSelectedDocumentLoader] = useState({})

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const [textSplitterNodes, setTextSplitterNodes] = useState([])
    const [splitterOptions, setTextSplitterOptions] = useState([])
    const [selectedTextSplitter, setSelectedTextSplitter] = useState({})

    const [documentChunks, setDocumentChunks] = useState([])
    const [totalChunks, setTotalChunks] = useState(0)

    const [currentPreviewCount, setCurrentPreviewCount] = useState(0)
    const [previewChunkCount, setPreviewChunkCount] = useState(20)
    const [existingLoaderFromDocStoreTable, setExistingLoaderFromDocStoreTable] = useState()

    const [showExpandedChunkDialog, setShowExpandedChunkDialog] = useState(false)
    const [expandedChunkDialogProps, setExpandedChunkDialogProps] = useState({})

    // State for previewing selected file
    const [selectedFile, setSelectedFile] = useState(null)
    const [availableFiles, setAvailableFiles] = useState([])

    const dispatch = useDispatch()

    // ==============================|| Snackbar ||============================== //
    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    const onSplitterChange = (name) => {
        const textSplitter = (textSplitterNodes ?? []).find((splitter) => splitter.name === name)
        if (textSplitter) {
            setSelectedTextSplitter(textSplitter)
        } else {
            setSelectedTextSplitter({})
        }
    }

    const onChunkClick = (selectedChunk, selectedChunkNumber) => {
        const dialogProps = {
            data: {
                selectedChunk,
                selectedChunkNumber
            }
        }
        setExpandedChunkDialogProps(dialogProps)
        setShowExpandedChunkDialog(true)
    }

    const checkMandatoryFields = () => {
        let canSubmit = true
        const inputParams = (selectedDocumentLoader.inputParams ?? []).filter((inputParam) => !inputParam.hidden)
        for (const inputParam of inputParams) {
            if (!inputParam.optional && (!selectedDocumentLoader.inputs[inputParam.name] || !selectedDocumentLoader.credential)) {
                if (inputParam.type === 'credential' && !selectedDocumentLoader.credential) {
                    canSubmit = false
                    break
                } else if (inputParam.type !== 'credential' && !selectedDocumentLoader.inputs[inputParam.name]) {
                    canSubmit = false
                    break
                }
            }
        }
        if (!canSubmit) {
            enqueueSnackbar({
                message: 'Please fill in all mandatory fields.',
                options: {
                    key: new Date().getTime() + Math.random(),
                    variant: 'warning',
                    action: (key) => (
                        <Button style={{ color: 'white' }} onClick={() => closeSnackbar(key)}>
                            <IconX />
                        </Button>
                    )
                }
            })
        }
        return canSubmit
    }

    const onPreviewChunks = async () => {
        if (checkMandatoryFields() && selectedFile) {
            setLoading(true)
            const config = getLoaderConfig(selectedFile)
            config.preview = {
                file: selectedFile,
                previewChunkCount: previewChunkCount
            }

            try {
                const previewResp = await documentStoreApi.previewChunks(config)
                if (previewResp.data) {
                    setTotalChunks(previewResp.data.totalChunks)
                    setDocumentChunks(previewResp.data.chunks)
                    setCurrentPreviewCount(previewResp.data.previewChunkCount)
                }
                setLoading(false)
            } catch (error) {
                setLoading(false)
                enqueueSnackbar({
                    message: `Failed to preview chunks: ${
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

    const onSaveAndProcess = async () => {
        if (checkMandatoryFields()) {
            setLoading(true)
            const config = getLoaderConfig()
            try {
                const processResp = await documentStoreApi.processChunks(config)
                setLoading(false)
                if (processResp.data) {
                    enqueueSnackbar({
                        message: 'File submitted for processing. Redirecting to Document Store..',
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
                    navigate(navigationPaths.documentStore.detail(storeId))
                }
            } catch (error) {
                setLoading(false)
                enqueueSnackbar({
                    message: `Failed to process chunking: ${
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

    const getLoaderConfig = () => {
        /**
         * Step 1. Set loader
         */
        let currentLoader = {}

        if (existingLoaderFromDocStoreTable) {
            currentLoader.loaderTypeId = existingLoaderFromDocStoreTable.loaderTypeId
            currentLoader.id = existingLoaderFromDocStoreTable.id
        } else {
            currentLoader.loaderTypeId = docLoaderNodeNameOrLoaderId
        }

        currentLoader.loaderTypeName = selectedDocumentLoader?.label

        // Set loader config
        if (selectedDocumentLoader.inputs) {
            currentLoader.loaderConfig = {}
            currentLoader.loaderConfig = Object.assign({}, selectedDocumentLoader.inputs)
        }

        // Set credential if needed
        if (selectedDocumentLoader.credential) {
            currentLoader.credential = selectedDocumentLoader.credential
        }

        /**
         * Step 2. Set splitter
         */
        let currentSplitter = {}
        
        // If Text splitter is set
        if (selectedTextSplitter.inputs && selectedTextSplitter.name && Object.keys(selectedTextSplitter).length > 0) {
            currentSplitter = {
                splitterId: selectedTextSplitter.name,
                splitterConfig: { ...selectedTextSplitter.inputs },

                splitterName: textSplitterNodes?.find(
                    splitter => splitter.name === selectedTextSplitter.name
                )?.label
            }
        }

        /**
         * Step 3. Generate config
         */
        const loaderProcessingConfig = {
            storeId: storeId,
            loader: currentLoader,
            chunkSplitter: currentSplitter
        }

        return loaderProcessingConfig
    }

    useEffect(() => {
        if (uuidValidate(docLoaderNodeNameOrLoaderId)) {
            // for existing loader, docLoaderNodeNameOrLoaderId is the loaderId
            getSpecificLoaderApi.request(docLoaderNodeNameOrLoaderId)
        } else {
            // for new loader, docLoaderNodeNameOrLoaderId is the loaderTypeId
            getNodeDetailsApi.request(docLoaderNodeNameOrLoaderId)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (getNodeDetailsApi.data) {
            const nodeData = cloneDeep(initNode(getNodeDetailsApi.data, uuidv4()))

            // If this is a document store edit config, set the existing input values
            if (existingLoaderFromDocStoreTable) {

                // Find the file input parameter name
                const fileInputParam = nodeData.inputParams?.find(param => 
                    param.type === 'file' || param.type === 'files'
                )
                
                if (fileInputParam) {
                    nodeData.inputs = {
                        ...nodeData.inputs,
                        [fileInputParam.name]: cloneDeep(existingLoaderFromDocStoreTable.files) || [],
                    }
                }

                // If there's a credential, set it
                if (existingLoaderFromDocStoreTable.credential) {
                    nodeData.credential = existingLoaderFromDocStoreTable.credential
                }
            }

            setSelectedDocumentLoader(nodeData)

            // Check if the loader has a text splitter, if yes, get the text splitter nodes
            const textSplitter = nodeData.inputAnchors.find((inputAnchor) => inputAnchor.name === 'textSplitter')
            if (textSplitter) {
                getNodesByCategoryApi.request('Text Splitters')
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getNodeDetailsApi.data])

    useEffect(() => {
        if (getNodesByCategoryApi.data) {
            // Set available text splitter nodes
            const nodes = []
            for (const node of getNodesByCategoryApi.data) {
                nodes.push(cloneDeep(initNode(node, uuidv4())))
            }
            setTextSplitterNodes(nodes)

            // Set options
            const options = getNodesByCategoryApi.data.map((splitter) => ({
                label: splitter.label,
                name: splitter.name
            }))
            options.unshift({ label: 'None', name: 'none' })
            setTextSplitterOptions(options)

            // If this is a document store edit config, set the existing input values
            if ( existingLoaderFromDocStoreTable?.chunkSplitter?.splitterId ) {
                const textSplitter = nodes.find((splitter) => splitter.name === existingLoaderFromDocStoreTable.chunkSplitter.splitterId)
                if (textSplitter) {
                    textSplitter.inputs = cloneDeep(existingLoaderFromDocStoreTable.chunkSplitter.splitterConfig)
                    setSelectedTextSplitter(textSplitter)
                } else {
                    setSelectedTextSplitter({})
                }
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getNodesByCategoryApi.data])

    useEffect(() => {
        if (getSpecificLoaderApi.data) {
            const currentLoader = getSpecificLoaderApi.data

            setExistingLoaderFromDocStoreTable(currentLoader)

            // Get node details
            getNodeDetailsApi.request(currentLoader.loaderTypeId)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getSpecificLoaderApi.data])

    useEffect(() => {
        if (getSpecificLoaderApi.error) {
            setError(getSpecificLoaderApi.error)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getSpecificLoaderApi.error])

    useEffect(() => {
        if (getNodeDetailsApi.error) {
            setError(getNodeDetailsApi.error)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getNodeDetailsApi.error])

    useEffect(() => {
        if (getNodesByCategoryApi.error) {
            setError(getNodesByCategoryApi.error)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getNodesByCategoryApi.error])

    // Reset selected file when available files changes
    useEffect(() => {
        // Clear selected file if it's no longer in the available success files list
        const successFiles = availableFiles.filter(f => f.status === 'success')
        
        if (selectedFile && !successFiles.some(f => f.id === selectedFile.id)) {
            setSelectedFile(null)
        }

        // If there's only one successful file, automatically select it
        if (successFiles.length === 1 && !selectedFile) {
            setSelectedFile(successFiles[0])
        }
    }, [availableFiles])

    // Update preview chunks when selected file changes
    useEffect(() => {
        if (selectedFile) {
            // Reset preview chunks when file changes
            setDocumentChunks([])
            setTotalChunks(0)
            setCurrentPreviewCount(0)
        }
    }, [selectedFile])

    return (
        <>
            <MainCard>
                {error ? (
                    <ErrorBoundary error={error} />
                ) : (
                    <Stack flexDirection='column'>
                        <Box sx={{ flexGrow: 1, py: 1.25, width: '100%' }}>
                            <Toolbar
                                disableGutters={true}
                                sx={{
                                    p: 0,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    width: '100%'
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'row' }}>
                                    <StyledFab size='small' color='secondary' aria-label='back' title='Back' onClick={() => navigate(-1)}>
                                        <IconArrowLeft />
                                    </StyledFab>
                                    <Typography sx={{ ml: 2, mr: 2 }} variant='h3'>
                                        {selectedDocumentLoader?.label}
                                    </Typography>
                                    <div
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: 'white',
                                            boxShadow: '0 2px 14px 0 rgb(32 40 45 / 25%)'
                                        }}
                                    >
                                        {selectedDocumentLoader?.name ? (
                                            <img
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    padding: 7,
                                                    borderRadius: '50%',
                                                    objectFit: 'contain'
                                                }}
                                                alt={selectedDocumentLoader?.name ?? 'docloader'}
                                                src={`${baseURL}/api/v1/node-icon/${selectedDocumentLoader?.name}`}
                                            />
                                        ) : (
                                            <IconBook color='black' />
                                        )}
                                    </div>
                                </Box>
                                <Box>
                                    <StyledButton
                                        variant='contained'
                                        onClick={onSaveAndProcess}
                                        sx={{ borderRadius: 2, height: '100%' }}
                                        startIcon={<IconDatabaseImport />}
                                    >
                                        Process
                                    </StyledButton>
                                </Box>
                            </Toolbar>
                        </Box>
                        <Box>
                            <Grid container spacing='2'>
                                <Grid item xs={4} md={6} lg={6} sm={4}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            paddingRight: 15
                                        }}
                                    >
                                        {selectedDocumentLoader &&
                                            Object.keys(selectedDocumentLoader).length > 0 &&
                                            (selectedDocumentLoader.inputParams ?? [])
                                                .filter((inputParam) => !inputParam.hidden)
                                                .map((inputParam, index) => (
                                                    <DocStoreInputHandler
                                                        key={index}
                                                        inputParam={inputParam}
                                                        data={selectedDocumentLoader}
                                                        storeId={storeId}
                                                        onUploadFileChange={setAvailableFiles}
                                                    />
                                                ))}
                                        {textSplitterNodes && textSplitterNodes.length > 0 && (
                                            <>
                                                <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'row', p: 2, mt: 5 }}>
                                                    <Typography sx={{ mr: 2 }} variant='h3'>
                                                        {(splitterOptions ?? []).find(
                                                            (splitter) => splitter.name === selectedTextSplitter?.name
                                                        )?.label ?? 'Select Text Splitter'}
                                                    </Typography>
                                                    <div
                                                        style={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: '50%',
                                                            backgroundColor: 'white',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            boxShadow: '0 2px 14px 0 rgb(32 40 45 / 25%)'
                                                        }}
                                                    >
                                                        {selectedTextSplitter?.name ? (
                                                            <img
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    padding: 7,
                                                                    borderRadius: '50%',
                                                                    objectFit: 'contain'
                                                                }}
                                                                alt={selectedTextSplitter?.name ?? 'textsplitter'}
                                                                src={`${baseURL}/api/v1/node-icon/${selectedTextSplitter?.name}`}
                                                            />
                                                        ) : (
                                                            <IconScissors color='black' />
                                                        )}
                                                    </div>
                                                </Box>
                                                <Box sx={{ p: 2 }}>
                                                    <Typography>Splitter</Typography>
                                                    <Dropdown
                                                        key={JSON.stringify(selectedTextSplitter)}
                                                        name='textSplitter'
                                                        options={splitterOptions}
                                                        onSelect={(newValue) => onSplitterChange(newValue)}
                                                        value={selectedTextSplitter?.name ?? 'none'}
                                                    />
                                                </Box>
                                            </>
                                        )}
                                        {Object.keys(selectedTextSplitter).length > 0 &&
                                            (selectedTextSplitter.inputParams ?? [])
                                                .filter((inputParam) => !inputParam.hidden)
                                                .map((inputParam, index) => (
                                                    <DocStoreInputHandler key={index} data={selectedTextSplitter} inputParam={inputParam} />
                                                ))}
                                    </div>
                                </Grid>
                                
                                <Grid item xs={8} md={6} lg={6} sm={8}>
                                    {true && (
                                        <>
                                            <Typography variant="h3" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <IconEye /> Preview
                                            </Typography>
                                            
                                            <StyledBox sx={{
                                                borderRadius: 2,
                                                p: 3,
                                                mb: 3
                                            }}>
                                                <Grid container spacing={3}>
                                                    <Grid item xs={12} md={6}>
                                                        <Typography>Select File to Preview</Typography>
                                                        <FormControl fullWidth sx={{ mt: 1 }}>
                                                            <Select
                                                                size="small"
                                                                value={selectedFile?.id || ''}
                                                                onChange={(e) => {
                                                                    const file = availableFiles.find(f => f.id === e.target.value)
                                                                    setSelectedFile(file || null)
                                                                }}
                                                            >
                                                                <MenuItem value="">Select a file</MenuItem>
                                                                {availableFiles
                                                                    ?.filter(file => file.status === 'success')
                                                                    ?.map((file) => (
                                                                        <MenuItem key={file.id} value={file.id}>
                                                                            {file.name} ({file.id})
                                                                        </MenuItem>
                                                                    ))}
                                                            </Select>
                                                        </FormControl>
                                                    </Grid>
                                                    <Grid item xs={12} md={6}>
                                                        <Typography>Show Chunks in Preview</Typography>
                                                        <OutlinedInput
                                                            size='small'
                                                            multiline={false}
                                                            sx={{ mt: 1, width: '100%' }}
                                                            type='number'
                                                            key='previewChunkCount'
                                                            onChange={(e) => setPreviewChunkCount(e.target.value)}
                                                            value={previewChunkCount ?? 25}
                                                        />
                                                    </Grid>
                                                </Grid>

                                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                                    <StyledButton
                                                        color='secondary'
                                                        aria-label='preview'
                                                        title='Preview'
                                                        variant='contained'
                                                        onClick={onPreviewChunks}
                                                        disabled={!selectedFile || !previewChunkCount || !checkMandatoryFields()}
                                                        sx={{ borderRadius: 2 }}
                                                        startIcon={<IconEye />}
                                                    >
                                                        Preview Chunks
                                                    </StyledButton>
                                                </Box>
                                            </StyledBox>

                                            {documentChunks.length > 0 && (
                                                <Typography sx={{ mb: 2 }} variant='h4'>
                                                    Showing {currentPreviewCount} of {totalChunks} Chunks
                                                </Typography>
                                            )}

                                            <div style={{ height: '800px', overflow: 'scroll', padding: '5px' }}>
                                                <Grid container spacing={2}>
                                                    {documentChunks?.map((row, index) => (
                                                        <Grid item lg={6} md={6} sm={6} xs={6} key={index}>
                                                            <CardWrapper
                                                                content={false}
                                                                onClick={() => onChunkClick(row, index + 1)}
                                                                sx={{
                                                                    border: 1,
                                                                    borderColor: theme.palette.grey[900] + 25,
                                                                    borderRadius: 2
                                                                }}
                                                            >
                                                                <Card>
                                                                    <CardContent sx={{ p: 1 }}>
                                                                        <Typography sx={{ wordWrap: 'break-word', mb: 1 }} variant='h5'>
                                                                            {`#${index + 1}. Characters: ${row.pageContent.length}`}
                                                                        </Typography>
                                                                        <Typography sx={{ wordWrap: 'break-word' }} variant='body2'>
                                                                            {row.pageContent}
                                                                        </Typography>
                                                                        <ReactJson
                                                                            theme={customization.isDarkMode ? 'ocean' : 'rjv-default'}
                                                                            style={{ paddingTop: 10 }}
                                                                            src={row.metadata}
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
                                        </>
                                    )}
                                </Grid>
                                
                            </Grid>
                        </Box>
                    </Stack>
                )}
            </MainCard>
            <ExpandedChunkDialog
                show={showExpandedChunkDialog}
                isReadOnly={true}
                dialogProps={expandedChunkDialogProps}
                onCancel={() => setShowExpandedChunkDialog(false)}
            ></ExpandedChunkDialog>
            {loading && <BackdropLoader open={loading} />}
        </>
    )
}

export default LoaderConfigPreviewChunks
