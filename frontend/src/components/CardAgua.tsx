import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';
import { Trash2 } from 'lucide-react';
import RotuloSecao from './ui/RotuloSecao';
import BotaoCta from './ui/BotaoCta';
import BotaoPasso from './ui/BotaoPasso';
import { useConfirmacao } from './useConfirmacao';
import { api, mensagemDoErro } from '../lib/api';
import { horaDoTimestamp } from '../lib/format';
import { AVULSO_MAXIMO, lerAvulso, normalizarPreset, somarAvulso } from '../lib/presetsAgua';
import { usePresetsAgua } from '../lib/usePresetsAgua';
import { litros } from '../lib/visual';
import type { Metrica, RegistroAgua } from '../lib/types';

interface Props {
  metrica: Metrica;
  data: string;
  aoAdicionar: (ml: number) => void;
  /** Chamado depois de apagar um registro, para o pai recarregar o resumo do dia. */
  aoApagar: () => Promise<void>;
  ocupado: boolean;
}

const estiloBotaoMl = (t: Theme) => ({
  flex: 1,
  minHeight: 36,
  border: '1.4px solid',
  borderColor: 'neutro.borda',
  borderRadius: '11px',
  bgcolor: 'background.default',
  fontFamily: 'inherit',
  fontWeight: 600,
  fontSize: 12.5,
  color: 'text.primary',
  transition: 'border-color .18s, color .18s',
  '&:hover': { borderColor: 'status.sobrou', color: 'status.sobrou' },
  '&.Mui-disabled': { opacity: 0.45 },
  ...t.applyStyles('dark', { borderWidth: '1px', bgcolor: 'neutro.cartao' }),
});

const estiloCampoMl = { width: 96, '& input': { textAlign: 'center' } } as const;

function LinhaPreset({ ml, aoMudar }: { ml: number; aoMudar: (novo: number) => void }) {
  // null = mostra o valor salvo; texto = o que está sendo digitado (só vale ao sair do campo)
  const [texto, setTexto] = useState<string | null>(null);

  function confirmar() {
    const novo = texto === null ? null : normalizarPreset(texto);
    if (novo !== null) aoMudar(novo);
    setTexto(null);
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', py: '9px', borderTop: '1px solid', borderColor: 'neutro.linha' }}>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
        <TextField
          type="number"
          size="small"
          aria-label={`predefinição de ${ml}ml`}
          value={texto ?? String(ml)}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={confirmar}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.querySelector('input')?.blur();
          }}
          slotProps={{ htmlInput: { inputMode: 'numeric', min: 50, max: 2000, step: 50 } }}
          sx={estiloCampoMl}
        />
        <Typography sx={{ fontWeight: 500, fontSize: 13, color: 'text.secondary' }}>ml</Typography>
      </Box>
      <BotaoPasso simbolo="−" tamanho={32} rotulo={`diminuir ${ml}ml`} disabled={ml <= 50} onClick={() => aoMudar(ml - 50)} />
      <BotaoPasso simbolo="+" tamanho={32} rotulo={`aumentar ${ml}ml`} disabled={ml >= 2000} onClick={() => aoMudar(ml + 50)} />
    </Box>
  );
}

export default function CardAgua({ metrica, data, aoAdicionar, aoApagar, ocupado }: Props) {
  const { presets, ajustar } = usePresetsAgua();
  const [editando, setEditando] = useState(false);
  const [outroAberto, setOutroAberto] = useState(false);
  const [textoOutro, setTextoOutro] = useState('');
  const [registros, setRegistros] = useState<RegistroAgua[] | null>(null);
  const [erroLista, setErroLista] = useState<string | null>(null);
  const { confirmar, elemento: confirmacao } = useConfirmacao();
  const largura = Math.min(metrica.percentual, 100);
  const valorOutro = lerAvulso(textoOutro);

  useEffect(() => {
    if (!editando) return;
    let ativo = true;
    setRegistros(null);
    setErroLista(null);
    api.aguaDoDia(data).then(
      (lista) => {
        if (ativo) setRegistros(lista);
      },
      (falha: unknown) => {
        if (ativo) setErroLista(mensagemDoErro(falha));
      },
    );
    return () => {
      ativo = false;
    };
  }, [editando, data]);

  async function apagar(registro: RegistroAgua) {
    const ok = await confirmar({
      titulo: 'apagar registro de água',
      texto: `${registro.quantidade_ml}ml saem do total do dia.`,
      rotulo: 'apagar',
    });
    if (!ok) return;
    setErroLista(null);
    try {
      await api.apagarAgua(registro.id);
      setRegistros((atual) => (atual === null ? atual : atual.filter((r) => r.id !== registro.id)));
      await aoApagar();
    } catch (falha: unknown) {
      setErroLista(mensagemDoErro(falha));
    }
  }

  function adicionarOutro() {
    if (valorOutro === null) return;
    aoAdicionar(valorOutro);
    setOutroAberto(false);
    setTextoOutro('');
  }

  return (
    <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <RotuloSecao>água</RotuloSecao>
        <ButtonBase
          onClick={() => setEditando((v) => !v)}
          aria-pressed={editando}
          sx={{ fontFamily: 'inherit', fontWeight: 600, fontSize: 11.5, color: 'primary.main', minHeight: 28, px: '4px', mr: '-4px' }}
        >
          {editando ? 'pronto' : 'editar'}
        </ButtonBase>
      </Box>

      {editando ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {presets.map((ml, indice) => (
              <LinhaPreset key={indice} ml={ml} aoMudar={(novo) => ajustar(indice, novo - ml)} />
            ))}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <RotuloSecao>registros do dia</RotuloSecao>
            {erroLista !== null && (
              <Typography role="alert" sx={{ fontSize: 12.5, color: 'error.main', pt: '6px' }}>
                {erroLista}
              </Typography>
            )}
            {registros === null ? (
              erroLista === null && <Typography sx={{ fontSize: 12.5, color: 'text.secondary', pt: '6px' }}>carregando...</Typography>
            ) : registros.length === 0 ? (
              <Typography sx={{ fontSize: 12.5, color: 'text.secondary', pt: '6px' }}>nenhum registro de água neste dia.</Typography>
            ) : (
              registros.map((registro) => (
                <Box key={registro.id} sx={{ display: 'flex', alignItems: 'center', gap: '10px', py: '4px', borderTop: '1px solid', borderColor: 'neutro.linha' }}>
                  <Typography sx={{ fontWeight: 500, fontSize: 13, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                    {horaDoTimestamp(registro.criado_em)}
                  </Typography>
                  <Typography sx={{ flex: 1, fontWeight: 600, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{registro.quantidade_ml}ml</Typography>
                  <ButtonBase
                    aria-label={`apagar ${registro.quantidade_ml}ml das ${horaDoTimestamp(registro.criado_em)}`}
                    disabled={ocupado}
                    onClick={() => void apagar(registro)}
                    sx={{ width: 36, height: 36, borderRadius: '9px', color: 'text.secondary', '&:hover': { color: 'error.main' }, '&.Mui-disabled': { opacity: 0.4 } }}
                  >
                    <Trash2 size={16} aria-hidden />
                  </ButtonBase>
                </Box>
              ))
            )}
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <Typography sx={{ fontWeight: 800, fontSize: 28, lineHeight: 1, letterSpacing: '-.03em', fontVariantNumeric: 'tabular-nums' }}>
              {litros(metrica.consumido)}
            </Typography>
            <Typography sx={{ fontWeight: 600, fontSize: 12.5, color: 'text.secondary' }}>/ {litros(metrica.meta)} L</Typography>
          </Box>
          <Box
            role="progressbar"
            aria-label="água do dia"
            aria-valuenow={Math.round(metrica.percentual)}
            aria-valuemin={0}
            aria-valuemax={100}
            sx={{ height: 14, borderRadius: '7px', bgcolor: 'agua.trilha', overflow: 'hidden' }}
          >
            <Box
              sx={(t) => ({
                height: '100%',
                borderRadius: '7px',
                width: `${largura}%`,
                background: (t.vars ?? t).palette.agua.gradiente,
                transition: 'width .7s cubic-bezier(.22,1,.36,1)',
              })}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: '8px' }}>
            {presets.map((ml, indice) => (
              <ButtonBase key={indice} disabled={ocupado} onClick={() => aoAdicionar(ml)} sx={estiloBotaoMl}>
                +{ml}ml
              </ButtonBase>
            ))}
            <ButtonBase
              disabled={ocupado}
              aria-expanded={outroAberto}
              onClick={() => setOutroAberto((v) => !v)}
              sx={(t) => ({ ...estiloBotaoMl(t), ...(outroAberto && { borderColor: 'status.sobrou', color: 'status.sobrou' }) })}
            >
              outro
            </ButtonBase>
          </Box>
          {outroAberto && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BotaoPasso simbolo="−" tamanho={32} rotulo="diminuir 50ml" disabled={valorOutro === null || valorOutro <= 1} onClick={() => setTextoOutro(String(somarAvulso(textoOutro, -50)))} />
              <TextField
                type="number"
                size="small"
                autoFocus
                aria-label="quantidade de água em ml"
                value={textoOutro}
                onChange={(e) => setTextoOutro(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') adicionarOutro();
                }}
                slotProps={{ htmlInput: { inputMode: 'numeric', min: 1, max: AVULSO_MAXIMO, step: 50 } }}
                sx={{ ...estiloCampoMl, width: 88 }}
              />
              <Typography sx={{ fontWeight: 500, fontSize: 13, color: 'text.secondary' }}>ml</Typography>
              <BotaoPasso simbolo="+" tamanho={32} rotulo="aumentar 50ml" disabled={valorOutro !== null && valorOutro >= AVULSO_MAXIMO} onClick={() => setTextoOutro(String(somarAvulso(textoOutro, 50)))} />
              <BotaoCta altura={36} disabled={ocupado || valorOutro === null} onClick={adicionarOutro} sx={{ flex: 1 }}>
                adicionar
              </BotaoCta>
            </Box>
          )}
        </Box>
      )}
      {confirmacao}
    </Box>
  );
}
