import React, { useEffect, useRef, useState } from "react";
import * as flubber from "flubber";
import "./Orb.css";

const SHAPES = [
  // Path 1
  "M100,30 Q140,35 170,70 Q190,110 150,150 Q110,190 70,170 Q30,140 40,90 Q50,40 100,30Z",
  // Path 2 (slightly different)
  "M100,25 Q150,40 175,80 Q185,120 140,160 Q100,195 60,160 Q15,120 25,80 Q50,40 100,25Z",
  // Path 3 (another variation)
  "M100,35 Q135,20 170,60 Q200,110 160,160 Q120,200 70,180 Q20,140 40,80 Q60,40 100,35Z",
];

interface OrbProps {
  className?: string;
  isLoading?: boolean;
}

const Orb: React.FC<OrbProps> = ({ className = "", isLoading = false }) => {
  const [pathIndex, setPathIndex] = useState(0);
  const [path, setPath] = useState(SHAPES[0]);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    let nextIndex = (pathIndex + 1) % SHAPES.length;
    const interpolator = flubber.interpolate(
      SHAPES[pathIndex],
      SHAPES[nextIndex],
      { maxSegmentLength: 2 }
    );
    let start: number | null = null;
    const duration = 1500; // ms

    function animate(ts: number) {
      if (!start) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      setPath(interpolator(t));
      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setPathIndex(nextIndex);
      }
    }

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [pathIndex]);

  return (
    <div
      className={`orb-svg-container ${className} ${
        isLoading ? "orb-rotate" : ""
      }`}
    >
      <svg
        className="orb-svg"
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="orbGradient" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#f8fffe" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#16aeac" stopOpacity="0.85" />
            <stop offset="80%" stopColor="#4a90e2" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#9b59b6" stopOpacity="0.85" />
          </radialGradient>
          <filter id="orbGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d={path} fill="url(#orbGradient)" filter="url(#orbGlow)" />
      </svg>
    </div>
  );
};

export default Orb;
