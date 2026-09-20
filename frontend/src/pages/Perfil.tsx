import { useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { api, mensagemDoErro } from '../lib/api';
import { milhar } from '../lib/format';
import { useRefeicoes } from '../lib/RefeicoesContext';
import { litros } from '../lib/visual';
import Erro from '../components/Erro';
import DialogoDesativarConta from '../components/perfil/DialogoDesativarConta';
import SecaoConta from '../components/perfil/SecaoConta';
import Interruptor from '../components/ui/Interruptor';
import LinhaLista from '../components/ui/LinhaLista';
import RotuloSecao from '../components/ui/RotuloSecao';
import Segmentado from '../components/ui/Segmentado';
import Tela from '../components/ui/Tela';
import type { ReactNode } from 'react';

type Modo = 'system' | 'light' | 'dark';

function Secao({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <RotuloSecao sx={{ mb: '8px' }}>{rotulo}</RotuloSecao>
      {children}
    </Box>
  );
}

const valorForte = { fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums' } as const;
const valorFraco = { fontWeight: 500, fontSize: 12.5, color: 'text.secondary' } as const;

export default function PerfilPage() {
  const { perfil, definirPerfil } = useAuth();
  const { refeicoes } = useRefeicoes();
  const { mode, setMode } = useColorScheme();
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [salvandoModo, setSalvandoModo] = useState(false);
  const [desativandoConta, setDesativandoConta] = useState(false);

  if (perfil === null) return null;
  const nomeTag = `${perfil.nome}#${perfil.tag}`;

  async function trocarModoPreguicoso(ligado: boolean) {
    if (perfil === null) return;
    setSalvandoModo(true);
    setErro(null);
    try {
      definirPerfil(await api.salvarPerfil({ modo_preguicoso: ligado }));
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    } finally {
      setSalvandoModo(false);
    }
  }

  async function copiarIdentidade() {
    try {
      await navigator.clipboard.writeText(nomeTag);
      setAviso('copiado');
    } catch {
      setAviso(`não consegui copiar — você é ${nomeTag}`);
    }
  }

  return (
    <Tela gap={26}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '14px', pt: '4px' }}>
        <Box
          aria-hidden="true"
          sx={{ width: 58, height: 58, borderRadius: '50%', flex: 'none', bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22 }}
        >
          {perfil.nome.trim().charAt(0).toUpperCase()}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <Typography component="h1" sx={{ m: 0, fontWeight: 700, fontSize: 17, overflowWrap: 'anywhere' }}>{perfil.nome}</Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', overflowWrap: 'anywhere' }}>{perfil.email}</Typography>
        </Box>
        <ButtonBase onClick={() => navigate('/perfil/dados')} sx={{ minHeight: 32, fontFamily: 'inherit', fontWeight: 600, fontSize: 12.5, color: 'primary.main' }}>
          editar
        </ButtonBase>
      </Box>

      {erro !== null && <Erro mensagem={erro} aoFechar={() => setErro(null)} />}

      <Secao rotulo="metas">
        <LinhaLista rotulo="meta diária" chevron onClick={() => navigate('/perfil/metas')} valor={<Box component="span" sx={valorForte}>{milhar(perfil.meta_calorias)} kcal</Box>} />
        <LinhaLista
          rotulo="macros"
          chevron
          onClick={() => navigate('/perfil/metas')}
          valor={
            <Box component="span" sx={valorFraco}>
              C {Math.round(perfil.meta_carboidrato_g)} · P {Math.round(perfil.meta_proteina_g)} · G {Math.round(perfil.meta_gordura_g)}
            </Box>
          }
        />
        <LinhaLista rotulo="água" chevron onClick={() => navigate('/perfil/metas')} valor={<Box component="span" sx={valorFraco}>{litros(perfil.meta_agua_ml)} L</Box>} />
      </Secao>

      <Secao rotulo="registro">
        <LinhaLista rotulo="modo preguiçoso">
          <Typography component="span" sx={{ fontSize: 11.5, color: 'text.secondary', mr: '4px' }}>sem confirmação</Typography>
          <Interruptor
            rotulo="modo preguiçoso"
            ligado={perfil.modo_preguicoso}
            disabled={salvandoModo}
            aoMudar={(v) => void trocarModoPreguicoso(v)}
          />
        </LinhaLista>
        <LinhaLista
          rotulo="refeições"
          chevron
          onClick={() => navigate('/perfil/refeicoes')}
          valor={<Box component="span" sx={valorFraco}>{refeicoes.length}</Box>}
        />
      </Secao>

      <Secao rotulo="identidade">
        <LinhaLista rotulo={<Box component="span" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{nomeTag}</Box>}>
          <ButtonBase onClick={() => void copiarIdentidade()} sx={{ minHeight: 32, px: '4px', fontFamily: 'inherit', fontWeight: 600, fontSize: 12.5, color: 'primary.main' }}>
            copiar
          </ButtonBase>
        </LinhaLista>
        <Typography role="status" sx={{ fontSize: 12, color: 'text.secondary', minHeight: 16 }}>
          {aviso ?? 'é assim que teus amigos te encontram'}
        </Typography>
      </Secao>

      <Secao rotulo="aparência">
        <Box sx={{ pt: '10px', borderTop: '1px solid', borderColor: 'neutro.linha' }}>
          <Segmentado<Modo>
            rotulo="tema"
            valor={mode ?? 'system'}
            aoMudar={setMode}
            opcoes={[
              { valor: 'system', rotulo: 'sistema' },
              { valor: 'light', rotulo: 'claro' },
              { valor: 'dark', rotulo: 'escuro' },
            ]}
          />
        </Box>
      </Secao>

      <SecaoConta
        antesDeSair={<LinhaLista rotulo="trocar senha" chevron onClick={() => navigate('/perfil/senha')} />}
        depoisDeSair={
          <LinhaLista rotulo="desativar conta" cor="perigo" ultima onClick={() => setDesativandoConta(true)} />
        }
      />
      <DialogoDesativarConta aberto={desativandoConta} aoFechar={() => setDesativandoConta(false)} />
    </Tela>
  );
}
