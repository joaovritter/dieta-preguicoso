import { describe, expect, it } from 'vitest';
import { dataLocal, intervaloDoDia, somarDias, timezoneValida } from './tempo.js';

describe('dataLocal', () => {
  it('usa o dia do fuso do usuário, não o UTC', () => {
    // 02:00Z de 11/03 ainda é 23:00 do dia 10 em São Paulo.
    const instante = new Date('2026-03-11T02:00:00Z');
    expect(dataLocal(instante, 'America/Sao_Paulo')).toBe('2026-03-10');
    expect(dataLocal(instante, 'UTC')).toBe('2026-03-11');
    expect(dataLocal(instante, 'Asia/Tokyo')).toBe('2026-03-11');
  });

  it('resolve a meia-noite local sem virar o dia', () => {
    const meiaNoite = new Date('2026-03-10T03:00:00Z'); // 00:00 em SP
    expect(dataLocal(meiaNoite, 'America/Sao_Paulo')).toBe('2026-03-10');
  });
});

describe('intervaloDoDia', () => {
  it('cobre exatamente 24h em dia sem mudança de fuso', () => {
    const { inicio, fim } = intervaloDoDia('2026-03-10', 'America/Sao_Paulo');
    expect(inicio.toISOString()).toBe('2026-03-10T03:00:00.000Z');
    expect(fim.toISOString()).toBe('2026-03-11T03:00:00.000Z');
  });

  it('o fim de um dia é o início do seguinte, sem buraco nem sobreposição', () => {
    const a = intervaloDoDia('2026-07-14', 'America/Sao_Paulo');
    const b = intervaloDoDia('2026-07-15', 'America/Sao_Paulo');
    expect(a.fim.getTime()).toBe(b.inicio.getTime());
  });

  it('sobrevive a uma virada de horário de verão', () => {
    // Nos EUA o relógio pula 1h no segundo domingo de março: o dia tem 23h.
    const { inicio, fim } = intervaloDoDia('2026-03-08', 'America/New_York');
    const horas = (fim.getTime() - inicio.getTime()) / 3_600_000;
    expect(horas).toBe(23);
  });
});

describe('somarDias', () => {
  it('atravessa a virada de mês', () => {
    expect(somarDias('2026-01-31', 1)).toBe('2026-02-01');
    expect(somarDias('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('anda para trás na janela de 7 dias da faixa semanal', () => {
    expect(somarDias('2026-09-10', -6)).toBe('2026-09-04');
  });
});

describe('timezoneValida', () => {
  it('separa fuso real de string qualquer', () => {
    expect(timezoneValida('America/Sao_Paulo')).toBe(true);
    expect(timezoneValida('Marte/Olympus')).toBe(false);
  });
});
