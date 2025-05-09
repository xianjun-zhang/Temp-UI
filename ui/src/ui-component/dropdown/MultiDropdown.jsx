import { useState, Fragment } from 'react'
import { useSelector } from 'react-redux'

import { Popper, FormControl, TextField, Box, Typography, Checkbox, Tooltip } from '@mui/material'
import Autocomplete, { autocompleteClasses } from '@mui/material/Autocomplete'
import { styled } from '@mui/material/styles'
import PropTypes from 'prop-types'

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

export const MultiDropdown = ({ name, value, options, onSelect, formControlSx = {}, disabled = false, disableClearable = false }) => {
    const customization = useSelector((state) => state.customization)
    const findMatchingOptions = (options = [], internalValue) => {
        let values = []
        if ('choose an option' !== internalValue && internalValue && typeof internalValue === 'string') values = JSON.parse(internalValue)
        else values = internalValue
        return options.filter((option) => values.includes(option.name))
    }
    const getDefaultOptionValue = () => []
    let [internalValue, setInternalValue] = useState(value ?? [])
    
    // Prepare options with Select All option
    const allOptions = options || []
    // Add Select All option only if there are regular options
    const displayOptions = allOptions.length > 0 
        ? [{ label: 'Select All', name: 'select-all' }, ...allOptions] 
        : allOptions
    
    // Handle multiple selection changes
    const handleMultipleSelectChange = (selection) => {
        let value = '';
        
        // Check if "Select All" was clicked
        if (selection.findIndex(opt => opt.name === 'select-all') !== -1) {
            // Check if we need to select all or deselect all
            const selectedOptions = findMatchingOptions(allOptions, internalValue) || [];
            const regularOptions = allOptions;
            
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
    
    // Render option with checkbox
    const renderOption = (props, option) => {
        // Special handling for "Select All" option
        if (option.name === 'select-all') {
            const selectedOptions = findMatchingOptions(allOptions, internalValue) || [];
            const regularOptions = allOptions;
            // Check if all options are selected
            const allSelected = selectedOptions.length === regularOptions.length && regularOptions.length > 0;
            
            return (
                <Box 
                    component='li' 
                    {...props} 
                    style={{ display: 'flex', alignItems: 'center' }}
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
        
        const selectedOptions = findMatchingOptions(allOptions, internalValue) || [];
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

    return (
        <FormControl sx={{ mt: 1, width: '100%', ...formControlSx }} size='small'>
            <Autocomplete
                id={name}
                disabled={disabled}
                disableClearable={disableClearable}
                size='small'
                multiple
                disableCloseOnSelect={true}
                filterSelectedOptions={false}
                options={displayOptions}
                value={findMatchingOptions(allOptions, internalValue) || getDefaultOptionValue()}
                onChange={(e, selection) => handleMultipleSelectChange(selection)}
                PopperComponent={StyledPopper}
                renderInput={(params) => (
                    <TextField {...params} value={internalValue} sx={{ height: '100%', '& .MuiInputBase-root': { height: '100%' } }} />
                )}
                renderOption={renderOption}
                sx={{ height: '100%' }}
            />
        </FormControl>
    )
}

MultiDropdown.propTypes = {
    name: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
    ]),
    options: PropTypes.array,
    onSelect: PropTypes.func,
    disabled: PropTypes.bool,
    formControlSx: PropTypes.object,
    disableClearable: PropTypes.bool
}
