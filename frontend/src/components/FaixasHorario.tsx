import { NOME_REFEICAO, REFEICOES } from '../lib/format';
import type { FaixaRefeicao } from '../lib/types';

interface Props {
  faixas: FaixaRefeicao[];
  aoMudar: (faixas: FaixaRefeicao[]) => void;
}

export default function FaixasHorario({ faixas, aoMudar }: Props) {
  // Garante as 5 faixas mesmo se o perfil vier incompleto.
  const completas: FaixaRefeicao[] = REFEICOES.map(
    (refeicao) =>
      faixas.find((faixa) => faixa.refeicao === refeicao) ?? { refeicao, inicio: '00:00', fim: '00:00' },
  );

  function atualizar(indice: number, campo: 'inicio' | 'fim', valor: string) {
    aoMudar(completas.map((faixa, i) => (i === indice ? { ...faixa, [campo]: valor } : faixa)));
  }

  return (
    <div>
      {completas.map((faixa, indice) => (
        <div className="faixa-horario" key={faixa.refeicao}>
          <span className="faixa-nome">{NOME_REFEICAO[faixa.refeicao]}</span>
          <input
            type="time"
            aria-label={`início de ${NOME_REFEICAO[faixa.refeicao]}`}
            value={faixa.inicio}
            onChange={(evento) => atualizar(indice, 'inicio', evento.target.value)}
          />
          <input
            type="time"
            aria-label={`fim de ${NOME_REFEICAO[faixa.refeicao]}`}
            value={faixa.fim}
            onChange={(evento) => atualizar(indice, 'fim', evento.target.value)}
          />
        </div>
      ))}
    </div>
  );
}
