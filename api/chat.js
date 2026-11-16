const { GoogleGenAI, Type } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const salvarMemoriaTool = {
  functionDeclarations: [{
    name: 'salvar_memoria',
    description: 'Salva um fato importante, preferência, tarefa ou informação permanente sobre o usuário no banco de dados.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        fato: { type: Type.STRING, description: 'O fato a ser lembrado de forma clara e resumida.' },
        categoria: { type: Type.STRING, description: 'Ex: projeto, preferencia, agenda, pessoal' }
      },
      required: ['fato']
    }
  }]
};

module.exports = async (req, res) => {
  // Libera acesso de qualquer dispositivo (PC ou Celular)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  if (req.headers['authorization'] !== process.env.SENHA_MESTRA) {
    return res.status(401).json({ erro: 'Acesso negado: Senha incorreta' });
  }

  const { mensagem } = req.body;

  try {
    const { data: memorias } = await supabase.from('memorias').select('fato, categoria');
    const textoMemorias = memorias?.map(m => `- [${m.categoria}] ${m.fato}`).join('\n') || 'Nenhuma memória salva.';

    const { data: historico } = await supabase
      .from('mensagens')
      .select('role, conteudo')
      .order('criado_em', { ascending: false })
      .limit(15);

    const contextoChat = (historico || []).reverse().map(m => ({
      role: m.role,
      parts: [{ text: m.conteudo }]
    }));

    contextoChat.push({ role: 'user', parts: [{ text: mensagem }] });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contextoChat,
      config: {
        systemInstruction: `Você é o Dante, o assistente pessoal, leal e de alta performance do Gabriel. Seja direto, técnico e objetivo.
        MEMÓRIAS PERMANENTES DO USUÁRIO:
        ${textoMemorias}
        Sempre que o Gabriel compartilhar algo relevante sobre projetos, preferências ou pedir para lembrar de algo, chame a função 'salvar_memoria'.`,
        tools: [salvarMemoriaTool]
      }
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === 'salvar_memoria') {
        await supabase.from('memorias').insert({
          fato: call.args.fato,
          categoria: call.args.categoria || 'geral'
        });
      }
    }

    const respostaFinal = response.text || 'Memória registrada, chefe.';

    await supabase.from('mensagens').insert([
      { role: 'user', conteudo: mensagem },
      { role: 'model', conteudo: respostaFinal }
    ]);

    return res.status(200).json({ resposta: respostaFinal });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno: ' + err.message });
  }
};