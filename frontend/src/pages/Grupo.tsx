import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { ChevronLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CardPost from '../components/CardPost';
import LinhaPessoa from '../components/social/LinhaPessoa';
import { useFeed } from '../components/social/useFeed';
import { useConfirmacao } from '../components/useConfirmacao';
import { api, mensagemDoErro } from '../lib/api';
import { membros, textoRanking } from '../lib/social';
import type { DetalheGrupo } from '../lib/types';

const rotuloSecao = {
  fontWeight: 600,
  fontSize: 9.5,
  letterSpacing: '.16em',
  textTransform: 'uppercase',
  color: 'text.secondary',
  mb: '8px',
} as const;

export default function GrupoPage() {
  const { id = '' } = useParams();
  const navegar = useNavigate();
  const [detalhe, setDetalhe] = useState<DetalheGrupo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const { confirmar, elemento: confirmacao } = useConfirmacao();
  const buscar = useCallback((antes?: string) => api.feedDoGrupo(id, antes), [id]);
  const feed = useFeed(buscar);

  useEffect(() => {
    api
      .grupo(id)
      .then(setDetalhe)
      .catch((falha: unknown) => setErro(mensagemDoErro(falha)));
  }, [id]);

  async function copiarCodigo(codigo: string) {
    try {
      await navigator.clipboard.writeText(codigo);
      setAviso('código copiado');
    } catch {
      setAviso(`não consegui copiar — o código é ${codigo}`);
    }
  }

  async function sair() {
    const nome = detalhe === null ? 'o grupo' : detalhe.grupo.nome;
    const ok = await confirmar({
      titulo: 'sair do grupo',
      texto: `você perde o feed de ${nome}. para voltar, vai precisar do código de convite.`,
      rotulo: 'sair',
    });
    if (!ok) return;
    try {
      await api.sairDoGrupo(id);
      navegar('/social?aba=grupos');
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    }
  }

  const ranking = detalhe === null ? null : textoRanking(detalhe.grupo.minha_posicao_semana);
  const erroGeral = erro ?? feed.erro;

  return (
    <Box component="main" sx={{ px: '22px', pt: '14px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: 480, mx: 'auto' }}>
      <Box component={Link} to="/social?aba=grupos" sx={{ display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600, fontSize: 13, color: 'text.secondary', textDecoration: 'none', minHeight: 44 }}>
        <ChevronLeft size={16} /> grupos
      </Box>

      {erroGeral !== null && (
        <Alert severity="error" onClose={() => { setErro(null); feed.limparErro(); }}>
          {erroGeral}
        </Alert>
      )}
      {aviso !== null && (
        <Alert severity="success" onClose={() => setAviso(null)}>
          {aviso}
        </Alert>
      )}

      {detalhe === null ? (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>carregando...</Typography>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Typography component="h1" sx={{ fontWeight: 700, fontSize: 22, letterSpacing: '-.02em' }}>
              {detalhe.grupo.nome}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
              {membros(detalhe.grupo.quantidade_membros)}
            </Typography>
            {ranking !== null && (
              <Typography sx={{ fontWeight: 600, fontSize: 12.5, color: 'primary.main' }}>{ranking}</Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Typography sx={{ flex: 1, fontWeight: 700, fontSize: 18, letterSpacing: '.2em', fontVariantNumeric: 'tabular-nums' }}>
              {detalhe.grupo.codigo_convite}
            </Typography>
            <Button variant="outlined" onClick={() => void copiarCodigo(detalhe.grupo.codigo_convite)} sx={{ borderRadius: '11px' }}>
              copiar código
            </Button>
          </Box>

          <Box>
            <Typography sx={rotuloSecao}>membros</Typography>
            {detalhe.membros.map((m) => (
              <LinhaPessoa key={m.perfil.id} perfil={m.perfil} progresso={m.progresso_hoje} />
            ))}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Typography sx={rotuloSecao}>feed</Typography>
            {feed.feed === null ? (
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>carregando o feed...</Typography>
            ) : feed.feed.posts.length === 0 ? (
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>nada registrado ainda por aqui</Typography>
            ) : (
              feed.feed.posts.map((post) => (
                <CardPost key={post.id} post={post} aoCurtir={feed.curtir} aoComentar={feed.abrirComentarios} />
              ))
            )}
            {feed.feed !== null && feed.feed.proximo_antes !== null && (
              <Button variant="outlined" disabled={feed.carregando} onClick={() => void feed.carregarMais()} sx={{ borderRadius: '12px', minHeight: 46 }}>
                {feed.carregando ? 'carregando...' : 'carregar mais'}
              </Button>
            )}
          </Box>

          <ButtonBase onClick={() => void sair()} sx={{ minHeight: 46, fontFamily: 'inherit', fontWeight: 500, fontSize: 14, color: 'error.main', mb: '8px' }}>
            sair do grupo
          </ButtonBase>
        </>
      )}
      {feed.folha}
      {confirmacao}
    </Box>
  );
}
