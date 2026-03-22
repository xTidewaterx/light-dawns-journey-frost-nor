import { useGLTF, useAnimations } from '@react-three/drei';
import { useRef, useEffect } from 'react';

export default function Deer({ modelPath, ...props }) {
  const ref = useRef();
  const { scene, animations } = useGLTF(modelPath);
  const { actions } = useAnimations(animations, ref);

  useEffect(() => {
    if (actions && animations.length > 0) {
      actions[animations[0].name]?.play();
    }
  }, [actions, animations]);

  useGLTF.preload(modelPath);

  return <primitive ref={ref} object={scene} {...props} />;
}
