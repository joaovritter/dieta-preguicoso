import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Dialog from '@mui/material/Dialog';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import DetalheAlimento from './detalhe/DetalheAlimento';
import Erro from './Erro';
import BotaoCta from './ui/BotaoCta';
import RotuloSecao from './ui/RotuloSecao';
import { milhar, numero, somarAlimentos } from '../lib/format';
import { mensagemDoErro } from '../lib/api';
import { useRefeicoes } from '../lib/RefeicoesContext';
import { corDaRefeicao } from '../lib/visual';
import type { Alimento, EntradaConfirmacao, Interpretacao, TipoEntrada } from '../lib/types';

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

const ORIGEM: Record<TipoEntrada, string> = { foto: 'foto', audio: 'áudio', texto: 'texto' };

export default function ConfirmacaoRegistro({ interpretacao, aoConfirmar, aoDescartar }: Props) {
  const { refeicoes } = useRefeicoes();
  const [alimentos, setAlimentos] = useState<Alimento[]>(interpretacao.alimentos);
  const [refeicaoId, setRefeicaoId] = useState<string>(interpretacao.refeicao_sugerida.id);
  const [editando, setEditando] = useState<number | 'novo' | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const totais = useMemo(() => somarAlimentos(alimentos), [alimentos]);
  const refeicao = refeicoes.find((r) => r.id === refeicaoId);
  const cor = corDaRefeicao(refeicaoId, refeicoes);

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

  function salvarDetalhe(alimento: Alimento) {
    setAlimentos((atual) => (editando === 'novo' ? [...atual, alimento] : atual.map((a, i) => (i === editando ? alimento : a))));
    setEditando(null);
  }

  function removerDetalhe() {
    if (typeof editando === 'number') setAlimentos((atual) => atual.filter((_, i) => i !== editando));
    setEditando(null);
  }

  const emEdicao = editando === 'novo' ? ALIMENTO_VAZIO : editando === null ? undefined : alimentos[editando];

  return (
    <>
      <Drawer
        anchor="bottom"
        open
        onClose={aoDescartar}
        slotProps={{
          paper: {
            sx: (t) => ({
              maxWidth: 480,
              mx: 'auto',
              maxHeight: '92dvh',
              borderRadius: '26px 26px 0 0',
              bgcolor: 'background.default',
              backgroundImage: 'none',
              p: '22px',
              pb: 'calc(22px + env(safe-area-inset-bottom))',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              ...t.applyStyles('dark', { borderRadius: '20px 20px 0 0', borderTop: '1px solid', borderColor: 'neutro.borda' }),
            }),
          },
        }}
      >
        {erro !== null && <Erro mensagem={erro} aoFechar={() => setErro(null)} />}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <RotuloSecao>li da sua {ORIGEM[interpretacao.tipo_entrada]}</RotuloSecao>
          <Typography component="h2" sx={{ m: 0, fontWeight: 700, fontSize: 26, lineHeight: 1.1, letterSpacing: '-.025em' }}>
            confere aí?
          </Typography>
          {interpretacao.descricao_bruta !== '' && (
            <Typography sx={{ fontSize: 13, lineHeight: 1.45, color: 'text.secondary' }}>
              “{interpretacao.descricao_bruta}”
            </Typography>
          )}
        </Box>

        <Box role="radiogroup" aria-label="refeição" sx={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
          {refeicoes.map((r) => {
            const ativa = r.id === refeicaoId;
            return (
              <ButtonBase
                key={r.id}
                role="radio"
                aria-checked={ativa}
                onClick={() => setRefeicaoId(r.id)}
                sx={{
                  minHeight: 34,
                  px: '13px',
                  borderRadius: '9px',
                  fontFamily: 'inherit',
                  fontSize: 11.5,
                  fontWeight: ativa ? 600 : 500,
                  border: ativa ? 'none' : '1.4px solid',
                  borderColor: 'neutro.borda',
                  bgcolor: ativa ? 'pilula.sobrou.fg' : 'transparent',
                  color: ativa ? 'primary.contrastText' : 'text.secondary',
                }}
              >
                {r.nome.toLowerCase()}
              </ButtonBase>
            );
          })}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {alimentos.map((alimento, indice) => (
            <ButtonBase
              key={indice}
              onClick={() => setEditando(indice)}
              sx={{ display: 'flex', alignItems: 'center', gap: '10px', py: '12px', borderTop: '1px solid', borderColor: 'neutro.linha', fontFamily: 'inherit', textAlign: 'left' }}
            >
              <Box component="span" sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <Box component="span" sx={{ fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>{alimento.nome}</Box>
                <Box component="span" sx={{ fontSize: 11.5, lineHeight: 1, color: 'text.secondary' }}>{alimento.quantidade_estimada}</Box>
              </Box>
              <Box component="span" sx={{ fontWeight: 700, fontSize: 15, lineHeight: 1, fontVariantNumeric: 'tabular-nums', borderBottom: '1.6px solid', borderColor: 'text.primary', pb: '2px' }}>
                {numero(alimento.calorias)}
              </Box>
              <Box component="span" sx={{ fontWeight: 500, fontSize: 11, color: 'text.secondary' }}>kcal</Box>
            </ButtonBase>
          ))}
          <ButtonBase
            onClick={() => setEditando('novo')}
            sx={{ minHeight: 44, mt: '8px', border: '1.4px dashed', borderColor: 'neutro.borda', borderRadius: '11px', fontFamily: 'inherit', fontWeight: 500, fontSize: 12.5, color: 'text.secondary', '&:hover': { borderColor: 'text.primary', color: 'text.primary' } }}
          >
            + adicionar alimento
          </ButtonBase>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', pt: '14px', borderTop: '1.6px solid', borderColor: 'text.primary' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
            <Typography sx={{ fontWeight: 800, fontSize: 40, lineHeight: 0.9, letterSpacing: '-.035em', fontVariantNumeric: 'tabular-nums' }}>
              {milhar(totais.calorias)}
            </Typography>
            <Typography sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', pb: '4px' }}>kcal</Typography>
          </Box>
          <Typography sx={{ fontWeight: 500, fontSize: 11.5, lineHeight: 1.5, color: 'text.secondary', textAlign: 'right' }}>
            C {Math.round(totais.carboidrato_g)} · P {Math.round(totais.proteina_g)} · G {Math.round(totais.gordura_g)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: '9px' }}>
          <BotaoCta variante="perigo" disabled={salvando} onClick={aoDescartar} sx={{ flex: '0 0 38%' }}>
            descartar
          </BotaoCta>
          <BotaoCta disabled={alimentos.length === 0 || salvando} onClick={() => void confirmar()} sx={{ flex: 1 }}>
            {salvando ? 'salvando...' : 'confirmar'}
          </BotaoCta>
        </Box>
      </Drawer>

      <Dialog fullScreen open={emEdicao !== undefined} onClose={() => setEditando(null)} slotProps={{ paper: { sx: { bgcolor: 'background.default', backgroundImage: 'none' } } }}>
        {emEdicao !== undefined && (
          <DetalheAlimento
            key={String(editando)}
            alimento={emEdicao}
            refeicaoNome={refeicao?.nome.toLowerCase() ?? interpretacao.refeicao_sugerida.nome.toLowerCase()}
            cor={cor}
            salvando={false}
            comecarEditando={editando === 'novo'}
            aoVoltar={() => setEditando(null)}
            aoSalvar={salvarDetalhe}
            aoRemover={removerDetalhe}
          />
        )}
      </Dialog>
    </>
  );
}
