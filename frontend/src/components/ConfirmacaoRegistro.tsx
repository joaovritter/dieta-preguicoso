import { useMemo, useState } from 'react';
import Overlay from './Overlay';
import Erro from './Erro';
import LinhaAlimento from './LinhaAlimento';
import { numero, somarAlimentos } from '../lib/format';
import { mensagemDoErro } from '../lib/api';
import { useRefeicoes } from '../lib/RefeicoesContext';
import type { Alimento, EntradaConfirmacao, Interpretacao } from '../lib/types';

interface Props {
  interpretacao: Interpretacao;
  aoConfirmar: (entrada: EntradaConfirmacao) => Promise<void>;
  aoDescartar: () => void;
}

const ALIMENTO_VAZIO: Alimento = {
  nome: '',
  quantidade_estimada: '',
  calorias: 0,
  carboidrato_g: 0,
  proteina_g: 0,
  gordura_g: 0,
};

export default function ConfirmacaoRegistro({ interpretacao, aoConfirmar, aoDescartar }: Props) {
  const { refeicoes } = useRefeicoes();
  const [alimentos, setAlimentos] = useState<Alimento[]>(interpretacao.alimentos);
  const [refeicaoId, setRefeicaoId] = useState<string>(interpretacao.refeicao_sugerida.id);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const totais = useMemo(() => somarAlimentos(alimentos), [alimentos]);
  const podeConfirmar = alimentos.length > 0 && !salvando;

  function trocar(indice: number, alimento: Alimento) {
    setAlimentos((atual) => atual.map((item, i) => (i === indice ? alimento : item)));
  }

  function remover(indice: number) {
    setAlimentos((atual) => atual.filter((_, i) => i !== indice));
  }

  async function confirmar() {
    setSalvando(true);
    setErro(null);
    try {
      await aoConfirmar({
        tipo_entrada: interpretacao.tipo_entrada,
        descricao_bruta: interpretacao.descricao_bruta,
        midia_url: interpretacao.midia_url,
        refeicao_id: refeicaoId,
        alimentos,
      });
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
      setSalvando(false);
    }
  }

  return (
    <Overlay titulo="confere aí" aoFechar={aoDescartar}>
      {erro !== null && <Erro mensagem={erro} aoFechar={() => setErro(null)} />}

      <p className="mudo" style={{ marginTop: 0, fontSize: 13 }}>
        {interpretacao.descricao_bruta}
      </p>

      <label className="campo">
        <span className="campo-rotulo">refeição</span>
        <select
          className="campo-entrada"
          value={refeicaoId}
          onChange={(evento) => setRefeicaoId(evento.target.value)}
        >
          {refeicoes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </select>
      </label>

      {alimentos.map((alimento, indice) => (
        <LinhaAlimento
          key={indice}
          alimento={alimento}
          indice={indice}
          aoMudar={trocar}
          aoRemover={remover}
        />
      ))}

      <button
        type="button"
        className="botao"
        style={{ width: '100%' }}
        onClick={() => setAlimentos((atual) => [...atual, { ...ALIMENTO_VAZIO }])}
      >
        + adicionar alimento
      </button>

      <div className="totais">
        <span>
          <strong>{numero(totais.calorias)}</strong> kcal
        </span>
        <span>
          <strong>{numero(totais.carboidrato_g)}</strong> carbo
        </span>
        <span>
          <strong>{numero(totais.proteina_g)}</strong> prot
        </span>
        <span>
          <strong>{numero(totais.gordura_g)}</strong> gord
        </span>
      </div>

      <div className="acoes-rodape">
        <button type="button" className="botao" onClick={aoDescartar} disabled={salvando}>
          descartar
        </button>
        <button
          type="button"
          className="botao botao-primario"
          disabled={!podeConfirmar}
          onClick={() => void confirmar()}
        >
          {salvando ? 'salvando...' : 'confirmar'}
        </button>
      </div>
    </Overlay>
  );
}
