import PropTypes from 'prop-types'
import { useState, useRef, forwardRef, useEffect, useContext } from 'react'
import React from 'react'

// material-ui
import { useTheme } from '@mui/material/styles'
import { 
    IconButton, 
    Popper, 
    Paper, 
    ClickAwayListener, 
    Box, 
    Typography, 
    Divider, 
    List, 
    ListItem, 
    ListItemText, 
    ListItemAvatar,
    Button
} from '@mui/material'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import Transitions from '@/ui-component/extended/Transitions'
import nodesApi from '@/api/nodes'

// icons
import { IconPlus } from '@tabler/icons-react'

// const
import { baseURL } from '@/store/constant'

import { flowContext } from '@/store/context/ReactFlowContext'
import { getUniqueNodeId, initNode } from '@/utils/genericHelper'
import { useCanvasDirtyState } from '@/hooks/useDirtyState'

// Use forwardRef to create the ConnectionMenuContent component
const ConnectionMenuContent = forwardRef((
    { 
        connectionType, 
        groupedCompatibleNodes, 
        handleNodeSelection 
    }, 
    ref
) => {
    const theme = useTheme()
    // Add state to track which descriptions are expanded
    const [expandedDescriptions, setExpandedDescriptions] = useState({})
    // Add state to track which descriptions are truncated
    const [truncatedDescriptions, setTruncatedDescriptions] = useState({})
    // Create a ref object to store references to all description elements
    const descriptionRefs = useRef({})
    
    // Toggle function for expanding/collapsing descriptions
    const toggleDescription = (nodeId) => {
        setExpandedDescriptions(prev => ({
            ...prev,
            [nodeId]: !prev[nodeId]
        }))
    }
    
    // Check for truncation after component mounts and when descriptions change
    useEffect(() => {
        // Function to check if text is truncated
        const checkTruncation = () => {
            const newTruncatedState = {};
            
            // Check each description element
            Object.keys(descriptionRefs.current).forEach(nodeId => {
                const element = descriptionRefs.current[nodeId];
                if (element) {
                    newTruncatedState[nodeId] = element.scrollHeight > element.clientHeight;
                }
            });
            
            setTruncatedDescriptions(newTruncatedState);
        };
        
        // Check truncation initially
        checkTruncation();
        
        // Add resize listener
        window.addEventListener('resize', checkTruncation);
        
        // Cleanup
        return () => {
            window.removeEventListener('resize', checkTruncation);
        };
    }, [groupedCompatibleNodes, expandedDescriptions]);

    return (
        <MainCard 
            ref={ref} // Forward the ref to MainCard
            border={false} 
            elevation={16} 
            content={false} 
            boxShadow 
            shadow={theme.shadows[16]}
            sx={{ width: 320 }}
        >
            <Box sx={{ p: 2 }}>
                <Typography variant="h5" color={theme.palette.secondary.dark}>
                    {/* {connectionType === 'input' ? 'Connect Input' : 'Connect Output'} */}
                    Suggested Nodes
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    {connectionType === 'input' 
                        ? 'Nodes that can provide input to this connection' 
                        : 'Nodes that can receive output from this connection'}
                </Typography>
            </Box>
            <Divider />
            <Box 
                sx={{ maxHeight: 400, overflow: 'auto' }}
            >
                {Object.keys(groupedCompatibleNodes).map((suggestCategory) => (
                    <Box key={suggestCategory}>
                        <Box sx={{ px: 2, py: 1, backgroundColor: theme.palette.grey[100] }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                                {suggestCategory}
                            </Typography>
                        </Box>
                        <List sx={{ py: 0 }}>
                            {groupedCompatibleNodes[suggestCategory].map((node, index) => (
                                <React.Fragment key={node.name}>
                                    <ListItem 
                                        button
                                        disableRipple
                                        sx={{ 
                                            py: 1,
                                            '&:hover': { 
                                                backgroundColor: theme.palette.primary.lighter 
                                            },
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            cursor: 'default'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                        }}
                                    >
                                        <Box sx={{ 
                                            display: 'flex', 
                                            width: '100%',
                                            alignItems: 'center'
                                        }}>
                                            <ListItemAvatar sx={{ minWidth: 45 }}>
                                                <Box 
                                                    sx={{ 
                                                        width: 35, 
                                                        height: 35, 
                                                        borderRadius: '50%',
                                                        backgroundColor: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <img
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            padding: 5,
                                                            objectFit: 'contain'
                                                        }}
                                                        alt={node.name}
                                                        src={node.icon}
                                                    />
                                                </Box>
                                            </ListItemAvatar>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="body1" fontWeight={500}>
                                                    {node.label}
                                                </Typography>
                                                <Typography 
                                                    ref={el => {
                                                        if (el && !expandedDescriptions[node.name]) {
                                                            descriptionRefs.current[node.name] = el;
                                                        }
                                                    }}
                                                    variant="body2" 
                                                    sx={{ 
                                                        color: 'text.secondary',
                                                        ...(expandedDescriptions[node.name] ? {} : {
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical'
                                                        })
                                                    }}
                                                >
                                                    {node.description}
                                                </Typography>
                                                {node.description && (
                                                    (truncatedDescriptions[node.name] && !expandedDescriptions[node.name]) || 
                                                    expandedDescriptions[node.name]
                                                ) && (
                                                    <Button 
                                                        size="small" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleDescription(node.name);
                                                        }}
                                                        sx={{ 
                                                            p: 0, 
                                                            minWidth: 'auto', 
                                                            textTransform: 'none',
                                                            color: theme.palette.primary.main,
                                                            fontWeight: 400,
                                                            fontSize: '0.75rem',
                                                            mt: 0.5
                                                        }}
                                                    >
                                                        {expandedDescriptions[node.name] ? 'Show less' : 'Show more'}
                                                    </Button>
                                                )}
                                            </Box>
                                            <Button 
                                                variant="contained" 
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleNodeSelection(node);
                                                }}
                                            >
                                                Add
                                            </Button>
                                        </Box>
                                    </ListItem>
                                    {index < groupedCompatibleNodes[suggestCategory].length - 1 && (
                                        <Divider variant="inset" component="li" sx={{ ml: 0 }} />
                                    )}
                                </React.Fragment>
                            ))}
                        </List>
                    </Box>
                ))}
            </Box>
        </MainCard>
    );
});

// Add display name for debugging
ConnectionMenuContent.displayName = 'ConnectionMenuContent'

// Add PropTypes for ConnectionMenuContent
ConnectionMenuContent.propTypes = {
    connectionType: PropTypes.oneOf(['input', 'output']).isRequired,
    groupedCompatibleNodes: PropTypes.object.isRequired,
    handleNodeSelection: PropTypes.func.isRequired
}

// Function to extract types from a type string (e.g., "VectorStore | json" -> ["VectorStore", "json"])
const extractTypes = (typeString) => {
    // Split by '|' and trim each resulting string to remove spaces
    return typeString.split('|').map(type => type.trim()).filter(type => type.length > 0);
};

// Function to check if two type strings are compatible
const areTypesCompatible = (type1, type2) => {
    const types1 = extractTypes(type1);
    const types2 = extractTypes(type2);
    
    // Check if there's at least one common type
    return types1.some(t1 => types2.includes(t1));
};

// Function to generate compatibleNodes for all nodes
const generateCompatibleNodes = (nodesDataWithAnchors) => {
    // Create a deep copy to avoid modifying the original data
    const nodesWithCompatibility = JSON.parse(JSON.stringify(nodesDataWithAnchors));
    
    // For each node
    for (const node of nodesWithCompatibility) {
        // Process input anchors
        if (node.inputAnchors) {
            for (const inputAnchor of node.inputAnchors) {
                inputAnchor.compatibleNodes = [];
                
                // Find compatible output anchors from all other nodes
                for (const otherNode of nodesDataWithAnchors) {
                    if (otherNode.id === node.id) continue; // Skip self
                    
                    const compatibleAnchors = [];
                    
                    // Check each output anchor of the other node
                    if (otherNode.outputAnchors) {
                        for (const outputAnchor of otherNode.outputAnchors) {
                            // Special handling for output anchors with type "options"
                            if (outputAnchor.type === "options" && outputAnchor.options) {
                                // Check each option in the options array
                                const matchingOptions = [];
                                
                                for (const option of outputAnchor.options) {
                                    if (areTypesCompatible(inputAnchor.type, option.type)) {
                                        matchingOptions.push({
                                            name: option.name
                                        });
                                    }
                                }
                                
                                // If there are matching options, add this anchor with options info
                                if (matchingOptions.length > 0) {
                                    compatibleAnchors.push({
                                        name: outputAnchor.name,
                                        options: matchingOptions
                                    });
                                }
                            } 
                            // Normal case - direct type matching
                            else if (areTypesCompatible(inputAnchor.type, outputAnchor.type)) {
                                compatibleAnchors.push({
                                    name: outputAnchor.name
                                });
                            }
                        }
                    }
                    
                    // If there are compatible anchors, add this node to the list
                    if (compatibleAnchors.length > 0) {
                        inputAnchor.compatibleNodes.push({
                            id: otherNode.id,
                            anchors: compatibleAnchors
                        });
                    }
                }
            }
        }
        
        // Process output anchors
        if (node.outputAnchors) {
            for (const outputAnchor of node.outputAnchors) {
                // Special handling for output anchors with type "options"
                if (outputAnchor.type === "options" && outputAnchor.options) {
                    // Initialize compatibleNodes for the main output anchor
                    outputAnchor.compatibleNodes = [];
                    
                    // Process each option in the options array
                    for (const option of outputAnchor.options) {
                        // Initialize compatibleNodes for each option
                        option.compatibleNodes = [];
                        
                        // Find compatible input anchors for this option
                        for (const otherNode of nodesDataWithAnchors) {
                            if (otherNode.id === node.id) continue; // Skip self
                            
                            const compatibleAnchors = [];
                            
                            // Check each input anchor of the other node
                            if (otherNode.inputAnchors) {
                                for (const inputAnchor of otherNode.inputAnchors) {
                                    if (areTypesCompatible(option.type, inputAnchor.type)) {
                                        compatibleAnchors.push({
                                            name: inputAnchor.name
                                        });
                                    }
                                }
                            }
                            
                            // If there are compatible anchors, add this node to the option's list
                            if (compatibleAnchors.length > 0) {
                                option.compatibleNodes.push({
                                    id: otherNode.id,
                                    anchors: compatibleAnchors
                                });
                            }
                        }
                    }
                } 
                // Normal case - regular output anchor
                else {
                    outputAnchor.compatibleNodes = [];
                    
                    // Find compatible input anchors from all other nodes
                    for (const otherNode of nodesDataWithAnchors) {
                        if (otherNode.id === node.id) continue; // Skip self
                        
                        const compatibleAnchors = [];
                        
                        // Check each input anchor of the other node
                        if (otherNode.inputAnchors) {
                            for (const inputAnchor of otherNode.inputAnchors) {
                                if (areTypesCompatible(outputAnchor.type, inputAnchor.type)) {
                                    compatibleAnchors.push({
                                        name: inputAnchor.name
                                    });
                                }
                            }
                        }
                        
                        // If there are compatible anchors, add this node to the list
                        if (compatibleAnchors.length > 0) {
                            outputAnchor.compatibleNodes.push({
                                id: otherNode.id,
                                anchors: compatibleAnchors
                            });
                        }
                    }
                }
            }
        }
    }
    
    return nodesWithCompatibility;
};

/**
 * ConnectionButton Component
 * 
 * A component that displays a "+" button which, when clicked,
 * shows a menu of compatible nodes that can be connected.
 * This component encapsulates both the button and its menu.
 */
export const ConnectionButton = ({ 
    nodeData,
    connectionType, // 'input' or 'output'
    handleId,
    buttonStyle, // Additional styling for the button
}) => {
    const theme = useTheme()
    const [showMenu, setShowMenu] = useState(false)
    const buttonRef = useRef(null)
    const { setDirty } = useCanvasDirtyState()
    const { reactFlowInstance } = useContext(flowContext)
    // Add a state variable to store the nodes data
    const [nodesData, setNodesData] = useState(null)
    // Add a loading state to track API call status
    const [isLoading, setIsLoading] = useState(false)
    // Add state for grouped nodes
    const [groupedCompatibleNodes, setGroupedCompatibleNodes] = useState({})

    // Add a useEffect to fetch nodes data when the component mounts
    useEffect(() => {
        const fetchNodesData = async () => {
            if (nodesData !== null) return; // Skip if we already have the data
            
            setIsLoading(true);
            try {
                const response = await fetch(`${baseURL}/api/v1/nodes`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch nodes: ${response.statusText}`);
                }
                
                const data = await response.json();
                setNodesData(data);
                
                // !One Time run -- To get the data for server configuration as a temporary solution
                // 1. initNode for each node to get the node's input/output anchors
                // 2. Generate nodes data with anchors (Step 1 output)
                // 3. Generate compatibility data (Step 2)
                /* ===============  !One Time run start ===============
                let nodesDataWithAnchors = []
                
                // Use the fetched data directly instead of the state variable
                for (const node of data) {
                    const nodeData = initNode(node, node.id || node.name)
                    nodesDataWithAnchors.push({
                        id: node.id || node.name,
                        inputAnchors: nodeData.inputAnchors,
                        outputAnchors: nodeData.outputAnchors
                    })
                }
                
                // Generate compatibility data (Step 2)
                const nodesWithCompatibility = generateCompatibleNodes(nodesDataWithAnchors);
                
                // Log the final result
                console.log('Nodes with compatibility:', nodesWithCompatibility)
                ! One time run output file: packages/server/src/services/nodes/compatibleNodes.json
                =============== !One Time run end =============== */
            } catch (error) {
                console.error('Error fetching nodes data:', error);
            } finally {
                setIsLoading(false);
            }
        }
        
        fetchNodesData();
    }, []); // Empty dependency array means this runs once on mount

    // Function to process and group nodes
    const processAndGroupNodes = (fetchedNodesData, compatibleNodesFromServer) => {
        if (!fetchedNodesData) return;
        
        // Create a map of nodes by ID for quick lookup
        const nodesMap = fetchedNodesData.reduce((map, node) => {
            map[node.name] = node;
            return map;
        }, {});
        
        // Process compatibleNodes and merge with API data
        const processedNodes = compatibleNodesFromServer.map(compatNode => {
            const nodeId = compatNode.id;
            const apiNode = nodesMap[nodeId];
            const defaultSuggestCategory = "Compatible Nodes"
            
            if (!apiNode) {
                console.warn(`Node with ID ${nodeId} not found in API data`);
                return null;
            }
            
            // Merge the compatible node with API data
            // Use default category "Compatible Nodes" if suggestCategory is not provided
            return {
                ...apiNode,
                suggestCategory: compatNode.suggestCategory || defaultSuggestCategory,
                icon: `${baseURL}/api/v1/node-icon/${apiNode.name}` // Set the correct icon URL
            };
        }).filter(Boolean); // Remove null entries
        
        // Group by suggestCategory
        const grouped = processedNodes.reduce((acc, node) => {
            const category = node.suggestCategory
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(node);
            return acc;
        }, {});
        
        // Create a new ordered object with "Most Common" first
        const orderedGrouped = {};
        
        // Get all category keys and sort them to ensure "Most Common" comes first
        const categories = Object.keys(grouped).sort((a, b) => {
            if (a === "Most Common") return -1;
            if (b === "Most Common") return 1;
            return a.localeCompare(b); // Alphabetical order for other categories
        });
        
        // Add categories to the ordered object in the sorted order
        categories.forEach(category => {
            orderedGrouped[category] = grouped[category];
        });
        
        setGroupedCompatibleNodes(orderedGrouped);
    };

    // Update the click handler to toggle the menu and fetch compatible nodes
    const handleButtonClick = async () => {
        setShowMenu((prevShow) => !prevShow) // Toggle between true/false
        
        // Extract the nodeId and anchorName from the handleId
        // handleId format is typically: "[nodeId]-[input/output]-[anchorName]-[types]", 
        // example: conversationalRetrievalQAChain_0-output-conversationalRetrievalQAChain-ConversationalRetrievalQAChain|BaseChain|Runnable
        const handleParts = handleId.split('-');
        
        if (handleParts.length >= 4) {
            const nodeId = nodeData.name
            const anchorName = handleParts[2]

            // Fetch compatible nodes from the server
            try {
                // Determine if this is an option based on your application's logic
                // This is a placeholder - you may need to adjust this based on your actual data structure
                const isOption = false; // Default to false, adjust as needed
                
                const serverResponse = await nodesApi.getCompatibleNodes(nodeId, anchorName, isOption)
                const compatibleNodesFromServer = serverResponse.data?.compatibleNodes || []
                
                if (compatibleNodesFromServer && compatibleNodesFromServer.length > 0) {
                    // Process the compatible nodes data
                    processAndGroupNodes(nodesData, compatibleNodesFromServer)
                }
            } catch (error) {
                console.error('Error fetching compatible nodes:', error);
            }
        } else {
            console.warn('Invalid handleId format:', handleId);
        }
    }

    const handleNodeSelection = async (node) => {
        try {
            // Use the stored nodes data instead of making a new API call
            if (!nodesData) {
                console.error('Nodes data not found');
                setShowMenu(false);
                return;
            } else {
                // Use the stored data
                const nodeId = typeof node === 'string' ? node : node.id || node.name;
                const nodeTemplate = nodesData.find(n => n.name === nodeId || n.id === nodeId);
                
                if (!nodeTemplate) {
                    console.error('Node template not found for:', nodeId);
                    setShowMenu(false);
                    return;
                }
                
                // Continue with the rest of the function using nodeTemplate
                addNodeToCanvas(nodeTemplate);
            }
        } catch (error) {
            console.error('Error in handleNodeSelection:', error);
        }
        
        // Close the menu
        setShowMenu(false);
    }
    
    // Extract the node addition logic to a separate function to avoid code duplication
    const addNodeToCanvas = (nodeTemplate) => {
        if (!reactFlowInstance) {
            console.error('ReactFlow instance not available');
            return;
        }
        
        // Get the position of the button
        const buttonElement = buttonRef.current;
        if (!buttonElement) {
            console.error('Button element not found');
            return;
        }
        
        // Get the button's position
        const buttonRect = buttonElement.getBoundingClientRect();
        
        // Get the ReactFlow container's position
        const reactFlowContainer = document.querySelector('.reactflow-wrapper');
        const containerRect = reactFlowContainer ? reactFlowContainer.getBoundingClientRect() : { left: 0, top: 0 };
        
        // Calculate the position in ReactFlow coordinates
        const position = reactFlowInstance.project({
            x: connectionType === 'input' 
                ? buttonRect.left - containerRect.left - 300  // Position to the left (node width ~300px + 50px gap)
                : buttonRect.left - containerRect.left + 100, // Position to the right (100px from button)
            y: buttonRect.top - containerRect.top          // Same vertical position as the button
        });
        
        // Generate a unique ID for the new node
        const existingNodes = reactFlowInstance.getNodes();
        const newNodeId = getUniqueNodeId(nodeTemplate, existingNodes);
        
        // Create the new node object with selected state
        const newNode = {
            id: newNodeId,
            position: position,
            type: nodeTemplate.type !== 'StickyNote' ? 'customNode' : 'stickyNote',
            selected: true,  // Add this for ReactFlow's built-in selection
            data: {
                ...initNode(nodeTemplate, newNodeId),
                selected: true  // Set the node as selected in data
            },
            // Add default dimensions for sticky notes
            ...(nodeTemplate.type === 'StickyNote' && {
                style: {
                    width: 300,
                    height: 300
                }
            })
        };
        
        // Add the node to the canvas and update other nodes
        const updatedNodes = existingNodes.map(node => ({
            ...node,
            selected: false,  // Update ReactFlow's selection
            data: {
                ...node.data,
                selected: false
            }
        }));
        
        // Set all nodes at once
        reactFlowInstance.setNodes([...updatedNodes, newNode]);
        
        // Mark the canvas as dirty
        setTimeout(() => setDirty && setDirty(), 0);
    }

    return (
        <>
            {/* "+" button */}
            <IconButton 
                ref={buttonRef}
                size="small"
                onClick={
                    (e) => {
                        e.stopPropagation();
                        handleButtonClick();
                    }
                }
                sx={{
                    width: '28px',
                    height: '28px',
                    backgroundColor: theme.palette.secondary.dark,
                    color: theme.palette.primary.contrastText,
                    '&:hover': {
                        backgroundColor: theme.palette.error.dark,
                    },
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    zIndex: 10,
                    ...buttonStyle
                }}
            >
                <IconPlus size={21} />
            </IconButton>
            
            {/* Connection Menu */}
            <Popper
                open={showMenu}
                anchorEl={buttonRef.current}
                placement={connectionType === 'input' ? 'left-start' : 'right-start'}
                transition
                disablePortal={false}
                sx={{ zIndex: 1200 }}
                onClick={
                    (e) => {
                        e.stopPropagation();
                    }
                }
            >
                {({ TransitionProps }) => (
                    <Transitions 
                        in={showMenu} 
                        {...TransitionProps}
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        <Paper 
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            <ClickAwayListener onClickAway={() => setShowMenu(false)}> 
                                <ConnectionMenuContent 
                                    connectionType={connectionType}
                                    groupedCompatibleNodes={groupedCompatibleNodes}
                                    handleNodeSelection={(node) => {
                                        handleNodeSelection(node);
                                    }}
                                />
                            </ClickAwayListener>
                        </Paper>
                    </Transitions>
                )}
            </Popper>
        </>
    )
}

ConnectionButton.propTypes = {
    nodeData: PropTypes.object.isRequired,
    connectionType: PropTypes.oneOf(['input', 'output']).isRequired,
    handleId: PropTypes.string.isRequired,
    buttonStyle: PropTypes.object,
}
