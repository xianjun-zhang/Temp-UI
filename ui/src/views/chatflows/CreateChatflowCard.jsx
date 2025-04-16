import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Card, CardContent, Typography, List, ListItem, ListItemIcon, ListItemText, IconButton, useTheme, Button, Stack } from '@mui/material'
import { IconPlus, IconTemplate, IconFileUpload, IconX } from '@tabler/icons-react'
import { navigationPaths } from '@/routes/path'
import { enqueueSnackbar as enqueueSnackbarAction, closeSnackbar as closeSnackbarAction } from '@/store/actions'
import TemplateSelectionDialog from './TemplateSelectionDialog'
import {getWorkflowDataFromJSON} from '@/utils/importHelper'

const CreateChatflowCard = ({ onFileUpload, isAgentCanvas = false }) => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const inputFile = useRef(null)
    const theme = useTheme()
    
    const [openTemplateDialog, setOpenTemplateDialog] = useState(false)
    
    const handleTemplateClick = () => {
        setOpenTemplateDialog(true)
    }
    
    const handleTemplateSelect = (template) => {
        // Close the dialog
        setOpenTemplateDialog(false)
        // const flowData = getWorkflowDataFromJSON(JSON.stringify(template), 'Chatflow')
        // Extract the flowData from the template
        let templateFlowData
        try {
            // If flowData is a string, parse it
            if (typeof template.flowData === 'string') {
                templateFlowData = JSON.parse(template.flowData)
            } else {
                templateFlowData = template.flowData
            }
            
            // Navigate with the flow data object
            const path = isAgentCanvas 
                ? navigationPaths.workspace.agentflows.new()
                : navigationPaths.workspace.chatflows.new()
            
            navigate(path, {
                state: {
                    templateFlowData: JSON.stringify(templateFlowData)
                }
            })
        } catch (error) {
            console.error('Error processing template data:', error)
        }
    }
    
    const menuItems = [
        {
            id: 'scratch',
            title: 'Create from Scratch',
            icon: IconPlus,
            onClick: () => navigate(isAgentCanvas ? navigationPaths.workspace.agentflows.new() : navigationPaths.workspace.chatflows.new())
        },
        {
            id: 'template',
            title: 'Create from Marketplace Template',
            icon: IconTemplate,
            onClick: handleTemplateClick
        },
        {
            id: 'import',
            title: isAgentCanvas ? 'Import Agentflow' : 'Import Chatflow',
            icon: IconFileUpload,
            onClick: () => inputFile.current.click()
        }
    ]
    
    const handleFileChange = (event) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0]
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const fileData = e.target.result
                    onFileUpload(fileData)
                } catch (error) {
                    console.error('Error reading file:', error)
                }
            }
            reader.readAsText(file)
            event.target.value = null
        }
    }
    
    return (
        <>
            <Card 
                sx={{ 
                    height: '160px',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px dashed #bdbdbd',
                    backgroundColor: 'transparent',
                    '&:hover': {
                        borderColor: 'primary.main',
                    }
                }}
            >
                <CardContent sx={{ 
                    pt: 2,
                    pb: 1.5,
                    px: 3.5,
                    height: '100%'
                }}>
                    <Typography 
                        variant="h5" 
                        sx={{ 
                            mb: 1,
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: 'primary.main'
                        }}
                    >
                        Create New Chatflow
                    </Typography>
                    <List sx={{ p: 0 }}>
                        {menuItems.map((item) => (
                            <ListItem 
                                key={item.id}
                                button 
                                onClick={item.onClick}
                                sx={{ 
                                    py: 0.5,
                                    px: 0,
                                    '&:hover': {
                                        '& .MuiListItemIcon-root svg': {
                                            stroke: 2
                                        },
                                        '& .MuiTypography-root': {
                                            fontWeight: 500
                                        }
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 24 }}>
                                    <item.icon stroke={1.5} size="0.875rem" />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={
                                        <Typography 
                                            variant="body2" 
                                            sx={{ 
                                                fontSize: '0.8125rem',
                                                transition: 'font-weight 0.3s'
                                            }}
                                        >
                                            {item.title}
                                        </Typography>
                                    } 
                                />
                            </ListItem>
                        ))}
                    </List>
                    <input
                        ref={inputFile}
                        type="file"
                        style={{ display: 'none' }}
                        accept=".json"
                        onChange={handleFileChange}
                    />
                </CardContent>
            </Card>
            
            <TemplateSelectionDialog 
                open={openTemplateDialog}
                onClose={() => setOpenTemplateDialog(false)}
                onSelectTemplate={handleTemplateSelect}
                isAgentCanvas={isAgentCanvas}
            />
        </>
    )
}

export default CreateChatflowCard
