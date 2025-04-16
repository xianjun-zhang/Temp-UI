import { useState, useEffect, Fragment } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import axios from 'axios'

// Material
import Autocomplete, { autocompleteClasses } from '@mui/material/Autocomplete'
import { Popper, CircularProgress, TextField, Box, Typography, Checkbox, Tooltip } from '@mui/material'
import { styled } from '@mui/material/styles'

// API
import credentialsApi from '@/api/credentials'

// const
import { baseURL } from '@/store/constant'

const StyledPopper = styled(Popper)({
    boxShadow: '0px 8px 10px -5px rgb(0 0 0 / 20%), 0px 16px 24px 2px rgb(0 0 0 / 14%), 0px 6px 30px 5px rgb(0 0 0 / 12%)',
    borderRadius: '10px',
    [`& .${autocompleteClasses.listbox}`]: {
        boxSizing: 'border-box',
        '& ul': {
            padding: 10,
            margin: 10
        }
    }
})

const fetchList = async ({ name, nodeData }) => {
    const loadMethod = nodeData.inputParams.find((param) => param.name === name)?.loadMethod

    let lists = await axios
        .post(
            `${baseURL}/api/v1/node-load-method/${nodeData.name}`,
            { ...nodeData, loadMethod }
        )
        .then(async function (response) {
            return response.data
        })
        .catch(function (error) {
            console.error(error)
        })
    return lists
}

export const AsyncDropdown = ({
    name,
    nodeData,
    value,
    onSelect,
    isCreateNewOption,
    onCreateNew,
    credentialNames = [],
    disabled = false,
    disableClearable = false,
    freeSolo = false,
    multiple = false
}) => {
    const customization = useSelector((state) => state.customization)

    const [open, setOpen] = useState(false)
    const [options, setOptions] = useState([])
    const [loading, setLoading] = useState(false)
    const findMatchingOptions = (options = [], value) => {

        if (!value || value === 'choose an option') {
            return null
        }

        if (multiple) {
            const values = Array.isArray(value) ? value : (typeof value === 'string' ? JSON.parse(value) : [])
            return options.filter((option) => values.includes(option.name))
        }
        
        return options.find((option) => option.name === value)
    }
    const getDefaultOptionValue = () => (multiple ? [] : '')
    const addNewOption = [{ label: '- Create New -', name: '-create-' }]
    let [internalValue, setInternalValue] = useState(value ?? 'choose an option')

    const fetchCredentialList = async () => {
        try {
            let names = ''
            if (credentialNames.length > 1) {
                names = credentialNames.join('&credentialName=')
            } else {
                names = credentialNames[0]
            }
            const resp = await credentialsApi.getCredentialsByName(names)
            if (resp.data) {
                const returnList = []
                for (let i = 0; i < resp.data.length; i += 1) {
                    const data = {
                        label: resp.data[i].name,
                        name: resp.data[i].id
                    }
                    returnList.push(data)
                }
                return returnList
            }
        } catch (error) {
            console.error(error)
        }
    }
    
    // Handle multiple selection changes
    const handleMultipleSelectChange = (selection) => {
        let value = '';
        
        // Check if "Select All" was clicked
        if (selection.findIndex(opt => opt.name === 'select-all') !== -1) {
            // Check if we need to select all or deselect all
            const selectedOptions = findMatchingOptions(options, internalValue) || [];
            const regularOptions = options.filter(opt => opt.name !== 'select-all' && opt.name !== '-create-');
            
            // If all options are already selected, this is a deselection action
            if (selectedOptions.length === regularOptions.length) {
                // Deselect all - set empty value
                value = '';
            } else {
                // Select all - get all option names except special ones
                const allOptionsNames = regularOptions.map(opt => opt.name);
                value = JSON.stringify(allOptionsNames);
            }
        } else if (selection.length) {
            // Normal selection
            const selectionNames = selection.map(item => item.name);
            value = JSON.stringify(selectionNames);
        }
        
        setInternalValue(value);
        onSelect(value);
    }
    
    // Handle single selection changes
    const handleSingleSelectChange = (selection) => {
        const value = selection ? selection.name : '';
        if (isCreateNewOption && value === '-create-') {
            onCreateNew();
        } else {
            setInternalValue(value);
            onSelect(value);
        }
    }
    
    // Render option with checkbox for multiple select mode
    const renderMultipleOption = (props, option) => {
        // Special handling for "Select All" option
        if (option.name === 'select-all') {
            const selectedOptions = findMatchingOptions(options, internalValue) || [];
            const regularOptions = options.filter(opt => opt.name !== 'select-all' && opt.name !== '-create-');
            // Check if all options are selected
            const allSelected = selectedOptions.length === regularOptions.length && regularOptions.length > 0;
            
            return (
                <Box 
                    component='li' 
                    {...props} 
                    style={{ display: 'flex', alignItems: 'center' }}
                    // Ensure it's clickable even when checked
                    onClick={(e) => {
                        // Use the props.onClick from MUI's Autocomplete
                        props.onClick(e);
                    }}
                >
                    <Checkbox
                        checked={allSelected}
                        sx={{ marginRight: 1 }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant='h5' sx={{ fontWeight: 'bold' }}>Select All</Typography>
                    </div>
                </Box>
            );
        }
        
        const selectedOptions = findMatchingOptions(options, internalValue) || [];
        const isSelected = selectedOptions.some(selected => selected.name === option.name);
        
        return (
            <Box 
                component='li' 
                {...props} 
                style={{ display: 'flex', alignItems: 'center' }}
            >
                <Checkbox
                    checked={isSelected}
                    sx={{ marginRight: 1 }}
                />
                <Tooltip 
                    title={
                        <Fragment>
                            <Typography sx={{ fontWeight: 'bold' }}>{option.label}</Typography>
                            {option.description && (
                                <Typography sx={{ mt: 1 }}>{option.description}</Typography>
                            )}
                        </Fragment>
                    }
                    placement="right"
                    arrow
                >
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>
                        <Typography 
                            variant='h5' 
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                width: '100%'
                            }}
                        >
                            {option.label}
                        </Typography>
                        {option.description && (
                            <Typography 
                                sx={{ 
                                    color: customization.isDarkMode ? '#9e9e9e' : '',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    width: '100%'
                                }}
                            >
                                {option.description}
                            </Typography>
                        )}
                    </div>
                </Tooltip>
            </Box>
        );
    }
    
    // Render option for single select mode
    const renderSingleOption = (props, option) => {
        return (
            <Box 
                component='li' 
                {...props} 
            >
                <Tooltip 
                    title={
                        <Fragment>
                            <Typography sx={{ fontWeight: 'bold' }}>{option.label}</Typography>
                            {option.description && (
                                <Typography sx={{ mt: 1 }}>{option.description}</Typography>
                            )}
                        </Fragment>
                    }
                    placement="right"
                    arrow
                >
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>
                        <Typography 
                            variant='h5' 
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                width: '100%'
                            }}
                        >
                            {option.label}
                        </Typography>
                        {option.description && (
                            <Typography 
                                sx={{ 
                                    color: customization.isDarkMode ? '#9e9e9e' : '',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    width: '100%'
                                }}
                            >
                                {option.description}
                            </Typography>
                        )}
                    </div>
                </Tooltip>
            </Box>
        );
    }

    useEffect(() => {
        setLoading(true);
        (async () => {
            const fetchData = async () => {
                try {
                    let response = credentialNames.length ? await fetchCredentialList() : await fetchList({ name, nodeData })
                    
                    // Add safety check to prevent infinite loading
                    if (!response) response = []
                    
                    // Add "Select All" option if multiple selection is enabled
                    if (multiple) {
                        const selectAllOption = { label: 'Select All', name: 'select-all' }
                        response = [selectAllOption, ...response]
                    }
                    
                    if (isCreateNewOption) setOptions([...response, ...addNewOption])
                    else setOptions([...response])
                } catch (error) {
                    console.error('Error fetching dropdown options:', error)
                    setOptions([]) // Set empty options on error
                } finally {
                    setLoading(false) // Always stop loading regardless of result
                }
            }
            
            fetchData()
            
            // Add a safety timeout to prevent infinite loading
            const timeoutId = setTimeout(() => {
                setLoading(false)
            }, 5000)
            
            return () => clearTimeout(timeoutId)
        })()

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <>
            <Autocomplete
                id={name}
                disabled={disabled}
                disableClearable={disableClearable}
                freeSolo={freeSolo}
                multiple={multiple}
                filterSelectedOptions={false}
                size='small'
                disableCloseOnSelect={multiple}
                sx={{ 
                    mt: 1, 
                    width: '100%',
                    maxHeight: '100px',
                    overflowX: 'auto',
                }}
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                options={options}
                value={findMatchingOptions(options, internalValue) || getDefaultOptionValue()}
                isOptionEqualToValue={(option, value) => {
                    if (!value) return true
                    return option.name === value.name
                }}
                onChange={(e, selection) => {
                    if (multiple) {
                        handleMultipleSelectChange(selection);
                    } else {
                        handleSingleSelectChange(selection);
                    }
                }}
                PopperComponent={StyledPopper}
                componentsProps={{
                    popper: {
                        placement: 'bottom-start',
                        strategy: 'fixed'
                    }
                }}
                ListboxProps={{
                    style: { maxHeight: '500px' }
                }}
                loading={loading}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        value={internalValue}
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <Fragment>
                                    {loading ? <CircularProgress color='inherit' size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </Fragment>
                            )
                        }}
                    />
                )}
                renderOption={(props, option) => 
                    multiple ? renderMultipleOption(props, option) : renderSingleOption(props, option)
                }
            />
        </>
    )
}

AsyncDropdown.propTypes = {
    name: PropTypes.string,
    nodeData: PropTypes.object,
    value: PropTypes.string,
    onSelect: PropTypes.func,
    onCreateNew: PropTypes.func,
    disabled: PropTypes.bool,
    credentialNames: PropTypes.array,
    disableClearable: PropTypes.bool,
    isCreateNewOption: PropTypes.bool,
    freeSolo: PropTypes.bool,
    multiple: PropTypes.bool
}
