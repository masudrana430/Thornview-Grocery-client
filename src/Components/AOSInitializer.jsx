import { useEffect } from "react";
import AOS from "aos";

export default function AOSInitializer() {
  useEffect(() => {
    AOS.init({
      duration: 700,
      offset: 80,
      once: true,
      easing: "ease-in-out",
    });

    const refreshAOS = () => {
      AOS.refresh();
    };

    window.addEventListener("load", refreshAOS);

    return () => {
      window.removeEventListener("load", refreshAOS);
    };
  }, []);

  return null;
}