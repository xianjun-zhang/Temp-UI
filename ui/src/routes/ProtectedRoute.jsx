import React from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from "@clerk/clerk-react"
import { CircularProgress, Box } from '@mui/material'

const LoadingSpinner = () => (
    <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
    }}>
        <CircularProgress />
    </Box>
);

export const ProtectedRoute = () => {
    const location = useLocation()
    const { isSignedIn, isLoaded } = useAuth()

    if (!isLoaded) {
        return <LoadingSpinner /> // null or a loading spinner
    }

    if (!isSignedIn) {
        return <RedirectToSignIn />
    }

    return <Outlet />
}
