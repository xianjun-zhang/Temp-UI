import React from 'react';
import { SignUp } from "@clerk/clerk-react";
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const SignUpPage = () => {
    const theme = useTheme();

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: theme.palette.background.default
            }}
        >
            <SignUp />
        </Box>
    );
};

export default SignUpPage;
