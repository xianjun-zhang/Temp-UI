import React from 'react';
import { SignIn } from "@clerk/clerk-react";
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const SignInPage = () => {
    const theme = useTheme();

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: theme.palette.background.default,
            }}
        >
            <SignIn />
        </Box>
    );
};

export default SignInPage;
