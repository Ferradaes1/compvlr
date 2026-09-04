// api/matches.js
//
// Vercel serverless function — funciona como "ponte" entre o dashboard
// (rodando no navegador) e a API da HenrikDev. Isso resolve dois problemas:
//
//   1) CORS: o navegador bloqueia chamadas diretas de um site pra API da
//      HenrikDev. Chamando servidor-a-servidor (aqui) não tem esse bloqueio.
//   2) Segurança: a API key fica só aqui no servidor (variável de ambiente),
//      nunca é enviada pro navegador de quem visita o site.
//
// Configuração necessária no Vercel:
//   Project → Settings → Environment Variables
//   Nome: HENRIK_API_KEY
//   Valor: sua key (ex: HDEV-xxxxxxxx-xxxx-...)
//   (depois de adicionar, precisa fazer um novo deploy pra valer)

module.exports = async function handler(req, res) {
  const { region, name, tag, mode, map, size, start } = req.query;

  if (!region || !name || !tag) {
    res.status(400).json({ error: 'parâmetros obrigatórios: region, name, tag' });
    return;
  }

  const apiKey = process.env.HENRIK_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'HENRIK_API_KEY não configurada no servidor (Vercel → Settings → Environment Variables)' });
    return;
  }

  const params = new URLSearchParams();
  if (size) params.set('size', size);
  if (mode && mode !== 'all') params.set('mode', mode);
  if (map) params.set('map', map);
  if (start) params.set('start', start);

  const url = `https://api.henrikdev.xyz/valorant/v4/matches/${encodeURIComponent(region)}/pc/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?${params.toString()}`;

  try {
    const upstream = await fetch(url, { headers: { Authorization: apiKey } });
    const bodyText = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(bodyText);
  } catch (err) {
    res.status(502).json({ error: 'falha ao contatar a HenrikDev', detail: String(err && err.message || err) });
  }
};
