import type { Alimento } from '../lib/types';

interface Props {
  alimento: Alimento;
  indice: number;
  aoMudar: (indice: number, alimento: Alimento) => void;
  aoRemover: (indice: number) => void;
}

type CampoNumerico = 'calorias' | 'carboidrato_g' | 'proteina_g' | 'gordura_g';

const NUMERICOS: Array<{ campo: CampoNumerico; rotulo: string }> = [
  { campo: 'calorias', rotulo: 'kcal' },
  { campo: 'carboidrato_g', rotulo: 'carbo g' },
  { campo: 'proteina_g', rotulo: 'prot g' },
  { campo: 'gordura_g', rotulo: 'gord g' },
];

export default function LinhaAlimento({ alimento, indice, aoMudar, aoRemover }: Props) {
  function mudarNumero(campo: CampoNumerico, texto: string) {
    const valor = Number(texto.replace(',', '.'));
    aoMudar(indice, { ...alimento, [campo]: Number.isFinite(valor) ? valor : 0 });
  }

  return (
    <div className="alimento">
      <div className="alimento-topo">
        <input
          aria-label="nome do alimento"
          value={alimento.nome}
          placeholder="alimento"
          onChange={(evento) => aoMudar(indice, { ...alimento, nome: evento.target.value })}
        />
        <input
          aria-label="quantidade estimada"
          value={alimento.quantidade_estimada}
          placeholder="150g"
          onChange={(evento) =>
            aoMudar(indice, { ...alimento, quantidade_estimada: evento.target.value })
          }
        />
      </div>

      <div className="alimento-grade">
        {NUMERICOS.map(({ campo, rotulo }) => (
          <label className="alimento-campo" key={campo}>
            <span>{rotulo}</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              value={String(alimento[campo])}
              onChange={(evento) => mudarNumero(campo, evento.target.value)}
            />
          </label>
        ))}
      </div>

      <button type="button" className="alimento-remover" onClick={() => aoRemover(indice)}>
        remover
      </button>
    </div>
  );
}
