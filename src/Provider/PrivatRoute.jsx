import React, { use } from 'react';
import { AuthContext } from './AuthProvider';
import { Navigate } from 'react-router';
import LoadingSpinnercopy from '../Components/LoadingSpinnercopy';
// import LoadingSpinner from '../Components/LoadingSpinner';

const PrivatRoute = ({ children }) => {
    // if user is not authenticated, you can redirect to login page
    //if user exists, then allow to visit the route(return children)
    const { user , loading } = use(AuthContext);
    // console.log('from private route', user);
    if (loading){
        return <div className='p-6'> <LoadingSpinnercopy /></div>;
    }

    if (user && user?.email){
        return children;
    }
    return <Navigate to='/auth/login' ></Navigate>;
};

export default PrivatRoute;