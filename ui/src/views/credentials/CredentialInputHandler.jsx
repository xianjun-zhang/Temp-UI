import PropTypes from 'prop-types'
import { useRef, useState } from 'react'
import { useSelector } from 'react-redux'

// material-ui
import { Box, Typography, IconButton } from '@mui/material'
import { IconArrowsMaximize, IconAlertTriangle } from '@tabler/icons-react'

// project import
import { Dropdown } from '@/ui-component/dropdown/Dropdown'
import { Input } from '@/ui-component/input/Input'
import { SwitchInput } from '@/ui-component/switch/Switch'
import { JsonEditorInput } from '@/ui-component/json/JsonEditor'
import { TooltipWithParser } from '@/ui-component/tooltip/TooltipWithParser'
import GoogleOAuthComponent from './GoogleOAuthComponent'
import { GoogleOAuthProvider } from '@react-oauth/google'

// ===========================|| NodeInputHandler ||=========================== //

const CredentialInputHandler = ({ inputParam, data, disabled = false, credentialId }) => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
    const customization = useSelector((state) => state.customization)
    const ref = useRef(null)

    const [showExpandDialog, setShowExpandDialog] = useState(false)
    const [expandDialogProps, setExpandDialogProps] = useState({})

    // Add key prop to force re-creation of component
    const componentKey = `${inputParam.name}-${!!data[inputParam.name]}-${credentialId || 'new'}`;

    const onExpandDialogClicked = (value, inputParam) => {
        const dialogProp = {
            value,
            inputParam,
            disabled,
            confirmButtonName: 'Save',
            cancelButtonName: 'Cancel'
        }
        setExpandDialogProps(dialogProp)
        setShowExpandDialog(true)
    }

    const onExpandDialogSave = (newValue, inputParamName) => {
        setShowExpandDialog(false)
        data[inputParamName] = newValue
    }

    const handleGoogleOAuthChange = (newValue, paramName) => {
        // If newValue is null, reset the data
        if (newValue === null) {
            data[paramName] = null;
            return;
        }
        
        // Check if we received successful auth data or an error
        if (newValue.status === 'success') {
            // Store the auth code and status in the data object
            data[paramName] = newValue;
        } else if (newValue.status === 'failed') {
            // Handle error case - you could store the error or just leave data unchanged
            console.error('Google OAuth failed:', newValue.error);
            // Optionally clear the data
            data[paramName] = null;
        }
    }

    return (
        <div ref={ref}>
            {inputParam && (
                <>
                    <Box sx={{ p: 2 }}>
                        <div style={{ display: 'flex', flexDirection: 'row' }}>
                            <Typography>
                                {inputParam.label}
                                {!inputParam.optional && <span style={{ color: 'red' }}>&nbsp;*</span>}
                                {inputParam.description && <TooltipWithParser style={{ marginLeft: 10 }} title={inputParam.description} />}
                            </Typography>
                            <div style={{ flexGrow: 1 }}></div>
                            {inputParam.type === 'string' && inputParam.rows && (
                                <IconButton
                                    size='small'
                                    sx={{
                                        height: 25,
                                        width: 25
                                    }}
                                    title='Expand'
                                    color='primary'
                                    onClick={() => onExpandDialogClicked(data[inputParam.name] ?? inputParam.default ?? '', inputParam)}
                                >
                                    <IconArrowsMaximize />
                                </IconButton>
                            )}
                        </div>
                        {inputParam.warning && (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    borderRadius: 10,
                                    background: 'rgb(254,252,191)',
                                    padding: 10,
                                    marginTop: 10,
                                    marginBottom: 10
                                }}
                            >
                                <IconAlertTriangle size={36} color='orange' />
                                <span style={{ color: 'rgb(116,66,16)', marginLeft: 10 }}>{inputParam.warning}</span>
                            </div>
                        )}

                        {inputParam.type === 'boolean' && (
                            <SwitchInput
                                disabled={disabled}
                                onChange={(newValue) => (data[inputParam.name] = newValue)}
                                value={data[inputParam.name] ?? inputParam.default ?? false}
                            />
                        )}
                        {(inputParam.type === 'string' || inputParam.type === 'password' || inputParam.type === 'number') && (
                            <>
                            <Input
                                key={data[inputParam.name]}
                                disabled={disabled}
                                inputParam={inputParam}
                                onChange={(newValue) => (data[inputParam.name] = newValue)}
                                value={data[inputParam.name] ?? inputParam.default ?? ''}
                                showDialog={showExpandDialog}
                                dialogProps={expandDialogProps}
                                onDialogCancel={() => setShowExpandDialog(false)}
                                onDialogConfirm={(newValue, inputParamName) => onExpandDialogSave(newValue, inputParamName)}
                            />
                            </>
                        )}
                        {inputParam.type === 'json' && (
                            <JsonEditorInput
                                disabled={disabled}
                                onChange={(newValue) => (data[inputParam.name] = newValue)}
                                value={data[inputParam.name] ?? inputParam.default ?? ''}
                                isDarkMode={customization.isDarkMode}
                            />
                        )}
                        {inputParam.type === 'options' && (
                            <Dropdown
                                disabled={disabled}
                                name={inputParam.name}
                                options={inputParam.options}
                                onSelect={(newValue) => (data[inputParam.name] = newValue)}
                                value={data[inputParam.name] ?? inputParam.default ?? 'choose an option'}
                            />
                        )}

                        {/* Google OAuth - add key prop to force re-render */}
                        {inputParam.type === 'google-oauth' && googleClientId && (
                            <GoogleOAuthProvider key={componentKey} clientId={googleClientId}>
                                <GoogleOAuthComponent 
                                    key={componentKey}  
                                    googleOAuthData={data[inputParam.name]} 
                                    onChange={(newValue) => {
                                        handleGoogleOAuthChange(newValue, inputParam.name);
                                    }}
                                    credentialId={credentialId}
                                />
                            </GoogleOAuthProvider>
                        )}

                    </Box>
                </>
            )}
        </div>
    )
}

CredentialInputHandler.propTypes = {
    inputParam: PropTypes.object,
    data: PropTypes.object,
    disabled: PropTypes.bool,
    credentialId: PropTypes.string
}

export default CredentialInputHandler
