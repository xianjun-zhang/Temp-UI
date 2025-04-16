import { Link } from 'react-router-dom'
import { Typography, Button, Box, Container } from '@mui/material'
import { styled } from '@mui/system'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'

const StyledContainer = styled(Container)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    textAlign: 'center',
    backgroundColor: theme.palette.background.default,
}))

const StyledErrorIcon = styled(ErrorOutlineIcon)(({ theme }) => ({
    fontSize: '8rem',
    color: theme.palette.error.main,
    marginBottom: theme.spacing(2),
}))

const NotFound404 = () => {
    return (
        <StyledContainer maxWidth="sm">
            <StyledErrorIcon />
            <Typography variant="h2" gutterBottom fontWeight="bold" color="primary">
                404
            </Typography>
            <Typography variant="h4" gutterBottom color="textSecondary">
                Oops! Page Not Found
            </Typography>
            <Typography variant="body1" paragraph color="textSecondary">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </Typography>
            <Button
                component={Link}
                to="/"
                variant="contained"
                color="primary"
                size="large"
                sx={{
                    mt: 3,
                    px: 4,
                    py: 1,
                    borderRadius: '50px',
                    boxShadow: '0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 7px 14px rgba(50, 50, 93, 0.1), 0 3px 6px rgba(0, 0, 0, 0.08)',
                    },
                }}
            >
                Back to Home
            </Button>
        </StyledContainer>
    )
}

export default NotFound404
