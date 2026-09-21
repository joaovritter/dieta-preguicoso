import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import GradeCalendario from '../components/calendario/GradeCalendario';
import CardPost from '../components/CardPost';
import Avatar from '../components/social/Avatar';
import { useFeed } from '../components/social/useFeed';
import { api, mensagemDoErro } from '../lib/api';
import { hojeISO, milhar, numero } from '../lib/format';
import { textoDoDia } from '../lib/social';
import { deslocarMes, mesLongo } from '../lib/visual';
import type { CalendarioMes, MembroComProgresso } from '../lib/types';

function Estatistica({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', minWidth: 56 }}>
      <Typography sx={{ fontWeight: 700, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{milhar(valor)}</Typography>
      <Typography sx={{ fontSize: 10.5, color: 'text.secondary' }}>{rotulo}</Typography>
    </Box>
  );
}

export default function PerfilPublico() {
  const { id = '' } = useParams();
  const hoje = hojeISO();
  const mesAtual = hoje.slice(0, 7);
  const [pessoa, setPessoa] = useState<MembroComProgresso | null>(null);
  const [mes, setMes] = useState(mesAtual);
  const [calendario, setCalendario] = useState<CalendarioMes | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const buscar = useCallback((antes?: string) => api.refeicoesDe(id, antes), [id]);
  const feed = useFeed(buscar);

  useEffect(() => {
    api
      .perfilPublico(id)
      .then(setPessoa)
      .catch((falha: unknown) => setErro(mensagemDoErro(falha)));
  }, [id]);

  useEffect(() => {
    setCalendario(null);
    api
      .calendarioDe(id, mes)
      .then(setCalendario)
      .catch((falha: unknown) => setErro(mensagemDoErro(falha)));
  }, [id, mes]);

  const erroGeral = erro ?? feed.erro;

  return (
    <Box component="main" sx={{ px: '22px', pt: '14px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: 480, mx: 'auto' }}>
      <Box component={Link} to="/social" sx={{ display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600, fontSize: 13, color: 'text.secondary', textDecoration: 'none', minHeight: 44 }}>
        <ChevronLeft size={16} /> social
      </Box>

      {erroGeral !== null && (
        <Alert severity="error" onClose={() => { setErro(null); feed.limparErro(); }}>
          {erroGeral}
        </Alert>
      )}

      {pessoa === null ? (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>carregando...</Typography>
      ) : (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <Avatar nome={pessoa.perfil.nome} fotoUrl={pessoa.perfil.foto_url} tamanho={72} />
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-around' }}>
              <Estatistica valor={pessoa.perfil.total_posts} rotulo="posts" />
              <Estatistica valor={pessoa.perfil.total_amigos} rotulo="seguidores" />
              <Estatistica valor={pessoa.perfil.total_amigos} rotulo="seguindo" />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Typography noWrap sx={{ fontWeight: 700, fontSize: 17 }}>
              {pessoa.perfil.nome_tag}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
              {textoDoDia(pessoa.progresso_hoje)} · {numero(pessoa.progresso_hoje.calorias)} /{' '}
              {numero(pessoa.progresso_hoje.meta_calorias)} kcal
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ fontWeight: 700, fontSize: 15 }}>calendário</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                <IconButton aria-label="mês anterior" onClick={() => setMes(deslocarMes(mes, -1))} size="small">
                  <ChevronLeft size={16} />
                </IconButton>
                <Typography sx={{ fontWeight: 500, fontSize: 12.5 }}>{mesLongo(mes)}</Typography>
                <IconButton aria-label="mês seguinte" disabled={mes >= mesAtual} onClick={() => setMes(deslocarMes(mes, 1))} size="small">
                  <ChevronRight size={16} />
                </IconButton>
              </Box>
            </Box>
            {calendario === null ? (
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>carregando o mês...</Typography>
            ) : (
              <GradeCalendario dias={calendario.dias} hoje={hoje} selecionada={null} />
            )}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Typography sx={{ fontWeight: 600, fontSize: 9.5, letterSpacing: '.16em', textTransform: 'uppercase', color: 'text.secondary' }}>
              refeições
            </Typography>
            {feed.feed === null ? (
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>carregando as refeições...</Typography>
            ) : feed.feed.posts.length === 0 ? (
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>nada registrado ainda</Typography>
            ) : (
              feed.feed.posts.map((post) => (
                <CardPost key={post.id} post={post} aoCurtir={feed.curtir} aoComentar={feed.abrirComentarios} aoSalvar={feed.salvar} />
              ))
            )}
            {feed.feed !== null && feed.feed.proximo_antes !== null && (
              <Button variant="outlined" disabled={feed.carregando} onClick={() => void feed.carregarMais()} sx={{ borderRadius: '12px', minHeight: 46 }}>
                {feed.carregando ? 'carregando...' : 'carregar mais'}
              </Button>
            )}
          </Box>
        </>
      )}
      {feed.folha}
    </Box>
  );
}
