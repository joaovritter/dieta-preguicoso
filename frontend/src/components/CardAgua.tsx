import BarraMacro from './BarraMacro';
import type { Metrica } from '../lib/types';

const ATALHOS = [200, 300, 500];

interface Props {
  metrica: Metrica;
  aoAdicionar: (ml: number) => void;
  ocupado: boolean;
}

export default function CardAgua({ metrica, aoAdicionar, ocupado }: Props) {
  return (
    <section className="cartao">
      <h2 className="titulo-secao">água</h2>
      <BarraMacro rotulo="água" unidade="ml" metrica={metrica} />
      <div className="agua-botoes">
        {ATALHOS.map((ml) => (
          <button
            key={ml}
            type="button"
            className="botao"
            disabled={ocupado}
            onClick={() => aoAdicionar(ml)}
          >
            +{ml} ml
          </button>
        ))}
      </div>
    </section>
  );
}
