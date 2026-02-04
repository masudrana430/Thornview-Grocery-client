import React from 'react';
import Lottie from "lottie-react";
// import errorImg from '../assets/error-404.png';
import ErrorAnimation1 from "./../animation/Ai loading model.json";

const LoadingSpinnerHome = () => {
  return (
    <Container>
        <Lottie
        animationData={ErrorAnimation1}
        loop={true}
        style={{ width: "400px", height: "400px", margin: "0 auto" }}
      />
      </Container>
  );
};

export default LoadingSpinnerHome;