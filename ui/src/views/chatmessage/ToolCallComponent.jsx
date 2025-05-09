import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'

// material-ui
import { Box, Chip, Stack, Tabs, Tab, Typography } from '@mui/material'
import { styled, useTheme } from '@mui/material/styles'
import { IconTool, IconChevronDown, IconChevronUp, IconCode, IconListDetails } from '@tabler/icons-react'

// project imports
import ReactJson from 'flowise-react-json-view'

// Styled components with isDarkMode parameter (default is true)
const ToolContainer = styled('div')(() => ({
    display: 'block',
    flexDirection: 'row',
    width: '100%',
    maxWidth: '100%'
}))

const ToolBox = styled(Box)(({ theme, isDarkMode = true }) => ({
    marginBottom: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    width: '100%',
    maxWidth: '100%',
    background: isDarkMode ? '#1e1e1e' : '#f5f5f5',
    border: `1px solid ${isDarkMode ? '#333' : '#ddd'}`,
    overflow: 'hidden',
    color: isDarkMode ? '#cccccc' : theme.palette.text.primary
}))

const ToolHeader = styled(Stack)(({ isDarkMode = true }) => ({
    padding: '10px 16px',
    cursor: 'pointer',
    justifyContent: 'space-between',
    backgroundColor: isDarkMode ? '#252526' : '#e9e9e9',
    width: '100%',
    overflow: 'hidden'
}))

const ToolContent = styled(Box)(({ isCollapsed, isDarkMode = true }) => ({
    maxHeight: isCollapsed ? 0 : '1000px',
    opacity: isCollapsed ? 0 : 1,
    overflow: 'hidden',
    transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
    padding: isCollapsed ? 0 : 16,
    paddingTop: 0,
    backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5',
    width: '100%',
    maxWidth: '100%'
}))

const StyledTabs = styled(Tabs)(({ isDarkMode = true }) => ({
    borderBottom: 1,
    borderColor: isDarkMode ? '#454545' : '#dfdfdf',
    minHeight: '36px',
    backgroundColor: isDarkMode ? '#252526' : '#e9e9e9',
    borderRadius: '4px 4px 0 0',
    width: '100%',
    '& .MuiTabs-indicator': {
        backgroundColor: isDarkMode ? '#569cd6' : '#1976d2',
        height: 2
    }
}))

const StyledTab = styled(Tab)(({ theme, isDarkMode = true, isActive }) => ({
    textTransform: 'none',
    minHeight: '36px',
    height: 'auto',
    padding: '8px 12px',
    fontSize: '0.8rem',
    color: isActive 
        ? (isDarkMode ? '#ffffff' : theme.palette.primary.main) 
        : (isDarkMode ? '#cccccc' : theme.palette.text.primary),
    '&.Mui-selected': {
        color: isActive 
            ? (isDarkMode ? '#ffffff' : theme.palette.primary.main) 
            : (isDarkMode ? '#cccccc' : theme.palette.text.primary),
        backgroundColor: isDarkMode ? '#1e1e1e' : '#f5f5f5'
    },
    '& .MuiTab-iconWrapper': {
        marginRight: '4px',
        marginBottom: '0px !important'
    }
}))

const SectionLabel = styled(Typography)(({ isDarkMode = true }) => ({
    fontWeight: 'bold',
    marginBottom: 8,
    color: isDarkMode ? '#569cd6' : '#1976d2',
    fontSize: '0.875rem'
}))

// Updated CodeBlock with max-height, overflow-y and word-break properties
const CodeBlock = styled(Box)(({ isDarkMode = true }) => ({
    padding: 12,
    borderRadius: 4,
    backgroundColor: isDarkMode ? '#2d2d2d' : '#f0f0f0',
    border: `1px solid ${isDarkMode ? '#454545' : '#dfdfdf'}`,
    fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
    fontSize: '0.85rem',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    color: isDarkMode ? '#cccccc' : '#333333',
    overflowX: 'auto',
    overflowY: 'auto',
    maxHeight: '400px',
    maxWidth: '100%',
    marginBottom: 16,
    '& .key': {
        color: isDarkMode ? '#9cdcfe' : '#0451a5',
        fontWeight: 500
    },
    '& .value-string': {
        color: isDarkMode ? '#ce9178' : '#a31515',
        wordBreak: 'break-word'
    },
    '& .value-number': {
        color: isDarkMode ? '#b5cea8' : '#098658'
    },
    '& .value-boolean': {
        color: isDarkMode ? '#569cd6' : '#0000ff'
    },
    '& .value-null': {
        color: isDarkMode ? '#569cd6' : '#0000ff'
    },
    '& .list-item': {
        display: 'block',
        paddingLeft: '1em'
    },
    '& .list-bullet': {
        color: isDarkMode ? '#d4d4d4' : '#000000'
    }
}))

const ToolIcon = styled(IconTool)(({ isDarkMode = true }) => ({
    color: isDarkMode ? '#569cd6' : '#1976d2',
    flexShrink: 0
}))

const TabIcon = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '4px'
})

// Custom TabPanel component
const TabPanel = (props) => {
    const { children, value, index, ...other } = props
    return (
        <div
            role='tabpanel'
            hidden={value !== index}
            id={`tool-tabpanel-${index}`}
            aria-labelledby={`tool-tab-${index}`}
            style={{ width: '100%', maxWidth: '100%' }}
            {...other}
        >
            {value === index && <Box sx={{ pt: 1.5, width: '100%', maxWidth: '100%' }}>{children}</Box>}
        </div>
    )
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired
}

const ToolCallComponent = ({ tools, displayMode = 'chip', onToolClick, isDarkMode = true, defaultExpanded = true }) => {
    const theme = useTheme()
    const customization = useSelector((state) => state.customization)
    const [collapsedState, setCollapsedState] = useState({})
    const [tabValues, setTabValues] = useState({})

    // Initialize collapsed state based on defaultExpanded prop
    useEffect(() => {
        if (tools && tools.length > 0) {
            const initialState = {}
            tools.forEach((_, index) => {
                initialState[index] = !defaultExpanded
            })
            setCollapsedState(initialState)
        }
    }, [tools, defaultExpanded])

    if (!tools || tools.length === 0) return null

    const toggleCollapse = (index, event) => {
        event.stopPropagation()
        setCollapsedState(prev => ({
            ...prev,
            [index]: !prev[index]
        }))
    }

    const handleTabChange = (index, newValue) => {
        setTabValues(prev => ({
            ...prev,
            [index]: newValue
        }))
    }

    // Helper to format different value types with syntax highlighting
    const formatValueWithHighlighting = (value, indentLevel = 0) => {
        const indentStr = '  '.repeat(indentLevel);
        
        // Handle null and undefined
        if (value === null) {
            return `<span class="value-null">null</span>`;
        }
        if (value === undefined) {
            return `<span class="value-null">undefined</span>`;
        }
        
        // Handle different types with appropriate styling
        switch (typeof value) {
            case 'string':
                // Try to parse as JSON first
                try {
                    const parsed = JSON.parse(value);
                    return formatJsonWithHighlighting(parsed, indentLevel);
                } catch (e) {
                    // It's a regular string
                    return `<span class="value-string">${value}</span>`;
                }
            case 'number':
                return `<span class="value-number">${value}</span>`;
            case 'boolean':
                return `<span class="value-boolean">${value}</span>`;
            case 'object':
                if (Array.isArray(value)) {
                    return formatArrayWithHighlighting(value, indentLevel);
                }
                return formatJsonWithHighlighting(value, indentLevel);
            default:
                return String(value);
        }
    }
    
    // Format JSON objects with syntax highlighting
    const formatJsonWithHighlighting = (jsonData, indentLevel = 0) => {
        if (!jsonData || typeof jsonData !== 'object' || Object.keys(jsonData).length === 0) {
            return '{}';
        }
        
        let result = '';
        const indent = '  '.repeat(indentLevel);
        
        for (const key in jsonData) {
            if (jsonData.hasOwnProperty(key)) {
                const value = jsonData[key];
                result += `${indent}<span class="key">${key}</span>: ${formatValueWithHighlighting(value, indentLevel + 1)}\n`;
            }
        }
        
        return result.trimEnd();
    }
    
    // Format arrays with bullet points and proper indentation
    const formatArrayWithHighlighting = (array, indentLevel = 0) => {
        if (!array || !array.length) {
            return '[]';
        }
        
        let result = '';
        const indent = '  '.repeat(indentLevel);
        
        array.forEach((item, index) => {
            result += `${indent}<span class="list-bullet">-</span> `;
            
            // Handle different item types
            if (typeof item === 'object' && item !== null) {
                if (Array.isArray(item)) {
                    // Nested array
                    result += `\n${formatArrayWithHighlighting(item, indentLevel + 1)}`;
                } else {
                    // Nested object
                    result += `\n${formatJsonWithHighlighting(item, indentLevel + 1)}`;
                }
            } else {
                // Primitive value
                result += formatValueWithHighlighting(item);
            }
            
            result += '\n';
        });
        
        return result.trimEnd();
    }

    // Format the output with syntax highlighting
    const formatOutputText = (data) => {
        if (data === null || data === undefined) {
            return '';
        }
        
        try {
            // If it's a string that can be parsed as JSON
            if (typeof data === 'string') {
                try {
                    const parsedData = JSON.parse(data);
                    return formatValueWithHighlighting(parsedData);
                } catch (e) {
                    // Plain string that's not JSON
                    return `<span class="value-string">${data}</span>`;
                }
            }
            
            // If it's already an object or array
            return formatValueWithHighlighting(data);
        } catch (error) {
            // Fallback to basic formatting if anything goes wrong
            console.error("Error formatting output:", error);
            return String(data);
        }
    }

    return (
        <ToolContainer>
            {tools.map((tool, index) => {
                if (!tool) return null

                if (displayMode === 'chip') {
                    return (
                        <Chip
                            size='small'
                            key={index}
                            label={tool.tool}
                            component='a'
                            sx={{ mr: 1, mt: 1 }}
                            variant='outlined'
                            clickable
                            icon={<IconTool size={15} />}
                            onClick={() => onToolClick(tool, 'Used Tools')}
                        />
                    )
                } else if (displayMode === 'box') {
                    const isCollapsed = collapsedState[index] ?? !defaultExpanded
                    const currentTabValue = tabValues[index] || 0
                    
                    return (
                        <ToolBox key={index} isDarkMode={isDarkMode}>
                            <ToolHeader 
                                direction="row"
                                spacing={1} 
                                alignItems="center" 
                                isDarkMode={isDarkMode}
                                onClick={(e) => toggleCollapse(index, e)}
                            >
                                <Stack 
                                    direction="row" 
                                    spacing={1} 
                                    alignItems="center"
                                    sx={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: 'calc(100% - 30px)'
                                    }}
                                >
                                    <ToolIcon size={16} isDarkMode={isDarkMode} />
                                    <Typography
                                        component="span"
                                        variant="body2"
                                        sx={{
                                            fontWeight: 'bold',
                                            color: isDarkMode ? '#cccccc' : theme.palette.text.primary,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {tool.tool}
                                    </Typography>
                                </Stack>
                                {isCollapsed ? 
                                    <IconChevronDown size={18} color={isDarkMode ? '#cccccc' : theme.palette.text.primary} /> : 
                                    <IconChevronUp size={18} color={isDarkMode ? '#cccccc' : theme.palette.text.primary} />
                                }
                            </ToolHeader>
                            
                            <ToolContent isCollapsed={isCollapsed} isDarkMode={isDarkMode}>
                                <StyledTabs
                                    value={currentTabValue}
                                    onChange={(_, newValue) => handleTabChange(index, newValue)}
                                    isDarkMode={isDarkMode}
                                    variant="fullWidth"
                                >
                                    <StyledTab 
                                        icon={
                                            <IconListDetails 
                                                size={14} 
                                                color={isDarkMode ? (currentTabValue === 0 ? '#ffffff' : '#cccccc') : undefined} 
                                            />
                                        } 
                                        iconPosition="start" 
                                        label="Formatted"
                                        isDarkMode={isDarkMode}
                                        isActive={currentTabValue === 0}
                                        disableRipple
                                    />
                                    <StyledTab 
                                        icon={
                                            <IconCode 
                                                size={14} 
                                                color={isDarkMode ? (currentTabValue === 1 ? '#ffffff' : '#cccccc') : undefined} 
                                            />
                                        } 
                                        iconPosition="start" 
                                        label="Raw JSON"
                                        isDarkMode={isDarkMode}
                                        isActive={currentTabValue === 1}
                                        disableRipple
                                    />
                                </StyledTabs>
                                
                                <TabPanel value={currentTabValue} index={0}>
                                    <Box sx={{ width: '100%', maxWidth: '100%' }}>
                                        <SectionLabel variant="subtitle2" isDarkMode={isDarkMode}>
                                            Input:
                                        </SectionLabel>
                                        <CodeBlock 
                                            isDarkMode={isDarkMode}
                                            dangerouslySetInnerHTML={{ __html: formatOutputText(tool.toolInput) }}
                                        />
                                        
                                        <SectionLabel variant="subtitle2" isDarkMode={isDarkMode}>
                                            Output:
                                        </SectionLabel>
                                        <CodeBlock 
                                            isDarkMode={isDarkMode} 
                                            sx={{ mb: 0 }}
                                            dangerouslySetInnerHTML={{ __html: formatOutputText(tool.toolOutput) }}
                                        />
                                    </Box>
                                </TabPanel>
                                
                                <TabPanel value={currentTabValue} index={1}>
                                    <Box sx={{ 
                                        maxHeight: '400px', 
                                        overflowY: 'auto',
                                        overflowX: 'auto',
                                        padding: 1,
                                        backgroundColor: isDarkMode ? '#2d2d2d' : '#f0f0f0',
                                        borderRadius: 1,
                                        width: '100%',
                                        maxWidth: '100%'
                                    }}>
                                        <ReactJson
                                            theme={isDarkMode ? 'ocean' : 'rjv-default'}
                                            style={{ 
                                                padding: 10, 
                                                borderRadius: 5, 
                                                backgroundColor: isDarkMode ? '#2d2d2d' : '#f0f0f0',
                                                border: `1px solid ${isDarkMode ? '#454545' : '#dfdfdf'}`,
                                                maxWidth: '100%',
                                                overflow: 'auto'
                                            }}
                                            src={tool}
                                            name={null}
                                            quotesOnKeys={false}
                                            enableClipboard={false}
                                            displayDataTypes={false}
                                            collapsed={1}
                                        />
                                    </Box>
                                </TabPanel>
                            </ToolContent>
                        </ToolBox>
                    )
                }
                
                return null
            })}
        </ToolContainer>
    )
}

ToolCallComponent.propTypes = {
    tools: PropTypes.array.isRequired,
    displayMode: PropTypes.oneOf(['chip', 'box']),
    onToolClick: PropTypes.func.isRequired,
    isDarkMode: PropTypes.bool,
    defaultExpanded: PropTypes.bool
}

export default ToolCallComponent

