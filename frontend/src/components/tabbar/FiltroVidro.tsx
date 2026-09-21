export const ID_FILTRO_VIDRO = 'vidro-indicador-refrato';

/**
 * Filtro SVG (turbulência + deslocamento) que dá o leve efeito de refração no
 * brilho do indicador — como a luz que entra tortinha ao atravessar um vidro de
 * verdade, em vez de um degradê reto. Só precisa existir uma vez no DOM.
 */
export default function FiltroVidro() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <filter id={ID_FILTRO_VIDRO} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.9" numOctaves="2" seed="7" result="ruido" />
          <feGaussianBlur in="ruido" stdDeviation="0.6" result="ruidoSuave" />
          <feDisplacementMap in="SourceGraphic" in2="ruidoSuave" scale="6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
