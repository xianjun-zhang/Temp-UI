import { useState } from 'react'
import PropTypes from 'prop-types'

// project import
import VectorStoreDialog from '@/views/vectorstore/VectorStoreDialog'
import UpsertResultDialog from '@/views/vectorstore/UpsertResultDialog'

const UpsertDialog = ({ show, chatflowid, onClose }) => {
    const [showUpsertResultDialog, setShowUpsertResultDialog] = useState(false)
    const [upsertResultDialogProps, setUpsertResultDialogProps] = useState({})

    const handleCancel = () => {
        onClose()
    }

    const handleIndexResult = (indexRes) => {
        setShowUpsertResultDialog(true)
        setUpsertResultDialogProps({ ...indexRes })
    }

    return (
        <>
            <VectorStoreDialog
                show={show}
                dialogProps={{
                    open: true,
                    title: 'Upsert Vector Store',
                    chatflowid
                }}
                onCancel={handleCancel}
                onIndexResult={handleIndexResult}
            />
            {/* Upsert Result Dialog, it will show after upserting the vector store successfully */}
            <UpsertResultDialog
                show={showUpsertResultDialog}
                dialogProps={upsertResultDialogProps}
                onCancel={() => {
                    setShowUpsertResultDialog(false)
                    onClose()
                }}
            />
        </>
    )
}

UpsertDialog.propTypes = {
    show: PropTypes.bool,
    chatflowid: PropTypes.string,
    onClose: PropTypes.func
}

export default UpsertDialog
