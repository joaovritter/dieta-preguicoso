import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { Check } from 'lucide-react';
import Overlay from '../Overlay';
import Erro from '../Erro';
import BotaoCta from '../ui/BotaoCta';
import { api, mensagemDoErro } from '../../lib/api';
import { milhar, numero, somarAlimentos } from '../../lib/format';
import { listaDeAlimentos } from '../../lib/social';
import type { Alimento, RefeicaoSalva } from '../../lib/types';

interface Props {
  aoUsar: (alimentos: Alimento[]) => void;
  aoFechar: () => void;
}

const macros = (item: RefeicaoSalva) =>
  `${milhar(item.calorias_total)} kcal · P ${Math.round(item.proteina_total_g)}g · C ${Math.round(item.carboidrato_total_g)}g · G ${Math.round(item.gordura_total_g)}g`;

/** Passo 2: marca os ingredientes que quer. Tudo marcado = a refeição completa. */
function EscolherIngredientes({
  item,
  aoVoltar,
  aoUsar,
}: {
  item: RefeicaoSalva;
  aoVoltar: () => void;
  aoUsar: (alimentos: Alimento[]) => void;
}) {
  const [marcados, setMarcados] = useState<Set<number>>(() => new Set(item.alimentos.map((_, i) => i)));
  const escolhidos = item.alimentos.filter((_, i) => marcados.has(i));
  const completa = escolhidos.length === item.alimentos.length;
  const totais = somarAlimentos(escolhidos);

  function alternar(indice: number) {
    setMarcados((atual) => {
      const novo = new Set(atual);
      if (novo.has(indice)) novo.delete(indice);
      else novo.add(indice);
      return novo;
    });
  }

  return (
    <>
      <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: '-8px' }}>
        {item.nome} · desmarque o que não quer levar
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {item.alimentos.map((alimento, indice) => {
          const ligado = marcados.has(indice);
          return (
            <ButtonBase
              key={indice}
              role="checkbox"
              aria-checked={ligado}
              onClick={() => alternar(indice)}
              sx={{ display: 'flex', alignItems: 'center', gap: '12px', py: '12px', borderTop: '1px solid', borderColor: 'neutro.linha', fontFamily: 'inherit', textAlign: 'left' }}
            >
              <Box
                component="span"
                aria-hidden="true"
                sx={{
                  width: 22,
                  height: 22,
                  flex: 'none',
                  borderRadius: '7px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.6px solid',
                  borderColor: ligado ? 'primary.main' : 'neutro.borda',
                  bgcolor: ligado ? 'primary.main' : 'transparent',
                  color: 'primary.contrastText',
                }}
              >
                {ligado && <Check size={14} strokeWidth={3} />}
              </Box>
              <Box component="span" sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1px', opacity: ligado ? 1 : 0.5 }}>
                <Box component="span" sx={{ fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>{alimento.nome}</Box>
                <Box component="span" sx={{ fontSize: 11.5, color: 'text.secondary' }}>{alimento.quantidade_estimada}</Box>
              </Box>
              <Box component="span" sx={{ fontWeight: 700, fontSize: 14, fontVariantNumeric: 'tabular-nums', opacity: ligado ? 1 : 0.5 }}>
                {numero(alimento.calorias)} kcal
              </Box>
            </ButtonBase>
          );
        })}
      </Box>

      <Typography sx={{ fontSize: 12.5, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
        {milhar(totais.calorias)} kcal · P {Math.round(totais.proteina_g)}g · C {Math.round(totais.carboidrato_g)}g · G {Math.round(totais.gordura_g)}g
      </Typography>

      <Box sx={{ display: 'flex', gap: '9px' }}>
        <BotaoCta type="button" variante="contorno" onClick={aoVoltar} sx={{ flex: '0 0 38%' }}>
          voltar
        </BotaoCta>
        <BotaoCta type="button" disabled={escolhidos.length === 0} onClick={() => aoUsar(escolhidos)} sx={{ flex: 1 }}>
          {completa
            ? 'adicionar refeição completa'
            : `adicionar ${escolhidos.length} ingrediente${escolhidos.length === 1 ? '' : 's'}`}
        </BotaoCta>
      </Box>
    </>
  );
}

/** Folha do `+ › salvas`: escolhe uma refeição salva e leva ela inteira ou só alguns ingredientes. */
export default function EscolherSalva({ aoUsar, aoFechar }: Props) {
  const [salvos, setSalvos] = useState<RefeicaoSalva[] | null>(null);
  const [proximo, setProximo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [escolhida, setEscolhida] = useState<RefeicaoSalva | null>(null);

  useEffect(() => {
    let ativo = true;
    api.salvos().then(
      (pagina) => {
        if (!ativo) return;
        setSalvos(pagina.salvos);
        setProximo(pagina.proximo_antes);
      },
      (falha: unknown) => {
        if (ativo) setErro(mensagemDoErro(falha));
      },
    );
    return () => {
      ativo = false;
    };
  }, []);

  async function carregarMais() {
    if (proximo === null || salvos === null) return;
    setCarregando(true);
    try {
      const pagina = await api.salvos(proximo);
      setSalvos([...salvos, ...pagina.salvos]);
      setProximo(pagina.proximo_antes);
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Overlay titulo={escolhida === null ? 'refeições salvas' : 'o que adicionar?'} aoFechar={aoFechar}>
      {erro !== null && <Erro mensagem={erro} aoFechar={() => setErro(null)} />}

      {escolhida !== null ? (
        <EscolherIngredientes item={escolhida} aoVoltar={() => setEscolhida(null)} aoUsar={aoUsar} />
      ) : (
        <>
          {salvos === null ? (
            erro === null && <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>carregando...</Typography>
          ) : salvos.length === 0 ? (
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              nenhuma refeição salva ainda. salve pelo marcador de um post ou ao confirmar uma refeição.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {salvos.map((item) => (
                <ButtonBase
                  key={item.id}
                  onClick={() => setEscolhida(item)}
                  sx={[
                    { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '3px', p: '14px', borderRadius: '14px', bgcolor: 'neutro.cartao', fontFamily: 'inherit', textAlign: 'left' },
                    (t) => t.applyStyles('dark', { border: '1px solid', borderColor: 'neutro.borda' }),
                  ]}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: 14.5, overflowWrap: 'anywhere' }}>{item.nome}</Typography>
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary', overflowWrap: 'anywhere' }}>{listaDeAlimentos(item.alimentos)}</Typography>
                  <Typography sx={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{macros(item)}</Typography>
                </ButtonBase>
              ))}
            </Box>
          )}

          {proximo !== null && (
            <BotaoCta type="button" variante="contorno" disabled={carregando} onClick={() => void carregarMais()}>
              {carregando ? 'carregando...' : 'carregar mais'}
            </BotaoCta>
          )}

          <BotaoCta type="button" variante="contorno" onClick={aoFechar}>
            cancelar
          </BotaoCta>
        </>
      )}
    </Overlay>
  );
}
