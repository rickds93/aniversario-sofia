const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

module.exports = async (req, res) => {
  // Habilita CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { nome, acompanhantes } = req.body;

    if (!nome || acompanhantes === undefined) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    // Lê o arquivo atual
    const fileResponse = await octokit.repos.getContent({
      owner: "rickds93",
      repo: "aniversario-sofia",
      path: "files/confirmacaodepresenca.txt",
    });

    const conteudoAtual = Buffer.from(
      fileResponse.data.content,
      "base64"
    ).toString("utf-8");

    // Verifica se já existe
    const linhas = conteudoAtual.split("\n");
    const jaConfirmou = linhas.some(
      (linha) =>
        linha.trim() &&
        linha.toLowerCase().includes(nome.toLowerCase()) &&
        linha.includes("|")
    );

    if (jaConfirmou) {
      return res.status(400).json({
        error: `${nome}, você já confirmou sua presença! 🎉`,
      });
    }

    // Adiciona nova confirmação
    const dataConfirmacao = new Date().toLocaleString("pt-BR");
    const totalPessoas = 1 + parseInt(acompanhantes);
    const novaConfirmacao = `${nome} | Acompanhantes: ${acompanhantes} | Total: ${totalPessoas} pessoas | ${dataConfirmacao}`;
    const novoConteudo = conteudoAtual + novaConfirmacao + "\n";

    // Atualiza o arquivo
    await octokit.repos.createOrUpdateFileContents({
      owner: "rickds93",
      repo: "aniversario-sofia",
      path: "files/confirmacaodepresenca.txt",
      message: `Adiciona confirmação: ${nome} (+${acompanhantes} acompanhantes)`,
      content: Buffer.from(novoConteudo).toString("base64"),
      sha: fileResponse.data.sha,
    });

    return res.status(200).json({
      message: `${nome}, sua presença foi confirmada com sucesso! Estamos te esperando! 🎊`,
    });
  } catch (error) {
    console.error("Erro:", error);
    return res.status(500).json({
      error: "Erro ao confirmar presença",
      details: error.message,
    });
  }
};
