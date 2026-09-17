import { useRef, useState } from 'react';
import { useMotionValueEvent, useScroll } from 'motion/react';
import { decidirCompacta, LIMIAR_DELTA, TOPO } from './rolagem';

export function useRolagemCompacta(): boolean {
  const { scrollY } = useScroll();
  const [compacta, setCompacta] = useState(false);
  // Referência só anda quando o movimento passa do limiar: vários scrolls de 2px somam.
  const referencia = useRef(0);

  useMotionValueEvent(scrollY, 'change', (y) => {
    const delta = y - referencia.current;
    if (y > TOPO && Math.abs(delta) <= LIMIAR_DELTA) return;
    referencia.current = y;
    setCompacta((atual) => decidirCompacta(atual, delta, y));
  });

  return compacta;
}
