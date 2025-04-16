import { useState, useRef, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

// material-ui
import { useTheme } from '@mui/material/styles'
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Box,
    Divider,
    InputAdornment,
    List,
    ListItemButton,
    ListItem,
    ListItemAvatar,
    ListItemText,
    OutlinedInput,
    Stack,
    Typography,
    Chip,
    Tab,
    Tabs,
    IconButton
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

// third-party
import PerfectScrollbar from 'react-perfect-scrollbar'

// icons
import { IconSearch, IconX, IconAlignRight2 } from '@tabler/icons-react'
import LlamaindexPNG from '@/assets/images/llamaindex.png'
import LangChainPNG from '@/assets/images/langchain.png'
import utilNodesPNG from '@/assets/images/utilNodes.png'

// const
import { baseURL } from '@/store/constant'
import { SET_COMPONENT_NODES } from '@/store/actions'
import { Tooltip } from '@mui/material'

// ==============================|| NODES DIALOG ||============================== //

function a11yProps(index) {
    return {
        id: `attachment-tab-${index}`,
        'aria-controls': `attachment-tabpanel-${index}`
    }
}

const AVAILABLE_TABS = {
    LANGCHAIN: { 
        name: 'Agent Chain', 
        index: 0, 
        isVisible: true,
        icon: LangChainPNG
    },
    LLAMAINDEX: { 
        name: 'LlamaIndex', index: 1, isVisible: false, icon: LlamaindexPNG },
    UTILITIES: { 
        name: 'Utilities', index: 2, isVisible: true, icon: utilNodesPNG }
}

// Helper function to get visible tabs
const getVisibleTabs = () => {
    return Object.values(AVAILABLE_TABS)
        .filter(tab => tab.isVisible)
        .sort((a, b) => a.index - b.index)
}

// Custom hook for debounced search
const useDebounce = (callback, delay) => {
    const timeoutRef = useRef(null)

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
            callback(...args)
        }, delay)
    }, [callback, delay])
}

const NodesDialog = ({ nodesData, onClose, isAgentCanvas, onDragStart, style }) => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    const dispatch = useDispatch()

    const [searchValue, setSearchValue] = useState('')
    const [nodes, setNodes] = useState({})
    const [categoryExpanded, setCategoryExpanded] = useState({})
    const [tabValue, setTabValue] = useState(0)

    const ps = useRef()

    const scrollTop = () => {
        const curr = ps.current
        if (curr) {
            curr.scrollTop = 0
        }
    }

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue)
        const visibleTabs = getVisibleTabs()
        const tabName = visibleTabs[newValue].name
        filterSearch(searchValue, tabName)
    }

    const blacklistCategoriesForAgentCanvas = ['Agents', 'Memory', 'Record Manager']
    const allowedAgentModel = {}
    const exceptions = {
        Memory: ['agentMemory']
    }

    const addException = () => {
        let nodes = []
        for (const category in exceptions) {
            const nodeNames = exceptions[category]
            nodes.push(...nodesData.filter((nd) => nd.category === category && nodeNames.includes(nd.name)))
        }
        return nodes
    }

    const getSearchedNodes = (value) => {
        if (isAgentCanvas) {
            const nodes = nodesData.filter((nd) => !blacklistCategoriesForAgentCanvas.includes(nd.category))
            nodes.push(...addException())
            const passed = nodes.filter((nd) => {
                const passesQuery = (nd.label || '').toLowerCase().includes(value.toLowerCase()) || 
                                  (nd.name || '').toLowerCase().includes(value.toLowerCase())
                const passesCategory = (nd.category || '').toLowerCase().includes(value.toLowerCase())
                const passesDescription = (nd.description || '').toLowerCase().includes(value.toLowerCase())
                return passesQuery || passesCategory || passesDescription
            })
            return passed
        }
        const nodes = nodesData.filter((nd) => nd.category !== 'Multi Agents' && nd.category !== 'Sequential Agents')
        const passed = nodes.filter((nd) => {
            const passesQuery = (nd.label || '').toLowerCase().includes(value.toLowerCase()) || 
                              (nd.name || '').toLowerCase().includes(value.toLowerCase())
            const passesCategory = (nd.category || '').toLowerCase().includes(value.toLowerCase())
            const passesDescription = (nd.description || '').toLowerCase().includes(value.toLowerCase())
            return passesQuery || passesCategory || passesDescription
        })
        return passed
    }

    const performSearch = useCallback((value, newTabValue) => {
        const returnData = value ? getSearchedNodes(value) : nodesData
        groupByCategory(returnData, newTabValue ?? getVisibleTabs()[tabValue].name)
        scrollTop()
    }, [nodesData, tabValue])

    // Use debounced search
    const searchTimeout = 500
    const debouncedSearch = useDebounce(performSearch, searchTimeout)

    // Update the filterSearch function
    const filterSearch = (value, newTabValue) => {
        setSearchValue(value) // Update the input value immediately
        debouncedSearch(value, newTabValue) // Debounce the actual search
    }

    const groupByTags = (nodes, tabName = AVAILABLE_TABS.LANGCHAIN.name) => {
        switch (tabName) {
            case AVAILABLE_TABS.LANGCHAIN.name:
                return nodes.filter((nd) => !nd.tags || nd.tags.length === 0)
            case AVAILABLE_TABS.LLAMAINDEX.name:
                return nodes.filter((nd) => nd.tags && nd.tags.includes('LlamaIndex'))
            case AVAILABLE_TABS.UTILITIES.name:
                return nodes.filter((nd) => nd.tags && nd.tags.includes('Utilities'))
            default:
                return []
        }
    }

    const groupByCategory = (nodes, newTabValue, isFilter) => {
        if (isAgentCanvas) {
            const accordianCategories = {}
            const result = nodes.reduce(function (r, a) {
                r[a.category] = r[a.category] || []
                r[a.category].push(a)
                accordianCategories[a.category] = isFilter ? true : false
                return r
            }, Object.create(null))

            const filteredResult = {}
            for (const category in result) {
                // Filter out blacklisted categories
                if (!blacklistCategoriesForAgentCanvas.includes(category)) {
                    // Filter out LlamaIndex nodes
                    const nodes = result[category].filter((nd) => !nd.tags?.length || !nd.tags.includes('LlamaIndex'))
                    if (!nodes.length) continue

                    // Only allow specific models for specific categories
                    if (Object.keys(allowedAgentModel).includes(category)) {
                        const allowedModels = allowedAgentModel[category]
                        filteredResult[category] = nodes.filter((nd) => allowedModels.includes(nd.name))
                    } else {
                        filteredResult[category] = nodes
                    }
                }

                // Allow exceptions
                if (Object.keys(exceptions).includes(category)) {
                    filteredResult[category] = addException()
                }
            }
            setNodes(filteredResult)
            accordianCategories['Multi Agents'] = true
            accordianCategories['Sequential Agents'] = true
            setCategoryExpanded(accordianCategories)
        } else {
            const taggedNodes = groupByTags(nodes, newTabValue)
            const accordianCategories = {}
            const result = taggedNodes.reduce(function (r, a) {
                r[a.category] = r[a.category] || []
                r[a.category].push(a)
                accordianCategories[a.category] = isFilter ? true : false
                return r
            }, Object.create(null))

            const filteredResult = {}
            for (const category in result) {
                if (category === 'Multi Agents' || category === 'Sequential Agents') {
                    continue
                }
                filteredResult[category] = result[category]
            }
            setNodes(filteredResult)
            setCategoryExpanded(accordianCategories)
        }
    }

    const handleAccordionChange = (category) => (event, isExpanded) => {
        const accordianCategories = { ...categoryExpanded }
        accordianCategories[category] = isExpanded
        setCategoryExpanded(accordianCategories)
    }

    // Load nodes on component mount
    useEffect(() => {
        if (nodesData) {
            groupByCategory(nodesData, AVAILABLE_TABS.LANGCHAIN.name)
            dispatch({ type: SET_COMPONENT_NODES, componentNodes: nodesData })
        }
    }, [nodesData, dispatch])

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                backgroundColor: theme.palette.background.paper,
                ...style,
            }}
        >
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Stack 
                    direction="row" 
                    justifyContent="space-between" 
                    alignItems="center"
                >
                    <Typography 
                        variant='h4'
                        sx={{ 
                            fontWeight: 600,
                            fontSize: '1.2rem'
                        }}
                    >
                        Node Components
                    </Typography>
                    <Tooltip title="Hide Nodes" placement="right" arrow>
                        <IconButton 
                            size="small" 
                            onClick={onClose}
                            sx={{
                                backgroundColor: 'white',
                                color: theme.palette.grey[500],
                                // boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                borderRadius: '6px',
                                width: 36,
                                height: 36,
                                '&:hover': {
                                    backgroundColor: theme.palette.grey[300],
                                    color: theme.palette.primary.main
                                }
                            }}
                        >
                            <IconAlignRight2 
                                size={18} 
                                stroke={2} 
                            />
                        </IconButton>
                    </Tooltip>
                </Stack>
                <OutlinedInput
                    sx={{ 
                        width: '100%', 
                        pr: 2, 
                        pl: 2, 
                        my: 2,
                        borderRadius: '8px',
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: theme.palette.grey[300]
                        }
                    }}
                    id='input-search-node'
                    value={searchValue}
                    onChange={(e) => filterSearch(e.target.value)}
                    placeholder='Search nodes'
                    startAdornment={
                        <InputAdornment position='start'>
                            <IconSearch stroke={1.5} size='1rem' color={theme.palette.grey[500]} />
                        </InputAdornment>
                    }
                    endAdornment={
                        searchValue && (
                            <InputAdornment
                                position='end'
                                sx={{
                                    cursor: 'pointer',
                                    color: theme.palette.grey[500],
                                    '&:hover': {
                                        color: theme.palette.grey[900]
                                    }
                                }}
                                title='Clear Search'
                            >
                                <IconX
                                    stroke={1.5}
                                    size='1rem'
                                    onClick={() => filterSearch('')}
                                    style={{
                                        cursor: 'pointer'
                                    }}
                                />
                            </InputAdornment>
                        )
                    }
                    aria-describedby='search-helper-text'
                    inputProps={{
                        'aria-label': 'weight'
                    }}
                />
                {!isAgentCanvas && (
                    <Tabs
                        sx={{ 
                            position: 'relative', 
                            minHeight: '50px', 
                            height: '50px',
                            '& .MuiTabs-indicator': {
                                height: '3px',
                                borderRadius: '1.5px'
                            }
                        }}
                        variant='fullWidth'
                        value={tabValue}
                        onChange={handleTabChange}
                        aria-label='tabs'
                    >
                        {getVisibleTabs().map((tab, index) => (
                            <Tab
                                icon={
                                    <div style={{ 
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center' 
                                    }}>
                                        <img
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                objectFit: 'contain'
                                            }}
                                            src={tab.icon}
                                            alt={tab.name}
                                        />
                                    </div>
                                }
                                iconPosition='start'
                                sx={{ 
                                    minHeight: '50px', 
                                    height: '50px',
                                    textTransform: 'none',
                                    fontWeight: tabValue === index ? 600 : 400
                                }}
                                key={index}
                                label={tab.name}
                                {...a11yProps(index)}
                            />
                        ))}
                    </Tabs>
                )}
                <Divider />
            </Box>
            
            {/* Content */}
            <PerfectScrollbar
                containerRef={(el) => {
                    ps.current = el
                }}
                style={{
                    flex: 1,
                    overflowX: 'hidden'
                }}
            >
                <Box sx={{ p: 2, pt: 0 }}>
                    <List
                        sx={{
                            width: '100%',
                            py: 0,
                            borderRadius: '10px',
                            '& .MuiListItemSecondaryAction-root': {
                                top: 22
                            },
                            '& .MuiDivider-root': {
                                my: 0
                            },
                            '& .list-container': {
                                pl: 7
                            }
                        }}
                    >
                        {Object.keys(nodes)
                            .sort()
                            .map((category) => (
                                <Accordion
                                    expanded={categoryExpanded[category] || false}
                                    onChange={handleAccordionChange(category)}
                                    key={category}
                                    disableGutters
                                >
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon />}
                                        aria-controls={`nodes-accordian-${category}`}
                                        id={`nodes-accordian-header-${category}`}
                                    >
                                        {category.split(';').length > 1 ? (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <Typography variant='h5'>{category.split(';')[0]}</Typography>
                                                &nbsp;
                                                <Chip
                                                    sx={{
                                                        width: 'max-content',
                                                        fontWeight: 700,
                                                        fontSize: '0.65rem',
                                                        background:
                                                            category.split(';')[1] === 'DEPRECATING'
                                                                ? theme.palette.warning.main
                                                                : theme.palette.teal.main,
                                                        color:
                                                            category.split(';')[1] !== 'DEPRECATING'
                                                                ? 'white'
                                                                : 'inherit'
                                                    }}
                                                    size='small'
                                                    label={category.split(';')[1]}
                                                />
                                            </div>
                                        ) : (
                                            <Typography variant='h5'>{category}</Typography>
                                        )}
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        {nodes[category].map((node, index) => (
                                            <div
                                                key={node.name}
                                                onDragStart={(event) => onDragStart(event, node)}
                                                draggable
                                            >
                                                <ListItemButton
                                                    sx={{
                                                        p: 0,
                                                        borderRadius: `${customization.borderRadius}px`,
                                                        cursor: 'move'
                                                    }}
                                                >
                                                    <ListItem alignItems='center'>
                                                        <ListItemAvatar>
                                                            <div
                                                                style={{
                                                                    width: 50,
                                                                    height: 50,
                                                                    borderRadius: '50%',
                                                                    backgroundColor: 'white'
                                                                }}
                                                            >
                                                                <img
                                                                    style={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        padding: 10,
                                                                        objectFit: 'contain'
                                                                    }}
                                                                    alt={node.name}
                                                                    src={`${baseURL}/api/v1/node-icon/${node.name}`}
                                                                />
                                                            </div>
                                                        </ListItemAvatar>
                                                        <ListItemText
                                                            sx={{ ml: 1 }}
                                                            primary={
                                                                <>
                                                                    <div
                                                                        style={{
                                                                            display: 'flex',
                                                                            flexDirection: 'row',
                                                                            alignItems: 'center'
                                                                        }}
                                                                    >
                                                                        <span>{node.label}</span>
                                                                        &nbsp;
                                                                        {node.badge && (
                                                                            <Chip
                                                                                sx={{
                                                                                    width: 'max-content',
                                                                                    fontWeight: 700,
                                                                                    fontSize: '0.65rem',
                                                                                    background:
                                                                                        node.badge === 'DEPRECATING'
                                                                                            ? theme.palette.warning.main
                                                                                            : theme.palette.teal.main,
                                                                                    color:
                                                                                        node.badge !== 'DEPRECATING'
                                                                                            ? 'white'
                                                                                            : 'inherit'
                                                                                }}
                                                                                size='small'
                                                                                label={node.badge}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    {node.author && (
                                                                        <span
                                                                            style={{
                                                                                fontSize: '0.65rem',
                                                                                fontWeight: 700
                                                                            }}
                                                                        >
                                                                            By {node.author}
                                                                        </span>
                                                                    )}
                                                                </>
                                                            }
                                                            secondary={node.description || ''}
                                                        />
                                                    </ListItem>
                                                </ListItemButton>
                                                {index === nodes[category].length - 1 ? null : <Divider />}
                                            </div>
                                        ))}
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                    </List>
                </Box>
            </PerfectScrollbar>
        </Box>
    )
}

NodesDialog.propTypes = {
    nodesData: PropTypes.array,
    onClose: PropTypes.func.isRequired,
    isAgentCanvas: PropTypes.bool,
    onDragStart: PropTypes.func.isRequired,
    style: PropTypes.object
}

export default NodesDialog
