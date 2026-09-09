const express = require("express");
const { rateLimit } = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const rsvpsFilePath = path.join(__dirname, "rsvps.json");

// Função para carregar RSVPs do arquivo JSON
function loadRsvpsFromFile() {
  try {
    if (fs.existsSync(rsvpsFilePath)) {
      const data = fs.readFileSync(rsvpsFilePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Erro ao carregar rsvps.json:", error);
  }
  return [];
}

// Função para salvar RSVP no arquivo JSON
function saveRsvpToFile(rsvps) {
  try {
    fs.writeFileSync(rsvpsFilePath, JSON.stringify(rsvps, null, 2), "utf-8");
    console.log("RSVPs salvos em rsvps.json");
  } catch (error) {
    console.error("Erro ao salvar RSVPs no arquivo:", error);
  }
}

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

  // Carrega RSVPs existentes
  const rsvps = loadRsvpsFromFile();
  
  // Cria novo RSVP com ID sequencial
  const novoId = rsvps.length > 0 ? Math.max(...rsvps.map(r => r.id)) + 1 : 1;
  const rsvpData = {
    id: novoId,
    nome,
    acompanhantes,
    data_confirmacao: dataConfirmacao,
  };

  // Adiciona à lista e salva
  rsvps.push(rsvpData);
  saveRsvpToFile(rsvps);

  const message =
    acompanhantes > 0
      ? `${nome}, presença confirmada com ${acompanhantes} acompanhante(s). Até a festa!`
      : `${nome}, presença confirmada. Até a festa!`;

  return response.status(201).json({
    message,
    rsvp: rsvpData,
  });
});

// Endpoint para baixar o arquivo de RSVPs
app.get("/api/rsvps-download", pageLimiter, (request, response) => {
  try {
    if (fs.existsSync(rsvpsFilePath)) {
      response.download(rsvpsFilePath, "rsvps.json");
    } else {
      return response.status(404).json({ error: "Nenhum RSVP registrado ainda." });
    }
  } catch (error) {
    console.error("Erro ao baixar RSVPs:", error);
    return response.status(500).json({ error: "Erro ao baixar o arquivo." });
  }
});

// Endpoint para visualizar RSVPs em JSON
app.get("/api/rsvps", pageLimiter, (request, response) => {
  const rsvps = loadRsvpsFromFile();
  return response.status(200).json({
    total: rsvps.length,
    rsvps: rsvps,
  });
});

// Middleware para retornar JSON em todas as rotas não encontradas
app.use((request, response) => {
  response.status(404).json({ error: "Rota não encontrada." });
});

// Middleware de erro global para garantir JSON
app.use((error, request, response, next) => {
  console.error("Erro no servidor:", error);
  response.status(500).json({ error: "Erro interno do servidor." });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor disponível em http://localhost:${PORT}`);
  });
}

module.exports = { app, rsvpsFilePath };
