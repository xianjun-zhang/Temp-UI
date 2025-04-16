import { useState, useCallback, useEffect, forwardRef, useRef } from 'react'
import { useTheme } from '@mui/material/styles'
import { Handle } from 'reactflow'
import { isHandleTypeCompatible, isInputHandle } from '@/utils/genericHelper'
import { useCanvasDirtyState } from '@/hooks/useDirtyState'
import { ConnectionButton } from './ConnectionButton'

// Define class names as constants to ensure consistency
const SELECTED_CLASS = 'rf-handle-selected'
const COMPATIBLE_CLASS = 'rf-handle-compatible'

export const useHandleSelection = (reactFlowInstance) => {
    // selectedHandle format: {nodeId, handleId}
    const [selectedHandle, setSelectedHandle] = useState(null)
    const [compatibleHandles, setCompatibleHandles] = useState([])
    const { setDirty } = useCanvasDirtyState()
    
    // Keep track of the last clicked node ID
    const lastClickedNodeRef = useRef(null)

    // Function to check if a handle is compatible with the selected handle
    const checkHandleCompatibility = useCallback(() => {
        if (!selectedHandle || !reactFlowInstance) {
            setCompatibleHandles([])
            
            // Clear all compatibility classes
            document.querySelectorAll(`.${COMPATIBLE_CLASS}`).forEach(el => {
                el.classList.remove(COMPATIBLE_CLASS)
            })
            return
        }
        
        const newCompatibleHandles = []
        const currentCanvasNodes = reactFlowInstance.getNodes()
        
        // Get the selected handle's type (input or output)
        const selectedNode = reactFlowInstance.getNode(selectedHandle.nodeId)
        if (!selectedNode) {
            setCompatibleHandles([])
            return
        }
        
        // Determine if the selected handle is an input or output
        const isSelectedInput = isInputHandle(selectedHandle.handleId)
        
        // First, clear all compatibility classes
        document.querySelectorAll(`.${COMPATIBLE_CLASS}`).forEach(el => {
            el.classList.remove(COMPATIBLE_CLASS)
        })
        
        // For each node, check if its handles are compatible with the selected handle
        currentCanvasNodes.forEach(node => {
            // Skip the node with the selected handle
            if (node.id === selectedHandle.nodeId) return
            
            // Check input or output handles based on the selected handle type
            if (isSelectedInput) {
                // If selected is input, check output handles
                if (node.data.outputAnchors) {
                    node.data.outputAnchors.forEach(anchor => {
                        // For simple anchors
                        if (!anchor.options) {
                            const {isTypeCompatible} = isHandleTypeCompatible(anchor.id, selectedHandle.handleId)
                            
                            if (isTypeCompatible) {
                                newCompatibleHandles.push({nodeId: node.id, handleId: anchor.id})
                            }
                        } else {
                            // For anchors with options
                            anchor.options.forEach(option => {
                                if (!option.id) return

                                const {isTypeCompatible} = isHandleTypeCompatible(option.id, selectedHandle.handleId)
                                
                                if (isTypeCompatible) {
                                    newCompatibleHandles.push({nodeId: node.id, handleId: option.id})
                                }
                            })
                        }
                    })
                }
            } else {
                // If selected is output, check input handles
                if (node.data.inputAnchors) {
                    node.data.inputAnchors.forEach(anchor => {
                        const {isTypeCompatible} = isHandleTypeCompatible(selectedHandle.handleId, anchor.id)
                        
                        if (isTypeCompatible) {
                            newCompatibleHandles.push({nodeId: node.id, handleId: anchor.id})
                        }
                    })
                }
                
                // Also check input params that accept variables
                if (node.data.inputParams) {
                    node.data.inputParams.forEach(param => {
                        if (param.acceptVariable) {
                            const {isTypeCompatible} = isHandleTypeCompatible(selectedHandle.handleId, param.id)
                            
                            if (isTypeCompatible) {
                                newCompatibleHandles.push({nodeId: node.id, handleId: param.id})
                            }
                        }
                    })
                }
            }
        })
        
        setCompatibleHandles(newCompatibleHandles)
        
        // Apply the COMPATIBLE_CLASS to all compatible handles
        newCompatibleHandles.forEach(handle => {
            const handleElement = document.querySelector(
                `.react-flow__handle[data-nodeid="${handle.nodeId}"][data-handleid="${handle.handleId}"]`
            )
            if (handleElement) {
                handleElement.classList.add(COMPATIBLE_CLASS)
            }
        })
    }, [selectedHandle, reactFlowInstance, COMPATIBLE_CLASS])

    // Run compatibility check whenever selected handle changes
    useEffect(() => {
        checkHandleCompatibility()
    }, [selectedHandle, checkHandleCompatibility])
    
    // This effect handles clearing the handle selection when appropriate
    useEffect(() => {
        if (!reactFlowInstance) return
        
        // Function to handle clicks anywhere in the document
        const handleDocumentClick = (event) => {
            // Skip if we don't have a selected handle
            if (!selectedHandle) return
            
            // Check if the click is on a node
            const nodeElement = event.target.closest('.react-flow__node')
            
            // If clicked outside any node, clear handle selection
            if (!nodeElement) {
                setSelectedHandle(null)
                lastClickedNodeRef.current = null
                return
            }
            
            // If clicked on a node, get its ID
            const clickedNodeId = nodeElement.getAttribute('data-id')
            
            // If clicked on a different node than the one with the selected handle
            if (clickedNodeId && clickedNodeId !== selectedHandle.nodeId) {
                setSelectedHandle(null)
                // Don't clear selection - we want to keep it for compatibility checking
                lastClickedNodeRef.current = clickedNodeId
            } else {
                // If clicked on the same node, update the ref
                lastClickedNodeRef.current = clickedNodeId
            }
        }
        
        // Add the document-level click listener
        document.addEventListener('click', handleDocumentClick)
        
        return () => {
            document.removeEventListener('click', handleDocumentClick)
        }
    }, [reactFlowInstance, selectedHandle])
    
    // Handle click function for the handles
    const handleClick = useCallback((event, nodeId, handleId) => {
        // Stop event propagation to prevent the document click handler from firing
        event.stopPropagation()
        
        // Toggle handle selection
        setSelectedHandle(current => 
            current?.handleId === handleId && current?.nodeId === nodeId 
                ? null 
                : { nodeId, handleId }
        )

        // Update the last clicked node ref
        lastClickedNodeRef.current = nodeId
        
        // Select the node in ReactFlow
        if (reactFlowInstance) {
            const nodes = reactFlowInstance.getNodes()
            const updatedNodes = nodes.map(node => ({
                ...node,
                selected: node.id === nodeId
            }))
            reactFlowInstance.setNodes(updatedNodes)
            
            // Mark canvas as dirty
            setDirty()
        }
    }, [reactFlowInstance, setDirty])
    
    // Function to clear handle selection
    // const clearSelection = useCallback(() => {
    //     setSelectedHandle(null)
    // }, [])
    
    // useEffect(() => {
    //     console.log('Compatible handles:', compatibleHandles)
    // }, [compatibleHandles])

    // Function to check if a specific handle is compatible
    // const isHandleCompatible = useCallback((nodeId, handleId) => {
        
    //     // Check if any object in the Set has matching nodeId and handleId
    //     const isCompatible = compatibleHandles.some(
    //         handle => handle.nodeId === nodeId && handle.handleId === handleId
    //     )

    //     return isCompatible;
    // }, [compatibleHandles]);
    
    return {
        selectedHandle,
        // isHandleCompatible,
        handleClick,
        // clearSelection
    }
}

export const EnhancedHandle = forwardRef(({ 
    nodeData,
    nodeId, 
    handleId, 
    isSelected,
    isCompatible,
    onClick,
    type,
    ...props 
}, ref) => {
    const theme = useTheme() // Import useTheme from @mui/material/styles
    
    // Use the constants in the className
    const className = `${props.className || ''} ${isSelected ? SELECTED_CLASS : ''}`
    
    // Use the same constants in the CSS
    useEffect(() => {
        const styleEl = document.createElement('style')
        styleEl.innerHTML = `
            .${SELECTED_CLASS} {
                background-color: ${theme.palette.secondary.main} !important;
                box-shadow: 0 0 15px ${theme.palette.secondary.main}, 0 0 50px ${theme.palette.secondary.main} !important;
                transition: all 0.3s ease !important;
                /* Increase the size of the handle when selected */
                width: 15px !important;
                height: 15px !important;
                /* Adjust position to keep the handle centered */
                margin-top: -2px !important;
                margin-left: -2px !important;
            }
            
            .${COMPATIBLE_CLASS} {
                background-color: ${theme.palette.success.dark} !important;
                box-shadow: 0 0 15px ${theme.palette.success.dark}, 0 0 50px ${theme.palette.success.dark} !important;
                transition: all 0.3s ease !important;
                /* Increase the size of the handle when compatible */
                width: 15px !important;
                height: 15px !important;
                /* Adjust position to keep the handle centered */
                margin-top: -2px !important;
                margin-left: -2px !important;
            }
            
            .react-flow__handle:hover {
                background-color: ${theme.palette.secondary.main} !important;
                box-shadow: 0 0 10px ${theme.palette.secondary.main} !important;
            }
        `
        document.head.appendChild(styleEl)
        
        return () => {
            document.head.removeChild(styleEl)
        }
    }, [theme.palette.secondary.main, theme.palette.success.main])
    
    return (
        <div className="enhanced-handle-container">
            <Handle
                ref={ref}
                {...props}
                type={type}
                data-nodeid={nodeId}
                data-handleid={handleId}
                className={className}
                onClick={(e) => onClick && onClick(e, nodeId, handleId)}
            />
            
            {isSelected && (
                <ConnectionButton
                    nodeData={nodeData}
                    connectionType={type === 'source' ? 'output' : 'input'}
                    handleId={handleId}
                    buttonStyle={{
                        position: 'absolute',
                        ...(type === 'source' 
                            ? { right: '-48px', transform: 'translateY(10px)' } 
                            : { left: '-48px', transform: 'translateY(10px)' }
                        )
                    }}
                />
            )}
        </div>
    )
})

// Set the display name for easier debugging
EnhancedHandle.displayName = 'EnhancedHandle'

