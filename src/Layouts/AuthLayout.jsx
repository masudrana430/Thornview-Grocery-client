import React from 'react';
import Container from '../Components/Container';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
    return (
        <Container>
            <Outlet />
        </Container>
    );
};

export default AuthLayout;