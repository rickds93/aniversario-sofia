const express = require("express");
const { rateLimit } = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const rsvpsFilePath = path.join(__dirname, "rsvps.txt");

// Função para salvar RSVP no arquivo TXT
function saveRsvpToFile(nome, acompanhantes, dataConfirmacao) {
  try {
    const data = new Date(dataConfirmacao);
    const dataFormatada = data.toLocaleString("pt-BR");
    
    const conteudo = `--- CONFIRMAÇÃO DE PRESENÇA ---
Nome: ${nome}
Acompanhantes: ${acompanhantes}
Data: ${dataFormatada}

`;

    fs.appendFileSync(rsvpsFilePath, conteudo, "utf-8");
    console.log("RSVP salvo em rsvps.txt");
  } catch (error) {
    console.error("Erro ao salvar RSVP no arquivo:", error);
  }
}

// Inicializa arquivo TXT se não existir
if (!fs.existsSync(rsvpsFilePath)) {
  fs.writeFileSync(rsvpsFilePath, "=== CONFIRMAÇÕES DE PRESENÇA ===\n\n", "utf-8");
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

  // Salva no arquivo de texto
  saveRsvpToFile(nome, acompanhantes, dataConfirmacao);

  const message =
    acompanhantes > 0
      ? `${nome}, presença confirmada com ${acompanhantes} acompanhante(s). Até a festa!`
      : `${nome}, presença confirmada. Até a festa!`;

  return response.status(201).json({
    message,
    rsvp: {
      nome,
      acompanhantes,
      data_confirmacao: dataConfirmacao,
    },
  });
});

// Endpoint para baixar o arquivo de RSVPs
app.get("/api/rsvps-download", pageLimiter, (request, response) => {
  try {
    if (fs.existsSync(rsvpsFilePath)) {
      response.download(rsvpsFilePath, "rsvps.txt");
    } else {
      return response.status(404).json({ error: "Nenhum RSVP registrado ainda." });
    }
  } catch (error) {
    console.error("Erro ao baixar RSVPs:", error);
    return response.status(500).json({ error: "Erro ao baixar o arquivo." });
  }
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
