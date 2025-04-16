import { createPortal } from 'react-dom'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import useConfirm from '@/hooks/useConfirm'
import { StyledButton } from '@/ui-component/button/StyledButton'
import { useTheme } from '@mui/material/styles'

const ConfirmDialog = () => {
    const { onConfirm, onCancel, onExtra, confirmState } = useConfirm()
    const portalElement = document.getElementById('portal')
    const theme = useTheme()

    const renderDescription = (description) => {
        if (typeof description === 'string') {
            // Handle legacy string format
            return <div style={{ whiteSpace: 'pre-line' }}>{description}</div>
        }

        return description.map((item, index) => {
            switch (item.type) {
                case 'action':
                    return (
                        <div key={index} style={{ marginBottom: '10px' }}>
                            <span style={{ color: item.color || theme.palette.primary.main, fontWeight: 500 }}>
                                {item.text}
                            </span>
                            {item.explanation && (
                                <>
                                    <span style={{ color: theme.palette.text.primary }}>
                                        {item.explanation}
                                    </span>
                                </>
                            )}
                        </div>
                    )
                case 'normal':
                default:
                    return (
                        <div key={index} style={{ marginBottom: '10px', color: item.color || theme.palette.text.primary }}>
                            {item.text}
                        </div>
                    )
            }
        })
    }

    // Calculate dialog size based on button text lengths
    const getDialogMaxWidth = () => {
        const buttonTexts = [
            confirmState.cancelButtonName,
            confirmState.confirmButtonName,
            confirmState.extraButton?.name
        ].filter(Boolean)
        
        const maxLength = Math.max(...buttonTexts.map(text => text.length))
        
        // If any button text is longer than 15 characters, use 'sm' size
        return maxLength > 15 ? 'sm' : 'xs'
    }

    const component = confirmState.show ? (
        <Dialog
            fullWidth
            maxWidth={getDialogMaxWidth()}
            open={confirmState.show}
            onClose={onCancel}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
        >
            <DialogTitle sx={{ fontSize: '1rem' }} id='alert-dialog-title'>
                {confirmState.title}
            </DialogTitle>
            <DialogContent>
                {renderDescription(confirmState.description)}
                <div style={{ display: 'flex', flexDirection: 'row', marginTop: 20, gap: 10 }}>
                    <Button 
                        sx={{ 
                            flex: 1,
                            fontSize: '0.875rem',  // Slightly larger font
                            minHeight: '36px',     // Min height instead of fixed
                            whiteSpace: 'normal',  // Allow text wrapping if needed
                            padding: '8px 16px',   // Slightly more padding
                            lineHeight: 1.2        // Better line height for wrapped text
                        }} 
                        variant='outlined' 
                        onClick={onCancel}
                    >
                        {confirmState.cancelButtonName}
                    </Button>
                    <StyledButton 
                        sx={{ 
                            flex: 1,
                            fontSize: '0.875rem',
                            minHeight: '36px',
                            whiteSpace: 'normal',
                            padding: '8px 16px',
                            lineHeight: 1.2
                        }} 
                        variant={confirmState.confirmButtonProps?.variant || 'contained'}
                        color={confirmState.confirmButtonProps?.color || 'primary'}
                        onClick={onConfirm}
                    >
                        {confirmState.confirmButtonName}
                    </StyledButton>
                    {confirmState.extraButton && (
                        <StyledButton
                            sx={{ 
                                flex: 1,
                                fontSize: '0.875rem',
                                minHeight: '36px',
                                whiteSpace: 'normal',
                                padding: '8px 16px',
                                lineHeight: 1.2
                            }}
                            variant={confirmState.extraButton.variant}
                            color={confirmState.extraButton.color}
                            onClick={onExtra}
                        >
                            {confirmState.extraButton.name}
                        </StyledButton>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    ) : null

    return createPortal(component, portalElement)
}

export default ConfirmDialog
