const TOTAL = 300;
const ORB_SIZE = 100;
const TIME_S = 14;
const BASE_HUE = 180;

const hash01 = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const buildParticleKeyframes = () => {
  let rules = "";

  for (let i = 1; i <= TOTAL; i += 1) {
    const z = Math.floor(hash01(i) * 360);
    const y = Math.floor(hash01(i + 1000) * 360);
    const hue = (40 / TOTAL) * i + BASE_HUE;
    const name = `orb-orbit-${i}`;

    rules += `
.orb-particle-c:nth-child(${i}) {
  animation: ${name} ${TIME_S}s infinite;
  animation-delay: ${i * 0.01}s;
  background-color: hsla(${hue}, 100%, 50%, 1);
}
@keyframes ${name} {
  20% { opacity: 1; }
  30% {
    transform: rotateZ(-${z}deg) rotateY(${y}deg) translateX(${ORB_SIZE}px) rotateZ(${z}deg);
  }
  80% {
    transform: rotateZ(-${z}deg) rotateY(${y}deg) translateX(${ORB_SIZE}px) rotateZ(${z}deg);
    opacity: 1;
  }
  100% {
    transform: rotateZ(-${z}deg) rotateY(${y}deg) translateX(${ORB_SIZE * 3}px) rotateZ(${z}deg);
  }
}`;
  }

  return rules;
};

export const ORB_PARTICLE_STYLES = `
.orb-particle-host {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.orb-particle-scale {
  transform: scale(0.42);
  transform-style: preserve-3d;
}

.orb-particle-wrap {
  position: relative;
  width: 0;
  height: 0;
  transform-style: preserve-3d;
  perspective: 1000px;
  animation: orb-particle-rotate ${TIME_S}s infinite linear;
}

.orb-particle-wrap--loading {
  animation-duration: ${TIME_S / 2}s;
}

@keyframes orb-particle-rotate {
  100% {
    transform: rotateY(360deg) rotateX(360deg);
  }
}

.orb-particle-c {
  position: absolute;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  opacity: 0;
}

${buildParticleKeyframes()}
`;

export const ORB_PARTICLE_COUNT = TOTAL;
