import PropTypes from 'prop-types'
import { useContext, useState, useCallback, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import MDEditor from '@uiw/react-md-editor'
import { Position, useReactFlow } from 'reactflow'

// material-ui
import { useTheme } from '@mui/material/styles'
import { IconButton, Box, Menu, MenuItem, Button } from '@mui/material'
import { IconCopy, IconTrash, IconPalette, IconDeviceFloppy, IconX } from '@tabler/icons-react'

// project imports
import NodeCardWrapper from '@/ui-component/cards/NodeCardWrapper'
import NodeTooltip from '@/ui-component/tooltip/NodeTooltip'
import { flowContext } from '@/store/context/ReactFlowContext'
import { ColorPickerButton, STICKY_NOTE_COLORS } from './ColorPickerButton'
import { NodeActionButtons } from './NodeActionButtons'
import NodeInfoDialog from '@/ui-component/dialog/NodeInfoDialog'
import { NodeResizer } from 'reactflow'
import { useCanvasDirtyState } from '@/hooks/useDirtyState'


// Add this CSS to handle resizing styles
const resizeStyles = {
    '.react-resizable-handle': {
        position: 'absolute',
        width: '20px',
        height: '20px',
        bottom: '0',
        right: '0',
        cursor: 'se-resize',
        '&::after': {
            content: '""',
            position: 'absolute',
            right: '5px',
            bottom: '5px',
            width: '8px',
            height: '8px',
            borderRight: '2px solid rgba(0, 0, 0, 0.4)',
            borderBottom: '2px solid rgba(0, 0, 0, 0.4)'
        }
    }
}

export const StickyNoteV2 = ({ data, selected }) => {
    const theme = useTheme()
    const canvas = useSelector((state) => state.canvas)
    const { deleteNode, duplicateNode } = useContext(flowContext)
    const [inputParam] = data.inputParams
    const reactFlowInstance = useReactFlow()
    
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(data.inputs[inputParam.name] ?? '')
    const [content, setContent] = useState(data.inputs[inputParam.name] ?? '')
    const [selectedColor, setSelectedColor] = useState(() => {
        return data.color ? STICKY_NOTE_COLORS[data.color] : STICKY_NOTE_COLORS.yellow
    })
    const [showInfoDialog, setShowInfoDialog] = useState(false)
    const [infoDialogProps, setInfoDialogProps] = useState({})
    const [isResizing, setIsResizing] = useState(false)
    const resizeStartPos = useRef({ x: 0, y: 0 })
    const nodeInitialSize = useRef({ width: 0, height: 0 })
    const { setDirty, removeDirty } = useCanvasDirtyState()

    const handleColorSelect = (selectedColor) => {
        setSelectedColor(selectedColor)
        data.color = selectedColor.id
        if (reactFlowInstance) {
            reactFlowInstance.setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === data.id) {
                        node.data = {
                            ...node.data,
                            color: selectedColor.id
                        }
                    }
                    return node
                })
            )
        }
    }

    const handleDoubleClick = () => {
        if (!isEditing) {
            setIsEditing(true)
            setEditContent(content)
        }
    }

    const handleChange = useCallback((newValue) => {
        setEditContent(newValue)
    }, [])

    const handleSave = useCallback(() => {
        data.inputs[inputParam.name] = editContent
        setContent(editContent)
        setIsEditing(false)
    }, [data, inputParam.name, editContent])

    const handleCancel = useCallback(() => {
        setEditContent(content)
        setIsEditing(false)
    }, [content])

    const onResize = useCallback((event, { size }) => {
        if (data.onResize) {
            data.onResize(data.id, size.width, size.height)
        }
    }, [data])

    const handleMouseWheel = useCallback((e) => {
        // Always prevent propagation when inside the content area
        const isContentArea = e.target.closest('.sticky-note-content') !== null;
        if (isContentArea) {
            // Stop the event from reaching ReactFlow
            e.stopPropagation();
        }
    }, []);

    const onMouseDownCapture = useCallback((e) => {
        const isContentArea = e.target.closest('.sticky-note-content') !== null;
        const isResizer = e.target.closest('.react-flow__resize') !== null;
        const isCustomResizer = e.target.closest('.custom-resize-handle') !== null;
        const isButton = e.target.closest('button') !== null;
        const isHeader = e.target.closest('.sticky-note-header') !== null;
        const isNodeBorder = e.target.closest('.node-border') !== null && !isContentArea && !isHeader && !isCustomResizer;

        // Handle custom resize
        if (isCustomResizer) {
            e.stopPropagation();
            setIsResizing(true);
            resizeStartPos.current = { x: e.clientX, y: e.clientY };
            
            // Get current node dimensions
            const node = reactFlowInstance.getNode(data.id);
            nodeInitialSize.current = { 
                width: node.style?.width || 200, 
                height: node.style?.height || 100 
            };
            return;
        }

        // If we're in the content area and not on a special element
        if (isContentArea && !isResizer && !isButton && !isNodeBorder && !isHeader && !isCustomResizer) {
            // Prevent the drag behavior
            e.stopPropagation();
            // Set nodesLocked to prevent dragging
            data.nodesLocked = true;
        }
    }, [data, reactFlowInstance]);

    const onMouseMoveCapture = useCallback((e) => {
        if (isResizing) {
            e.stopPropagation();
            e.preventDefault();
            
            // Calculate the delta
            const deltaX = e.clientX - resizeStartPos.current.x;
            const deltaY = e.clientY - resizeStartPos.current.y;
            
            // Calculate new dimensions (with minimum size constraints)
            const newWidth = Math.max(200, nodeInitialSize.current.width + deltaX);
            const newHeight = Math.max(100, nodeInitialSize.current.height + deltaY);
            
            // Update the node dimensions
            reactFlowInstance.setNodes((nodes) =>
                nodes.map((node) => {
                    if (node.id === data.id) {
                        return {
                            ...node,
                            style: {
                                ...node.style,
                                width: newWidth,
                                height: newHeight
                            }
                        };
                    }
                    return node;
                })
            );
        }
    }, [isResizing, data.id, reactFlowInstance]);

    const onMouseUpCapture = useCallback((e) => {
        if (isResizing) {
            setIsResizing(false);
            // Trigger any necessary updates after resize
            if (data.onResize) {
                const node = reactFlowInstance.getNode(data.id);
                data.onResize(data.id, node.style?.width || 200, node.style?.height || 100);
            }

            // Tell the canvas it's "dirty" now that the user changed the size
            setDirty()
        }
        
        if (data.selected) {
            data.nodesLocked = false;
        }
    }, [data, isResizing, reactFlowInstance]);

    // Add global mouse move and up handlers for resizing
    useEffect(() => {
        if (isResizing) {
            const handleMouseMove = (e) => onMouseMoveCapture(e);
            const handleMouseUp = (e) => {
                onMouseUpCapture(e);
                setIsResizing(false);
            };
            
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isResizing, onMouseMoveCapture, onMouseUpCapture]);

    return (
        <NodeCardWrapper
            content={false}
            isSelected={selected}
            className="node-border"
            onMouseDownCapture={onMouseDownCapture}
            onMouseUpCapture={onMouseUpCapture}
            sx={{
                height: '100%',
                width: '100%',
                padding: 0,
                background: selectedColor.light,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'grab',
                '&:active': {
                    cursor: isResizing ? 'nwse-resize' : 'grabbing',
                },
                '& .sticky-note-content': {
                    cursor: 'text !important',
                    userSelect: 'text !important',
                },
                '& .w-md-editor': {
                    flex: 1,
                    display: 'flex !important',
                    flexDirection: 'column !important',
                    border: 'none !important',
                    backgroundColor: 'transparent !important'
                },
                '& .w-md-editor-preview': {
                    backgroundColor: 'transparent !important',
                    flex: 1
                },
                '& .wmde-markdown': {
                    backgroundColor: 'transparent !important',
                    flex: 1,
                    height: '100%'
                },
                '& .w-md-editor-toolbar': {
                    backgroundColor: `${selectedColor.selected}20 !important`,
                    borderBottom: `1px solid ${selectedColor.selected}40 !important`,
                    padding: '4px !important',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    '& button': {
                        color: theme.palette.text.primary,
                        '&:hover': {
                            backgroundColor: `${selectedColor.selected}40 !important`
                        }
                    }
                },
                '& .w-md-editor-text': {
                    backgroundColor: 'transparent !important'
                },
                '& .w-md-editor-content': {
                    flex: '1 1 auto !important',
                    height: 'auto !important',
                    display: 'flex !important',
                    flexDirection: 'column !important'
                },
                '& .w-md-editor-input': {
                    flex: '1 1 auto !important',
                    height: 'auto !important'
                },
                '& textarea': {
                    backgroundColor: 'transparent !important',
                    height: '100% !important'
                },
                // Enhanced custom resize handle styling with more contrast
                '& .custom-resize-handle': {
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    width: '24px',
                    height: '24px',
                    cursor: 'nwse-resize !important',
                    zIndex: 10,
                    display: 'block', // Always show the resize handle for better UX
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        right: '3px',
                        bottom: '3px',
                        width: '0',
                        height: '0',
                        borderStyle: 'solid',
                        borderWidth: '0 0 16px 16px',
                        // Use a more contrasting color - dark gray that works with any note color
                        borderColor: 'transparent transparent #555555 transparent',
                        opacity: selected ? 1 : 0.7, // More visible when selected
                    }
                }
            }}
        >
            <NodeResizer 
                minWidth={200}
                minHeight={100}
                isVisible={false} // Hide the default resizer, we'll use our custom one
                onResize={onResize}
            />

            {/* Add a draggable header area */}
            <Box 
                className="sticky-note-header node-border"
                sx={{ 
                    height: '24px',
                    width: '100%',
                    cursor: 'grab',
                    '&:active': {
                        cursor: 'grabbing',
                    },
                    backgroundColor: `${selectedColor.selected}30`,
                    borderBottom: `1px solid ${selectedColor.selected}40`,
                }}
            />

            {/* Top buttons container - moved inside the header for better positioning */}
            <Box 
                className="node-border"
                sx={{ 
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    padding: '2px',
                    zIndex: 1,
                }}
            >
                <ColorPickerButton 
                    currentColor={selectedColor}
                    onColorSelect={handleColorSelect}
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

            <Box
                onDoubleClick={!isEditing ? handleDoubleClick : undefined}
                className="sticky-note-content"
                onWheelCapture={handleMouseWheel}
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '8px 16px 16px 16px', // Reduced top padding since we have a header now
                    overflow: 'auto',
                    cursor: 'text',
                    '&:hover': {
                        cursor: 'text',
                    }
                }}
            >
                <Box 
                    className="sticky-note-content"
                    sx={{
                        flex: '1 1 auto',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'auto',
                        minHeight: 0,
                        marginRight: -1,
                        backgroundColor: isEditing ? '#ffffff' : 'transparent',
                        cursor: 'text',
                        '& .wmde-markdown, & .w-md-editor': {
                            cursor: 'text !important',
                            userSelect: 'text !important',
                            pointerEvents: 'auto !important',
                        },
                        '& .w-md-editor-text-input': {
                            cursor: 'text !important',
                            userSelect: 'text !important',
                            pointerEvents: 'auto !important',
                        },
                        '& .w-md-editor-text': {
                            cursor: 'text !important',
                        },
                        '& *': {
                            pointerEvents: 'auto !important',
                        }
                    }}
                >
                    {isEditing ? (
                        <MDEditor
                            value={editContent}
                            onChange={handleChange}
                            preview='edit'
                            hideToolbar={false}
                            autoFocus
                            textareaProps={{
                                className: 'sticky-note-content',
                                style: {
                                    color: '#000000',
                                    backgroundColor: '#ffffff',
                                    padding: '0 8px 0 0',
                                    cursor: 'text',
                                    userSelect: 'text',
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.stopPropagation();
                                }
                            }}
                        />
                    ) : (
                        <MDEditor.Markdown 
                            className="sticky-note-content"
                            source={content}
                            style={{
                                overflow: 'auto',
                                height: '100%',
                                padding: '0 8px 0 0',
                                cursor: 'text',
                                userSelect: 'text',
                            }}
                        />
                    )}
                </Box>
                {isEditing && (
                    <Box
                        className="node-border"
                        sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 1,
                            p: 1,
                            borderTop: 1,
                            borderColor: 'divider',
                            backgroundColor: `${selectedColor.selected}20`,
                            marginTop: 1,
                            cursor: 'move',
                        }}
                    >
                        <Button
                            size="small"
                            startIcon={<IconX />}
                            onClick={handleCancel}
                            color="error"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="small"
                            startIcon={<IconDeviceFloppy />}
                            onClick={handleSave}
                            variant="contained"
                            color="primary"
                        >
                            Save
                        </Button>
                    </Box>
                )}
            </Box>

            {/* Custom resize handle that's always visible */}
            <Box 
                className="custom-resize-handle"
                onClick={(e) => {
                    // Prevent click from propagating to avoid deselecting the node
                    e.stopPropagation();
                }}
            />

            <NodeInfoDialog 
                show={showInfoDialog} 
                dialogProps={infoDialogProps} 
                onCancel={() => setShowInfoDialog(false)}
            />
        </NodeCardWrapper>
    )
}

StickyNoteV2.propTypes = {
    data: PropTypes.object,
    selected: PropTypes.bool
}

export default StickyNoteV2
