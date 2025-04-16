import { useEffect, useRef, useState, useCallback, useContext, lazy } from 'react'
import ReactFlow, { addEdge, Controls, Background, useNodesState, useEdgesState, NodeResizer } from 'reactflow'
import 'reactflow/dist/style.css'

import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation, useParams, matchPath } from 'react-router-dom'
import {
    SET_CHATFLOW,
    enqueueSnackbar as enqueueSnackbarAction,
    closeSnackbar as closeSnackbarAction
} from '@/store/actions'
import { useCanvasDirtyState } from '@/hooks/useDirtyState'
import { omit, cloneDeep } from 'lodash'

// material-ui
import { Toolbar, Box, AppBar, Button, Fab, IconButton, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import CanvasNode from './CanvasNode'
import ButtonEdge from './ButtonEdge'
import { StickyNoteV2 } from './StickyNoteV2'
import CanvasHeader from './CanvasHeader'
import ConfirmDialog from '@/ui-component/dialog/ConfirmDialog'
import { VectorStorePopUp } from '@/views/vectorstore/VectorStorePopUp'
import { flowContext } from '@/store/context/ReactFlowContext'
import {getWorkflowDataFromJSON} from '@/utils/importHelper'

// Error page
import Loadable from '@/ui-component/loading/Loadable'
const NotFound = Loadable(lazy(() => import('@/views/errorpage/error404')))

// API
import nodesApi from '@/api/nodes'
import chatflowsApi from '@/api/chatflows'

// Hooks
import useApi from '@/hooks/useApi'
import useConfirm from '@/hooks/useConfirm'

// icons
import { IconX, IconRefreshAlert, IconAlignLeft2 } from '@tabler/icons-react'

// utils
import {
    getUniqueNodeId,
    initNode,
    rearrangeToolsOrdering,
    getUpsertDetails,
    updateOutdatedNodeData,
    updateOutdatedNodeEdge
} from '@/utils/genericHelper'
import useNotifier from '@/utils/useNotifier'
import { usePrompt } from '@/utils/usePrompt'

// const
import { BITFLOW_CREDENTIAL_ID } from '@/store/constant'
import { navigationPaths, PARAMS } from '@/routes/path'
import { useHandleSelection } from './EnhancedHandle'
import NodesDialog from './NodesDialog'
import CanvasActionButtons from './CanvasActionButtons'

const nodeTypes = { 
    customNode: (props) => {
        const { reactFlowInstance } = useContext(flowContext)
        const {
            selectedHandle,
            handleClick,
        } = useHandleSelection(reactFlowInstance)

        return (
            <>
                <CanvasNode 
                    {...props} 
                    selectedHandle={selectedHandle}
                    handleClick={handleClick}
                />
            </>
        )
    }, 
    stickyNote: (props) => (
        <>
            <StickyNoteV2 {...props} />
        </>
    )
}
const edgeTypes = { buttonedge: ButtonEdge }

// ==============================|| CANVAS ||============================== //

const Canvas = () => {
    const theme = useTheme()
    const navigate = useNavigate()

    const { state, pathname } = useLocation()
    const templateFlowData = state ? state.templateFlowData : ''

    const { id: rawChatflowId } = useParams()
    const chatflowId = rawChatflowId && rawChatflowId === PARAMS.NEW ? '' : rawChatflowId

    const agentPattern = matchPath(
        { path: `${navigationPaths.workspace.agentflows.root()}/:id` }, 
        pathname
    )
    const isAgentCanvas = Boolean(agentPattern)
    const canvasTitle = isAgentCanvas ? 'Agentflow' : 'Chatflow'
    const flowType = isAgentCanvas ? 'MULTIAGENT' : 'CHATFLOW'

    const { confirm } = useConfirm()

    const dispatch = useDispatch()
    const canvas = useSelector((state) => state.canvas)
    const [canvasDataStore, setCanvasDataStore] = useState(canvas)
    const [chatflow, setChatflow] = useState(null)
    const { reactFlowInstance, setReactFlowInstance, deleteNode } = useContext(flowContext)
    const [showNotFound, setShowNotFound] = useState(false)

    const { setDirty, removeDirty } = useCanvasDirtyState()

    // ==============================|| Snackbar ||============================== //

    useNotifier()
    const enqueueSnackbar = (...args) => dispatch(enqueueSnackbarAction(...args))
    const closeSnackbar = (...args) => dispatch(closeSnackbarAction(...args))

    // ==============================|| ReactFlow ||============================== //

    const [nodes, setNodes, onNodesChange] = useNodesState()
    const [edges, setEdges, onEdgesChange] = useEdgesState()

    const [selectedNode, setSelectedNode] = useState(null)
    const [isUpsertButtonEnabled, setIsUpsertButtonEnabled] = useState(false)
    const [isSyncNodesButtonEnabled, setIsSyncNodesButtonEnabled] = useState(false)

    const reactFlowWrapper = useRef(null)

    // ==============================|| Chatflow API ||============================== //

    const getNodesApi = useApi(nodesApi.getAllNodes)
    const createNewChatflowApi = useApi(chatflowsApi.createNewChatflow)
    const updateChatflowApi = useApi(chatflowsApi.updateChatflow)
    const getSpecificChatflowApi = useApi(chatflowsApi.getSpecificChatflow)

    // ==============================|| Events & Actions ||============================== //

    const onConnect = (params) => {
        const newEdge = {
            ...params,
            type: 'buttonedge',
            id: `${params.source}-${params.sourceHandle}-${params.target}-${params.targetHandle}`
        }

        const targetNodeId = params.targetHandle.split('-')[0]
        const sourceNodeId = params.sourceHandle.split('-')[0]
        const targetInput = params.targetHandle.split('-')[2]

        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === targetNodeId) {
                    setTimeout(() => setDirty(), 0)
                    let value
                    const inputAnchor = node.data.inputAnchors.find((ancr) => ancr.name === targetInput)
                    const inputParam = node.data.inputParams.find((param) => param.name === targetInput)

                    if (inputAnchor && inputAnchor.list) {
                        const newValues = node.data.inputs[targetInput] || []
                        if (targetInput === 'tools') {
                            rearrangeToolsOrdering(newValues, sourceNodeId)
                        } else {
                            newValues.push(`{{${sourceNodeId}.data.instance}}`)
                        }
                        value = newValues
                    } else if (inputParam && inputParam.acceptVariable) {
                        value = node.data.inputs[targetInput] || ''
                    } else {
                        value = `{{${sourceNodeId}.data.instance}}`
                    }
                    node.data = {
                        ...node.data,
                        inputs: {
                            ...node.data.inputs,
                            [targetInput]: value
                        }
                    }
                }
                return node
            })
        )

        setEdges((eds) => addEdge(newEdge, eds))
    }

    const handleLoadFlowFile = (fileContent) => {
        try {
            const flowData = getWorkflowDataFromJSON(fileContent, flowType)
            handleLoadFlowData(flowData)

            dispatch(
                enqueueSnackbarAction({
                    message: `Import ${flowType.toLowerCase()} successfully`,
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
                })
            )
        } catch (error) {
            console.error('Error importing chatflow:', error)
            dispatch(
                enqueueSnackbarAction({
                    message: `Failed to import ${flowType.toLowerCase()}: ${error.message}`,
                    options: {
                        key: new Date().getTime() + Math.random(),
                        variant: 'error',
                        autoHideDuration: 5000,
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
                })
            )
        }
    }

    const handleLoadFlowData = (flowCanvasData) => {
        try {
            const flowData = JSON.parse(flowCanvasData)

            setNodes(flowData.nodes || [])
            setEdges(flowData.edges || [])
            setTimeout(() => setDirty(), 0)
        } catch (e) {
            console.error(e)
        }
    }

    const handleDeleteFlow = async () => {
        const confirmPayload = {
            title: `Delete`,
            description: `Delete ${canvasTitle} ${chatflow.name}?`,
            confirmButtonName: 'Delete',
            cancelButtonName: 'Cancel'
        }
        const isConfirmed = await confirm(confirmPayload)

        if (isConfirmed) {
            try {
                await chatflowsApi.deleteChatflow(chatflow.id)
                localStorage.removeItem(`${chatflow.id}_INTERNAL`)
                navigate(isAgentCanvas ? navigationPaths.workspace.agentflows.root() : navigationPaths.workspace.chatflows.root())
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

    const [previousPath] = useState(isAgentCanvas 
        ? navigationPaths.workspace.agentflows.root()
        : navigationPaths.workspace.chatflows.root()
    )

    const handleSaveFlow = (chatflowName) => {
        if (reactFlowInstance) {
            const nodes = reactFlowInstance.getNodes().map((node) => {
                const nodeData = cloneDeep(node.data)
                if (Object.prototype.hasOwnProperty.call(nodeData.inputs, BITFLOW_CREDENTIAL_ID)) {
                    nodeData.credential = nodeData.inputs[BITFLOW_CREDENTIAL_ID]
                    nodeData.inputs = omit(nodeData.inputs, [BITFLOW_CREDENTIAL_ID])
                }
                node.data = {
                    ...nodeData,
                    selected: false
                }
                return node
            })

            const rfInstanceObject = reactFlowInstance.toObject()
            rfInstanceObject.nodes = nodes
            const flowData = JSON.stringify(rfInstanceObject)

            if (!chatflow.id) {
                const newChatflowBody = {
                    name: chatflowName,
                    deployed: false,
                    isPublic: false,
                    flowData,
                    type: isAgentCanvas ? 'MULTIAGENT' : 'CHATFLOW'
                }
                createNewChatflowApi.request(newChatflowBody)
            } else {
                const updateBody = {
                    name: chatflowName,
                    flowData
                }
                updateChatflowApi.request(chatflow.id, updateBody)
            }
        }
    }

    const onDragOver = useCallback((event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
    }, [])

    const onDrop = useCallback(
        (event) => {
            event.preventDefault()
            const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
            let nodeData = event.dataTransfer.getData('application/reactflow')

            // check if the dropped element is valid
            if (typeof nodeData === 'undefined' || !nodeData) {
                return
            }

            nodeData = JSON.parse(nodeData)

            const position = reactFlowInstance.project({
                x: event.clientX - reactFlowBounds.left - 100,
                y: event.clientY - reactFlowBounds.top - 50
            })

            const newNodeId = getUniqueNodeId(nodeData, reactFlowInstance.getNodes())

            const newNode = {
                id: newNodeId,
                position,
                type: nodeData.type !== 'StickyNote' ? 'customNode' : 'stickyNote',
                data: initNode(nodeData, newNodeId),
                selected: true,
                // Add default dimensions for sticky notes
                ...(nodeData.type === 'StickyNote' && {
                    style: {
                        width: 300,    // Default width
                        height: 300    // Default height
                    }
                })
            }

            // setSelectedNode(newNode)
            setNodes((nds) => nds.concat(newNode))
            setTimeout(() => setDirty(), 0)
        },
        // eslint-disable-next-line
        [reactFlowInstance]
    )

    const syncNodes = () => {
        const componentNodes = canvas.componentNodes

        const cloneNodes = cloneDeep(nodes)
        const cloneEdges = cloneDeep(edges)
        let toBeRemovedEdges = []

        for (let i = 0; i < cloneNodes.length; i++) {
            const node = cloneNodes[i]
            const componentNode = componentNodes.find((cn) => cn.name === node.data.name)
            if (componentNode && componentNode.version > node.data.version) {
                const clonedComponentNode = cloneDeep(componentNode)
                cloneNodes[i].data = updateOutdatedNodeData(clonedComponentNode, node.data)
                toBeRemovedEdges.push(...updateOutdatedNodeEdge(cloneNodes[i].data, cloneEdges))
            }
        }

        setNodes(cloneNodes)
        setEdges(cloneEdges.filter((edge) => !toBeRemovedEdges.includes(edge)))
        setDirty()
        setIsSyncNodesButtonEnabled(false)
    }

    const saveChatflowSuccess = () => {
        removeDirty()
        enqueueSnackbar({
            message: `${canvasTitle} saved`,
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

    const errorFailed = (message) => {
        enqueueSnackbar({
            message,
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

    const checkIfUpsertAvailable = (nodes, edges) => {
        const upsertNodeDetails = getUpsertDetails(nodes, edges)
        if (upsertNodeDetails.length) setIsUpsertButtonEnabled(true)
        else setIsUpsertButtonEnabled(false)
    }

    const checkIfSyncNodesAvailable = (nodes) => {
        const componentNodes = canvas.componentNodes

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i]
            const componentNode = componentNodes.find((cn) => cn.name === node.data.name)
            if (componentNode && componentNode.version > node.data.version) {
                setIsSyncNodesButtonEnabled(true)
                return
            }
        }

        setIsSyncNodesButtonEnabled(false)
    }

    // ==============================|| useEffect ||============================== //

    // Get specific chatflow successful
    useEffect(() => {
        if (getSpecificChatflowApi.data) {
            const chatflow = getSpecificChatflowApi.data
            const initialFlow = chatflow.flowData ? JSON.parse(chatflow.flowData) : []
            setNodes(initialFlow.nodes || [])
            setEdges(initialFlow.edges || [])
            dispatch({ type: SET_CHATFLOW, chatflow })
        } else if (getSpecificChatflowApi.error) {
            setShowNotFound(true)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getSpecificChatflowApi.data, getSpecificChatflowApi.error])

    // Create new chatflow successful
    useEffect(() => {
        if (createNewChatflowApi.data) {
            const chatflow = createNewChatflowApi.data
            dispatch({ type: SET_CHATFLOW, chatflow })
            saveChatflowSuccess()
            
            // Replace the current URL and add state information
            navigate(
                isAgentCanvas 
                    ? navigationPaths.workspace.agentflows.detail(chatflow.id)
                    : navigationPaths.workspace.chatflows.detail(chatflow.id),
                {
                    replace: true,
                    state: { from: previousPath }
                }
            )
        } else if (createNewChatflowApi.error) {
            errorFailed(`Failed to save ${canvasTitle}: ${createNewChatflowApi.error.response.data.message}`)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [createNewChatflowApi.data, createNewChatflowApi.error])

    // Update chatflow successful
    useEffect(() => {
        if (updateChatflowApi.data) {
            dispatch({ type: SET_CHATFLOW, chatflow: updateChatflowApi.data })
            saveChatflowSuccess()
        } else if (updateChatflowApi.error) {
            errorFailed(`Failed to save ${canvasTitle}: ${updateChatflowApi.error.response.data.message}`)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [updateChatflowApi.data, updateChatflowApi.error])

    useEffect(() => {
        setChatflow(canvasDataStore.chatflow)
        if (canvasDataStore.chatflow) {
            const flowData = canvasDataStore.chatflow.flowData ? JSON.parse(canvasDataStore.chatflow.flowData) : []
            checkIfUpsertAvailable(flowData.nodes || [], flowData.edges || [])
            checkIfSyncNodesAvailable(flowData.nodes || [])
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canvasDataStore.chatflow])

    // Initialization
    useEffect(() => {
        setIsSyncNodesButtonEnabled(false)
        setIsUpsertButtonEnabled(false)
        if (chatflowId) {
            getSpecificChatflowApi.request(chatflowId)
        } else {
            if (localStorage.getItem('duplicatedFlowData')) {
                handleLoadFlowData(localStorage.getItem('duplicatedFlowData'))
                setTimeout(() => localStorage.removeItem('duplicatedFlowData'), 0)
            } else {
                setNodes([])
                setEdges([])
            }
            dispatch({
                type: SET_CHATFLOW,
                chatflow: {
                    name: `Untitled ${canvasTitle}`
                }
            })
        }

        getNodesApi.request()

        // Clear dirty state before leaving and remove any ongoing test triggers and webhooks
        return () => {
            setTimeout(() => removeDirty(), 0)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        setCanvasDataStore(canvas)
    }, [canvas])

    useEffect(() => {
        function handlePaste(e) {
            const pasteData = e.clipboardData.getData('text')
            //TODO: prevent paste event when input focused, temporary fix: catch chatflow syntax
            if (pasteData.includes('{"nodes":[') && pasteData.includes('],"edges":[')) {
                handleLoadFlowData(pasteData)
            }
        }

        window.addEventListener('paste', handlePaste)

        return () => {
            window.removeEventListener('paste', handlePaste)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (templateFlowData && templateFlowData.includes('"nodes":[') && templateFlowData.includes('],"edges":[')) {
            handleLoadFlowData(templateFlowData)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [templateFlowData])

    // Add this effect to handle back navigation
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (canvasDataStore.isDirty) {
                e.preventDefault()
                e.returnValue = ''
            } else if (e.type === 'popstate') {
                navigate(previousPath)
            }
        }

        window.addEventListener('popstate', handleBeforeUnload)
        return () => {
            window.removeEventListener('popstate', handleBeforeUnload)
        }
    }, [navigate, previousPath, canvasDataStore.isDirty])

    usePrompt('You have not saved changes yet! Do you want to ignore the changes and leave?', canvasDataStore.isDirty)

    const [showNodesDialog, setShowNodesDialog] = useState(false)

    const handleNodeDragStart = (event, node) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify(node))
        event.dataTransfer.effectAllowed = 'move'
    }

    // Create our custom function with a different name
    const customOnNodesChange = useCallback(
        (changes) => {
            for (const change of changes) {
                // Check if this is a node removal change
                if (change.type === 'remove') {
                    // Call our custom deleteNode function
                    deleteNode(change.id);
                    return;
                }
            }
            // Use the original function for other changes
            onNodesChange(changes);
        },
        [onNodesChange, deleteNode]
    );

    if (showNotFound) {
        return <NotFound />
    }

    return (
        <>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100vh', // Full viewport height
                    overflow: 'hidden' // Prevent scrolling on the outer container
                }}
            >
                {/* Header Toolbar */}
                <Box
                    sx={{
                        height: 72, // Fixed header height
                        flexShrink: 0, // Prevent header from shrinking
                        display: 'flex',
                        alignItems: 'center',
                        px: 2,
                        boxShadow: 0
                    }}
                >
                    <CanvasHeader
                        chatflow={chatflow}
                        handleSaveFlow={handleSaveFlow}
                        handleDeleteFlow={handleDeleteFlow}
                        handleLoadFlow={handleLoadFlowFile}
                        isAgentCanvas={isAgentCanvas}
                    />
                </Box>

                {/* Canvas Body */}
                <Box
                    className='reactflow-parent-wrapper'
                    sx={{
                        display: 'flex',
                        flexGrow: 1, // Take all remaining space
                        height: '100%',
                        width: '100%',
                        overflow: 'auto', // 'hidden' Prevent scrolling on the inner container. overflow: 'auto' Allow scrolling within the body if content overflows
                        position: 'relative',
                        padding: '2px',
                        // borderRadius: '4px',
                        gap: '2px',
                    }}
                >
                    {/* Sidebar for nodes components */}
                    {showNodesDialog && (
                        <NodesDialog 
                            nodesData={getNodesApi.data} 
                            onClose={() => setShowNodesDialog(false)}
                            isAgentCanvas={isAgentCanvas}
                            onDragStart={handleNodeDragStart}
                            style={{
                                // position: 'absolute',
                                // pt: '2px',
                                flexShrink: 0,
                                zIndex: 50,
                                width: '380px',
                                height: '100%',
                                border: `1px solid ${theme.palette.grey[300]}`,
                                borderRadius: '8px',
                                boxSizing: 'border-box',
                                overflow: 'hidden',
                                alignSelf: 'center',
                                margin: 'auto 0',
                            }}
                        />
                    )}

                    {/* Main canvas area for workflow */}
                    <Box 
                        className='reactflow-wrapper' 
                        ref={reactFlowWrapper}
                        style={{
                            padding: '0px',
                            height: '100%',
                            flexGrow: 1,
                            border: `1px solid ${theme.palette.grey[300]}`,
                            borderRadius: '8px',
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                        }}
                    >
                            <ReactFlow
                                proOptions={{ hideAttribution: true }}
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={customOnNodesChange}
                                onEdgesChange={onEdgesChange}
                                onDrop={onDrop}
                                onDragOver={onDragOver}
                                onNodeDragStop={setDirty}
                                nodeTypes={nodeTypes}
                                edgeTypes={edgeTypes}
                                onConnect={onConnect}
                                onInit={setReactFlowInstance}
                                fitView
                                deleteKeyCode={canvas.canvasDialogShow ? null : ['Delete']}
                                minZoom={0.1}
                                style={{ backgroundColor: '#F4F4F5' }}
                                nodesDraggable={(node) => !node.data?.nodesLocked}
                                selectNodesOnDrag={false}
                                panOnDrag={true}
                                zoomOnScroll={true}
                                zoomOnPinch={true}
                                // onNodeClick={onNodeClick}
                                // onPaneClick={onPaneClick}
                            >
                                <Controls
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                />
                                <Background color='#A1A1AA' gap={16} size={2} />
                                
                                {!showNodesDialog && (
                                    <Box
                                        onClick={() => setShowNodesDialog(true)}
                                        sx={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 10,
                                            width: 40,
                                            height: 40,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: 'white',
                                            border: `1px solid ${theme.palette.grey[300]}`,
                                            // borderRadius: '50%',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                            zIndex: 50,
                                            transition: 'all 0.2s ease-in-out',
                                            '&:hover': {
                                                boxShadow: '0 4px 8px rgba(0,0,0,0.12)',
                                                backgroundColor: theme.palette.grey[400],
                                            }
                                        }}
                                    >
                                        <Tooltip title="Add Node" placement="right" arrow>
                                            <IconButton 
                                                size="small" 
                                                sx={{
                                                    backgroundColor: 'white',
                                                    color: theme.palette.grey[700],
                                                    // boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                    // borderRadius: '8px',
                                                    // width: 40,
                                                    // height: 40,
                                                    '&:hover': {
                                                        backgroundColor: theme.palette.grey[200],
                                                        color: theme.palette.primary.dark,
                                                    }
                                                }}
                                            >
                                                <IconAlignLeft2 
                                                    size={18} 
                                                    stroke={2} 
                                                />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                )}
                                
                                {isSyncNodesButtonEnabled && (
                                    <Fab
                                        sx={{
                                            left: 40,
                                            top: 20,
                                            color: 'white',
                                            background: 'orange',
                                            '&:hover': {
                                                background: 'orange',
                                                backgroundImage: `linear-gradient(rgb(0 0 0/10%) 0 0)`
                                            }
                                        }}
                                        size='small'
                                        aria-label='sync'
                                        title='Sync Nodes'
                                        onClick={() => syncNodes()}
                                    >
                                        <IconRefreshAlert />
                                    </Fab>
                                )}

                                <CanvasActionButtons
                                    isUpsertButtonEnabled={isUpsertButtonEnabled}
                                    isAgentCanvas={isAgentCanvas}
                                    chatflowId={chatflowId}
                                    isDirty={canvasDataStore.isDirty}
                                />

                            </ReactFlow>
                    </Box>

                </Box>
                <ConfirmDialog />
            </Box>
        </>
    )
}

export default Canvas
