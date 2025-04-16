// material-ui
import { styled } from '@mui/material/styles'

// project imports
import MainCard from './MainCard'

const NodeCardWrapper = styled(MainCard, {
    shouldForwardProp: (prop) => prop !== 'isSelected'
})(({ theme, isSelected = false }) => ({
    background: theme.palette.card.main,
    color: theme.darkTextPrimary,
    border: 'solid 2px',
    borderColor: isSelected ? theme.palette.warning.dark : theme.palette.grey[300],
    width: '300px',
    height: 'auto',
    padding: '10px',
    boxShadow: `0 1px 10px 0 ${isSelected ? theme.palette.warning.dark : theme.palette.grey[300]}40`,  //#E4E4E6
    '&:hover': {
        borderColor: theme.palette.warning.main,
        boxShadow: `0 4px 10px 2px ${theme.palette.warning.main}40`
    }
}))

export default NodeCardWrapper
