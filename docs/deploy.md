# Deploy na VPS (Contabo, sem domínio)

## Pré-requisitos

Docker e Docker Compose na VPS:

```bash
curl -fsSL https://get.docker.com | sh
```

## Subir

```bash
git clone <seu-repo> dieta-preguicoso && cd dieta-preguicoso
cp .env.example .env
openssl rand -hex 32   # cole em JWT_SECRET
openssl rand -hex 16   # cole em POSTGRES_PASSWORD
nano .env              # preencha também OPENAI_API_KEY
docker compose up -d --build
```

O app fica em `http://SEU_IP:8080`. As migrations rodam sozinhas no boot do backend.

Verificar:

```bash
docker compose ps
docker compose logs -f backend
curl http://localhost:8080/api/health   # {"ok":true}
```

## Fechar o cadastro

Crie sua conta na tela de login e então:

```bash
sed -i 's/^PERMITIR_CADASTRO=.*/PERMITIR_CADASTRO=false/' .env
docker compose up -d backend
```

Depois disso `POST /api/auth/register` responde `403 CADASTRO_DESABILITADO`. Isso importa:
sem domínio e sem HTTPS, o IP:porta acaba sendo varrido por bots mais cedo ou mais tarde.

**Atenção com os amigos:** a rede social precisa que as outras pessoas tenham conta neste
mesmo servidor. Deixe `PERMITIR_CADASTRO=true` enquanto o grupo está entrando e feche depois
(`docker compose up -d backend` aplica na hora, nos dois sentidos).

## Firewall

Sem domínio e sem TLS, o tráfego (inclusive a senha no login) trafega em claro. Restrinja
o acesso ao seu IP em vez de deixar a porta aberta para a internet:

```bash
ufw default deny incoming
ufw allow ssh
ufw allow from SEU_IP_RESIDENCIAL to any port 8080 proto tcp
ufw enable
```

Se seu IP for dinâmico, a alternativa mais simples é acessar por túnel SSH e não expor
porta nenhuma:

```bash
# remova a seção `ports` do serviço frontend, depois, na sua máquina:
ssh -L 8080:localhost:8080 usuario@SEU_IP
```

## Atualizar

```bash
git pull
docker compose up -d --build
```

## Backup

O dump vale mais que o resto: é o seu diário alimentar. As mídias são descartáveis.

```bash
mkdir -p ~/backups
docker compose exec -T postgres pg_dump -U dieta dieta | gzip > ~/backups/dieta-$(date +%F).sql.gz
```

Diário às 3h, guardando 30 dias:

```bash
crontab -e
```

```cron
0 3 * * * cd /caminho/para/dieta-preguicoso && docker compose exec -T postgres pg_dump -U dieta dieta | gzip > ~/backups/dieta-$(date +\%F).sql.gz && find ~/backups -name 'dieta-*.sql.gz' -mtime +30 -delete
```

Copie os dumps para fora da VPS de vez em quando — backup que mora no mesmo disco não é backup.

## Restaurar

```bash
gunzip -c ~/backups/dieta-2026-09-10.sql.gz | docker compose exec -T postgres psql -U dieta -d dieta
```

## Custo de IA

Cada foto é uma chamada de visão (`detail: low`, ~85 tokens de imagem) e cada áudio uma de
Whisper mais uma de chat. Para uso pessoal isso fica na casa de centavos por dia. Se quiser
apertar, troque `OPENAI_MODEL_TEXTO` e `OPENAI_MODEL_VISAO` para `gpt-4o-mini` no `.env` —
a estimativa fica mais grosseira, mas a tela de confirmação existe justamente para corrigir.
