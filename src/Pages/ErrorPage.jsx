import React from "react";
import Container from "../Components/Container";
import Lottie from "lottie-react";
// import errorImg from '../assets/error-404.png';
import ErrorAnimation from "./../animation/Error 404.json";

const ErrorPage = () => {
  return (
    <Container>
      <Lottie
        animationData={ErrorAnimation}
        loop={true}
        style={{ width: "400px", height: "400px", margin: "0 auto" }}
      />
      <h1 className="text-3xl font-bold text-center mt-20">
        Oops, page not found!
      </h1>
      <p className="text-center mt-4 text-gray-600">
        The page you are looking for is not available.
      </p>
      {/* <Link to="/" className="btn btn-primary">Go back to Home</Link> */}
    </Container>
  );
};

export default ErrorPage;
