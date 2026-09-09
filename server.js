const express = require("express");
const { rateLimit } = require("express-rate-limit");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const databasePath = path.join(__dirname, "database.db");
const db = new sqlite3.Database(databasePath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS rsvps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      acompanhantes INTEGER NOT NULL,
      data_confirmacao TEXT NOT NULL
    )
  `);
});

app.use(express.json());

const pageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições. Tente novamente mais tarde." },
});

const rsvpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas confirmações enviadas. Tente novamente mais tarde." },
});

app.get(["/", "/index.html"], pageLimiter, (request, response) => {
  response.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/rsvp", rsvpLimiter, (request, response) => {
  const nome = typeof request.body.nome === "string" ? request.body.nome.trim() : "";
  const acompanhantes = Number.parseInt(request.body.acompanhantes, 10);
  const dataConfirmacao = request.body.data_confirmacao;

  if (!nome) {
    return response.status(400).json({ error: "O nome do convidado é obrigatório." });
  }

  if (!Number.isInteger(acompanhantes) || acompanhantes < 0) {
    return response.status(400).json({ error: "A quantidade de acompanhantes é inválida." });
  }

  if (!dataConfirmacao || Number.isNaN(Date.parse(dataConfirmacao))) {
    return response.status(400).json({ error: "A data de confirmação é inválida." });
  }

  const statement = `
    INSERT INTO rsvps (nome, acompanhantes, data_confirmacao)
    VALUES (?, ?, ?)
  `;

  db.run(statement, [nome, acompanhantes, dataConfirmacao], function onInsert(error) {
    if (error) {
      console.error("Erro ao salvar RSVP:", error);
      return response.status(500).json({ error: "Erro interno ao salvar a confirmação." });
    }

    const message =
      acompanhantes > 0
        ? `${nome}, presença confirmada com ${acompanhantes} acompanhante(s). Até a festa!`
        : `${nome}, presença confirmada. Até a festa!`;

    return response.status(201).json({
      message,
      rsvp: {
        id: this.lastID,
        nome,
        acompanhantes,
        data_confirmacao: dataConfirmacao,
      },
    });
  });
});

app.use((request, response) => {
  response.status(404).json({ error: "Rota não encontrada." });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor disponível em http://localhost:${PORT}`);
  });
}

module.exports = { app, db, databasePath };
