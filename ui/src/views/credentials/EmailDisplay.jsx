import PropTypes from 'prop-types'
import { Box, Typography, Paper, Divider } from '@mui/material'

/* Email data format:
{
    subject: string,
    from: string,
    snippet: string,
    content: string
}
*/
const EmailDisplay = ({ emailData }) => {
    if (!emailData) return null

    return (
        <Paper 
            elevation={0} 
            variant="outlined" 
            sx={{ 
                mt: 2, 
                p: 2,
                borderRadius: 2 
            }}
        >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {emailData.subject}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                From: {emailData.from}
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            
            <Box 
                sx={{ 
                    p: 2,
                    bgcolor: 'background.default',
                    borderRadius: 1,
                    maxHeight: 200,
                    overflow: 'auto'
                }}
            >
                {emailData.content ? (
                    <div dangerouslySetInnerHTML={{ __html: emailData.content }} />
                ) : emailData.snippet ? (
                    <Typography variant="body2">{emailData.snippet}</Typography>
                ) : (
                    <Typography variant="body2">No email content available</Typography>
                )}
            </Box>
        </Paper>
    )
}

EmailDisplay.propTypes = {
    emailData: PropTypes.shape({
        subject: PropTypes.string.isRequired,
        from: PropTypes.string.isRequired,
        snippet: PropTypes.string,
        content: PropTypes.string
    })
}

export default EmailDisplay