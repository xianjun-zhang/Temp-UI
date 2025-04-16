import { useEffect, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'

/**
 * A custom implementation of FullPageChat that uses bitflow-embed directly from CDN
 * @param {Object} props - Component props
 * @param {string} props.chatflowid - The ID of the chatflow
 * @param {string} props.apiHost - The base URL of the API
 * @param {Object} props.chatflowConfig - Configuration for the chatflow
 * @param {Object} props.theme - Theme customization for the chat
 * @param {Function} props.onError - Error handler function
 * @param {Object} props.style - Optional CSS styles
 * @param {string} props.className - Optional CSS class name
 */
const CustomFullPageChat = ({ 
    chatflowid, 
    apiHost, 
    chatflowConfig, 
    theme, 
    onError,
    style,
    className
}) => {
    const containerRef = useRef(null)
    const scriptId = 'bitflow-embed-script'
    const cdnUrl = 'https://cdn.jsdelivr.net/gh/xianjun-zhang/ChatEmbed@latest/dist/web.js'
    
    // Extracted error handler to make it reusable
    const handleError = useCallback((error, message) => {
        console.error(message, error)
        if (onError) onError(error)
    }, [onError])
    
    // Function to initialize the chatbot
    const initializeChatbot = useCallback(() => {
        if (!window.Chatbot || !containerRef.current) {
            handleError(
                new Error('Chatbot object not found after loading script'),
                'Chatbot object not found after loading script'
            )
            return
        }
        
        try {
            // Clear container and create the custom element
            containerRef.current.innerHTML = ''
            const fullChatbotElement = document.createElement('n-fullchatbot')
            containerRef.current.appendChild(fullChatbotElement)
            
            // Apply style and class if provided
            if (style) Object.assign(fullChatbotElement.style, style)
            if (className) fullChatbotElement.className = className
            
            // Initialize the chatbot with provided config
            window.Chatbot.initFull({
                chatflowid,
                apiHost,
                theme,
                ...chatflowConfig,
                streaming: false // Ensure consistent behavior by disabling streaming
            })

        } catch (error) {
            handleError(error, 'Error initializing chatbot:')
        }
    }, [chatflowid, apiHost, chatflowConfig, theme, style, className, handleError])

    useEffect(() => {
        // Remove any existing script to prevent duplication
        const existingScript = document.getElementById(scriptId)
        if (existingScript) existingScript.remove()

        // Create and configure script element
        const script = document.createElement('script')
        script.id = scriptId
        script.type = 'module'
        script.src = cdnUrl
        
        // Handle script loading success
        script.onload = () => {
            // Use setTimeout to ensure the custom element is registered
            setTimeout(initializeChatbot, 300)
        }
        
        // Handle script loading failure
        script.onerror = (error) => {
            handleError('Error loading bitflow-embed script from CDN:', error)
        }

        // Add script to document
        document.head.appendChild(script)
        
        // Cleanup function
        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script)
            }
            if (containerRef.current) {
                containerRef.current.innerHTML = ''
            }
        }
    }, [chatflowid, apiHost, chatflowConfig, theme, handleError, initializeChatbot])

    return (
        <div 
            ref={containerRef} 
            data-testid="bitflow-chat-container"
            style={{ 
                width: '100%', 
                height: '100%', 
                minHeight: '500px',
                ...style 
            }} 
            className={className}
        />
    )
}

// Add PropTypes for better documentation and validation
CustomFullPageChat.propTypes = {
    chatflowid: PropTypes.string.isRequired,
    apiHost: PropTypes.string.isRequired,
    chatflowConfig: PropTypes.object,
    theme: PropTypes.object,
    onError: PropTypes.func,
    style: PropTypes.object,
    className: PropTypes.string
}

// Default props for optional parameters
CustomFullPageChat.defaultProps = {
    chatflowConfig: {},
    theme: {},
    style: {},
    onError: null
}

export default CustomFullPageChat
