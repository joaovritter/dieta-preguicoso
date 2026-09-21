import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { Settings } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import AbaComentarios from '../components/perfil/AbaComentarios';
import AbaGruposPerfil from '../components/perfil/AbaGruposPerfil';
import AbaPublicacoes from '../components/perfil/AbaPublicacoes';
import AbaSalvos from '../components/perfil/AbaSalvos';
import EditorFotoPerfil from '../components/perfil/EditorFotoPerfil';
import Erro from '../components/Erro';
import Segmentado from '../components/social/Segmentado';
import Tela from '../components/ui/Tela';
import { api, mensagemDoErro } from '../lib/api';
import { milhar } from '../lib/format';

type Aba = 'publicacoes' | 'salvos' | 'grupos' | 'comentarios';

function lerAba(valor: string | null, comComentarios: boolean): Aba {
  if (valor === 'salvos') return 'salvos';
  if (valor === 'grupos') return 'grupos';
  if (valor === 'comentarios' && comComentarios) return 'comentarios';
  return 'publicacoes';
}

function Estatistica({ valor, rotulo }: { valor: number | null; rotulo: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', minWidth: 56 }}>
      <Typography sx={{ fontWeight: 700, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>
        {valor === null ? '—' : milhar(valor)}
      </Typography>
      <Typography sx={{ fontSize: 10.5, color: 'text.secondary' }}>{rotulo}</Typography>
    </Box>
  );
}

export default function PerfilPage() {
  const { perfil } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [erro, setErro] = useState<string | null>(null);
  const [contadores, setContadores] = useState<{ total_posts: number; total_amigos: number } | null>(null);

  useEffect(() => {
    if (perfil === null) return;
    api
      .perfilPublico(perfil.id)
      .then(({ perfil: publico }) =>
        setContadores({ total_posts: publico.total_posts, total_amigos: publico.total_amigos }),
      )
      .catch((falha: unknown) => setErro(mensagemDoErro(falha)));
  }, [perfil]);

  if (perfil === null) return null;

  const comComentarios = !perfil.esconder_comentarios_perfil;
  const aba = lerAba(params.get('aba'), comComentarios);
  const opcoesAba = [
    { valor: 'publicacoes' as const, rotulo: 'publicações' },
    { valor: 'salvos' as const, rotulo: 'salvos' },
    { valor: 'grupos' as const, rotulo: 'grupos' },
    ...(comComentarios ? [{ valor: 'comentarios' as const, rotulo: 'comentários' }] : []),
  ];

  return (
    <Tela gap={22}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography component="h1" sx={{ m: 0, fontWeight: 800, fontSize: 22, letterSpacing: '-.02em' }}>
          perfil
        </Typography>
        <ButtonBase
          onClick={() => navigate('/configuracoes')}
          aria-label="configurações"
          sx={{ minHeight: 36, minWidth: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}
        >
          <Settings size={22} strokeWidth={1.8} />
        </ButtonBase>
      </Box>

      {erro !== null && <Erro mensagem={erro} aoFechar={() => setErro(null)} />}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <EditorFotoPerfil tamanho={72} aoFalhar={setErro} />
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-around' }}>
          <Estatistica valor={contadores?.total_posts ?? null} rotulo="posts" />
          <Estatistica valor={contadores?.total_amigos ?? null} rotulo="seguidores" />
          <Estatistica valor={contadores?.total_amigos ?? null} rotulo="seguindo" />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <Typography component="h2" sx={{ m: 0, fontWeight: 700, fontSize: 17, overflowWrap: 'anywhere' }}>
          {perfil.nome}
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
          {perfil.nome}#{perfil.tag}
        </Typography>
      </Box>

      <Segmentado
        rotulo="seções do perfil"
        opcoes={opcoesAba}
        valor={aba}
        aoMudar={(nova) => setParams({ aba: nova }, { replace: true })}
      />

      {aba === 'publicacoes' && <AbaPublicacoes userId={perfil.id} />}
      {aba === 'salvos' && <AbaSalvos />}
      {aba === 'grupos' && <AbaGruposPerfil />}
      {aba === 'comentarios' && comComentarios && <AbaComentarios />}
    </Tela>
  );
}
