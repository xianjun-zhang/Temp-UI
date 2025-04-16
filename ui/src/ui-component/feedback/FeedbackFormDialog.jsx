import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import {
    Dialog,
    DialogActions,
    Button,
    TextField,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Box,
    Typography,
    CircularProgress,
    Alert,
    Paper,
    InputAdornment,
    IconButton,
    Tooltip,
    Chip,
    LinearProgress
} from '@mui/material'
import { alpha, styled, useTheme } from '@mui/material/styles'
import productFeedbackApi from '@/api/product-feedback'
import { 
    IconX, 
    IconCopy, 
    IconCheck,
    IconLink,
    IconRefresh,
    IconUpload,
    IconFile,
    IconPhoto,
    IconVideo,
    IconTrash,
    IconPaperclip,
    IconFileUpload
} from '@tabler/icons-react'

// NextUI-inspired styled components
const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        borderRadius: '16px',
        backgroundColor: theme.palette.background.paper,
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.05)'
    }
}))

const DialogHeader = styled(Box)(({ theme }) => ({
    padding: '28px 28px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid',
    borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.05)'
}))

const DialogContent = styled(Box)(({ theme }) => ({
    padding: '24px',
    overflow: 'auto',
    maxHeight: 'calc(80vh - 132px)',
}))

const DialogFooter = styled(Box)(({ theme }) => ({
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '12px',
    borderTop: '1px solid',
    borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.05)'
}))

const StyledRadioGroup = styled(RadioGroup)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    '& .MuiFormControlLabel-root': {
        marginRight: theme.spacing(3)
    }
}))

const StyledButton = styled(Button)(({ theme }) => ({
    borderRadius: '10px',
    padding: '8px 22px',
    fontWeight: 600,
    textTransform: 'none',
    transition: 'all 0.2s ease-in-out',
    boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 4px 14px 0 rgba(0, 0, 0, 0.1)',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)'
    }
}))

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
        transition: 'all 0.2s ease',
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
            borderWidth: '1px'
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
            borderWidth: '2px'
        }
    }
}))

const UploadZone = styled(Box)(({ theme, isDragging }) => ({
    border: '2px dashed',
    borderColor: isDragging 
        ? theme.palette.primary.main 
        : theme.palette.mode === 'dark' 
            ? alpha(theme.palette.grey[300], 0.2) 
            : alpha(theme.palette.grey[400], 0.4),
    borderRadius: '12px',
    padding: theme.spacing(3),
    backgroundColor: isDragging
        ? alpha(theme.palette.primary.main, 0.05)
        : theme.palette.mode === 'dark'
            ? alpha(theme.palette.grey[900], 0.4)
            : alpha(theme.palette.grey[100], 0.6),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: theme.palette.mode === 'dark'
            ? alpha(theme.palette.grey[800], 0.6)
            : alpha(theme.palette.grey[200], 0.7),
        borderColor: theme.palette.mode === 'dark'
            ? alpha(theme.palette.grey[300], 0.3)
            : alpha(theme.palette.grey[500], 0.5),
    }
}))

const FileThumbnail = styled(Box)(({ theme }) => ({
    position: 'relative',
    borderRadius: '10px',
    overflow: 'hidden',
    marginTop: theme.spacing(2),
    border: '1px solid',
    borderColor: theme.palette.mode === 'dark' 
        ? alpha(theme.palette.grey[300], 0.2) 
        : alpha(theme.palette.grey[400], 0.3),
    backgroundColor: theme.palette.mode === 'dark'
        ? alpha(theme.palette.grey[900], 0.4)
        : alpha(theme.palette.grey[100], 0.7),
    boxShadow: theme.palette.mode === 'dark'
        ? 'none'
        : '0 2px 8px rgba(0, 0, 0, 0.05)',
}))

const FeedbackFormDialog = ({ open, onClose }) => {
    const [feedbackType, setFeedbackType] = useState('bug')
    const [feedbackText, setFeedbackText] = useState('')
    const [pageUrl, setPageUrl] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState(null)
    const [isCopied, setIsCopied] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState([])
    const [files, setFiles] = useState([])
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef(null)
    const theme = useTheme()

    // Get the current page URL when the dialog opens
    useEffect(() => {
        if (open) {
            setPageUrl(window.location.href)
        }
    }, [open])

    // Reset copy status after 2 seconds
    useEffect(() => {
        let timer
        if (isCopied) {
            timer = setTimeout(() => {
                setIsCopied(false)
            }, 2000)
        }
        return () => clearTimeout(timer)
    }, [isCopied])

    // Clean up object URLs when component unmounts or dialog closes
    useEffect(() => {
        return () => {
            files.forEach(file => {
                if (file.preview) {
                    URL.revokeObjectURL(file.preview);
                }
            });
        };
    }, [files]);

    const handleSubmit = async () => {
        if (!feedbackText.trim()) return

        setIsSubmitting(true)
        try {
            // Prepare the feedback data including file IDs from uploaded files
            const feedbackData = {
                type: feedbackType,
                content: feedbackText,
                pageUrl: pageUrl,
                attachmentIds: uploadedFiles.map(file => file.id)
            }
            
            // Submit feedback using the real API
            const response = await productFeedbackApi.createFeedback(feedbackData)
            
            if (response.data) {
                setSubmitStatus('success')
                // Reset form after successful submission
                setTimeout(() => {
                    setFeedbackText('')
                    setFeedbackType('suggestion')
                    setFiles([])
                    setUploadedFiles([])
                    setSubmitStatus(null)
                    onClose()
                }, 2000)
            }
        } catch (error) {
            console.error('Error submitting feedback:', error)
            setSubmitStatus('error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(pageUrl)
            .then(() => {
                setIsCopied(true)
            })
            .catch(err => {
                console.error('Could not copy text: ', err)
            })
    }

    const resetToCurrentUrl = () => {
        setPageUrl(window.location.href)
    }
    
    const handleFileChange = (e) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;
        
        // Process each file directly, without storing the File object in state
        Array.from(selectedFiles).forEach(file => {
            // Generate a unique ID for this file
            const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            
            // Add the file to UI state WITHOUT the actual File object
            const newFileEntry = {
                id: fileId,
                // DO NOT include file: file here
                name: file.name,
                size: file.size,
                type: file.type,
                preview: URL.createObjectURL(file),
                status: 'uploading', // Start as uploading immediately
                progress: 0,
                error: null
            };
            
            // First update the UI to show the file
            setFiles(prev => [...prev, newFileEntry]);
            
            // Then handle the upload separately
            const formData = new FormData();
            formData.append('file', file); // Use the direct file reference
            
            // Upload using the API
            productFeedbackApi.uploadAttachmentFile(formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'x-mime-type': file.type,
                    'x-original-filename': encodeURIComponent(file.name)
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / (progressEvent.total || 1)
                    );
                    
                    setFiles(prev => 
                        prev.map(f => 
                            f.id === fileId ? { ...f, progress: percentCompleted } : f
                        )
                    );
                }
            })
            .then(response => {
                const fileResult = response.data;
                
                // Update file status to success in UI
                setFiles(prev => 
                    prev.map(f => 
                        f.id === fileId ? { 
                            ...f, 
                            status: 'success', 
                            progress: 100, 
                            serverId: fileResult.id 
                        } : f
                    )
                );
                
                // Add to uploaded files array for form submission
                setUploadedFiles(prev => [...prev, {
                    id: fileResult.id,
                    name: file.name,
                    size: file.size,
                    type: file.type
                }]);
            })
            .catch(error => {
                console.error('Error uploading file:', error);
                
                // Update file status to failed in UI
                setFiles(prev => 
                    prev.map(f => 
                        f.id === fileId ? { 
                            ...f, 
                            status: 'error', 
                            error: error.message || 'Upload failed' 
                        } : f
                    )
                );
            });
        });
        
        // Reset the file input
        e.target.value = null;
    };
    
    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        
        try {
            if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
                const droppedFiles = Array.from(e.dataTransfer.files)
                handleFileChange({ target: { files: droppedFiles } })
            }
        } catch (error) {
            console.error('Error handling dropped files:', error)
            setSubmitStatus('error')
            setTimeout(() => setSubmitStatus(null), 3000)
        }
    }
    
    const removeFile = (id) => {
        // Find the file to revoke the object URL before removing
        const fileToRemove = files.find(file => file.id === id)
        
        if (fileToRemove) {
            // Revoke the object URL if it exists
            if (fileToRemove.preview) {
                URL.revokeObjectURL(fileToRemove.preview)
            }
            
            // If the file was successfully uploaded, remove it from the uploadedFiles array
            if (fileToRemove.serverId) {
                setUploadedFiles(prev => prev.filter(file => file.id !== fileToRemove.serverId))
            }
            
            // Remove the file from the UI
            setFiles(prev => prev.filter(file => file.id !== id))
        }
    }
    
    const retryUpload = (fileObj) => {
        if (!fileObj || fileObj.status !== 'error') return;
        
        // Update file status to uploading
        setFiles(prev => 
            prev.map(f => 
                f.id === fileObj.id ? { 
                    ...f, 
                    status: 'uploading',
                    progress: 0,
                    error: null 
                } : f
            )
        );
        
        // Get the file from the preview URL
        fetch(fileObj.preview)
            .then(res => res.blob())
            .then(blob => {
                // Create a file object and trigger the existing handleFileChange function
                const file = new File([blob], fileObj.name, { type: fileObj.type });
                
                // Remove the current file from the UI to avoid duplicates
                removeFile(fileObj.id);
                
                // Use the existing file upload handler with the recreated file
                handleFileChange({ 
                    target: { 
                        files: [file] 
                    } 
                });
            })
            .catch(error => {
                console.error('Error retrying file upload:', error);
                
                // Update file status back to error if fetching the file fails
                setFiles(prev => 
                    prev.map(f => 
                        f.id === fileObj.id ? { 
                            ...f, 
                            status: 'error',
                            error: 'Failed to prepare file for retry' 
                        } : f
                    )
                );
            });
    }
    
    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }
    
    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const renderFeedbackTypeButtons = () => {
        const options = [
            { value: 'bug', label: '🐞 Bug Report' },
            { value: 'suggestion', label: '💡 Suggestion' },
            { value: 'feature', label: '✨ Feature Request' },
            { value: 'other', label: '💬 Other' }
        ]

        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {options.map((option) => (
                    <Box 
                        key={option.value}
                        onClick={() => setFeedbackType(option.value)}
                        sx={{
                            px: 2, 
                            py: 1, 
                            borderRadius: '8px',
                            border: '1px solid',
                            borderColor: feedbackType === option.value 
                                ? theme.palette.primary.main 
                                : alpha(theme.palette.divider, 0.5),
                            bgcolor: feedbackType === option.value 
                                ? alpha(theme.palette.primary.main, 0.1)
                                : 'transparent',
                            color: feedbackType === option.value 
                                ? theme.palette.primary.main 
                                : theme.palette.text.primary,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                                bgcolor: feedbackType === option.value 
                                    ? alpha(theme.palette.primary.main, 0.15)
                                    : alpha(theme.palette.action.hover, 0.1)
                            }
                        }}
                    >
                        <Typography variant="body2" fontWeight={500}>
                            {option.label}
                        </Typography>
                    </Box>
                ))}
            </Box>
        )
    }
    
    const renderFilePreview = (fileObj) => {
        const isComplete = fileObj.status === 'success'
        const isError = fileObj.status === 'error'
        const isUploading = fileObj.status === 'uploading'
        
        return (
            <FileThumbnail key={fileObj.id} sx={{ mb: 2 }}>
                <Box sx={{ position: 'relative' }}>
                    {/* File preview - image or video */}
                    {fileObj.type.startsWith('image/') && fileObj.preview ? (
                        <Box 
                            component="img" 
                            src={fileObj.preview} 
                            alt={fileObj.name}
                            sx={{ 
                                width: '100%', 
                                maxHeight: '150px',
                                objectFit: 'cover'
                            }}
                        />
                    ) : fileObj.type.startsWith('video/') ? (
                        <Box
                            sx={{
                                height: '100px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: theme.palette.mode === 'dark' ? '#2a3441' : '#e6f0f7'
                            }}
                        >
                            <IconVideo size={36} color={theme.palette.primary.main} />
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                height: '100px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: theme.palette.mode === 'dark' ? '#2a3441' : '#e6f0f7'
                            }}
                        >
                            <IconFile size={36} color={theme.palette.grey[500]} />
                        </Box>
                    )}
                    
                    {/* File details and actions */}
                    <Box 
                        sx={{ 
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: '200px' }}>
                                {fileObj.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {isUploading ? `${fileObj.progress}% uploaded` : 
                                 isComplete ? 'Upload complete' : 
                                 isError ? 'Upload failed' : 
                                 'Ready to upload'}
                            </Typography>
                        </Box>
                        <Box>
                            {isError && (
                                <Button
                                    variant="text"
                                    size="small"
                                    onClick={() => retryUpload(fileObj)}
                                    sx={{ mr: 1 }}
                                >
                                    Retry
                                </Button>
                            )}
                            {!isUploading && (
                                <IconButton 
                                    size="small" 
                                    onClick={() => removeFile(fileObj.id)}
                                    sx={{ color: theme.palette.error.main }}
                                >
                                    <IconTrash size={18} />
                                </IconButton>
                            )}
                        </Box>
                    </Box>
                    
                    {/* Upload progress bar */}
                    {isUploading && (
                        <LinearProgress 
                            variant="determinate" 
                            value={fileObj.progress} 
                            sx={{ 
                                height: 4,
                                borderRadius: 0,
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0
                            }}
                        />
                    )}
                </Box>
            </FileThumbnail>
        )
    }

    // Add a function to check if the form has valid input to submit
    const isFormValid = () => {
        // Allow submission if any of these conditions are met:
        // 1. User has entered feedback text
        // 2. User has uploaded files
        return feedbackType || pageUrl || feedbackText.trim() !== '' || uploadedFiles.length > 0 
    }

    return (
        <StyledDialog 
            open={open} 
            onClose={!isSubmitting ? onClose : undefined}
            fullWidth
            maxWidth="sm"
        >
            <DialogHeader>
                <Typography 
                    variant="h4"
                    fontWeight={700}
                    color="textPrimary"
                    sx={{ 
                        fontSize: '1.75rem',
                        letterSpacing: '-0.01em'
                    }}
                >
                    Share Your Feedback
                </Typography>
                {!isSubmitting && (
                    <IconX 
                        size={22}
                        cursor="pointer" 
                        onClick={onClose} 
                        style={{ 
                            opacity: 0.6,
                            '&:hover': { opacity: 1 }
                        }}
                    />
                )}
            </DialogHeader>

            <DialogContent>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="body1" color="textPrimary" paragraph>
                        Thank you for participating in our alpha testing! Your feedback is invaluable and helps us improve the product.
                    </Typography>
                </Box>
                
                <Box sx={{ mb: 5 }}>
                    <Typography variant="subtitle1" fontWeight={600} color="textPrimary" mb={1.5}>
                        What type of feedback do you have?
                    </Typography>
                    {renderFeedbackTypeButtons()}
                </Box>

                {/* Page URL field */}
                <Box sx={{ mb: 5 }}>
                    <Typography variant="subtitle1" fontWeight={600} color="textPrimary" mb={1.5}>
                        Which page are you providing feedback for?
                    </Typography>
                    <StyledTextField
                        fullWidth
                        placeholder="Page URL"
                        value={pageUrl}
                        onChange={(e) => setPageUrl(e.target.value)}
                        disabled={isSubmitting}
                        variant="outlined"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <IconLink size={20} color={theme.palette.text.secondary} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Box sx={{ display: 'flex' }}>
                                        <Tooltip title="Reset to current page">
                                            <IconButton
                                                edge="end"
                                                onClick={resetToCurrentUrl}
                                                disabled={isSubmitting}
                                                sx={{ mr: 0.5 }}
                                            >
                                                <IconRefresh size={18} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={isCopied ? "Copied!" : "Copy URL"}>
                                            <IconButton
                                                edge="end"
                                                onClick={copyToClipboard}
                                                disabled={isSubmitting}
                                            >
                                                {isCopied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </InputAdornment>
                            )
                        }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        The current page URL is automatically captured. You can modify if needed.
                    </Typography>
                </Box>
                
                <Box sx={{ mb: 5 }}>
                    <Typography variant="subtitle1" fontWeight={600} color="textPrimary" mb={1.5}>
                        Tell us more
                    </Typography>
                    <StyledTextField
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Please share your thoughts, ideas, or report issues you've encountered..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        disabled={isSubmitting}
                        variant="outlined"
                    />
                </Box>
                
                {/* File upload section */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" fontWeight={600} color="textPrimary" mb={1.5}>
                        Add screenshots or videos (optional)
                    </Typography>
                    
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*, video/*"
                        multiple
                        onChange={handleFileChange}
                        disabled={isSubmitting}
                    />
                    
                    <UploadZone
                        isDragging={isDragging}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <IconFileUpload 
                            size={36} 
                            color={theme.palette.mode === 'dark' ? theme.palette.grey[400] : theme.palette.grey[600]} 
                        />
                        <Typography variant="body1" align="center" mt={2} fontWeight={500}>
                            Drag & drop files or click to upload
                        </Typography>
                        <Typography variant="caption" color="textSecondary" align="center" mt={1}>
                            Supports images and videos up to 10MB
                        </Typography>
                    </UploadZone>
                    
                    {/* File list/preview */}
                    {files.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            {files.map(renderFilePreview)}
                        </Box>
                    )}
                </Box>
                
                {submitStatus === 'success' && (
                    <Alert 
                        severity="success" 
                        sx={{ 
                            mt: 2, 
                            borderRadius: '10px',
                            '& .MuiAlert-icon': { alignItems: 'center' }
                        }}
                    >
                        Thank you for your feedback! We appreciate your help in improving our product.
                    </Alert>
                )}
                
                {submitStatus === 'error' && (
                    <Alert 
                        severity="error" 
                        sx={{ 
                            mt: 2, 
                            borderRadius: '10px',
                            '& .MuiAlert-icon': { alignItems: 'center' }
                        }}
                    >
                        There was an error submitting your feedback. Please try again.
                    </Alert>
                )}
            </DialogContent>

            <DialogFooter>
                <Button 
                    onClick={onClose} 
                    disabled={isSubmitting}
                    sx={{ 
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 500
                    }}
                >
                    Cancel
                </Button>
                <StyledButton 
                    variant="contained" 
                    onClick={handleSubmit}
                    disabled={isSubmitting || !isFormValid()}
                    sx={{ 
                        minWidth: '120px'
                    }}
                >
                    {isSubmitting ? (
                        <CircularProgress size={24} color="inherit" />
                    ) : (
                        'Submit Feedback'
                    )}
                </StyledButton>
            </DialogFooter>
        </StyledDialog>
    )
}

FeedbackFormDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
}

export default FeedbackFormDialog
