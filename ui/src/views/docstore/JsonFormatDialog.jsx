import React from 'react'
import { useSelector } from 'react-redux'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'
import ReactJson from 'react-json-view'

const JsonFormatDialog = ({ show, dialogProps, onCancel }) => {
    const customization = useSelector((state) => state.customization)

    return (
        <Dialog
            open={show}
            onClose={onCancel}
            aria-labelledby="file-details-dialog"
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>{dialogProps.title}</DialogTitle>
            <DialogContent>
                <ReactJson
                    src={dialogProps.data}
                    theme={customization.isDarkMode ? 'monokai' : 'rjv-default'}
                    style={{ padding: '10px' }}
                    displayDataTypes={false}
                    enableClipboard={false}
                    name={false}
                    collapsed={1}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>{dialogProps.cancelButtonName}</Button>
            </DialogActions>
        </Dialog>
    )
}

export default JsonFormatDialog