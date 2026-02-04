// src/Components/LoadingSpinner.jsx
import React from "react";
import Container from './Container';
import Lottie from "lottie-react";
// import errorImg from '../assets/error-404.png';
import ErrorAnimation1 from "./../animation/Loading loop animation.json";

const LoadingSpinner = () => {
  return (
    <div>
      <Container>
        <Lottie
        animationData={ErrorAnimation1}
        loop={true}
        style={{ width: "400px", height: "400px", margin: "0 auto" }}
      />
      </Container>
    </div>
  );
};

export default LoadingSpinner;
