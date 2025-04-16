import { styled } from '@mui/material/styles'
import { Box } from '@mui/material'

export const StyledBox = styled(Box)(({ theme, color = 'background' }) => ({
    backgroundColor: theme.palette[color].paper,
    backgroundImage: `linear-gradient(rgb(0 0 0/3%) 0 0)`,

    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3)
}))
