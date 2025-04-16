import { useState } from 'react'
import { Fab, Tooltip, useTheme } from '@mui/material'
import FeedbackIcon from '@mui/icons-material/Feedback'
import FeedbackFormDialog from './FeedbackFormDialog'

const FeedbackButton = () => {
    const [open, setOpen] = useState(false)
    const theme = useTheme()

    const handleOpen = () => setOpen(true)
    const handleClose = () => setOpen(false)

    return (
        <>
            <Tooltip title="Give Feedback" placement="left">
                <Fab
                    color="primary"
                    aria-label="feedback"
                    onClick={handleOpen}
                    sx={{
                        position: 'fixed',
                        backgroundColor: theme.palette.primary.main, //theme.palette.primary.main,
                        bottom: 24,
                        right: 24,
                        zIndex: 1000,
                        boxShadow: theme.shadows[4],
                        '&:hover': {
                            backgroundColor: theme.palette.secondary.dark, //theme.palette.primary.main,
                        }
                    }}
                >
                    <FeedbackIcon />
                </Fab>
            </Tooltip>
            <FeedbackFormDialog open={open} onClose={handleClose} />
        </>
    )
}

export default FeedbackButton
