import { lazy } from 'react'
import Loadable from '@/ui-component/loading/Loadable'
import MinimalLayout from '@/layout/MinimalLayout'
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { BASE_PATHS, AUTH_PATHS } from './path'

const SignIn = Loadable(lazy(() => import('@/views/auth/SignIn')))
const SignUp = Loadable(lazy(() => import('@/views/auth/SignUp')))
const UserProfile = Loadable(lazy(() => import('@/views/auth/UserProfile')))

export const AuthRoutes = {
    path: BASE_PATHS.ROOT,
    // element: <MinimalLayout />,
    children: [
        {
            path: `${AUTH_PATHS.ROOT}${AUTH_PATHS.CHILDREN.SIGN_IN}`,
            element: <SignIn />
        },
        {
            path: `${AUTH_PATHS.ROOT}${AUTH_PATHS.CHILDREN.SIGN_UP}`,
            element: <SignUp />
        },
        {
            path: `${AUTH_PATHS.ROOT}${AUTH_PATHS.CHILDREN.PROFILE}`,
            element: <ProtectedRoute />,
            children: [
                {
                    index: true,
                    element: <UserProfile />
                }
            ]
        },
    ]
}
