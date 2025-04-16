import PropTypes from 'prop-types'
import { Handle, Position, useUpdateNodeInternals } from 'reactflow'
import { useEffect, useRef, useState, useContext } from 'react'

// material-ui
import { useTheme, styled } from '@mui/material/styles'
import { Box, Typography, Tooltip } from '@mui/material'
import { tooltipClasses } from '@mui/material/Tooltip'
import { flowContext } from '@/store/context/ReactFlowContext'
import { isValidConnection } from '@/utils/genericHelper'
import { Dropdown } from '@/ui-component/dropdown/Dropdown'
import { EnhancedHandle } from './EnhancedHandle'
import { OutputTooltip } from './CustomTooltip'

// ===========================|| NodeOutputHandler ||=========================== //

const NodeOutputHandler = ({ 
    outputAnchor, 
    data, 
    isNodeSelected, 
    disabled = false, 
    selectedHandle, 
    // isHandleCompatible, 
    handleClick 
}) => {
    const theme = useTheme()
    const ref = useRef(null)
    const updateNodeInternals = useUpdateNodeInternals()
    const [position, setPosition] = useState(0)
    const [clientHeight, setClientHeight] = useState(0)
    const [offsetTop, setOffsetTop] = useState(0)
    const [dropdownValue, setDropdownValue] = useState(null)
    const { reactFlowInstance } = useContext(flowContext)
    // Resize observer ref
    const resizeObserverRef = useRef(null)

    const getAvailableOptions = (options = []) => {
        return options.filter((option) => !option.hidden && !option.isAnchor)
    }

    const getAnchorOptions = (options = []) => {
        return options.filter((option) => !option.hidden && option.isAnchor)
    }

    const getAnchorPosition = (options, index) => {
        const spacing = clientHeight / (getAnchorOptions(options).length + 1)
        return offsetTop + spacing * (index + 1)
    }

    // Function to update handle positions
    const updateHandlePositions = () => {
        if (ref.current && ref.current?.offsetTop && ref.current?.clientHeight) {
            setClientHeight(ref.current.clientHeight)
            setOffsetTop(ref.current.offsetTop)
            setPosition(ref.current.offsetTop + ref.current.clientHeight / 2)
            updateNodeInternals(data.id)
        }
    }

    // Initial setup and cleanup of ResizeObserver
    useEffect(() => {
        if (ref.current && typeof ResizeObserver !== 'undefined') {
            // Clean up any existing observer
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect()
            }
            
            // Create a new observer
            resizeObserverRef.current = new ResizeObserver(() => {
                updateHandlePositions()
            })
            
            // Start observing the element
            resizeObserverRef.current.observe(ref.current)
            
            // Also observe the parent node to detect overall node resizing
            const parentNode = ref.current.closest('.react-flow__node')
            if (parentNode) {
                resizeObserverRef.current.observe(parentNode)
            }
        }
        
        // Call once on mount
        updateHandlePositions()
        
        // Clean up observer on unmount
        return () => {
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect()
            }
        }
    }, [data.id])

    // Update node internals when position changes
    useEffect(() => {
        updateNodeInternals(data.id)
    }, [data.id, position, updateNodeInternals])

    // Update when dropdown value changes
    useEffect(() => {
        if (dropdownValue) {
            updateNodeInternals(data.id)
        }
    }, [data.id, dropdownValue, updateNodeInternals])

    return (
        <div ref={ref}>
            {outputAnchor.type !== 'options' && !outputAnchor.options && (
                <>
                    <OutputTooltip title={outputAnchor.type}>
                        <EnhancedHandle
                            nodeData={data}
                            type='source'
                            position={Position.Right}
                            key={outputAnchor.id}
                            id={outputAnchor.id}
                            nodeId={data.id}
                            handleId={outputAnchor.id}
                            isSelected={selectedHandle?.handleId === outputAnchor.id && isNodeSelected}
                            // isCompatible={isHandleCompatible && isHandleCompatible(data.id, outputAnchor.id)}
                            onClick={handleClick}
                            isValidConnection={(connection) => isValidConnection(connection, reactFlowInstance)}
                            style={{
                                height: 11,
                                width: 11,
                                top: position,
                                right: -6
                            }}
                        />
                    </OutputTooltip>
                    <Box sx={{ p: 2, textAlign: 'end' }}>
                        <Typography>{outputAnchor.label}</Typography>
                    </Box>
                </>
            )}
            {data.name !== 'ifElseFunction' &&
                outputAnchor.type === 'options' &&
                outputAnchor.options &&
                getAnchorOptions(outputAnchor.options).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {getAnchorOptions(outputAnchor.options).map((option, index) => {
                            return (
                                <div key={option.id} style={{ display: 'flex', flexDirection: 'row' }}>
                                    <OutputTooltip title={option.type}>
                                        <EnhancedHandle
                                            nodeData={data}
                                            type='source'
                                            position={Position.Right}
                                            key={index}
                                            id={option?.id}
                                            nodeId={data.id}
                                            handleId={option?.id}
                                            isSelected={selectedHandle?.handleId === option?.id && isNodeSelected}
                                            // isCompatible={isHandleCompatible && isHandleCompatible(data.id, option?.id)}
                                            onClick={handleClick}
                                            isValidConnection={(connection) => isValidConnection(connection, reactFlowInstance)}
                                            style={{
                                                height: 10,
                                                width: 10,
                                                top: getAnchorPosition(outputAnchor.options, index)
                                            }}
                                        />
                                    </OutputTooltip>
                                    <div style={{ flex: 1 }}></div>
                                    <Box sx={{ p: 2, textAlign: 'end' }}>
                                        <Typography>{option.label}</Typography>
                                    </Box>
                                </div>
                            )
                        })}
                    </div>
                )}
            {data.name === 'ifElseFunction' && outputAnchor.type === 'options' && outputAnchor.options && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <OutputTooltip
                            title={
                                outputAnchor.options.find((opt) => opt.name === data.outputs?.[outputAnchor.name])?.type ??
                                outputAnchor.type
                            }
                        >
                            <EnhancedHandle
                                nodeData={data}
                                type='source'
                                position={Position.Right}
                                key={outputAnchor.options.find((opt) => opt.name === 'returnTrue')?.id ?? ''}
                                id={outputAnchor.options.find((opt) => opt.name === 'returnTrue')?.id ?? ''}
                                nodeId={data.id}
                                handleId={outputAnchor.options.find((opt) => opt.name === 'returnTrue')?.id ?? ''}
                                isSelected={selectedHandle?.handleId === outputAnchor.options.find((opt) => opt.name === 'returnTrue')?.id && isNodeSelected}
                                // isCompatible={isHandleCompatible && isHandleCompatible(data.id, outputAnchor.options.find((opt) => opt.name === 'returnTrue')?.id)}
                                onClick={handleClick}
                                isValidConnection={(connection) => isValidConnection(connection, reactFlowInstance)}
                                style={{
                                    height: 10,
                                    width: 10,
                                    top: position - 25
                                }}
                            />
                        </OutputTooltip>
                        <div style={{ flex: 1 }}></div>
                        <Box sx={{ p: 2, textAlign: 'end' }}>
                            <Typography>True</Typography>
                        </Box>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <OutputTooltip
                            title={
                                outputAnchor.options.find((opt) => opt.name === data.outputs?.[outputAnchor.name])?.type ??
                                outputAnchor.type
                            }
                        >
                            <EnhancedHandle
                                nodeData={data}
                                type='source'
                                position={Position.Right}
                                key={outputAnchor.options.find((opt) => opt.name === 'returnFalse')?.id ?? ''}
                                id={outputAnchor.options.find((opt) => opt.name === 'returnFalse')?.id ?? ''}
                                nodeId={data.id}
                                handleId={outputAnchor.options.find((opt) => opt.name === 'returnFalse')?.id ?? ''}
                                isSelected={selectedHandle?.handleId === outputAnchor.options.find((opt) => opt.name === 'returnFalse')?.id && isNodeSelected}
                                // isCompatible={isHandleCompatible && isHandleCompatible(data.id, outputAnchor.options.find((opt) => opt.name === 'returnFalse')?.id)}
                                onClick={handleClick}
                                isValidConnection={(connection) => isValidConnection(connection, reactFlowInstance)}
                                style={{
                                    height: 10,
                                    width: 10,
                                    top: position + 25
                                }}
                            />
                        </OutputTooltip>
                        <div style={{ flex: 1 }}></div>
                        <Box sx={{ p: 2, textAlign: 'end' }}>
                            <Typography>False</Typography>
                        </Box>
                    </div>
                </div>
            )}
            {data.name !== 'ifElseFunction' &&
                outputAnchor.type === 'options' &&
                outputAnchor.options &&
                getAvailableOptions(outputAnchor.options).length > 0 && (
                    <>
                        <OutputTooltip
                            title={
                                outputAnchor.options.find((opt) => opt.name === data.outputs?.[outputAnchor.name])?.type ??
                                outputAnchor.type
                            }
                        >
                            <EnhancedHandle
                                nodeData={data}
                                type='source'
                                position={Position.Right}
                                id={outputAnchor.options.find((opt) => opt.name === data.outputs?.[outputAnchor.name])?.id ?? ''}
                                nodeId={data.id}
                                handleId={outputAnchor.options.find((opt) => opt.name === data.outputs?.[outputAnchor.name])?.id ?? ''}
                                isSelected={selectedHandle?.handleId === outputAnchor.options.find((opt) => opt.name === data.outputs?.[outputAnchor.name])?.id && isNodeSelected}
                                // isCompatible={isHandleCompatible && isHandleCompatible(data.id, outputAnchor.options.find((opt) => opt.name === data.outputs?.[outputAnchor.name])?.id)}
                                onClick={handleClick}
                                isValidConnection={(connection) => isValidConnection(connection, reactFlowInstance)}
                                style={{
                                    height: 10,
                                    width: 10,
                                    top: position
                                }}
                            />
                        </OutputTooltip>
                        <Box sx={{ p: 2, textAlign: 'end' }}>
                            <Dropdown
                                disabled={disabled}
                                disableClearable={true}
                                name={outputAnchor.name}
                                options={getAvailableOptions(outputAnchor.options)}
                                onSelect={(newValue) => {
                                    setDropdownValue(newValue)
                                    data.outputs[outputAnchor.name] = newValue
                                }}
                                value={data.outputs[outputAnchor.name] ?? outputAnchor.default ?? 'choose an option'}
                            />
                        </Box>
                    </>
                )}
        </div>
    )
}

NodeOutputHandler.propTypes = {
    outputAnchor: PropTypes.object,
    data: PropTypes.object,
    isNodeSelected: PropTypes.bool,
    disabled: PropTypes.bool,
    selectedHandle: PropTypes.object,
    // isHandleCompatible: PropTypes.func,
    handleClick: PropTypes.func
}

export default NodeOutputHandler
