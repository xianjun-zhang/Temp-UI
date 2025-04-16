import { useState } from 'react'
import { Box, IconButton, Popper, Paper } from '@mui/material'
import { IconPalette, IconDots } from '@tabler/icons-react'
import { NodeActionButtons } from './NodeActionButtons'
import PropTypes from 'prop-types'

export const STICKY_NOTE_COLORS = {
    yellow: { id: 'yellow', light: '#FFF8B8', selected: '#FFE770' },
    gray: { id: 'gray', light: '#EEEEEE', selected: '#E0E0E0' },
    pink: { id: 'pink', light: '#FFD1D1', selected: '#FFB1B1' },
    blue: { id: 'blue', light: '#D1E8FF', selected: '#B1D8FF' },
    green: { id: 'green', light: '#D1FFD1', selected: '#B1FFB1' }
}

export const ColorPickerButton = ({ currentColor, onColorSelect, ...nodeActionProps }) => {
    const [anchorEl, setAnchorEl] = useState(null)
    
    const handleClick = (event) => {
        setAnchorEl(anchorEl ? null : event.currentTarget)
    }

    return (
        <>
            <Box sx={{ 
                position: 'absolute',
                top: 0,
                // left: '50%',
                // transform: 'translateX(-50%)',
                right: 0,
                display: 'flex',
                gap: 1,
                backgroundColor: 'white',
                padding: '2px',
                borderRadius: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <IconButton 
                    onClick={handleClick}
                    sx={{
                        backgroundColor: currentColor.light,
                        width: 24,
                        height: 24,
                        '&:hover': { backgroundColor: currentColor.selected }
                    }}
                >
                    <IconPalette size={20} />
                </IconButton>

                {/* {onMoreOptions && (
                    <IconButton
                        onClick={onMoreOptions}
                        sx={{ width: 32, height: 32 }}
                    >
                        <IconDots size={20} />
                    </IconButton>


                )} */}
                <NodeActionButtons {...nodeActionProps} />
            </Box>
            
            <Popper open={Boolean(anchorEl)} anchorEl={anchorEl} placement="top">
                <Paper sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    p: 1, 
                    borderRadius: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    {Object.entries(STICKY_NOTE_COLORS).map(([colorName, color]) => (
                        <IconButton
                            key={colorName}
                            onClick={() => {
                                onColorSelect(color)
                                setAnchorEl(null)
                            }}
                            sx={{
                                backgroundColor: color.light,
                                width: 24,
                                height: 24,
                                '&:hover': { backgroundColor: color.selected }
                            }}
                        />
                    ))}
                </Paper>
            </Popper>
        </>
    )
}

ColorPickerButton.propTypes = {
    currentColor: PropTypes.object.isRequired,
    onColorSelect: PropTypes.func.isRequired,
    ...NodeActionButtons.propTypes
}
