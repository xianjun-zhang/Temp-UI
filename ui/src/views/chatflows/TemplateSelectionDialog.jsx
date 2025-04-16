import { useState, useEffect } from 'react'
import { 
    Dialog, 
    DialogTitle, 
    DialogContent,
    IconButton,
    Typography,
    Grid,
    TextField,
    InputAdornment,
    Box,
    Chip,
    Card,
    CardContent,
    CardMedia,
    CardActionArea,
    Divider,
    CircularProgress
} from '@mui/material'
import { 
    IconSearch, 
    IconX,
    IconFilter,
    IconTemplate,
    IconAward
} from '@tabler/icons-react'

// API
import marketplacesApi from '@/api/marketplaces'

// Hooks
import useApi from '@/hooks/useApi'

// Constants
import { baseURL } from '@/store/constant'

const getBadgeColor = (badge) => {
    switch (badge?.toLowerCase()) {
        case 'new':
            return {
                bg: '#E8F5E9',
                color: '#2E7D32',
                borderColor: '#A5D6A7'
            };
        case 'popular':
            return {
                bg: '#FFF3E0',
                color: '#E65100',
                borderColor: '#FFCC80'
            };
        case 'featured':
            return {
                bg: '#E3F2FD',
                color: '#1565C0',
                borderColor: '#90CAF9'
            };
        default:
            return {
                bg: '#F3E5F5',
                color: '#7B1FA2',
                borderColor: '#CE93D8'
            };
    }
};

const TemplateSelectionDialog = ({ open, onClose, onSelectTemplate, isAgentCanvas }) => {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedUsecase, setSelectedUsecase] = useState('All')
    const [selectedBadge, setSelectedBadge] = useState('All')
    const [images, setImages] = useState({})
    
    // Use the same API hook pattern as in marketplace
    const getAllTemplatesMarketplacesApi = useApi(marketplacesApi.getAllTemplatesFromMarketplaces)
    
    // Fetch templates when dialog opens
    useEffect(() => {
        if (open) {
            getAllTemplatesMarketplacesApi.request()
        }
    }, [open])
    
    // Load images when templates data is available
    useEffect(() => {
        if (getAllTemplatesMarketplacesApi.data) {
            // Load images
            const imgs = {}
            getAllTemplatesMarketplacesApi.data.forEach((item) => {
                if (item.image) {
                    const img = new Image()
                    img.src = `${baseURL}/api/v1/marketplaces/images/${item.image}`
                    imgs[item.image] = img
                }
            })
            setImages(imgs)
        }
    }, [getAllTemplatesMarketplacesApi.data])
    
    // First filter templates by type
    const typeFilteredTemplates = getAllTemplatesMarketplacesApi.data 
        ? getAllTemplatesMarketplacesApi.data.filter((template) => {
            if (!template) return false;
            const type = template.templateType || '';
            return isAgentCanvas 
                ? type.toLowerCase() === 'agentflow'
                : type.toLowerCase() === 'chatflow';
        })
        : [];
    
    // Then get unique useCases only from templates matching the type
    const useCases = ['All', ...new Set(typeFilteredTemplates
        .filter(t => t && Array.isArray(t.useCases))
        .flatMap(t => t.useCases)
        .filter(Boolean)
        .sort()
    )];
    
    // Get unique badges from templates
    const badges = ['All', ...new Set(typeFilteredTemplates
        .filter(t => t && t.officialBadge) // Only include templates with badges
        .map(t => t.officialBadge)
        .filter(Boolean)
        .sort()
    )];
    
    // Finally filter by search and usecase
    const filteredTemplates = typeFilteredTemplates.filter((template) => {
        if (!template) return false;
        
        const name = template.name || '';
        const description = template.description || '';
        const templateUsecases = template.useCases || [];
        const templateBadge = template.officialBadge || '';
        
        const matchesSearch = searchQuery === '' || 
                            name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            description.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesUsecase = selectedUsecase === 'All' || templateUsecases.includes(selectedUsecase);
        const matchesBadge = selectedBadge === 'All' || templateBadge === selectedBadge;
        
        return matchesSearch && matchesUsecase && matchesBadge;
    });
    
    // Pass the entire template object to parent
    const handleTemplateClick = (template) => {
        onSelectTemplate(template);
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    maxHeight: '85vh'
                }
            }}
        >
            <DialogTitle 
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 3,
                    pb: 0
                }}
            >
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {isAgentCanvas ? 'Agentflow Templates' : 'Chatflow Templates'}
                </Typography>
                <IconButton 
                    onClick={onClose}
                    sx={{
                        color: 'text.secondary',
                        '&:hover': {
                            backgroundColor: 'action.hover'
                        }
                    }}
                >
                    <IconX />
                </IconButton>
            </DialogTitle>
            
            <DialogContent sx={{ p: 3 }}>
                {/* Search and Filters Section */}
                <Box sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <IconSearch 
                                        stroke={1.5} 
                                        size="1rem" 
                                        style={{ color: 'text.secondary' }} 
                                    />
                                </InputAdornment>
                            )
                        }}
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                backgroundColor: 'background.paper',
                                '& .MuiInputAdornment-root': {
                                    marginLeft: 0,
                                    marginRight: 0.5,
                                },
                                '& input': {
                                    paddingLeft: 0.5,
                                },
                                '&:hover': {
                                    '& > fieldset': {
                                        borderColor: 'primary.main'
                                    }
                                }
                            }
                        }}
                    />
                    
                    {/* Filters Section */}
                    <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Use Cases Filter */}
                        {useCases.length > 1 && (
                            <Box sx={{ 
                                display: 'flex', 
                                gap: 1, 
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                p: 2,
                                borderRadius: 2,
                                backgroundColor: 'background.paper',
                                boxShadow: '0 0 10px rgba(0,0,0,0.05)'
                            }}>
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    mr: 1,
                                    color: 'text.secondary'
                                }}>
                                    <IconFilter stroke={1.5} size="1rem" />
                                    <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 500 }}>
                                        Use Cases:
                                    </Typography>
                                </Box>
                                
                                {useCases.map((usecase) => (
                                    <Chip
                                        key={usecase}
                                        label={usecase}
                                        onClick={() => setSelectedUsecase(usecase)}
                                        color={selectedUsecase === usecase ? 'primary' : 'default'}
                                        variant={selectedUsecase === usecase ? 'filled' : 'outlined'}
                                        size="small"
                                        sx={{
                                            borderRadius: '8px',
                                            '&:hover': {
                                                backgroundColor: selectedUsecase === usecase 
                                                    ? 'primary.main' 
                                                    : 'action.hover'
                                            }
                                        }}
                                    />
                                ))}
                            </Box>
                        )}

                        {/* Badges Filter */}
                        {badges.length > 1 && (
                            <Box sx={{ 
                                display: 'flex', 
                                gap: 1, 
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                p: 2,
                                borderRadius: 2,
                                backgroundColor: 'background.paper',
                                boxShadow: '0 0 10px rgba(0,0,0,0.05)'
                            }}>
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    mr: 1,
                                    color: 'text.secondary'
                                }}>
                                    <IconAward stroke={1.5} size="1rem" />
                                    <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 500 }}>
                                        Badges:
                                    </Typography>
                                </Box>
                                
                                {badges.map((badge) => (
                                    <Chip
                                        key={badge}
                                        label={badge}
                                        onClick={() => setSelectedBadge(badge)}
                                        icon={<IconAward size={14} />}
                                        color={selectedBadge === badge ? 'secondary' : 'default'}
                                        variant={selectedBadge === badge ? 'filled' : 'outlined'}
                                        size="small"
                                        sx={{
                                            borderRadius: '8px',
                                            ...(badge !== 'All' && {
                                                backgroundColor: selectedBadge === badge 
                                                    ? getBadgeColor(badge).bg 
                                                    : 'background.paper',
                                                color: getBadgeColor(badge).color,
                                                borderColor: getBadgeColor(badge).borderColor,
                                                '&:hover': {
                                                    backgroundColor: getBadgeColor(badge).bg,
                                                    opacity: 0.9
                                                }
                                            })
                                        }}
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* Templates List */}
                <Box sx={{ 
                    display: 'grid', 
                    gap: 2,
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: '1fr 1fr',
                        md: '1fr 1fr 1fr'
                    }
                }}>
                    {filteredTemplates.map((template, index) => (
                        <Card
                            key={index}
                            onClick={() => onSelectTemplate(template)}
                            sx={{
                                position: 'relative', // Added for badge positioning
                                display: 'flex',
                                flexDirection: 'column',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                backgroundColor: 'background.paper',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    '& .template-icon': {
                                        color: 'primary.main'
                                    }
                                }
                            }}
                        >
                            {/* Badge Display */}
                            {template.officialBadge && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 12,
                                        right: 12,
                                        zIndex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        backgroundColor: getBadgeColor(template.officialBadge).bg,
                                        color: getBadgeColor(template.officialBadge).color,
                                        border: '1px solid',
                                        borderColor: getBadgeColor(template.officialBadge).borderColor,
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1,
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <IconAward size={14} stroke={2} />
                                    {template.officialBadge}
                                </Box>
                            )}

                            <CardContent sx={{ p: 2.5, flex: 1 }}>
                                {/* Template Header */}
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'flex-start',
                                    mb: 1.5,
                                    gap: 1.5 
                                }}>
                                    <Box 
                                        className="template-icon"
                                        sx={{
                                            p: 1,
                                            borderRadius: 1,
                                            backgroundColor: 'background.neutral',
                                            color: 'text.secondary',
                                            transition: 'color 0.2s ease-in-out'
                                        }}
                                    >
                                        <IconTemplate size={24} stroke={1.5} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography 
                                            variant="subtitle1" 
                                            sx={{ 
                                                fontWeight: 600,
                                                color: 'text.primary',
                                                mb: 0.5
                                            }}
                                        >
                                            {template.name}
                                        </Typography>
                                        <Typography 
                                            variant="body2" 
                                            color="text.secondary"
                                            sx={{
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {template.description}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Use Cases Tags */}
                                {template.useCases && template.useCases.length > 0 && (
                                    <Box sx={{ 
                                        display: 'flex', 
                                        flexWrap: 'wrap', 
                                        gap: 0.8,
                                        mt: 'auto'
                                    }}>
                                        {template.useCases.map((usecase, idx) => (
                                            <Chip
                                                key={idx}
                                                label={usecase}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    borderRadius: '6px',
                                                    backgroundColor: selectedUsecase === usecase 
                                                        ? 'primary.lighter'
                                                        : 'background.paper',
                                                    borderColor: selectedUsecase === usecase 
                                                        ? 'primary.light'
                                                        : 'divider',
                                                    color: selectedUsecase === usecase 
                                                        ? 'primary.main'
                                                        : 'text.secondary',
                                                    '& .MuiChip-label': {
                                                        fontSize: '0.75rem'
                                                    }
                                                }}
                                            />
                                        ))}
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </Box>

                {/* Empty State */}
                {filteredTemplates.length === 0 && (
                    <Box 
                        sx={{ 
                            textAlign: 'center',
                            py: 8,
                            px: 2
                        }}
                    >
                        <Typography 
                            variant="h6" 
                            color="text.secondary"
                            sx={{ mb: 1 }}
                        >
                            No templates found
                        </Typography>
                        <Typography 
                            variant="body2" 
                            color="text.disabled"
                        >
                            Try adjusting your search or filters
                        </Typography>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default TemplateSelectionDialog
