import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useTheme } from '@mui/material/styles'
import { FormControl, Button, Typography, Box } from '@mui/material'
import { IconUpload } from '@tabler/icons-react'
import documentStoreAPI from '@/api/documentstore'

// TODO: [p0.5] 未来考虑与组件(FileUploadBase64.jsx)的合并，根据不同使用场景决定是否使用instant upload还是转化为base64，下一步操作再真上传

const FileUploadStatus = {
    PENDING: 'pending',
    UPLOADING: 'uploading',
    SUCCESS: 'success',
    FAILED: 'failed'
}

export const FileInstantUploadComponent = ({ existingFiles = [], fileType, onChange, disabled = false, storeId }) => {
    const theme = useTheme()
    const [files, setFiles] = useState([]) // Array of file objects with metadata

    // Initialize files from existingFiles prop
    useEffect(() => {
        if (existingFiles && Array.isArray(existingFiles) && existingFiles.length > 0) {
            // Format existing files to match expected structure
            const formattedFiles = existingFiles.map(file => ({
                id: file.id,
                file: {
                    name: file.name || file.originalFileName,
                    type: file.type || file.mimePrefix
                },
                status: file.status === 'CHUNK_SYNCED' ? FileUploadStatus.SUCCESS : FileUploadStatus.FAILED,
                progress: file.status === 'CHUNK_SYNCED' ? 100 : 0,
                fileUploadResult: file.fileUploadResult || file
            }))

            setFiles(formattedFiles)
        }
    }, [])

    // Effect to handle changes passed to parent onChange
    useEffect(() => {
        const allFiles = files.map((f) => ({
            id: f.id,
            name: f.file.name,
            fileUploadResult: f.fileUploadResult,
            status: f.status,
            progress: f.progress,
            error: f.error
        }))
        onChange(allFiles)
    }, [files])
    

    // Handle file selection and start upload immediately
    const handleFilesUpload = (e) => {
        if (!e.target.files) return

        const selectedFiles = Array.from(e.target.files).map((file) => ({
            file,
            progress: 0,
            status: FileUploadStatus.PENDING,
            error: null,
            id: null, // Will be set after successful upload
            fileUploadResult: null, // Will store the server response data
        }))

        // Add selected files to the state
        setFiles((prevFiles) => [...prevFiles, ...selectedFiles])

        // Start uploading the selected files
        selectedFiles.forEach((fileObj) => {
            uploadFile(fileObj)
        })

        // Reset the file input, important for re-try upload the file when failed
        e.target.value = null
    }

    const uploadFile = (fileObj) => {
        const formData = new FormData()
        formData.append('file', fileObj.file)

        // Update status to uploading
        setFiles((prevFiles) =>
            prevFiles.map((f) =>
                f.file === fileObj.file ? { ...f, status: FileUploadStatus.UPLOADING, progress: 0 } : f
            )
        )

        // Use the centralized API module
        documentStoreAPI
            .uploadFileToStore(storeId, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'x-original-filename': encodeURIComponent(fileObj.file.name),
                    'x-mime-type': fileObj.file.type,
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / (progressEvent.total || 1)
                    )

                    setFiles((prevFiles) =>
                        prevFiles.map((f) =>
                            f.file === fileObj.file ? { ...f, progress: percentCompleted } : f
                        )
                    )
                },
            })
            .then((response) => {
                const fileResult = response.data

                if (fileResult && fileResult.fileUploadedStatus === FileUploadStatus.SUCCESS) {
                    const documentStoreFileId = fileResult.id

                    setFiles((prevFiles) => 
                        prevFiles.map((f) =>
                            f.file === fileObj.file
                                ? {
                                    ...f,
                                    status: FileUploadStatus.SUCCESS,
                                    progress: 100,
                                    id: documentStoreFileId,
                                    fileUploadResult: fileResult,
                                }
                                : f
                        )
                    )
                } else {
                    setFiles((prevFiles) =>
                        prevFiles.map((f) =>
                            f.file === fileObj.file
                                ? { 
                                    ...f, 
                                    status: FileUploadStatus.FAILED, 
                                    progress: 0,
                                    error: fileResult.error || 'Upload failed',
                                    fileUploadResult: fileResult
                                }
                                : f
                        )
                    )
                }
            })
            .catch((error) => {
                setFiles((prevFiles) =>
                    prevFiles.map((f) =>
                        f.file === fileObj.file
                            ? { 
                                ...f, 
                                status: FileUploadStatus.FAILED, 
                                progress: 0,
                                error: error.message
                            }
                            : f
                    )
                )
            })
    }

    // Remove a file from the list
    const removeFile = (fileObj) => {
        setFiles((prevFiles) => {
            const updatedFiles = prevFiles.filter((f) => f.file !== fileObj.file)
            return updatedFiles
        })
    }

    return (
        <FormControl sx={{ mt: 1, width: '100%' }} size='small'>
            {/* Display "Choose a file to upload" if no files are selected */}
            {files.length === 0 && (
                <Typography
                    variant='body2'
                    sx={{
                        fontStyle: 'italic',
                        color: theme.palette.grey['800'],
                        marginBottom: '1rem',
                    }}
                >
                    Choose a file to upload
                </Typography>
            )}
            
            <Button
                disabled={disabled}
                variant='outlined'
                component='label'
                fullWidth
                startIcon={<IconUpload />}
                sx={{ marginBottom: '1rem' }}
            >
                {'Upload File'}
                <input
                    type='file'
                    multiple
                    accept={fileType}
                    hidden
                    onChange={handleFilesUpload}
                />
            </Button>

            {/* Display the list of files and their statuses */}
            {files.map((fileObj, index) => (
                <Box
                    key={index}
                    sx={{
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Typography variant='body2'>
                        {fileObj.file.name} - {' '}
                        {fileObj.status === FileUploadStatus.UPLOADING
                            ? `${fileObj.progress}% uploaded`
                            : fileObj.status === FileUploadStatus.SUCCESS
                                ? 'Upload successful'
                                : fileObj.status === FileUploadStatus.FAILED
                                    ? `Upload failed with error: ${fileObj.error}`
                                    : 'Pending'}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {/* Retry button for failed uploads */}
                        {fileObj.status === FileUploadStatus.FAILED && (
                            <Button
                                onClick={() => uploadFile(fileObj)}
                                size='small'
                                variant='text'
                                sx={{ minWidth: 'auto', padding: '0 8px', mr: 1 }}
                            >
                                retry
                            </Button>
                        )}

                        {/* Remove button to remove the file from the list */}
                        {fileObj.status !== FileUploadStatus.UPLOADING && (
                            <Button
                                onClick={() => removeFile(fileObj)}
                                size='small'
                                variant='text'
                                sx={{ minWidth: 'auto', padding: '0 8px' }}
                            >
                                x
                            </Button>
                        )}
                    </Box>
                </Box>
            ))}

            
        </FormControl>
    )
}


FileInstantUploadComponent.propTypes = {
    existingFiles: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    fileType: PropTypes.string,
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
    storeId: PropTypes.string
}