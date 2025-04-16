import React from 'react';
import { UserProfile, UserButton } from '@clerk/clerk-react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const UserProfilePage = () => {
    const theme = useTheme();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                minHeight: '100vh',
                backgroundColor: theme.palette.background.default,
                padding: '20px',
            }}
        >
            <Box sx={{ alignSelf: 'flex-end', marginBottom: '20px' }}>
                <UserButton />
            </Box>
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <UserProfile />
            </Box>
        </Box>
    );
};

export default UserProfilePage;