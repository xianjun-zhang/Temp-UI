import { styled } from '@mui/material/styles'
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip'
import { Box, Typography, useTheme } from '@mui/material'
import { useReactFlow } from 'reactflow'

// Add these constants at the top of your file, after the imports
const TOOLTIP_TYPOGRAPHY = {
    fontFamily: 'Inter, "Roboto", "Helvetica", "Arial", sans-serif',
    sizes: {
        small: '0.75rem',
        regular: '0.875rem'
    },
    weights: {
        regular: 400,
        medium: 500,
        semiBold: 600
    },
    colors: {
        primary: '#f8f9fa',
        secondary: '#e9ecef'
    }
}

const TOOLTIP_STYLES = {
    container: {
        // width: 280,
        minWidth: 240,
        maxWidth: 360,
        borderRadius: '4px',
        backgroundColor: '#1e1e1e',
        boxShadow: '0px 3px 10px rgba(0,0,0,0.2)',
        padding: 2
    },
    typeLabel: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1,
        marginBottom: 1.5,
        fontFamily: TOOLTIP_TYPOGRAPHY.fontFamily,
        fontSize: TOOLTIP_TYPOGRAPHY.sizes.small,
        fontWeight: TOOLTIP_TYPOGRAPHY.weights.medium,
        color: TOOLTIP_TYPOGRAPHY.colors.primary
    },
    typeBox: {
        px: 1.5,
        py: 0.25,
        borderRadius: '4px',
        color: 'white',
        fontFamily: TOOLTIP_TYPOGRAPHY.fontFamily,
        fontSize: TOOLTIP_TYPOGRAPHY.sizes.small,
        fontWeight: TOOLTIP_TYPOGRAPHY.weights.semiBold,
        letterSpacing: '0.01em'
    },
    description: {
        color: TOOLTIP_TYPOGRAPHY.colors.secondary,
        marginBottom: 0.75,
        fontFamily: TOOLTIP_TYPOGRAPHY.fontFamily,
        fontSize: TOOLTIP_TYPOGRAPHY.sizes.small,
        fontWeight: TOOLTIP_TYPOGRAPHY.weights.regular,
        opacity: 0.8
    }
}

// Custom tooltip content component
const TooltipContent = ({ type = 'input' | 'output', typeListStr }) => {
    const theme = useTheme()
    const { getZoom } = useReactFlow()
    const zoom = Math.max(getZoom(), 0.9)
    const isInput = type === 'input'
    const bgColor = isInput ? theme.palette.secondary.main : theme.palette.secondary.main
    const actionText = `Click the handle to see more tips.`
    const typeList = typeListStr
        .split('|')
        .reduce((acc, item) => {
            const trimmed = item.trim()
            if (trimmed) acc.push(trimmed)
            return acc
        }, [])

    return (
        <Box
            sx={{
                ...TOOLTIP_STYLES.container,
                overflow: 'hidden',
                color: 'white',
                fontSize: TOOLTIP_TYPOGRAPHY.sizes.regular,
                lineHeight: 1.5,
                transform: `scale(${zoom})`,
                transformOrigin: isInput ? 'right center' : 'left center'
            }}
        >
            <Box>
                <Typography sx={TOOLTIP_STYLES.typeLabel}>
                    {isInput ? 'Input type:' : 'Output type:'} 
                    {typeList.map((type, index) => (
                        <Box 
                            key={index}
                            component="span" 
                            sx={{
                                ...TOOLTIP_STYLES.typeBox,
                                backgroundColor: bgColor
                            }}
                        >
                            {type}
                        </Box>
                    ))}
                </Typography>
                
                <Typography sx={TOOLTIP_STYLES.description}>
                    {actionText}
                </Typography>
            </Box>
        </Box>
    )
}

// Base tooltip remains simple
const BaseTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} />
))({
    [`& .${tooltipClasses.tooltip}`]: {
        maxWidth: 'none',
        padding: 0,
        backgroundColor: 'transparent',
        // boxShadow: '0px 2px 8px rgba(0,0,0,0.2)'
    },
    [`& .${tooltipClasses.popper}`]: {
        opacity: 1
    }
})

// Input tooltip
export const InputTooltip = ({ title, children, ...props }) => (
    <BaseTooltip
        title={<TooltipContent type="input" typeListStr={title} />}
        placement="left"
        arrow={false}
        {...props}
    >
        {children}
    </BaseTooltip>
)

// Output tooltip
export const OutputTooltip = ({ title, children, ...props }) => (
    <BaseTooltip
        title={<TooltipContent type="output" typeListStr={title} />}
        placement="right"
        arrow={false}
        {...props}
    >
        {children}
    </BaseTooltip>
)
