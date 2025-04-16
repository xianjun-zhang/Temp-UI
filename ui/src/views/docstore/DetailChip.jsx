import React, { useState } from 'react'
import { Chip } from '@mui/material'
import { alpha } from '@mui/material/styles'
import JsonFormatDialog from './JsonFormatDialog'

const DetailChip = ({ label, title, data, onClick }) => {
    const [showDialog, setShowDialog] = useState(false);
    const [dialogProps, setDialogProps] = useState({});

    const handleClick = (e) => {
        e.stopPropagation()

        if (!data) {
            return
        }

        const dialogProp = {
            title: title,
            data: data,
            cancelButtonName: 'Close'
        }
        setDialogProps(dialogProp)
        setShowDialog(true)
    }

    return (
        <>
            {label && (
                <Chip
                    variant="outlined"
                    size="small"
                    label={typeof label === 'number' ? label.toLocaleString() : label}
                    sx={{
                        cursor: 'pointer',
                        '&:hover': {
                            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1)
                        }
                    }}
                    onClick={handleClick}
                />
            )}

            <JsonFormatDialog
                show={showDialog}
                dialogProps={dialogProps}
                onCancel={() => setShowDialog(false)}
            />
        </>
    )
}

export default DetailChip