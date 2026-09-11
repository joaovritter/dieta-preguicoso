import { useState } from 'react';
import ItemRegistro from './ItemRegistro';
import { NOME_REFEICAO, numero } from '../lib/format';
import type { GrupoRefeicao, Refeicao, Registro } from '../lib/types';

interface Props {
  grupos: GrupoRefeicao[];
  ocupado: boolean;
  aoTrocarRefeicao: (id: string, refeicao: Refeicao) => void;
  aoExcluir: (id: string) => void;
}

export default function ListaRefeicoes({ grupos, ocupado, aoTrocarRefeicao, aoExcluir }: Props) {
  const [abertas, setAbertas] = useState<Refeicao[]>([]);

  function alternar(refeicao: Refeicao) {
    setAbertas((atual) =>
      atual.includes(refeicao) ? atual.filter((r) => r !== refeicao) : [...atual, refeicao],
    );
  }

  const total = grupos.reduce((soma, grupo) => soma + grupo.registros.length, 0);
  if (total === 0) {
    return (
      <section className="cartao">
        <h2 className="titulo-secao">refeições</h2>
        <p className="mudo" style={{ margin: 0 }}>
          nada registrado ainda hoje
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="titulo-secao">refeições</h2>
      {grupos.map((grupo) => {
        const aberta = abertas.includes(grupo.refeicao);
        return (
          <div className="cartao" key={grupo.refeicao}>
            <button
              type="button"
              className="refeicao-cabecalho"
              aria-expanded={aberta}
              onClick={() => alternar(grupo.refeicao)}
            >
              <span className="refeicao-nome">{NOME_REFEICAO[grupo.refeicao]}</span>
              <span className="refeicao-kcal">
                {numero(grupo.calorias)} kcal · {grupo.registros.length}{' '}
                {grupo.registros.length === 1 ? 'registro' : 'registros'} {aberta ? '▾' : '▸'}
              </span>
            </button>

            {aberta && (
              <div className="refeicao-corpo">
                {grupo.registros.length === 0 ? (
                  <p className="mudo" style={{ margin: 0, fontSize: 13 }}>
                    nada nessa refeição
                  </p>
                ) : (
                  grupo.registros.map((registro: Registro) => (
                    <ItemRegistro
                      key={registro.id}
                      registro={registro}
                      ocupado={ocupado}
                      aoTrocarRefeicao={aoTrocarRefeicao}
                      aoExcluir={aoExcluir}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
