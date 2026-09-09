# Aniversário Sofia

Site com confirmação de presença para o aniversário de Sofia (4 anos) - Tema: A Bela e a Fera

## 🎉 Recursos

- Countdown até a festa
- Formulário de confirmação de presença
- Armazenamento automático de confirmações
- Download em TXT e CSV

## 🚀 Como Configurar

### Passo 1: Crie um Personal Access Token (PAT)
1. Vá para https://github.com/settings/tokens
2. Clique em "Generate new token (classic)"
3. Selecione as permissões: `repo`, `workflow`
4. Copie o token gerado

### Passo 2: Hospede a API no Vercel (GRÁTIS)
1. Acesse https://vercel.com
2. Faça login com sua conta GitHub
3. Clique em "Add New..." → "Project"
4. Selecione este repositório (`aniversario-sofia`)
5. Configure as variáveis de ambiente:
   - Nome: `GITHUB_TOKEN`
   - Valor: Cole o PAT do Passo 1
6. Clique em "Deploy"

### Passo 3: Atualize o URL da API no index.html
- Substitua `https://seu-vercel-url.vercel.app` pela URL do seu deploy no Vercel
- Procure por `fetch("/api/confirmacao"` no arquivo `index.html`

## 📝 Como Funciona

1. Visitante preenche o formulário
2. Dados são enviados para a API do Vercel
3. API lê o arquivo `files/confirmacaodepresenca.txt`
4. Valida se a pessoa já confirmou
5. Adiciona a confirmação ao arquivo
6. Faz commit automático no repositório

## 📄 Arquivo de Confirmações

Veja as confirmações em: `files/confirmacaodepresenca.txt`
