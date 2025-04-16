import PropTypes from 'prop-types'
import { useContext, useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { NodeResizer } from 'reactflow'

// material-ui
import { useTheme } from '@mui/material/styles'
import { Box, Typography, Divider, Button, Tooltip, IconButton } from '@mui/material'

// project imports
import NodeCardWrapper from '@/ui-component/cards/NodeCardWrapper'
import NodeInputHandler from './NodeInputHandler'
import NodeOutputHandler from './NodeOutputHandler'
import AdditionalParamsDialog from '@/ui-component/dialog/AdditionalParamsDialog'
import NodeInfoDialog from '@/ui-component/dialog/NodeInfoDialog'
import { NodeActionButtons } from './NodeActionButtons'

// const
import { baseURL } from '@/store/constant'
import { IconAlertTriangle } from '@tabler/icons-react'
import { flowContext } from '@/store/context/ReactFlowContext'
import LlamaindexPNG from '@/assets/images/llamaindex.png'

// ===========================|| CANVAS NODE ||=========================== //

const CanvasNode = ({ 
    data,
    selected,
    selectedHandle,
    handleClick,
    style // <== IMPORTANT: This is the style prop from React Flow (width/height)
}) => {
    const theme = useTheme()
    const canvas = useSelector((state) => state.canvas)
    const { deleteNode, duplicateNode } = useContext(flowContext)

    const [showDialog, setShowDialog] = useState(false)
    const [dialogProps, setDialogProps] = useState({})
    const [showInfoDialog, setShowInfoDialog] = useState(false)
    const [infoDialogProps, setInfoDialogProps] = useState({})
    const [warningMessage, setWarningMessage] = useState('')
    const nodeOutdatedMessage = (oldVersion, newVersion) => `Node version ${oldVersion} outdated\nUpdate to latest version ${newVersion}`

    const nodeVersionEmptyMessage = (newVersion) => `Node outdated\nUpdate to latest version ${newVersion}`

    // Track how tall the inner content is (so we can prevent resizing below that)
    const [contentHeight, setContentHeight] = useState(100)
    // Reference for content area
    const contentRef = useRef(null)
    // Resize observer ref
    const resizeObserverRef = useRef(null)

    // Measure content's natural height initially
    useLayoutEffect(() => {
        if (contentRef.current) {
            // e.g. scrollHeight or offsetHeight
            const newHeight = contentRef.current.scrollHeight
            // setContentHeight(Math.max(100, newHeight))
            setContentHeight(newHeight)
        }
    }, [data])

    // Set up ResizeObserver to monitor content height changes
    useEffect(() => {
        if (contentRef.current && typeof ResizeObserver !== 'undefined') {
            // Clean up any existing observer
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect()
            }
            
            // Create a new observer
            resizeObserverRef.current = new ResizeObserver(entries => {
                for (const entry of entries) {
                    // Update height when content changes
                    const newHeight = entry.target.scrollHeight
                    if (newHeight !== contentHeight) {
                        setContentHeight(newHeight)
                    }
                }
            })
            
            // Start observing the content element
            resizeObserverRef.current.observe(contentRef.current)
        }
        
        // Clean up observer on unmount
        return () => {
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect()
            }
        }
    }, [contentHeight])

    const onDialogClicked = () => {
        const dialogProps = {
            data,
            inputParams: data.inputParams.filter((inputParam) => !inputParam.hidden).filter((param) => param.additionalParams),
            confirmButtonName: 'Save',
            cancelButtonName: 'Cancel'
        }
        setDialogProps(dialogProps)
        setShowDialog(true)
    }

    useEffect(() => {
        const componentNode = canvas.componentNodes.find((nd) => nd.name === data.name)
        if (componentNode) {
            if (!data.version) {
                setWarningMessage(nodeVersionEmptyMessage(componentNode.version))
            } else if (data.version && componentNode.version > data.version) {
                setWarningMessage(nodeOutdatedMessage(data.version, componentNode.version))
            } else if (componentNode.badge === 'DEPRECATING') {
                setWarningMessage(
                    componentNode?.deprecateMessage ??
                        'This node will be deprecated in the next release. Please change to new version node.'
                )
            } else {
                setWarningMessage('')
            }
        }
    }, [canvas.componentNodes, data.name, data.version])

    return (
        <>
            <NodeCardWrapper
                content={false}
                isSelected={selected}
                sx={{
                    padding: 0,
                    overflow: 'visible',
                }}
                style={{
                    // Apply the width/height so that resizing is visible
                    // Force the node container to match the NodeResizer’s updated width/height.
                    width: style?.width || 'auto',
                    height: 'auto', // Allow auto height
                    minWidth: 300,
                    maxWidth: 500,
                    minHeight: contentHeight,
                    // maxHeight: contentHeight, Remove maxHeight constraint to allow growth
                    display: 'flex',
                    flexDirection: 'column',
                    // border: '1px solid #999',
                    // background: '#fff'
                }}
            >
                <NodeResizer
                    minWidth={300}
                    maxWidth={500}
                    minHeight={contentHeight}
                    // maxHeight={contentHeight} Remove maxHeight constraint to allow growth
                    // isVisible={selected}
                    isVisible={false}
                />
                <div
                    ref={contentRef}
                    style={{
                        // Let the content area grow or shrink
                        flex: 1,
                        // overflow: 'auto',
                        // padding: '0px'
                    }}
                >
                    <Box sx={{ position: 'relative' }}>
                        {/* Icons container */}
                        <Box 
                            sx={{ 
                                position: 'absolute',
                                top: 12,
                                right: 8,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                zIndex: 1
                            }}
                        >
                                {warningMessage && (
                                <Box sx={{ position: 'relative' }}>
                                    <Tooltip title={warningMessage}>
                                        <IconButton
                                            sx={{ 
                                                height: '28px',
                                                width: '28px',
                                                padding: '5px',
                                                '&:hover': { 
                                                    backgroundColor: 'rgba(255, 165, 0, 0.04)' 
                                                }
                                            }}
                                        >
                                            <IconAlertTriangle 
                                                size={18} 
                                                color='orange'
                                            />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            )}

                            {data.tags && data.tags.includes('LlamaIndex') && (
                                <Box sx={{ position: 'relative' }}>
                                    <IconButton
                                        sx={{ 
                                            height: '28px',
                                            width: '28px',
                                            padding: '4px',
                                            '&:hover': { 
                                                backgroundColor: 'rgba(0, 0, 0, 0.1)' 
                                            }
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                borderRadius: '50%',
                                                backgroundColor: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <img
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                                alt="LlamaIndex"
                                                src={LlamaindexPNG}
                                            />
                                        </Box>
                                    </IconButton>
                                </Box>
                            )}

                            <Box sx={{ position: 'relative' }}>
                                <NodeActionButtons 
                                    onCopy={() => {
                                        duplicateNode(data.id)
                                    }} 
                                    onDuplicate={() => {
                                        duplicateNode(data.id)
                                    }} 
                                    onDelete={() => {
                                        deleteNode(data.id)
                                    }} 
                                    onDocs={() => {
                                        if (data.documentationUrl) {
                                            window.open(data.documentationUrl, '_blank')
                                        }
                                    }}
                                    onInfo={() => {
                                        setInfoDialogProps({ data })
                                        setShowInfoDialog(true)
                                    }}
                                    hasDocumentation={Boolean(data.documentationUrl)}
                                />
                            </Box>
                        </Box>

                        {/* Title container */}
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'row', 
                            alignItems: 'center',
                            height: '52px',
                            pr: (theme) => {
                                let padding = 3; // base padding
                                if (data.tags?.includes('LlamaIndex')) padding += 3; // LlamaIndex icon width + gap
                                if (warningMessage) padding += 3; // Warning icon width + gap
                                padding += 3; // Menu icon width
                                return padding;
                            }
                        }}>
                            <Box sx={{ 
                                width: 40, 
                                height: 40, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                mr: 1.5 
                            }}>
                                <img
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        padding: 5,
                                        objectFit: 'contain'
                                    }}
                                    alt={data.name}
                                    src={`${baseURL}/api/v1/node-icon/${data.name}`}
                                />
                            </Box>
                            <Box sx={{ 
                                minWidth: 0,
                                flex: 1
                            }}>
                                <Tooltip 
                                    title={data.label}
                                    placement="top"
                                    PopperProps={{
                                        sx: {
                                            // Only show tooltip if text is truncated
                                            display: (theme) => ({
                                                '& .MuiTooltip-tooltip': {
                                                    display: 'block'
                                                }
                                            })
                                        }
                                    }}
                                >
                                    <Typography
                                        ref={(element) => {
                                            if (element) {
                                                const isTextTruncated = element.scrollWidth > element.clientWidth;
                                                element.title = isTextTruncated ? data.label : '';
                                            }
                                        }}
                                        sx={{
                                            fontSize: '1rem',
                                            fontWeight: 500,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            lineHeight: '28px'
                                        }}
                                    >
                                        {data.label}
                                    </Typography>
                                </Tooltip>
                            </Box>
                        </Box>

                        {/* Rest of the node content */}
                        <Box>
                            {/* ============================ Input Anchors section ============================ */}
                            {(data.inputAnchors.length > 0) && (
                                <>
                                    <Divider />
                                    <Box sx={{ background: theme.palette.asyncSelect.main, p: 0 }}>
                                        <Typography
                                            sx={{
                                                fontWeight: 500,
                                                textAlign: 'center',
                                                py: 1
                                            }}
                                        >
                                            Node Inputs
                                        </Typography>
                                    </Box>
                                    <Divider />
                                </>
                            )}
                            {data.inputAnchors.map((inputAnchor, index) => (
                                <NodeInputHandler 
                                    key={index} 
                                    inputAnchor={inputAnchor} 
                                    data={data}
                                    isNodeSelected={selected}
                                    selectedHandle={selectedHandle}
                                    handleClick={handleClick}
                                />
                            ))}

                            {/* ============================ Input Params section ============================ */}
                            {data.inputParams.length > 0 && (
                                <>
                                    <Divider />
                                    <Box sx={{ background: theme.palette.asyncSelect.main, p: 0 }}>
                                        <Typography sx={{ fontWeight: 500, textAlign: 'center', py: 1 }}>
                                            Parameters
                                        </Typography>
                                    </Box>
                                    <Divider />
                                </>
                            )}
                            {data.inputParams
                                .filter((inputParam) => !inputParam.hidden)
                                .map((inputParam, index) => (
                                    <NodeInputHandler
                                        key={index}
                                        inputParam={inputParam}
                                        data={data}
                                        onHideNodeInfoDialog={(isHide) => {}}
                                        selectedHandle={selectedHandle}
                                        handleClick={handleClick}
                                        isNodeSelected={selected}
                                    />
                                ))}

                            {data.inputParams.find((param) => param.additionalParams) && (
                                <div style={{ 
                                    textAlign: 'center',
                                    marginTop: 
                                        data.inputParams.filter((param) => param.additionalParams).length === data.inputParams.length + data.inputAnchors.length ? 20 : 20
                                }}>
                                    <Button 
                                        sx={{ borderRadius: '4px', width: '90%', mb: 2 }} 
                                        variant='outlined' 
                                        onClick={onDialogClicked}
                                    >
                                        Additional Parameters
                                    </Button>
                                </div>
                            )}

                            {/* ============================ Output Anchors section ============================ */}
                            {data.outputAnchors.length > 0 && (
                                <>
                                    <Divider />
                                    <Box sx={{ background: theme.palette.asyncSelect.main, p: 0 }}>
                                        <Typography sx={{ fontWeight: 500, textAlign: 'center', py: 1 }}>
                                            Node Outputs
                                        </Typography>
                                    </Box>
                                    <Divider />
                                    {data.outputAnchors.map((outputAnchor) => (
                                        <NodeOutputHandler 
                                            key={JSON.stringify(outputAnchor)}
                                            outputAnchor={outputAnchor} 
                                            data={data}
                                            isNodeSelected={selected}
                                            selectedHandle={selectedHandle}
                                            handleClick={handleClick}
                                        />
                                    ))}
                                </>
                            )}
                        </Box>
                    </Box>
                </div>
            </NodeCardWrapper>
            <AdditionalParamsDialog
                show={showDialog}
                dialogProps={dialogProps}
                onCancel={() => setShowDialog(false)}
            />
            <NodeInfoDialog 
                show={showInfoDialog} 
                dialogProps={infoDialogProps} 
                onCancel={() => setShowInfoDialog(false)}
            />
        </>
    )
}

CanvasNode.propTypes = {
    data: PropTypes.object,
    selected: PropTypes.bool,
    selectedHandle: PropTypes.object,
    handleClick: PropTypes.func
}

export default CanvasNode
