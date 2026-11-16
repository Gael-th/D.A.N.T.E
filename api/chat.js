import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  // 1. Verifica se as variáveis de ambiente foram carregadas na Vercel
  if (!process.env.GEMINI_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    return res.status(500).json({ 
      erro: 'Variáveis de ambiente ausentes na Vercel. Faça um Redeploy após salvá-las.' 
    });
  }

  // 2. Verifica a senha
  if (req.headers['authorization'] !== process.env.SENHA_MESTRA) {
    return res.status(401).json({ erro: 'Acesso negado: Senha incorreta' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

    const { mensagem } = req.body;

    // Busca memórias
    const { data: memorias, error: errMem } = await supabase.from('memorias').select('fato, categoria');
    if (errMem) throw new Error('Supabase (memorias): ' + errMem.message);

    const textoMemorias = memorias?.map(m => `- [${m.categoria}] ${m.fato}`).join('\n') || 'Nenhuma memória salva.';

    // Busca histórico
    const { data: historico, error: errHist } = await supabase
      .from('mensagens')
      .select('role, conteudo')
      .order('criado_em', { ascending: false })
      .limit(15);
    if (errHist) throw new Error('Supabase (mensagens): ' + errHist.message);

    const contextoChat = (historico || []).reverse().map(m => ({
      role: m.role,
      parts: [{ text: m.conteudo }]
    }));
    contextoChat.push({ role: 'user', parts: [{ text: mensagem }] });

    const salvarMemoriaTool = {
      functionDeclarations: [{
        name: 'salvar_memoria',
        description: 'Salva um fato importante ou preferência permanente sobre o usuário.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            fato: { type: Type.STRING, description: 'O fato a ser lembrado.' },
            categoria: { type: Type.STRING, description: 'Categoria: projeto, preferencia, agenda, pessoal' }
          },
          required: ['fato']
        }
      }]
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contextoChat,
      config: {
        systemInstruction: `Você é o Dante, o assistente pessoal do Gabriel. Seja direto, técnico e objetivo.
        MEMÓRIAS PERMANENTES:
        ${textoMemorias}
        Sempre que o Gabriel compartilhar algo relevante sobre projetos, preferências ou pedir para lembrar de algo, chame 'salvar_memoria'.`,
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
    return res.status(500).json({ erro: err.message });
  }
}


const res = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': SENHA },
  body: JSON.stringify({ mensagem: texto })
});

const textoBruto = await res.text(); // Lê a resposta mesmo se não for JSON

if (!res.ok) {
  log.innerHTML += `<p style="color:#ef4444;"><strong>Erro ${res.status}:</strong> ${textoBruto}</p>`;
  return;
}

const data = JSON.parse(textoBruto);