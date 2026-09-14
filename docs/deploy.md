# Deploy na VPS (Contabo)

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

## Cadastro

Fica **aberto** (`PERMITIR_CADASTRO=true`, que já é o padrão): a rede social só funciona se
os seus amigos conseguirem criar conta neste mesmo servidor.

Se você já tinha fechado o cadastro numa instalação anterior, reabra assim:

```bash
sed -i 's/^PERMITIR_CADASTRO=.*/PERMITIR_CADASTRO=true/' .env
docker compose up -d backend
```

O que segura abuso com o cadastro aberto: `/api/auth/*` aceita no máximo 15 tentativas por
IP a cada 15 minutos, senha tem mínimo de 8 caracteres e hash bcrypt. Não é muito — é o
suficiente para um servidor entre amigos, não para um cadastro público de verdade.

Para trancar depois (só quem já tem conta continua entrando), é o mesmo comando com `false`;
aí `POST /api/auth/register` passa a responder `403 CADASTRO_DESABILITADO`.

## Firewall

Com o cadastro aberto e amigos usando de casa, a porta do app precisa ficar aberta —
travar por IP só valeria se você fosse o único usuário. Feche todo o resto:

```bash
ufw default deny incoming
ufw allow ssh
ufw allow 8080/tcp
ufw enable
```

**Enquanto não houver domínio e HTTPS, tudo trafega em claro** — inclusive a senha de quem
faz login. Avise o pessoal para não reaproveitar uma senha importante aqui, e resolva o TLS
assim que o domínio chegar.

## Domínio e HTTPS (dieta.trainna.com.br)

**1. DNS.** No painel de `trainna.com.br`, crie um registro `A` com nome `dieta` apontando
para o IP da VPS. Confira antes de seguir:

```bash
dig +short dieta.trainna.com.br    # tem que devolver o IP da VPS
```

Se `trainna.com.br` estiver atrás do Cloudflare, deixe esse registro como **DNS only**
(nuvem cinza). Com a nuvem laranja quem responde pelo domínio é o Cloudflare, e o Caddy
fica tentando validar um endereço que nunca chega nele.

**2. Certificado.** O Caddy cuida do Let's Encrypt sozinho:

```bash
apt install -y caddy
echo 'dieta.trainna.com.br {
  reverse_proxy localhost:8080
}' > /etc/caddy/Caddyfile
systemctl restart caddy
ufw allow 80,443/tcp && ufw delete allow 8080/tcp
```

**3. Avise o backend que agora são dois proxies.** A cadeia virou Caddy → nginx → API, e o
limite de tentativas de login conta por IP. Sem esse ajuste o backend enxerga o IP do proxy
em vez do IP de quem está acessando, e 15 tentativas erradas de uma pessoa trancam o grupo
inteiro:

```bash
sed -i 's/^TRUST_PROXY=.*/TRUST_PROXY=2/' .env   # se a linha não existir, acrescente
docker compose up -d backend
```

Pronto: o app vive em `https://dieta.trainna.com.br`, a porta 8080 sai do ar e as senhas
param de trafegar em claro. Não há CORS para configurar — o nginx serve o app e faz proxy
de `/api` na mesma origem.

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
