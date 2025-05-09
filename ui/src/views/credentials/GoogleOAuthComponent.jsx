import PropTypes from 'prop-types'
import { Box, Typography, Avatar, Chip, Button, CircularProgress, Paper, Snackbar, Alert, AlertTitle } from '@mui/material'
import { IconKey, IconLock, IconMail } from '@tabler/icons-react'
import { useGoogleLogin } from '@react-oauth/google'
import { useState, useEffect } from 'react'
import credentialsApi from '@/api/credentials'
import EmailDisplay from './EmailDisplay'

const GMAIL_SCOPES_AND_DESCRIPTIONS = {
    // Gmail operations
    'https://www.googleapis.com/auth/gmail.modify': 'Read & Edit Emails',
    'https://www.googleapis.com/auth/gmail.labels': 'Manage Email Labels',
    'https://www.googleapis.com/auth/gmail.compose': 'Create Email Drafts',
    'https://www.googleapis.com/auth/gmail.send': 'Send Emails',

    // User identification (includes email and basic profile)
    'openid': 'Basic Profile'
};

const GoogleOAuthComponent = ({ googleOAuthData, onChange, credentialId }) => {
    const [authData, setAuthData] = useState(null)
    const [emailData, setEmailData] = useState(null)
    const [emailLoading, setEmailLoading] = useState(false)
    const [emailError, setEmailError] = useState(null)
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
    
    // Initialize authData from props
    useEffect(() => {
        if (googleOAuthData) {
            let newAuthData = null;
            if (googleOAuthData.profile) {
                newAuthData = {...googleOAuthData, id: credentialId};
            } else if (googleOAuthData.authCode) {
                newAuthData = {...googleOAuthData};
            }
            setAuthData(newAuthData);
        }
    }, [googleOAuthData, credentialId])

    // Handle Google OAuth success
    const handleGoogleOauthSuccess = async (codeResponse) => {
        try {
            // Create an object with the auth code and status
            const authDataObject = {
                authCode: codeResponse.code,
                status: 'success'
            }
            
            // Update local state
            setAuthData(authDataObject)
            
            // Pass the auth data to parent component
            if (onChange) {
                onChange(authDataObject)
            }
            
            // Replace alert with notification
            setNotification({
                open: true,
                message: 'Gmail authentication successful! Click Save to complete the connection.',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error processing Google response:', error)
            setNotification({
                open: true,
                message: 'Failed to process Google response: ' + error.message,
                severity: 'error'
            });
        }
    }

    // Handle Google OAuth error
    const handleGoogleOauthError = (error) => {
        console.error('Login failed', error)
        
        // Create an error object
        const errorData = {
            error: error,
            status: 'failed'
        }
        
        // Update parent component
        if (onChange) {
            onChange(errorData)
        }
    }

    // Google OAuth login
    const googleOauthLogin = useGoogleLogin({
        scope: Object.keys(GMAIL_SCOPES_AND_DESCRIPTIONS).join(' '),
        flow: 'auth-code',          // Get an authorization code instead of token
        access_type: 'offline',     // Get a refresh token
        prompt: 'consent',          // Always show consent screen (to get refresh token)
        include_granted_scopes: true,
        onSuccess: handleGoogleOauthSuccess,
        onError: handleGoogleOauthError
    })

    const handleRevoke = () => {
        if (authData?.profile?.email) {
            setNotification({
                open: true,
                message: 'Revoked authorization for ' + authData.profile.email,
                severity: 'info'
            });
        }
        
        setAuthData(null)
        
        // Call onChange to update parent component
        if (onChange) {
            onChange(null)
        }
    }
    
    // Add this new handler
    const handleTestEmail = async () => {
        // Get the credential ID from either the authData or from the parent dialog
        const credentialId = authData?.id || credentialId
        
        if (!credentialId) {
            setEmailError("This credential hasn't been saved yet. Please save first to test Gmail connection.");
            return;
        }
        
        setEmailLoading(true);
        setEmailError(null);
        
        try {
            const response = await credentialsApi.getLatestGmail(credentialId);
            setEmailData(response.data);
        } catch (error) {
            console.error("Failed to fetch email:", error);
            setEmailError(error.response?.data?.message || "Failed to fetch email");
        } finally {
            setEmailLoading(false);
        }
    };
    
    // Add a handler to close notifications
    const handleCloseNotification = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setNotification(prev => ({ ...prev, open: false }));
    };
    
    // Extract common UI elements into reusable components/functions
    
    // 1. Common header with avatar, email and buttons
    const renderAuthHeader = (profileInfo, showTestButton = false) => (
        <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider'
        }}>
            <Avatar 
                sx={{ 
                    width: 40, 
                    height: 40,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }} 
                src={profileInfo?.picture}
            >
                <IconKey size={24} />
            </Avatar>
            <Typography 
                variant="body1" 
                fontWeight="500"
                sx={{ 
                    maxWidth: 180,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}
                title={profileInfo?.email}
            >
                {profileInfo?.email || 'Google authentication successful'}
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            
            {/* Conditionally show test button only when we have a profile */}
            {showTestButton && (
                <Button 
                    variant="outlined" 
                    color="primary"
                    size="small" 
                    startIcon={emailLoading ? <CircularProgress size={14} color="inherit" /> : <IconMail size={14} />}
                    onClick={handleTestEmail}
                    disabled={emailLoading}
                    title="Fetch latest email to test the connection"
                    sx={{
                        borderRadius: 1.5,
                        textTransform: 'none',
                        minWidth: '80px',
                        mr: 1
                    }}
                >
                    {emailLoading ? "..." : "Test"}
                </Button>
            )}
            
            {/* Always show reauthenticate */}
            <Button 
                variant="outlined" 
                color="error"
                size="small"
                onClick={() => googleOauthLogin()}
                sx={{
                    borderRadius: 1.5,
                    textTransform: 'none',
                    minWidth: '120px',
                    mr: 1
                }}
            >
                Reauthenticate
            </Button>
            
            {/* Cancel/Revoke button only when we're not showing a profile yet */}
            {!showTestButton && (
                <Button 
                    variant="outlined" 
                    color="error" 
                    size="small"
                    onClick={handleRevoke}
                    sx={{
                        borderRadius: 1.5,
                        textTransform: 'none',
                        minWidth: '80px'
                    }}
                >
                    Cancel
                </Button>
            )}
            
            {/* Keeping the commented revoke button for future use */}
            {/* <Button variant="outlined" color="error" size="small" onClick={handleRevoke}... /> */}
        </Box>
    );
    
    // 2. Common wrapper component
    const AuthWrapper = ({ children }) => (
        <Box sx={{ 
            mt: 2, 
            bgcolor: 'background.paper', 
            borderRadius: 2,
            p: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
            {children}
            
            {/* Notification component - always available */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleCloseNotification} 
                    severity={notification.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
    
    // Now use the shared components with conditional rendering for unique sections
    
    // Case 1: We have full profile info
    if (authData && authData.profile) {
        const googleProfile = authData.profile;
        const googleScopes = typeof authData.scope === 'string' 
                ? authData.scope.split(' ').filter(scope => scope.length > 0)
                : Array.isArray(authData.scope) ? authData.scope : [];
        
        return (
            <AuthWrapper>
                {renderAuthHeader(googleProfile, true)}
                
                {/* Scopes section - only for profile view */}
                {googleScopes && googleScopes.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            Permissions Granted:
                        </Typography>
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: 1
                        }}>
                            {googleScopes
                                .filter(scope => GMAIL_SCOPES_AND_DESCRIPTIONS[scope])
                                .map((scope, index) => (
                                    <Chip 
                                        key={index}
                                        icon={<IconLock size={14} />}
                                        label={GMAIL_SCOPES_AND_DESCRIPTIONS[scope]}
                                        size="small"
                                        variant="outlined"
                                        sx={{ 
                                            borderRadius: 1.5,
                                            '& .MuiChip-label': {
                                                px: 1.5,
                                                py: 0.5
                                            },
                                            '& .MuiChip-icon': {
                                                ml: 1
                                            }
                                        }}
                                    />
                                ))
                            }
                        </Box>
                    </Box>
                )}
                
                {/* Email test results section - only for profile view */}
                {(emailData || emailError) && (
                    <Box sx={{ 
                        mt: 3, 
                        pt: 2,
                        pb: 1, 
                        borderTop: '2px solid',
                        borderColor: 'primary.main',
                        backgroundColor: 'background.default',
                        borderRadius: '0 0 8px 8px'
                    }}>
                        <Typography 
                            variant="subtitle1" 
                            sx={{ 
                                mb: 2, 
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                color: 'primary.main',
                                fontSize: '1.1rem'
                            }}
                        >
                            <IconMail size={22} style={{ marginRight: 10 }} />
                            Gmail Connection Test Results
                        </Typography>
                        
                        {emailError && (
                            <Typography 
                                color="error" 
                                variant="body1" 
                                sx={{ mb: 2, p: 1, bgcolor: 'error.light', borderRadius: 1 }}
                            >
                                {emailError}
                            </Typography>
                        )}
                        
                        {emailData && <EmailDisplay emailData={emailData} />}
                    </Box>
                )}
            </AuthWrapper>
        );
    }
    
    // Case 2: We have auth code but no profile yet
    if (authData && authData.authCode) {
        return (
            <AuthWrapper>
                {renderAuthHeader()}
                
                {/* Simplified Alert component */}
                <Alert 
                    severity="error"
                    // variant="filled"
                    sx={{ mt: 2 }}
                >
                    <AlertTitle>Action Required</AlertTitle>
                    Google authentication successful, but it's not complete yet!
                    <br />
                    <strong>Click "Save" to complete the authentication process.</strong>
                </Alert>
            </AuthWrapper>
        );
    }
    
    // Case 3: No auth data, just show login button
    return (
        <AuthWrapper>
            <Box sx={{ 
                display: 'flex',
                justifyContent: 'center'
            }}>
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => googleOauthLogin()}
                    sx={{
                        borderRadius: 1.5,
                        textTransform: 'none',
                        py: 1,
                        px: 3
                    }}
                >
                    Link Gmail Account
                </Button>
            </Box>
        </AuthWrapper>
    );
};

GoogleOAuthComponent.propTypes = {
    googleOAuthData: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    onChange: PropTypes.func,
    credentialId: PropTypes.string
}

export default GoogleOAuthComponent 