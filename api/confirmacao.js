import { Octokit } = require("@octokit/rest");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export default async function handler(req, res) {
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
    if (conteudoAtual.includes(nome)) {
      return res
        .status(400)
        .json({ error: `${nome}, você já confirmou sua presença!` });
    }

    // Adiciona nova confirmação
    const dataConfirmacao = new Date().toLocaleString("pt-BR");
    const totalPessoas = 1 + parseInt(acompanhantes);
    const novaConfirmacao = `${nome} | Acompanhantes: ${acompanhantes} | Total: ${totalPessoas} pessoas | ${dataConfirmacao}\n`;
    const novoConteudo = conteudoAtual + novaConfirmacao;

    // Atualiza o arquivo
    await octokit.repos.createOrUpdateFileContents({
      owner: "rickds93",
      repo: "aniversario-sofia",
      path: "files/confirmacaodepresenca.txt",
      message: `Adiciona confirmação: ${nome} (+${acompanhantes} acompanhantes)`,
      content: Buffer.from(novoConteudo).toString("base64"),
      sha: fileResponse.data.sha,
    });

    res.status(200).json({
      message: `${nome}, sua presença foi confirmada com sucesso! Estamos te esperando! 🎊`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erro ao confirmar presença",
      details: error.message,
    });
  }
}
