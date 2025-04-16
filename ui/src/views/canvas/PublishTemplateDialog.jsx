import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Box,
    FormControlLabel,
    Checkbox,
    Typography,
    Grid,
    Alert,
    IconButton,
    Divider,
    styled,
    useTheme
} from '@mui/material'
import marketplacesApi from '../../api/marketplaces'
import { useSnackbar } from 'notistack'
import { IconX, IconPlus, IconInfoCircle } from '@tabler/icons-react'
import { useSelector } from 'react-redux'

// Styled components for the modern look
const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
    }
}))

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${theme.palette.divider}`
}))

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
    padding: '24px',
    overflowY: 'auto'
}))

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
    padding: '16px 24px',
    borderTop: `1px solid ${theme.palette.divider}`,
    justifyContent: 'flex-end'
}))

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: '4px',
        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#F5F7FA'
    },
    marginBottom: '16px'
}))

const SectionLabel = styled(Typography)(({ theme, required }) => ({
    fontWeight: 500,
    marginBottom: '8px',
    marginTop: '16px',
    color: theme.palette.text.primary,
    display: 'flex',
    alignItems: 'center',
    '&::after': required ? {
        content: '"*"',
        color: theme.palette.error.main,
        marginLeft: '2px',
        fontSize: '14px',  // Smaller font size
        lineHeight: 1,
        position: 'relative',
        top: '-2px'  // Slight upward adjustment for better alignment
    } : {}
}))

const StyledFormControl = styled(FormControl)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: '4px',
        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#F5F7FA'
    },
    marginBottom: '16px'
}))

const StyledChip = styled(Chip)(({ theme, color }) => ({
    borderRadius: '4px',
    backgroundColor: color ? color : theme.palette.mode === 'dark' ? theme.palette.background.paper : '#F0F0F0',
    margin: '0 8px 8px 0',
    '&:hover .MuiChip-deleteIcon': {
        color: theme.palette.error.main
    }
}))

const getRandomColor = () => {
    // Set of pleasing pastel colors
    const colors = [
        { bg: '#FCE8DD', fg: '#FF6B3D' }, // Orange
        { bg: '#E3F2FD', fg: '#1E88E5' }, // Blue
        { bg: '#E8F5E9', fg: '#4CAF50' }, // Green
        { bg: '#F3E5F5', fg: '#9C27B0' }, // Purple
        { bg: '#FFF8E1', fg: '#FFA000' }, // Amber
        { bg: '#E0F7FA', fg: '#00ACC1' }, // Cyan
        { bg: '#FFF3E0', fg: '#FF9800' }, // Deep Orange
        { bg: '#F1F8E9', fg: '#8BC34A' }, // Light Green
        { bg: '#E8EAF6', fg: '#3F51B5' }, // Indigo
        { bg: '#FFEBEE', fg: '#F44336' }  // Red
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

const RobotIcon = styled('div')(({ theme, colorBg, colorFg }) => ({
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.mode === 'dark' 
        ? theme.palette.grey[800] // Darker background in dark mode
        : colorBg,  // Random background color in light mode
    color: theme.palette.mode === 'dark'
        ? theme.palette.primary.light // Lighter text in dark mode
        : colorFg,  // Random text color in light mode
    borderRadius: '6px',
    marginRight: '12px',
    fontFamily: 'monospace',
    fontSize: '16px',
    fontWeight: 'bold'
}))

const releaseStatusOptions = [
    { value: 'dev', label: 'Development' },
    { value: 'alpha', label: 'Alpha' },
    { value: 'beta', label: 'Beta' },
    { value: 'rc', label: 'Release Candidate' },
    { value: 'stable', label: 'Stable' },
    { value: 'deprecated', label: 'Deprecated' },
    { value: 'legacy', label: 'Legacy' }
]

const visibilityOptions = [
    { value: 'private', label: 'Private' },
    { value: 'public', label: 'Public' },
    { value: 'organization', label: 'Organization' }
]

const PublishTemplateDialog = ({ open, onClose, chatflowId, chatflowType, isCanvasDirty }) => {
    const theme = useTheme()
    const { enqueueSnackbar } = useSnackbar()
    // Get the current chatflow from Redux store
    const currentChatflow = useSelector((state) => state.canvas.chatflow)
    const [loading, setLoading] = useState(false)
    const [existingTemplate, setExistingTemplate] = useState(null)
    const [randomColor, setRandomColor] = useState(getRandomColor())
    
    // Initialize form data with chatflow name/description when available
    const [formData, setFormData] = useState({
        name: currentChatflow?.name || '',
        description: currentChatflow?.description || '',
        releaseStatus: 'dev',
        visibility: 'private',
        version: '0.1.0',
        tags: [],
        useCases: [],
        customBadge: '',
        isAssociatedWithChatflow: true
    })

    // Other fileds when submit save template to server
    const otherFormFilelds = {
        chatflowId: chatflowId,
        templateType: chatflowType === 'Agentflow' ? 'Agentflow' : 'Chatflow',
        categories: [], // Empty for now, will be updated in the future
        framework: '',  // Empty for now, will be updated in the future
    }
    
    const [currentTag, setCurrentTag] = useState('')
    const [currentUseCase, setCurrentUseCase] = useState('')
    const [error, setError] = useState('')

    // Reset form when dialog opens
    // Fetch existing template data if this chatflow has been published before
    useEffect(() => {
        if (open) {
            // Generate new random color
            setRandomColor(getRandomColor())

            // If the chatflow has been published before, fetch the template data
            if (currentChatflow?.marketplaceTemplateId && chatflowId) {
                setLoading(true)
                marketplacesApi.getTemplateByChatflowId(chatflowId)
                    .then((response) => {
                        const templateData = response.data
                        if (templateData) {
                            if (templateData.associatedChatFlowId) {
                                templateData.isAssociatedWithChatflow = true
                            }
                            setExistingTemplate(templateData)
                            setFormData({
                                ...templateData
                            })
                        }
                    })
                    .catch((error) => {
                        // It's okay if the template doesn't exist yet - this could be a first-time publish
                        if (error.response && error.response.status !== 404) {
                            console.error('Error fetching template data:', error)
                        }
                    })
                    .finally(() => {
                        setLoading(false)
                    })
            }
            else {
                // If not editing an existing template, use current chatflow info as default
                setFormData(prevState => ({
                    ...prevState,
                    name: currentChatflow?.name || '',
                    description: currentChatflow?.description || ''
                }))
            }
        }
    }, [open, currentChatflow])

    const handleInputChange = (e) => {
        const { name, value, checked } = e.target
        if (name === 'isAssociatedWithChatflow') {
            setFormData({ ...formData, [name]: checked })
        } else {
            setFormData({ ...formData, [name]: value })
        }
    }

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' && currentTag.trim() !== '') {
            e.preventDefault()
            if (!formData.tags.includes(currentTag.trim())) {
                setFormData({ ...formData, tags: [...formData.tags, currentTag.trim()] })
            }
            setCurrentTag('')
        }
    }

    const handleUseCaseKeyDown = (e) => {
        if (e.key === 'Enter' && currentUseCase.trim() !== '') {
            e.preventDefault()
            if (!formData.useCases.includes(currentUseCase.trim())) {
                setFormData({ ...formData, useCases: [...formData.useCases, currentUseCase.trim()] })
            }
            setCurrentUseCase('')
        }
    }

    const handleDeleteTag = (tagToDelete) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter((tag) => tag !== tagToDelete)
        })
    }

    const handleDeleteUseCase = (useCaseToDelete) => {
        setFormData({
            ...formData,
            useCases: formData.useCases.filter((useCase) => useCase !== useCaseToDelete)
        })
    }

    const handleSubmit = async () => {
        // Validate form
        if (!formData.name.trim()) {
            setError('Name is required')
            return
        }
        if (!formData.description.trim()) {
            setError('Description is required')
            return
        }

        setLoading(true)
        setError('')

        // Prepare data for API
        let templateData = {
            ...formData,
            ...otherFormFilelds,
            templateId: existingTemplate?.id
        }

        try {
            const submitResponse = await marketplacesApi.publishTemplate(templateData)
            setExistingTemplate(null)

            enqueueSnackbar('Template published successfully!', {
                variant: 'success'
            })

            onClose()
            
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to publish template. Error: ' + error.response?.data?.error)
            enqueueSnackbar('Failed to publish template', {
                variant: 'error'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <StyledDialog open={open} onClose={() => onClose()} fullWidth maxWidth="md">
            <StyledDialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <RobotIcon colorBg={randomColor.bg} colorFg={randomColor.fg}>🤖</RobotIcon>
                    <Typography variant="h4">
                        {existingTemplate ? 'Update Published Template' : 'Publish Flow to Marketplace'}
                    </Typography>
                </Box>
                <IconButton onClick={() => onClose()} size="small" sx={{ color: theme.palette.text.secondary }}>
                    <IconX size={18} />
                </IconButton>
            </StyledDialogTitle>

            <StyledDialogContent>
                {isCanvasDirty && (
                    <Alert 
                        severity="warning" 
                        sx={{ mt:3, mb: 3, borderRadius: '8px' }}
                        variant="filled"
                    >
                        You have unsaved changes. Please save your flow first to publish the latest version.
                    </Alert>
                )}

                {/* Name Field */}
                <SectionLabel required>Name</SectionLabel>
                <StyledTextField
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter a descriptive name for your template"
                    fullWidth
                    variant="outlined"
                    size="small"
                />

                {/* Description Field */}
                <SectionLabel required>Description</SectionLabel>
                <StyledTextField
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe what your template does and how it can be used"
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    size="small"
                />

                {/* Version field */}
                <SectionLabel>Version</SectionLabel>
                <StyledTextField
                    name="version"
                    value={formData.version}
                    onChange={handleInputChange}
                    placeholder="e.g. 1.0.0"
                    fullWidth
                    variant="outlined"
                    size="small"
                />

                {/* Custom Badge */}
                <SectionLabel>Badge</SectionLabel>
                <StyledTextField
                    name="customBadge"
                    value={formData.customBadge}
                    onChange={handleInputChange}
                    placeholder="e.g. New, Featured"
                    fullWidth
                    variant="outlined"
                    size="small"
                />

                {/* Tags */}
                <SectionLabel>Tags</SectionLabel>
                <StyledTextField
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Choose tags (Type and press Enter to add tags)"
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{
                        endAdornment: currentTag && (
                            <IconButton 
                                onClick={() => {
                                    if (!formData.tags.includes(currentTag.trim())) {
                                        setFormData({ ...formData, tags: [...formData.tags, currentTag.trim()] })
                                    }
                                    setCurrentTag('')
                                }}
                                size="small"
                            >
                                <IconPlus size={16} />
                            </IconButton>
                        )
                    }}
                />
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1, mb: 2 }}>
                    {formData.tags.map((tag) => (
                        <StyledChip
                            key={tag}
                            label={tag}
                            onDelete={() => handleDeleteTag(tag)}
                        />
                    ))}
                </Box>

                {/* Use Cases */}
                <SectionLabel>Use Cases</SectionLabel>
                <StyledTextField
                    value={currentUseCase}
                    onChange={(e) => setCurrentUseCase(e.target.value)}
                    onKeyDown={handleUseCaseKeyDown}
                    placeholder="Add use cases (Type and press Enter to add use cases)"
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{
                        endAdornment: currentUseCase && (
                            <IconButton 
                                onClick={() => {
                                    if (!formData.useCases.includes(currentUseCase.trim())) {
                                        setFormData({ ...formData, useCases: [...formData.useCases, currentUseCase.trim()] })
                                    }
                                    setCurrentUseCase('')
                                }}
                                size="small"
                            >
                                <IconPlus size={16} />
                            </IconButton>
                        )
                    }}
                />
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1, mb: 2 }}>
                    {formData.useCases.map((useCase) => (
                        <StyledChip
                            key={useCase}
                            label={useCase}
                            onDelete={() => handleDeleteUseCase(useCase)}
                        />
                    ))}
                </Box>

                {/* Template Visibility */}
                <SectionLabel>Visibility</SectionLabel>
                <StyledFormControl fullWidth size="small">
                    <Select
                        name="visibility"
                        value={formData.visibility}
                        onChange={handleInputChange}
                        displayEmpty
                    >
                        {visibilityOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </StyledFormControl>

                {/* Release Status */}
                <SectionLabel>Release Status</SectionLabel>
                <StyledFormControl fullWidth size="small">
                    <Select
                        name="releaseStatus"
                        value={formData.releaseStatus}
                        onChange={handleInputChange}
                        displayEmpty
                    >
                        {releaseStatusOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </StyledFormControl>

                {/* Association Checkbox */}
                <Box sx={{ mt: 3 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={formData.isAssociatedWithChatflow}
                                onChange={handleInputChange}
                                name="isAssociatedWithChatflow"
                                color="primary"
                            />
                        }
                        label={
                            <Typography variant="body2">
                                Associate with this flow (enables better version management)
                            </Typography>
                        }
                    />
                </Box>
            </StyledDialogContent>

            {error && (
                    <Alert 
                        severity="error" 
                        sx={{ mb: 3, mt: 2,ml: 2, mr: 2, borderRadius: '4px' }}
                        variant="outlined"
                    >
                        {error}
                    </Alert>
            )}

            <StyledDialogActions>
                <Button 
                    onClick={() => onClose()} 
                    disabled={loading}
                    sx={{ 
                        textTransform: 'none',
                        color: theme.palette.text.secondary
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={loading || !formData.name.trim() || !formData.description.trim()}
                    sx={{ 
                        borderRadius: '4px', 
                        textTransform: 'none',
                        px: 3
                    }}
                >
                    {loading 
                        ? 'Publishing...' 
                        : (existingTemplate ? 'Update' : 'Save')
                    }
                </Button>
            </StyledDialogActions>
        </StyledDialog>
    )
}

PublishTemplateDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    chatflowId: PropTypes.string,
    chatflowType: PropTypes.string,
    isCanvasDirty: PropTypes.bool
}

export default PublishTemplateDialog
