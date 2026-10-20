import { useMemo } from "react";
import {
  ORB_PARTICLE_COUNT,
  ORB_PARTICLE_STYLES,
} from "./orbParticleStyles";

interface OrbProps {
  className?: string;
  isLoading?: boolean;
}

const Orb = ({ className = "", isLoading = false }: OrbProps) => {
  const particles = useMemo(
    () =>
      Array.from({ length: ORB_PARTICLE_COUNT }, (_, index) => (
        <div key={index} className="orb-particle-c" />
      )),
    []
  );

  return (
    <div
      className={`orb-particle-host ${className}`}
      aria-hidden="true"
    >
      <style>{ORB_PARTICLE_STYLES}</style>
      <div className="orb-particle-scale">
        <div
          className={`orb-particle-wrap ${
            isLoading ? "orb-particle-wrap--loading" : ""
          }`}
        >
          {particles}
        </div>
      </div>
    </div>
  );
};

export default Orb;
