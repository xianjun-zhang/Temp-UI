import * as React from 'react'
import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import PropTypes from 'prop-types'

// material-ui
import {
    Box,
    Stack,
    Badge,
    ToggleButton,
    InputLabel,
    FormControl,
    Select,
    OutlinedInput,
    Checkbox,
    ListItemText,
    Skeleton,
    FormControlLabel,
    ToggleButtonGroup,
    MenuItem,
    Button,
    Tabs,
    Tab,
    Typography,
    Grid
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { IconLayoutGrid, IconList, IconX } from '@tabler/icons-react'

// project imports
import MainCard from '@/ui-component/cards/MainCard'
import ItemCard from '@/ui-component/cards/ItemCard'
import WorkflowEmptySVG from '@/assets/images/workflow_empty.svg'
import ToolDialog from '@/views/tools/ToolDialog'
import { MarketplaceTable } from '@/ui-component/table/MarketplaceTable'
import ViewHeader from '@/layout/MainLayout/ViewHeader'
import ErrorBoundary from '@/ErrorBoundary'
import { navigationPaths } from '@/routes/path'

// API
import marketplacesApi from '@/api/marketplaces'

// Hooks
import useApi from '@/hooks/useApi'

// const
import { baseURL } from '@/store/constant'
import { gridSpacing } from '@/store/constant'

function TabPanel(props) {
    const { children, value, index, ...other } = props
    return (
        <div
            role='tabpanel'
            hidden={value !== index}
            id={`attachment-tabpanel-${index}`}
            aria-labelledby={`attachment-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 1 }}>{children}</Box>}
        </div>
    )
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired
}

const badges = ['POPULAR', 'NEW']
const types = ['Chatflow', 'Agentflow', 'Tool']
const framework = ['Langchain', 'LlamaIndex']
const MenuProps = {
    PaperProps: {
        style: {
            width: 160
        }
    }
}
const SelectStyles = {
    '& .MuiOutlinedInput-notchedOutline': {
        borderRadius: 2
    }
}

// Add this constant/function near the top of the file, around line 72-80 where other constants are defined
const getReleaseStatusConfig = (status) => {
    // Default to lowercase for case-insensitive comparison
    const statusLower = status?.toLowerCase();
    
    switch (statusLower) {
        case 'stable':
            return {
                color: 'success',
                label: 'STABLE'
            };
        case 'beta':
            return {
                color: 'warning',
                label: 'BETA'
            };
        case 'alpha':
            return {
                color: 'info',
                label: 'ALPHA'
            };
        case 'dev':
            return {
                color: 'secondary',
                label: 'DEV'
            };
        default:
            return {
                color: 'primary',
                label: status
            };
    }
};

// ==============================|| Marketplace ||============================== //

const Marketplace = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const theme = useTheme()

    const [isLoading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [images, setImages] = useState({})
    const [usecases, setUsecases] = useState([])
    const [eligibleUsecases, setEligibleUsecases] = useState([])

    const [showToolDialog, setShowToolDialog] = useState(false)
    const [toolDialogProps, setToolDialogProps] = useState({})

    const getAllTemplatesMarketplacesApi = useApi(marketplacesApi.getAllTemplatesFromMarketplaces)

    const [view, setView] = React.useState(localStorage.getItem('mpDisplayStyle') || 'card')

    const [tabValue, setTabValue] = useState(() => {
        // Get the tab value from localStorage
        const savedTab = localStorage.getItem('marketplaceActiveTab');
        return savedTab ? parseInt(savedTab, 10) : 0;
    });

    // Add state for user templates
    const [userTemplates, setUserTemplates] = useState([])
    const [userTemplatesLoading, setUserTemplatesLoading] = useState(false)
    const [userTemplatesError, setUserTemplatesError] = useState(null)
    const [userTemplateImages, setUserTemplateImages] = useState({})
    
    // API hook for user templates
    const getUserTemplatesApi = useApi(marketplacesApi.getUserTemplates)
    
    // Function to fetch user templates when tab changes
    const fetchUserTemplates = () => {
        if (tabValue === 1 && userTemplates.length === 0 && !userTemplatesLoading) {
            setUserTemplatesLoading(true)
            getUserTemplatesApi.request()
                .then(() => {
                    setUserTemplatesLoading(false)
                })
                .catch(error => {
                    setUserTemplatesError(error)
                    setUserTemplatesLoading(false)
                })
        }
    }
    
    // Effect to load user templates when tab changes to "My Template"
    useEffect(() => {
        if (tabValue === 1) {
            setUserTemplatesLoading(true);
            getUserTemplatesApi.request()
                .then(() => {
                    setUserTemplatesLoading(false);
                })
                .catch(error => {
                    console.error("Error fetching user templates:", error);
                    setUserTemplatesError(error);
                    setUserTemplatesLoading(false);
                });
        }
    }, [tabValue]);
    
    // Process user templates data when it's fetched
    useEffect(() => {
        if (getUserTemplatesApi.data) {
            try {
                setUserTemplates(getUserTemplatesApi.data || []);
                
                // Process template images
                const images = {};
                for (let i = 0; i < getUserTemplatesApi.data.length; i++) {
                    if (getUserTemplatesApi.data[i].flowData) {
                        try {
                            const flowDataStr = getUserTemplatesApi.data[i].flowData;
                            const flowData = JSON.parse(flowDataStr);
                            const nodes = flowData.nodes || [];
                            images[getUserTemplatesApi.data[i].id] = [];
                            for (let j = 0; j < nodes.length; j++) {
                                const imageSrc = `${baseURL}/api/v1/node-icon/${nodes[j].data.name}`;
                                if (!images[getUserTemplatesApi.data[i].id].includes(imageSrc)) {
                                    images[getUserTemplatesApi.data[i].id].push(imageSrc);
                                }
                            }
                        } catch (err) {
                            console.error('Error processing template flowData:', err);
                        }
                    }
                }
                
                setUserTemplateImages(images);
            } catch (e) {
                console.error('Error processing templates:', e);
                setUserTemplatesError(e);
            }
        }
    }, [getUserTemplatesApi.data]);
    
    // Process user templates error
    useEffect(() => {
        if (getUserTemplatesApi.error) {
            setUserTemplatesError(getUserTemplatesApi.error)
        }
    }, [getUserTemplatesApi.error])

    // Helper functions for filter state management
    const getInitialFilters = () => {
        // Try to get filters from location state first, then from sessionStorage
        if (location.state?.filters) {
            // Save to sessionStorage when coming back with state
            sessionStorage.setItem('marketplaceFilters', JSON.stringify(location.state.filters))
            return location.state.filters
        }
        
        // Try to get from sessionStorage
        const savedFilters = sessionStorage.getItem('marketplaceFilters')
        if (savedFilters) {
            return JSON.parse(savedFilters)
        }

        // Default values if nothing is saved
        return {
            search: '',
            badgeFilter: [],
            typeFilter: [],
            frameworkFilter: [],
            selectedUsecases: []
        }
    }

    const initialFilters = getInitialFilters()

    // Initialize states with saved filters
    const [search, setSearch] = useState(initialFilters.search)
    const [badgeFilter, setBadgeFilter] = useState(initialFilters.badgeFilter)
    const [typeFilter, setTypeFilter] = useState(initialFilters.typeFilter)
    const [frameworkFilter, setFrameworkFilter] = useState(initialFilters.frameworkFilter)
    const [selectedUsecases, setSelectedUsecases] = useState(initialFilters.selectedUsecases || [])

    // Update sessionStorage when filters change
    const updateFilters = (newFilters) => {
        sessionStorage.setItem('marketplaceFilters', JSON.stringify(newFilters))
    }

    const clearAllUsecases = () => {
        setSelectedUsecases([])
        updateFilters({
            search,
            badgeFilter,
            typeFilter,
            frameworkFilter,
            selectedUsecases: []
        })
    }

    const handleBadgeFilterChange = (event) => {
        const {
            target: { value }
        } = event
        const newValue = typeof value === 'string' ? value.split(',') : value
        setBadgeFilter(newValue)
        updateFilters({
            search,
            badgeFilter: newValue,
            typeFilter,
            frameworkFilter
        })
        getEligibleUsecases({ typeFilter, badgeFilter: newValue, frameworkFilter, search })
    }

    const handleTypeFilterChange = (event) => {
        const {
            target: { value }
        } = event
        const newValue = typeof value === 'string' ? value.split(',') : value
        setTypeFilter(newValue)
        updateFilters({
            search,
            badgeFilter,
            typeFilter: newValue,
            frameworkFilter
        })
        getEligibleUsecases({ typeFilter: newValue, badgeFilter, frameworkFilter, search })
    }

    const handleFrameworkFilterChange = (event) => {
        const {
            target: { value }
        } = event
        const newValue = typeof value === 'string' ? value.split(',') : value
        setFrameworkFilter(newValue)
        updateFilters({
            search,
            badgeFilter,
            typeFilter,
            frameworkFilter: newValue
        })
        getEligibleUsecases({ typeFilter, badgeFilter, frameworkFilter: newValue, search })
    }

    const handleViewChange = (event, nextView) => {
        if (nextView === null) return
        localStorage.setItem('mpDisplayStyle', nextView)
        setView(nextView)
    }

    const onSearchChange = (event) => {
        const newValue = event.target.value
        setSearch(newValue)
        updateFilters({
            search: newValue,
            badgeFilter,
            typeFilter,
            frameworkFilter
        })
        getEligibleUsecases({ typeFilter, badgeFilter, frameworkFilter, search: newValue })
    }

    function filterFlows(data) {
        return (
            (data.categories ? data.categories.join(',') : '').toLowerCase().indexOf(search.toLowerCase()) > -1 ||
            data.name.toLowerCase().indexOf(search.toLowerCase()) > -1 ||
            (data.description && data.description.toLowerCase().indexOf(search.toLowerCase()) > -1)
        )
    }

    function filterByBadge(data) {
        return badgeFilter.length > 0 ? badgeFilter.includes(data.officialBadge) : true
    }

    function filterByType(data) {
        if (typeFilter.length === 0) return true;
        
        // Get the type value from the data, ensuring it exists and converting to lowercase
        const dataType = (data.templateType || '').toLowerCase();
        
        // Convert each type filter value to lowercase for comparison
        return typeFilter.some(type => type.toLowerCase() === dataType);
    }

    function filterByFramework(data) {
        return frameworkFilter.length > 0 ? (data.framework || []).some((item) => frameworkFilter.includes(item)) : true
    }

    function filterByUsecases(data) {
        return selectedUsecases.length > 0 ? (data.useCases || []).some((item) => selectedUsecases.includes(item)) : true
    }

    const getEligibleUsecases = (filter) => {
        if (!getAllTemplatesMarketplacesApi.data) return

        let filteredData = getAllTemplatesMarketplacesApi.data
        if (filter.badgeFilter.length > 0) filteredData = filteredData.filter((data) => filter.badgeFilter.includes(data.officialBadge))
        if (filter.typeFilter.length > 0) filteredData = filteredData.filter((data) => filter.typeFilter.includes(data.templateType))
        if (filter.frameworkFilter.length > 0)
            filteredData = filteredData.filter((data) => (data.framework || []).some((item) => filter.frameworkFilter.includes(item)))
        if (filter.search) {
            filteredData = filteredData.filter(
                (data) =>
                    (data.categories ? data.categories.join(',') : '').toLowerCase().indexOf(filter.search.toLowerCase()) > -1 ||
                    data.name.toLowerCase().indexOf(filter.search.toLowerCase()) > -1 ||
                    (data.description && data.description.toLowerCase().indexOf(filter.search.toLowerCase()) > -1)
            )
        }

        const usecases = []
        for (let i = 0; i < filteredData.length; i += 1) {
            if (filteredData[i].flowData) {
                if (filteredData[i].useCases) {
                    usecases.push(...filteredData[i].useCases)
                }
            }
        }
        setEligibleUsecases(Array.from(new Set(usecases)).sort())
    }

    const onUseTemplate = (selectedTool) => {
        const dialogProp = {
            title: 'Add New Tool',
            type: 'IMPORT',
            cancelButtonName: 'Cancel',
            confirmButtonName: 'Add',
            data: selectedTool
        }
        setToolDialogProps(dialogProp)
        setShowToolDialog(true)
    }
    
    const convertToolData = (toolData) => {
        return {
            ...toolData,
            ...(JSON.parse(toolData.flowData))
        }
    }

    const goToTool = (selectedTool) => {
        selectedTool = convertToolData(selectedTool)
        const dialogProp = {
            title: selectedTool.name,
            type: 'TEMPLATE',
            data: selectedTool
        }
        setToolDialogProps(dialogProp)
        setShowToolDialog(true)
    }

    const goToCanvas = (selectedChatflow) => {
        // Save current filters in both navigation state and sessionStorage
        const currentFilters = {
            search,
            badgeFilter,
            typeFilter,
            frameworkFilter,
            selectedUsecases
        }
        sessionStorage.setItem('marketplaceFilters', JSON.stringify(currentFilters))
        navigate(
            navigationPaths.marketplace.detail(selectedChatflow.id),
            { 
                state: {
                    templateData: selectedChatflow,
                    filters: currentFilters
                }
            }
        )
    }

    const goToUserTemplateCanvas = (template) => {
        // Use the navigation path constant instead of hardcoding
        navigate(
            navigationPaths.marketplace.detail(template.id),
            {
                state: {
                    templateData: template,
                }
            }
        );
    };

    useEffect(() => {
        getAllTemplatesMarketplacesApi.request()

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        setLoading(getAllTemplatesMarketplacesApi.loading)
    }, [getAllTemplatesMarketplacesApi.loading])

    useEffect(() => {
        if (getAllTemplatesMarketplacesApi.data) {
            try {
                const flows = getAllTemplatesMarketplacesApi.data
                const usecases = []
                const images = {}
                for (let i = 0; i < flows.length; i += 1) {
                    if (flows[i].flowData) {
                        const flowDataStr = flows[i].flowData
                        const flowData = JSON.parse(flowDataStr)
                        if (flows[i].useCases) {    
                            usecases.push(...flows[i].useCases)
                        }
                        const nodes = flowData.nodes || []
                        images[flows[i].id] = []
                        for (let j = 0; j < nodes.length; j += 1) {
                            const imageSrc = `${baseURL}/api/v1/node-icon/${nodes[j].data.name}`
                            if (!images[flows[i].id].includes(imageSrc)) {
                                images[flows[i].id].push(imageSrc)
                            }
                        }
                    }
                }
                setImages(images)
                setUsecases(Array.from(new Set(usecases)).sort())
                setEligibleUsecases(Array.from(new Set(usecases)).sort())
            } catch (e) {
                console.error(e)
            }
        }
    }, [getAllTemplatesMarketplacesApi.data])

    useEffect(() => {
        if (getAllTemplatesMarketplacesApi.error) {
            setError(getAllTemplatesMarketplacesApi.error)
        }
    }, [getAllTemplatesMarketplacesApi.error])

    // Cleanup function
    useEffect(() => {
        return () => {
            // Only clear filters if navigating away from marketplace (not to canvas)
            if (!window.location.pathname.includes(navigationPaths.marketplace.root())) {
                sessionStorage.removeItem('marketplaceFilters')
            }
        }
    }, [])

    const handleUsecaseChange = (usecase, checked) => {
        const newSelectedUsecases = checked
            ? [...selectedUsecases, usecase]
            : selectedUsecases.filter((item) => item !== usecase)
        
        setSelectedUsecases(newSelectedUsecases)
        updateFilters({
            search,
            badgeFilter,
            typeFilter,
            frameworkFilter,
            selectedUsecases: newSelectedUsecases
        })
    }

    useEffect(() => {
        if (getAllTemplatesMarketplacesApi.data) {
            // Recalculate eligible usecases based on current filters
            const filteredData = getAllTemplatesMarketplacesApi.data
                ?.filter(filterByBadge)
                ?.filter(filterByType)
                ?.filter(filterFlows)
                ?.filter(filterByFramework) || []

            // Get unique usecases from filtered data
            const newEligibleUsecases = [...new Set(
                filteredData
                    .flatMap(item => item.useCases || [])
                    .filter(Boolean)
            )]
            
            setEligibleUsecases(newEligibleUsecases)
        }
    }, [
        getAllTemplatesMarketplacesApi.data,
        search,
        badgeFilter,
        typeFilter,
        frameworkFilter
    ])

    const clearAllFilters = () => {
        setSearch('')
        setBadgeFilter([])
        setTypeFilter([])
        setFrameworkFilter([])
        updateFilters({
            search: '',
            badgeFilter: [],
            typeFilter: [],
            frameworkFilter: [],
            selectedUsecases
        })
        getEligibleUsecases({ 
            typeFilter: [], 
            badgeFilter: [], 
            frameworkFilter: [], 
            search: '' 
        })
    }

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        // Save the current tab in localStorage
        localStorage.setItem('marketplaceActiveTab', newValue.toString());
    }

    // Add new state for user template filter use case
    const [userTemplateFilterUseCases, setUserTemplateFilterUseCases] = useState([]);

    // Then in the component, add a toggle function
    const toggleUserTemplateUseCase = (useCase) => {
        if (userTemplateFilterUseCases.includes(useCase)) {
            setUserTemplateFilterUseCases(userTemplateFilterUseCases.filter(uc => uc !== useCase));
        } else {
            setUserTemplateFilterUseCases([...userTemplateFilterUseCases, useCase]);
        }
    };

    // Clear all selected filters
    const clearUserTemplateFilters = () => {
        setUserTemplateFilterUseCases([]);
    };

    return (
        <>
            <MainCard>
                {error ? (
                    <ErrorBoundary error={error} />
                ) : (
                    <Stack flexDirection='column' sx={{ gap: 3 }}>
                        <ViewHeader
                            filters={
                                <>
                                    <FormControl
                                        sx={{
                                            borderRadius: 2,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'end',
                                            minWidth: 120
                                        }}
                                    >
                                        <InputLabel size='small' id='filter-officialBadge-label'>
                                            Badge
                                        </InputLabel>
                                        <Select
                                            labelId='filter-officialBadge-label'
                                            id='filter-officialBadge-checkbox'
                                            size='small'
                                            multiple
                                            value={badgeFilter}
                                            onChange={handleBadgeFilterChange}
                                            input={<OutlinedInput label='Badge' />}
                                            renderValue={(selected) => selected.join(', ')}
                                            MenuProps={MenuProps}
                                            sx={SelectStyles}
                                        >
                                            {badges.map((name) => (
                                                <MenuItem
                                                    key={name}
                                                    value={name}
                                                    sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}
                                                >
                                                    <Checkbox checked={badgeFilter.indexOf(name) > -1} sx={{ p: 0 }} />
                                                    <ListItemText primary={name} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <FormControl
                                        sx={{
                                            borderRadius: 2,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'end',
                                            minWidth: 120
                                        }}
                                    >
                                        <InputLabel size='small' id='type-officialBadge-label'>
                                            Type
                                        </InputLabel>
                                        <Select
                                            size='small'
                                            labelId='type-officialBadge-label'
                                            id='type-officialBadge-checkbox'
                                            multiple
                                            value={typeFilter}
                                            onChange={handleTypeFilterChange}
                                            input={<OutlinedInput label='Badge' />}
                                            renderValue={(selected) => selected.join(', ')}
                                            MenuProps={MenuProps}
                                            sx={SelectStyles}
                                        >
                                            {types.map((name) => (
                                                <MenuItem
                                                    key={name}
                                                    value={name}
                                                    sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}
                                                >
                                                    <Checkbox checked={typeFilter.indexOf(name) > -1} sx={{ p: 0 }} />
                                                    <ListItemText primary={name} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <FormControl
                                        sx={{
                                            borderRadius: 2,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'end',
                                            minWidth: 120
                                        }}
                                    >
                                        <InputLabel size='small' id='type-fw-label'>
                                            Framework
                                        </InputLabel>
                                        <Select
                                            size='small'
                                            labelId='type-fw-label'
                                            id='type-fw-checkbox'
                                            multiple
                                            value={frameworkFilter}
                                            onChange={handleFrameworkFilterChange}
                                            input={<OutlinedInput label='Badge' />}
                                            renderValue={(selected) => selected.join(', ')}
                                            MenuProps={MenuProps}
                                            sx={SelectStyles}
                                        >
                                            {framework.map((name) => (
                                                <MenuItem
                                                    key={name}
                                                    value={name}
                                                    sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}
                                                >
                                                    <Checkbox checked={frameworkFilter.indexOf(name) > -1} sx={{ p: 0 }} />
                                                    <ListItemText primary={name} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </>
                            }
                            onSearchChange={onSearchChange}
                            search={true}
                            searchValue={search}
                            searchPlaceholder='Search Name/Description/Node'
                            title='Marketplace'
                            onClearFilters={clearAllFilters}
                            showClearFilters={!!search || badgeFilter.length > 0 || typeFilter.length > 0 || frameworkFilter.length > 0}
                        >
                            <ToggleButtonGroup
                                sx={{ borderRadius: 2, height: '100%' }}
                                value={view}
                                color='primary'
                                exclusive
                                onChange={handleViewChange}
                            >
                                <ToggleButton
                                    sx={{
                                        borderColor: theme.palette.grey[900] + 25,
                                        borderRadius: 2,
                                        color: theme?.customization?.isDarkMode ? 'white' : 'inherit'
                                    }}
                                    variant='contained'
                                    value='card'
                                    title='Card View'
                                >
                                    <IconLayoutGrid />
                                </ToggleButton>
                                <ToggleButton
                                    sx={{
                                        borderColor: theme.palette.grey[900] + 25,
                                        borderRadius: 2,
                                        color: theme?.customization?.isDarkMode ? 'white' : 'inherit'
                                    }}
                                    variant='contained'
                                    value='list'
                                    title='List View'
                                >
                                    <IconList />
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </ViewHeader>
                        
                        <Box sx={{ width: '100%', borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs 
                                value={tabValue} 
                                onChange={handleTabChange} 
                                aria-label="marketplace tabs"
                                textColor='primary'
                                indicatorColor='primary'
                                centered={false}
                            >
                                <Tab label="Community" />
                                <Tab label="My Template" />
                            </Tabs>
                        </Box>
                        
                        <TabPanel value={tabValue} index={0}>
                            <Stack flexDirection='column' sx={{ gap: 3 }}>
                                <Stack direction='row' sx={{ gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                    {usecases.map((usecase, index) => (
                                        <FormControlLabel
                                            key={index}
                                            size='small'
                                            control={
                                                <Checkbox
                                                    disabled={!eligibleUsecases.includes(usecase)}
                                                    color='success'
                                                    checked={selectedUsecases.includes(usecase)}
                                                    onChange={(event) => handleUsecaseChange(usecase, event.target.checked)}
                                                />
                                            }
                                            label={usecase}
                                        />
                                    ))}
                                </Stack>
                                { selectedUsecases.length > 0 && (
                                    <Button
                                        sx={{ width: 'max-content', borderRadius: '20px' }}
                                        variant='outlined'
                                        onClick={() => clearAllUsecases()}
                                        startIcon={<IconX />}
                                    >
                                        Clear All
                                    </Button>
                                )}
                                {!view || view === 'card' ? (
                                    <>
                                        {isLoading ? (
                                            <Box display='grid' gridTemplateColumns='repeat(3, 1fr)' gap={gridSpacing}>
                                                <Skeleton variant='rounded' height={160} />
                                                <Skeleton variant='rounded' height={160} />
                                                <Skeleton variant='rounded' height={160} />
                                            </Box>
                                        ) : (
                                            <Box display='grid' gridTemplateColumns='repeat(3, 1fr)' gap={gridSpacing}>
                                                {getAllTemplatesMarketplacesApi.data
                                                    ?.filter(filterByBadge)
                                                    ?.filter(filterByType)
                                                    ?.filter(filterFlows)
                                                    ?.filter(filterByFramework)
                                                    ?.filter(filterByUsecases)
                                                    ?.map((data, index) => (
                                                        <Box key={index}>
                                                            {data.officialBadge && (
                                                                <Badge
                                                                    sx={{
                                                                        width: '100%',
                                                                        height: '100%',
                                                                        '& .MuiBadge-badge': {
                                                                            right: 20
                                                                        }
                                                                    }}
                                                                    badgeContent={data.officialBadge}
                                                                    color={data.officialBadge === 'POPULAR' ? 'primary' : 'error'}
                                                                >
                                                                    {(data.templateType === 'Chatflow' || data.templateType === 'Agentflow') && (
                                                                        <ItemCard
                                                                            onClick={() => goToCanvas(data)}
                                                                            data={data}
                                                                            images={images[data.id]}
                                                                        />
                                                                    )}
                                                                    {data.templateType === 'Tool' && (
                                                                        <ItemCard data={convertToolData(data)} onClick={() => goToTool(data)} />
                                                                    )}
                                                                </Badge>
                                                            )}
                                                            {!data.officialBadge && (data.templateType === 'Chatflow' || data.templateType === 'Agentflow') && (
                                                                <ItemCard onClick={() => goToCanvas(data)} data={data} images={images[data.id]} />
                                                            )}
                                                            {!data.officialBadge && data.templateType === 'Tool' && (
                                                                <ItemCard data={convertToolData(data)} onClick={() => goToTool(data)} />
                                                            )}
                                                        </Box>
                                                    )) || []}
                                            </Box>
                                        )}
                                    </>
                                ) : (
                                    <MarketplaceTable
                                        data={getAllTemplatesMarketplacesApi.data || []}
                                        filterFunction={filterFlows}
                                        filterByType={filterByType}
                                        filterByBadge={filterByBadge}
                                        filterByFramework={filterByFramework}
                                        filterByUsecases={filterByUsecases}
                                        goToTool={goToTool}
                                        goToCanvas={goToCanvas}
                                        isLoading={isLoading}
                                        setError={setError}
                                    />
                                )}

                                {!isLoading && (!getAllTemplatesMarketplacesApi.data || getAllTemplatesMarketplacesApi.data.length === 0) && (
                                    <Stack sx={{ alignItems: 'center', justifyContent: 'center' }} flexDirection='column'>
                                        <Box sx={{ p: 2, height: 'auto' }}>
                                            <img
                                                style={{ objectFit: 'cover', height: '16vh', width: 'auto' }}
                                                src={WorkflowEmptySVG}
                                                alt='WorkflowEmptySVG'
                                            />
                                        </Box>
                                        <div>No Marketplace Yet</div>
                                    </Stack>
                                )}
                            </Stack>
                        </TabPanel>
                        
                        <TabPanel value={tabValue} index={1} dir={theme.direction}>
                            {/* Use cases section with horizontal layout */}
                            <Grid container spacing={gridSpacing} sx={{ mt: 2 }}>
                                <Grid item xs={12}>
                                    <Box display="flex" alignItems="center" flexWrap="wrap" gap={2}>
                                        <Typography variant="subtitle1" fontWeight="500" sx={{ mr: 1 }}>
                                            Use cases:
                                        </Typography>
                                        
                                        <Box display="flex" flexWrap="wrap" gap={1}>
                                            <Button
                                                color={userTemplateFilterUseCases.length === 0 ? 'primary' : 'secondary'}
                                                variant={userTemplateFilterUseCases.length === 0 ? 'contained' : 'outlined'}
                                                onClick={clearUserTemplateFilters}
                                                size="small"
                                            >
                                                All
                                            </Button>
                                            {Array.from(new Set(userTemplates.flatMap(template => template.useCases || []))).map((useCase) => (
                                                <Button
                                                    key={useCase}
                                                    color={userTemplateFilterUseCases.includes(useCase) ? 'primary' : 'secondary'}
                                                    variant={userTemplateFilterUseCases.includes(useCase) ? 'contained' : 'outlined'}
                                                    onClick={() => toggleUserTemplateUseCase(useCase)}
                                                    size="small"
                                                >
                                                    {useCase}
                                                </Button>
                                            ))}
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                            
                            {userTemplatesLoading ? (
                                <Box display='grid' gridTemplateColumns='repeat(3, 1fr)' gap={gridSpacing} sx={{ mt: 2 }}>
                                    <Skeleton variant='rounded' height={160} />
                                    <Skeleton variant='rounded' height={160} />
                                    <Skeleton variant='rounded' height={160} />
                                </Box>
                            ) : userTemplates.length > 0 ? (
                                <Grid container spacing={gridSpacing} sx={{ mt: 2 }}>
                                    {userTemplates
                                        // Apply the same filters as used in the community tab
                                        .filter(filterByBadge)
                                        .filter(filterByType)
                                        .filter(filterFlows)
                                        .filter(filterByFramework)
                                        .filter(template => {
                                            // Additional filter for use cases
                                            return userTemplateFilterUseCases.length === 0 || 
                                                (template.useCases && 
                                                 template.useCases.some(useCase => userTemplateFilterUseCases.includes(useCase)));
                                        })
                                        .map((template, index) => (
                                            <Grid item xs={12} md={4} key={index}>
                                                {template.releaseStatus && (
                                                    <Badge
                                                        sx={{
                                                            width: '100%',
                                                            height: '100%',
                                                            '& .MuiBadge-badge': {
                                                                left: 0,  // Position on the left
                                                                top: 0,   // Position from the top
                                                                right: 'auto',
                                                                transform: 'translate(0, 0) scale(1)',
                                                                transformOrigin: '0 0',
                                                                borderRadius: 1,
                                                                padding: '0 8px',
                                                                height: '22px',
                                                                minWidth: '60px', // Fixed width for all badges
                                                                width: '60px',    // Fixed width for all badges
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                letterSpacing: '0.5px',
                                                                textTransform: 'uppercase',
                                                                zIndex: 1,
                                                                display: 'flex',  // Enable flex layout for centering
                                                                justifyContent: 'center', // Center text horizontally
                                                                alignItems: 'center',     // Center text vertically
                                                            }
                                                        }}
                                                        badgeContent={getReleaseStatusConfig(template.releaseStatus).label}
                                                        color={getReleaseStatusConfig(template.releaseStatus).color}
                                                    >
                                                        <ItemCard
                                                            data={template}
                                                            images={userTemplateImages[template.id] || []}
                                                            onClick={() => goToUserTemplateCanvas(template)}
                                                        />
                                                    </Badge>
                                                )}
                                                {!template.releaseStatus && (
                                                    <ItemCard
                                                        data={template}
                                                        images={userTemplateImages[template.id] || []}
                                                        onClick={() => goToUserTemplateCanvas(template)}
                                                    />
                                                )}
                                            </Grid>
                                        ))}
                                </Grid>
                            ) : (
                                <Box 
                                    sx={{ 
                                        mt: 10, 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        height: '50vh'
                                    }}
                                >
                                    <img
                                        src={WorkflowEmptySVG}
                                        alt="No templates"
                                        style={{ width: '200px', marginBottom: '20px' }}
                                    />
                                    <Typography variant="h5" gutterBottom>
                                        No Templates Yet
                                    </Typography>
                                    <Typography variant="body1" color="textSecondary">
                                        Templates you create will appear here
                                    </Typography>
                                </Box>
                            )}
                        </TabPanel>
                    </Stack>
                )}
            </MainCard>
            <ToolDialog
                show={showToolDialog}
                dialogProps={toolDialogProps}
                onCancel={() => setShowToolDialog(false)}
                onConfirm={() => setShowToolDialog(false)}
                onUseTemplate={(tool) => onUseTemplate(tool)}
            ></ToolDialog>
        </>
    )
}

export default Marketplace
