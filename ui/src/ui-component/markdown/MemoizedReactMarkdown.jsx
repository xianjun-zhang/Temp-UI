import { memo } from 'react'
import PropTypes from 'prop-types'
import ReactMarkdown from 'react-markdown'
import { styled } from '@mui/material/styles'
import { useSelector } from 'react-redux'
import './Markdown.css'

// Styled component for message box
const MessageBox = styled('div')(({ theme, isDarkMode = true }) => ({
    padding: '12px 16px',
    borderRadius: theme.shape.borderRadius,
    background: isDarkMode ? '#1e1e1e' : '#f5f5f5',
    border: `1px solid ${isDarkMode ? '#333' : '#ddd'}`,
    marginBottom: '12px',
    '& code': {
        fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
        backgroundColor: isDarkMode ? '#2d2d2d' : '#eaeaea',
        padding: '2px 4px',
        borderRadius: '3px',
        fontSize: '0.85em'
    },
    '& pre': {
        margin: '8px 0'
    }
}))

export const MemoizedReactMarkdown = memo(
    ({ children, withBox = false, ...props }) => {
        const customization = useSelector((state) => state.customization)
        const isDarkMode = customization?.isDarkMode ?? true

        const content = (
            <div className='react-markdown'>
                <ReactMarkdown {...props}>{children}</ReactMarkdown>
            </div>
        )

        return withBox ? (
            <MessageBox isDarkMode={isDarkMode}>
                {content}
            </MessageBox>
        ) : content
    },
    (prevProps, nextProps) => 
        prevProps.children === nextProps.children && 
        prevProps.withBox === nextProps.withBox
)

MemoizedReactMarkdown.displayName = 'MemoizedReactMarkdown'

MemoizedReactMarkdown.propTypes = {
    children: PropTypes.any,
    withBox: PropTypes.bool
}
