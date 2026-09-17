import { useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import BotaoCta from '../ui/BotaoCta';
import BotaoPasso from '../ui/BotaoPasso';
import RotuloSecao from '../ui/RotuloSecao';
import { numero } from '../../lib/format';
import { escalarAlimento, lerPorcao, passoDaPorcao } from '../../lib/porcao';
import type { CorRefeicao } from '../../lib/visual';
import type { Alimento } from '../../lib/types';

export interface PropsDetalhe {
  alimento: Alimento;
  refeicaoNome: string;
  cor: CorRefeicao;
  salvando: boolean;
  comecarEditando?: boolean;
  aoVoltar: () => void;
  aoSalvar: (alimento: Alimento) => void;
  aoRemover: () => void;
}

type CampoNumerico = 'calorias' | 'carboidrato_g' | 'proteina_g' | 'gordura_g';

const MACROS: Array<{ campo: Exclude<CampoNumerico, 'calorias'>; rotulo: string; cor: string }> = [
  { campo: 'carboidrato_g', rotulo: 'carboidrato', cor: 'macro.carbo' },
  { campo: 'proteina_g', rotulo: 'proteína', cor: 'macro.proteina' },
  { campo: 'gordura_g', rotulo: 'gordura', cor: 'macro.gordura' },
];

function paraNumero(texto: string): number {
  const valor = Number(texto.replace(',', '.'));
  return Number.isFinite(valor) && valor >= 0 ? valor : 0;
}

export default function DetalheAlimento({
  alimento,
  refeicaoNome,
  cor,
  salvando,
  comecarEditando = false,
  aoVoltar,
  aoSalvar,
  aoRemover,
}: PropsDetalhe) {
  const [base, setBase] = useState(alimento);
  const [editando, setEditando] = useState(comecarEditando);
  const original = lerPorcao(base.quantidade_estimada);
  const passo = passoDaPorcao(original);
  const [quantidade, setQuantidade] = useState(original.quantidade);
  const atual = escalarAlimento(base, quantidade);

  function mudarCampo(campo: 'nome' | 'quantidade_estimada', valor: string) {
    const novo = { ...atual, [campo]: valor };
    setBase(novo);
    if (campo === 'quantidade_estimada') setQuantidade(lerPorcao(valor).quantidade);
  }

  function mudarNumero(campo: CampoNumerico, texto: string) {
    setBase({ ...atual, [campo]: paraNumero(texto) });
    setQuantidade(lerPorcao(atual.quantidade_estimada).quantidade);
  }

  const podeSalvar = atual.nome.trim() !== '' && !salvando;

  return (
    <Box
      sx={{ maxWidth: 480, mx: 'auto', minHeight: '100dvh', p: '14px 22px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px', bgcolor: 'background.default' }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <ButtonBase onClick={aoVoltar} sx={{ minHeight: 32, fontFamily: 'inherit', fontWeight: 600, fontSize: 13, color: 'text.secondary' }}>
            ← voltar
          </ButtonBase>
          <ButtonBase
            onClick={() => setEditando((v) => !v)}
            aria-pressed={editando}
            sx={{ minHeight: 32, fontFamily: 'inherit', fontWeight: 600, fontSize: 12.5, color: 'primary.main' }}
          >
            {editando ? 'usar porção' : 'ajustar valores'}
          </ButtonBase>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Box
            component="span"
            sx={{ minHeight: 28, display: 'flex', alignItems: 'center', width: 'fit-content', px: '11px', borderRadius: '8px', bgcolor: `refeicao.${cor}`, color: 'primary.contrastText', fontWeight: 600, fontSize: 11 }}
          >
            {refeicaoNome}
          </Box>
          {editando ? (
            <TextField label="alimento" value={atual.nome} onChange={(e) => mudarCampo('nome', e.target.value)} autoFocus={comecarEditando} />
          ) : (
            <Typography component="h1" sx={{ m: 0, fontWeight: 800, fontSize: 32, lineHeight: 1.05, letterSpacing: '-.025em' }}>
              {atual.nome}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '8px', pb: '14px', borderBottom: '1.6px solid', borderColor: 'text.primary' }}>
          <Typography sx={{ fontWeight: 800, fontSize: 52, lineHeight: 0.9, letterSpacing: '-.035em', fontVariantNumeric: 'tabular-nums' }}>
            {numero(atual.calorias)}
          </Typography>
          <Typography sx={{ fontWeight: 600, fontSize: 14, color: 'text.secondary', pb: '6px' }}>kcal</Typography>
        </Box>

        {editando ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <TextField label="quantidade" value={atual.quantidade_estimada} onChange={(e) => mudarCampo('quantidade_estimada', e.target.value)} sx={{ gridColumn: '1 / -1' }} />
            <TextField label="kcal" type="number" slotProps={{ htmlInput: { inputMode: 'decimal', min: 0, step: 0.1 } }} value={String(atual.calorias)} onChange={(e) => mudarNumero('calorias', e.target.value)} />
            {MACROS.map((m) => (
              <TextField key={m.campo} label={`${m.rotulo} (g)`} type="number" slotProps={{ htmlInput: { inputMode: 'decimal', min: 0, step: 0.1 } }} value={String(atual[m.campo])} onChange={(e) => mudarNumero(m.campo, e.target.value)} />
            ))}
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <RotuloSecao sx={{ letterSpacing: '.14em' }}>porção</RotuloSecao>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <BotaoPasso simbolo="−" tamanho={44} rotulo="diminuir porção" disabled={quantidade - passo < passo} onClick={() => setQuantidade((q) => q - passo)} />
                <Typography sx={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 17, fontVariantNumeric: 'tabular-nums' }}>
                  {atual.quantidade_estimada === '' ? `${quantidade} porção` : atual.quantidade_estimada}
                </Typography>
                <BotaoPasso simbolo="+" tamanho={44} rotulo="aumentar porção" disabled={quantidade + passo > 999} onClick={() => setQuantidade((q) => q + passo)} />
              </Box>
            </Box>
            <Box>
              {MACROS.map((m) => (
                <Box key={m.campo} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: '11px', borderTop: '1px solid', borderColor: 'neutro.linha' }}>
                  <Typography sx={{ fontWeight: 500, fontSize: 13, color: 'text.secondary' }}>{m.rotulo}</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: 14, color: m.cor }}>{numero(atual[m.campo])}g</Typography>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: '9px' }}>
        <BotaoCta variante="perigo" disabled={salvando} onClick={aoRemover} sx={{ flex: '0 0 38%' }}>
          remover
        </BotaoCta>
        <BotaoCta disabled={!podeSalvar} onClick={() => aoSalvar(atual)} sx={{ flex: 1 }}>
          {salvando ? 'salvando...' : 'salvar'}
        </BotaoCta>
      </Box>
    </Box>
  );
}
