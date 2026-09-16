import { Router } from 'express';
import { z } from 'zod';
import { arredondar, metrica } from '../domain/nutricao.js';
import { dataLocal, intervaloDoDia, somarDias } from '../domain/tempo.js';
import { perfilDe } from '../middleware/autenticar.js';
import { totalAguaNoIntervalo } from '../repos/agua.js';
import { listarNoIntervalo } from '../repos/registros.js';
import { listarRefeicoes } from '../repos/refeicoes.js';

export const rotasResumo: Router = Router();

const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;
const dataOpcional = z.string().regex(RE_DATA, 'data deve estar no formato YYYY-MM-DD').optional();

rotasResumo.get('/dia', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const { data } = z.object({ data: dataOpcional }).parse(req.query);
    const dia = data ?? dataLocal(new Date(), perfil.timezone);
    const { inicio, fim } = intervaloDoDia(dia, perfil.timezone);

    const [registros, aguaMl] = await Promise.all([
      listarNoIntervalo(perfil.id, inicio, fim),
      totalAguaNoIntervalo(perfil.id, inicio, fim),
    ]);

    const consumido = registros.reduce(
      (acc, r) => ({
        calorias: acc.calorias + r.calorias_total,
        carboidrato_g: acc.carboidrato_g + r.carboidrato_total_g,
        proteina_g: acc.proteina_g + r.proteina_total_g,
        gordura_g: acc.gordura_g + r.gordura_total_g,
      }),
      { calorias: 0, carboidrato_g: 0, proteina_g: 0, gordura_g: 0 },
    );

    res.json({
      data: dia,
      calorias: metrica(consumido.calorias, perfil.meta_calorias),
      carboidrato_g: metrica(consumido.carboidrato_g, perfil.meta_carboidrato_g),
      proteina_g: metrica(consumido.proteina_g, perfil.meta_proteina_g),
      gordura_g: metrica(consumido.gordura_g, perfil.meta_gordura_g),
      agua_ml: metrica(aguaMl, perfil.meta_agua_ml),
      refeicoes: (await listarRefeicoes(perfil.id)).map((refeicao) => {
        const doGrupo = registros.filter((r) => r.refeicao_id === refeicao.id);
        return {
          refeicao_id: refeicao.id,
          refeicao_nome: refeicao.nome,
          calorias: arredondar(doGrupo.reduce((s, r) => s + r.calorias_total, 0)),
          quantidade_registros: doGrupo.length,
        };
      }),
    });
  } catch (e) {
    next(e);
  }
});

rotasResumo.get('/semana', async (req, res, next) => {
  try {
    const perfil = perfilDe(req);
    const { fim } = z.object({ fim: dataOpcional }).parse(req.query);
    const ultimoDia = fim ?? dataLocal(new Date(), perfil.timezone);

    // 7 dias terminando no dia pedido. Uma consulta por dia é aceitável aqui:
    // são 7 leituras indexadas de uma base de um usuário só.
    const dias = await Promise.all(
      Array.from({ length: 7 }, (_, i) => somarDias(ultimoDia, i - 6)).map(async (data) => {
        const { inicio, fim: fimDia } = intervaloDoDia(data, perfil.timezone);
        const registros = await listarNoIntervalo(perfil.id, inicio, fimDia);
        const calorias = arredondar(registros.reduce((s, r) => s + r.calorias_total, 0));
        return {
          data,
          calorias,
          meta_calorias: perfil.meta_calorias,
          percentual:
            perfil.meta_calorias > 0 ? arredondar((calorias / perfil.meta_calorias) * 100) : 0,
          tem_registro: registros.length > 0,
        };
      }),
    );

    res.json({ dias });
  } catch (e) {
    next(e);
  }
});
