import { useRef, useState } from 'react';
import { api } from '../lib/api';
import { useRefeicoes } from '../lib/RefeicoesContext';
import { useConfirmacao } from './useConfirmacao';
import type { Refeicao } from '../lib/types';

export default function SecaoRefeicoes({ aoFalhar }: { aoFalhar: (e: unknown) => void }) {
  const { refeicoes, recarregar } = useRefeicoes();
  const { confirmar, elemento } = useConfirmacao();
  const [nova, setNova] = useState({ nome: '', inicio: '', fim: '' });
  const [salvando, setSalvando] = useState(false);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState('');
  const canceladaRef = useRef(false);

  async function criar(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    try {
      await api.criarRefeicao(nova);
      setNova({ nome: '', inicio: '', fim: '' });
      await recarregar();
    } catch (falha: unknown) {
      aoFalhar(falha);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(r: Refeicao) {
    const ok = await confirmar({
      titulo: `excluir ${r.nome}`,
      texto: 'a faixa de horário dela passa para a refeição vizinha.',
      rotulo: 'excluir',
    });
    if (!ok) return;
    try {
      await api.excluirRefeicao(r.id);
      await recarregar();
    } catch (falha: unknown) {
      aoFalhar(falha);
    }
  }

  function iniciarEdicao(r: Refeicao) {
    setEditandoId(r.id);
    setRascunho(r.nome);
  }

  async function salvarNome(r: Refeicao) {
    setEditandoId(null);
    const cancelada = canceladaRef.current;
    canceladaRef.current = false;
    if (cancelada) return;
    const novoNome = rascunho.trim();
    if (novoNome === '' || novoNome === r.nome) return;
    try {
      await api.atualizarRefeicao(r.id, { nome: novoNome });
      await recarregar();
    } catch (falha: unknown) {
      aoFalhar(falha);
    }
  }

  function aoTeclar(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Enter') {
      evento.currentTarget.blur();
    } else if (evento.key === 'Escape') {
      canceladaRef.current = true;
      evento.currentTarget.blur();
    }
  }

  const nomeValido = nova.nome.trim() !== '' && nova.inicio !== '' && nova.fim !== '';

  return (
    <section className="cartao">
      <h2 className="titulo-secao">refeições</h2>
      {refeicoes.map((r) => (
        <div className="linha-social" key={r.id}>
          {editandoId === r.id ? (
            <input
              className="campo-entrada linha-social-nome"
              value={rascunho}
              autoFocus
              onChange={(evento) => setRascunho(evento.target.value)}
              onBlur={() => void salvarNome(r)}
              onKeyDown={aoTeclar}
            />
          ) : (
            <button
              type="button"
              className="linha-social-nome refeicao-nome-botao"
              aria-label={`renomear ${r.nome}`}
              onClick={() => iniciarEdicao(r)}
            >
              {r.nome}
            </button>
          )}
          <span className="mudo linha-social-kcal">
            {r.inicio}–{r.fim}
          </span>
          <button type="button" className="botao-mini botao-perigo" onClick={() => void excluir(r)}>
            excluir
          </button>
        </div>
      ))}

      <form className="refeicao-nova" onSubmit={(evento) => void criar(evento)}>
        <label className="campo">
          <span className="campo-rotulo">nome</span>
          <input
            className="campo-entrada"
            value={nova.nome}
            onChange={(evento) => setNova((atual) => ({ ...atual, nome: evento.target.value }))}
          />
        </label>

        <div className="linha-campos">
          <label className="campo">
            <span className="campo-rotulo">início</span>
            <input
              className="campo-entrada"
              type="time"
              value={nova.inicio}
              onChange={(evento) => setNova((atual) => ({ ...atual, inicio: evento.target.value }))}
            />
          </label>
          <label className="campo">
            <span className="campo-rotulo">fim</span>
            <input
              className="campo-entrada"
              type="time"
              value={nova.fim}
              onChange={(evento) => setNova((atual) => ({ ...atual, fim: evento.target.value }))}
            />
          </label>
        </div>

        <button
          type="submit"
          className="botao"
          style={{ width: '100%' }}
          disabled={salvando || !nomeValido}
        >
          {salvando ? 'criando...' : '+ nova refeição'}
        </button>
      </form>
      {elemento}
    </section>
  );
}
