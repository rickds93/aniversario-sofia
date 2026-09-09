# aniversário-sofia

Convite do aniversário da Sofia com confirmação de presença salva em um backend Node.js + Express e banco SQLite.

## Requisitos

- Node.js 18+ (ou compatível com `fetch` no navegador)

## Como rodar

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Inicie o servidor:

   ```bash
   npm start
   ```

3. Abra no navegador:

   ```text
   http://localhost:3000
   ```

## API

### `POST /api/rsvp`

Recebe um JSON com os dados da confirmação:

```json
{
  "nome": "Maria",
  "acompanhantes": 2,
  "data_confirmacao": "2026-09-09T12:00:00.000Z"
}
```

Resposta de sucesso:

```json
{
  "message": "Maria, presença confirmada com 2 acompanhante(s). Até a festa!",
  "rsvp": {
    "id": 1,
    "nome": "Maria",
    "acompanhantes": 2,
    "data_confirmacao": "2026-09-09T12:00:00.000Z"
  }
}
```

## Banco de dados

- O SQLite é salvo localmente no arquivo `database.db`
- O arquivo do banco e `node_modules/` estão ignorados no Git