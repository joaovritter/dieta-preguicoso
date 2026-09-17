import { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import InputBase from '@mui/material/InputBase';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { api } from '../lib/api';
import { useRefeicoes } from '../lib/RefeicoesContext';
import { corDaRefeicao } from '../lib/visual';
import { useConfirmacao } from './useConfirmacao';
import BotaoCta from './ui/BotaoCta';
import RotuloSecao from './ui/RotuloSecao';
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
    const ok = await confirmar({ titulo: `excluir ${r.nome}`, texto: 'a faixa de horário dela passa para a refeição vizinha.', rotulo: 'excluir' });
    if (!ok) return;
    try {
      await api.excluirRefeicao(r.id);
      await recarregar();
    } catch (falha: unknown) {
      aoFalhar(falha);
    }
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
    if (evento.key === 'Enter') evento.currentTarget.blur();
    else if (evento.key === 'Escape') {
      canceladaRef.current = true;
      evento.currentTarget.blur();
    }
  }

  const novaValida = nova.nome.trim() !== '' && nova.inicio !== '' && nova.fim !== '';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <Box>
        {refeicoes.map((r) => (
          <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: 52, borderTop: '1px solid', borderColor: 'neutro.linha' }}>
            <Box sx={{ width: 6, height: 28, borderRadius: '3px', flex: 'none', bgcolor: `refeicao.${corDaRefeicao(r.id, refeicoes)}` }} />
            {editandoId === r.id ? (
              <InputBase
                autoFocus
                value={rascunho}
                onChange={(e) => setRascunho(e.target.value)}
                onBlur={() => void salvarNome(r)}
                onKeyDown={aoTeclar}
                sx={{ flex: 1, fontWeight: 600, fontSize: 14, borderBottom: '1.6px solid', borderColor: 'text.primary' }}
              />
            ) : (
              <ButtonBase
                aria-label={`renomear ${r.nome}`}
                onClick={() => {
                  setEditandoId(r.id);
                  setRascunho(r.nome);
                }}
                sx={{ flex: 1, justifyContent: 'flex-start', minHeight: 44, fontFamily: 'inherit', fontWeight: 600, fontSize: 14, color: 'text.primary' }}
              >
                {r.nome}
              </ButtonBase>
            )}
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
              {r.inicio}–{r.fim}
            </Typography>
            <ButtonBase onClick={() => void excluir(r)} sx={{ minHeight: 44, px: '6px', fontFamily: 'inherit', fontWeight: 600, fontSize: 12, color: 'error.main' }}>
              excluir
            </ButtonBase>
          </Box>
        ))}
      </Box>

      <Box component="form" onSubmit={(e: React.FormEvent) => void criar(e)} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <RotuloSecao sx={{ gridColumn: '1 / -1' }}>nova refeição</RotuloSecao>
        <TextField label="nome" value={nova.nome} onChange={(e) => setNova((a) => ({ ...a, nome: e.target.value }))} sx={{ gridColumn: '1 / -1' }} />
        <TextField label="início" type="time" value={nova.inicio} onChange={(e) => setNova((a) => ({ ...a, inicio: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField label="fim" type="time" value={nova.fim} onChange={(e) => setNova((a) => ({ ...a, fim: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
        <BotaoCta type="submit" variante="contorno" altura={46} disabled={salvando || !novaValida} sx={{ gridColumn: '1 / -1' }}>
          {salvando ? 'criando...' : '+ nova refeição'}
        </BotaoCta>
      </Box>
      {elemento}
    </Box>
  );
}
