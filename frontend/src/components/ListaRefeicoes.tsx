import { useState } from 'react';
import ItemRegistro from './ItemRegistro';
import { numero } from '../lib/format';
import type { GrupoRefeicao, Registro } from '../lib/types';

interface Props {
  grupos: GrupoRefeicao[];
  ocupado: boolean;
  aoTrocarRefeicao: (id: string, refeicaoId: string) => void;
  aoExcluir: (id: string) => void;
}

export default function ListaRefeicoes({ grupos, ocupado, aoTrocarRefeicao, aoExcluir }: Props) {
  const [abertas, setAbertas] = useState<string[]>([]);

  function alternar(refeicaoId: string) {
    setAbertas((atual) =>
      atual.includes(refeicaoId) ? atual.filter((r) => r !== refeicaoId) : [...atual, refeicaoId],
    );
  }

  const total = grupos.reduce((soma, grupo) => soma + grupo.registros.length, 0);
  if (total === 0) {
    return (
      <section className="cartao">
        <h2 className="titulo-secao">refeições</h2>
        <p className="mudo estado-vazio">nada registrado ainda hoje</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="titulo-secao">refeições</h2>
      {grupos.map((grupo) => {
        const aberta = abertas.includes(grupo.refeicao_id);
        return (
          <div className="cartao" key={grupo.refeicao_id}>
            <button
              type="button"
              className="refeicao-cabecalho"
              aria-expanded={aberta}
              onClick={() => alternar(grupo.refeicao_id)}
            >
              <span className="refeicao-nome">{grupo.refeicao_nome}</span>
              <span className="refeicao-kcal">
                {numero(grupo.calorias)} kcal · {grupo.registros.length}{' '}
                {grupo.registros.length === 1 ? 'registro' : 'registros'}
                <span className={aberta ? 'refeicao-seta aberta' : 'refeicao-seta'} aria-hidden="true">
                  ▸
                </span>
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
