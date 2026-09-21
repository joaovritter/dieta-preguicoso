import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import InputBase from '@mui/material/InputBase';
import Typography from '@mui/material/Typography';
import Avatar from '../../components/social/Avatar';
import BarraBuscaAmigos from '../../components/social/BarraBuscaAmigos';
import BotaoTracejado from '../../components/social/BotaoTracejado';
import LinhaPessoa from '../../components/social/LinhaPessoa';
import { useConfirmacao } from '../../components/useConfirmacao';
import { api, mensagemDoErro } from '../../lib/api';
import { filtrarAmigos } from '../../lib/social';
import type { MembroComProgresso, PedidosAmizade } from '../../lib/types';

const rotuloSecao = {
  fontWeight: 600,
  fontSize: 9.5,
  letterSpacing: '.16em',
  textTransform: 'uppercase',
  color: 'text.secondary',
  mb: '8px',
} as const;

const botaoMini = {
  fontFamily: 'inherit',
  fontWeight: 600,
  fontSize: 12,
  minHeight: 36,
  px: '10px',
  borderRadius: '9px',
} as const;

export default function AbaAmigos() {
  const [amigos, setAmigos] = useState<MembroComProgresso[] | null>(null);
  const [pedidos, setPedidos] = useState<PedidosAmizade | null>(null);
  const [adicionando, setAdicionando] = useState(false);
  const [nomeTag, setNomeTag] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [busca, setBusca] = useState('');
  const { confirmar, elemento: confirmacao } = useConfirmacao();
  const amigosFiltrados = filtrarAmigos(busca, amigos ?? []);

  const carregar = useCallback(async () => {
    try {
      const [lista, pendentes] = await Promise.all([api.amigos(), api.pedidos()]);
      setAmigos(lista.amigos);
      setPedidos(pendentes);
      setErro(null);
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function comOcupado(acao: () => Promise<unknown>) {
    setOcupado(true);
    try {
      await acao();
      setErro(null);
      await carregar();
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    } finally {
      setOcupado(false);
    }
  }

  async function comConfirmacao(pedido: { titulo: string; texto: string; rotulo: string }, acao: () => Promise<unknown>) {
    if (await confirmar(pedido)) await comOcupado(acao);
  }

  function pedir(evento: React.FormEvent) {
    evento.preventDefault();
    const valor = nomeTag.trim();
    if (valor === '') return;
    void comOcupado(async () => {
      await api.pedirAmizade(valor);
      setNomeTag('');
      setAdicionando(false);
      setAviso(`pedido enviado para ${valor}`);
    });
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {erro !== null && (
        <Alert severity="error" onClose={() => setErro(null)}>
          {erro}
        </Alert>
      )}
      {aviso !== null && (
        <Alert severity="success" onClose={() => setAviso(null)}>
          {aviso}
        </Alert>
      )}

      <BarraBuscaAmigos valor={busca} aoMudar={setBusca} />

      {amigos === null || pedidos === null ? (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>carregando...</Typography>
      ) : (
        <>
          {pedidos.recebidos.length > 0 && (
            <Box>
              <Typography sx={rotuloSecao}>pedidos recebidos</Typography>
              {pedidos.recebidos.map((pedido) => (
                <Box key={pedido.id} sx={{ display: 'flex', alignItems: 'center', gap: '12px', py: '9px', borderTop: 1, borderColor: 'neutro.linha' }}>
                  <Avatar nome={pedido.perfil.nome} tamanho={40} />
                  <Typography noWrap sx={{ flex: 1, fontWeight: 600, fontSize: 14 }}>
                    {pedido.perfil.nome_tag}
                  </Typography>
                  <ButtonBase
                    disabled={ocupado}
                    sx={{ ...botaoMini, bgcolor: 'primary.main', color: 'primary.contrastText' }}
                    onClick={() => void comOcupado(() => api.aceitarPedido(pedido.id))}
                  >
                    aceitar
                  </ButtonBase>
                  <ButtonBase
                    disabled={ocupado}
                    sx={{ ...botaoMini, color: 'text.secondary' }}
                    onClick={() =>
                      void comConfirmacao(
                        {
                          titulo: 'recusar pedido',
                          texto: `o pedido de ${pedido.perfil.nome_tag} some. para virar amizade depois, precisa de um pedido novo.`,
                          rotulo: 'recusar',
                        },
                        () => api.recusarPedido(pedido.id),
                      )
                    }
                  >
                    recusar
                  </ButtonBase>
                </Box>
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {amigos.length === 0 && (
              <Typography sx={{ fontSize: 13, color: 'text.secondary', py: '9px' }}>nenhum amigo ainda</Typography>
            )}
            {amigos.length > 0 && amigosFiltrados.length === 0 && (
              <Typography sx={{ fontSize: 13, color: 'text.secondary', py: '9px' }}>nenhum amigo com esse nome</Typography>
            )}
            {amigosFiltrados.map((amigo) => (
              <LinhaPessoa
                key={amigo.perfil.id}
                perfil={amigo.perfil}
                progresso={amigo.progresso_hoje}
                acao={
                  <ButtonBase
                    disabled={ocupado}
                    aria-label={`remover ${amigo.perfil.nome_tag}`}
                    sx={{ ...botaoMini, color: 'error.main' }}
                    onClick={() =>
                      void comConfirmacao(
                        { titulo: 'remover amigo', texto: 'vocês deixam de ver o progresso um do outro no feed.', rotulo: 'remover' },
                        () => api.removerAmigo(amigo.perfil.id),
                      )
                    }
                  >
                    remover
                  </ButtonBase>
                }
              />
            ))}

            {pedidos.enviados.map((pedido) => (
              <Box key={pedido.id} sx={{ display: 'flex', alignItems: 'center', gap: '12px', py: '9px', borderTop: 1, borderColor: 'neutro.linha' }}>
                <Avatar nome={pedido.perfil.nome} tamanho={40} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 600, fontSize: 14 }}>
                    {pedido.perfil.nome_tag}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>aguardando resposta</Typography>
                </Box>
                <ButtonBase
                  disabled={ocupado}
                  sx={{ ...botaoMini, color: 'text.secondary' }}
                  onClick={() =>
                    void comConfirmacao(
                      { titulo: 'cancelar pedido', texto: `o pedido para ${pedido.perfil.nome_tag} some. você pode mandar outro depois.`, rotulo: 'cancelar pedido' },
                      () => api.recusarPedido(pedido.id),
                    )
                  }
                >
                  cancelar
                </ButtonBase>
              </Box>
            ))}

            {adicionando ? (
              <Box component="form" onSubmit={pedir} sx={{ display: 'flex', gap: '8px', mt: '6px' }}>
                <InputBase
                  autoFocus
                  value={nomeTag}
                  onChange={(e) => setNomeTag(e.target.value)}
                  placeholder="nome#0000"
                  inputProps={{ 'aria-label': 'nome e tag de quem você quer adicionar' }}
                  sx={{ flex: 1, minHeight: 46, px: '12px', border: '1.4px solid', borderColor: 'neutro.borda', borderRadius: '12px', fontSize: 14 }}
                />
                <Button type="submit" variant="contained" disabled={ocupado} sx={{ borderRadius: '12px' }}>
                  pedir
                </Button>
              </Box>
            ) : (
              <BotaoTracejado onClick={() => setAdicionando(true)}>+ adicionar amigo</BotaoTracejado>
            )}
          </Box>
        </>
      )}
      {confirmacao}
    </Box>
  );
}
