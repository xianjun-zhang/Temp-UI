import { useEffect, useRef } from 'react'
import ReactFlow, { Controls, Background, useNodesState, useEdgesState } from 'reactflow'
import 'reactflow/dist/style.css'
import '@/views/canvas/index.css'

import { useLocation, useNavigate } from 'react-router-dom'

// material-ui
import { Toolbar, Box, AppBar } from '@mui/material'
import { useTheme } from '@mui/material/styles'

// project imports
import MarketplaceCanvasNode from './MarketplaceCanvasNode'
import MarketplaceCanvasHeader from './MarketplaceCanvasHeader'
import { StickyNoteV2 } from '../canvas/StickyNoteV2'
import { navigationPaths } from '@/routes/path'

const nodeTypes = { customNode: MarketplaceCanvasNode, stickyNote: StickyNoteV2 }
const edgeTypes = { buttonedge: '' }

// ==============================|| CANVAS ||============================== //
// TODO: [p0] Load canvas from marketplace, if canvas contains sticky notes, debug console will have `hook.js:608 MUI: Too many re-renders. The layout is unstable.` error. Need to fix. Did not solve on 2025-02-16 spend 10 hours using chatGPT and Cursor. Will redesign the sticky note component later.
const MarketplaceCanvas = () => {
    const theme = useTheme()
    const navigate = useNavigate()

    const { state } = useLocation()
    const { templateData } = state

    // ==============================|| ReactFlow ||============================== //

    const [nodes, setNodes, onNodesChange] = useNodesState()
    const [edges, setEdges, onEdgesChange] = useEdgesState()

    const reactFlowWrapper = useRef(null)

    // ==============================|| useEffect ||============================== //

    useEffect(() => {
        if (templateData) {
            const initialFlow = JSON.parse(templateData.flowData)
            setNodes(initialFlow.nodes || [])
            setEdges(initialFlow.edges || [])
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [templateData])

    const onChatflowCopy = (templateData) => {
        // const isAgentCanvas = (flowData?.nodes || []).some(
        //     (node) => node.data.category === 'Multi Agents' || node.data.category === 'Sequential Agents'
        // )

        const isAgentCanvas = templateData.templateType === 'Agentflow'


        // TODO: [p1] Pass template title and description to the new canvas
        const templateFlowData = JSON.stringify(JSON.parse(templateData.flowData))
        navigate(
            isAgentCanvas 
                ? navigationPaths.workspace.agentflows.new()
                : navigationPaths.workspace.chatflows.new(),
            { state: { templateFlowData: templateFlowData } }
        )
    }

    return (
        <>
            <Box>
                <AppBar
                    enableColorOnDark
                    position='fixed'
                    color='inherit'
                    elevation={0}
                    sx={{
                        bgcolor: theme.palette.background.default,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        boxShadow: 'none'
                    }}
                >
                    <Toolbar>
                        <MarketplaceCanvasHeader
                            templateData={templateData}
                            onChatflowCopy={(templateData) => onChatflowCopy(templateData)}
                        />
                    </Toolbar>
                </AppBar>
                <Box sx={{ pt: '70px', height: '100vh', width: '100%' }}>
                    <div className='reactflow-parent-wrapper'>
                        <div className='reactflow-wrapper' ref={reactFlowWrapper}>
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                nodesDraggable={false}
                                nodeTypes={nodeTypes}
                                edgeTypes={edgeTypes}
                                fitView
                                minZoom={0.1}
                            >
                                <Controls
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                />
                                <Background color='#aaa' gap={16} />
                            </ReactFlow>
                        </div>
                    </div>
                </Box>
            </Box>
        </>
    )
}

export default MarketplaceCanvas
