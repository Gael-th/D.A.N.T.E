// import { GoogleGenAI, Type } from '@google/genai';
// import { createClient } from '@supabase/supabase-js';

// export default async function handler(req, res) {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

//   if (req.method === 'OPTIONS') return res.status(200).end();
//   if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

//   // 1. Validação prévia e rigorosa das variáveis de ambiente
//   const rawUrl = process.env.SUPABASE_URL;
//   const rawKey = process.env.SUPABASE_KEY;
//   const apiKey = process.env.GEMINI_API_KEY;

//   if (!apiKey || !rawUrl || !rawKey) {
//     return res.status(500).json({ 
//       erro: 'Variáveis de ambiente ausentes ou incompletas na Vercel. Verifique GEMINI_API_KEY, SUPABASE_URL e SUPABASE_KEY.' 
//     });
//   }

//   // 2. Validação da senha de acesso
//   if (req.headers['authorization'] !== process.env.SENHA_MESTRA) {
//     return res.status(401).json({ erro: 'Acesso negado: Senha incorreta' });
//   }

//   try {
//     const ai = new GoogleGenAI({ apiKey });
    
//     // 3. LIMPEZA BLINDADA DA URL: Remove aspas, espaços e barras duplicadas do final
//     const supabaseUrl = rawUrl.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
//     const supabaseKey = rawKey.trim().replace(/^['"]|['"]$/g, '');

//     const supabase = createClient(supabaseUrl, supabaseKey);

//     const { mensagem } = req.body;
//     if (!mensagem) {
//       return res.status(400).json({ erro: 'Mensagem vazia.' });
//     }

//     // 4. Busca segura nas tabelas do banco
//     let memorias = [];
//     let historico = [];

//     const { data: memData, error: memErr } = await supabase.from('memorias').select('fato, categoria');
//     if (memErr) {
//       console.warn('Aviso ao buscar memorias (tabela pode estar vazia ou ausente):', memErr.message);
//     } else {
//       memorias = memData || [];
//     }

//     const { data: histData, error: histErr } = await supabase
//       .from('mensagens')
//       .select('role, conteudo')
//       .order('criado_em', { ascending: false })
//       .limit(15);
    
//     if (histErr) {
//       console.warn('Aviso ao buscar historico:', histErr.message);
//     } else {
//       historico = histData || [];
//     }

//     const textoMemorias = memorias.length > 0 
//       ? memorias.map(m => `- [${m.categoria}] ${m.fato}`).join('\n') 
//       : 'Nenhuma memória salva ainda.';

//     const contextoChat = historico.reverse().map(m => ({
//       role: m.role,
//       parts: [{ text: m.conteudo }]
//     }));
//     contextoChat.push({ role: 'user', parts: [{ text: mensagem }] });

//     const salvarMemoriaTool = {
//       functionDeclarations: [{
//         name: 'salvar_memoria',
//         description: 'Salva um fato importante, preferência ou projeto permanente sobre o usuário.',
//         parameters: {
//           type: Type.OBJECT,
//           properties: {
//             fato: { type: Type.STRING, description: 'O fato a ser lembrado.' },
//             categoria: { type: Type.STRING, description: 'Categoria: projeto, preferencia, agenda, pessoal' }
//           },
//           required: ['fato']
//         }
//       }]
//     };

//     const response = await ai.models.generateContent({
//       model: 'gemini-2.5-flash',
//       contents: contextoChat,
//       config: {
//         systemInstruction: `Você é o Dante, o assistente pessoal, leal e de alta performance do Gabriel. Seja direto, técnico e objetivo.
//         MEMÓRIAS PERMANENTES DO USUÁRIO:
//         ${textoMemorias}
//         Sempre que o Gabriel compartilhar algo relevante sobre projetos, preferências ou pedir para lembrar de algo, chame a função 'salvar_memoria'.`,
//         tools: [salvarMemoriaTool]
//       }
//     });

//     if (response.functionCalls && response.functionCalls.length > 0) {
//       const call = response.functionCalls[0];
//       if (call.name === 'salvar_memoria') {
//         await supabase.from('memorias').insert({
//           fato: call.args.fato,
//           categoria: call.args.categoria || 'geral'
//         }).catch(err => console.error('Erro ao salvar memória:', err.message));
//       }
//     }

//     const respostaFinal = response.text || 'Memória registrada, chefe.';

//     await supabase.from('mensagens').insert([
//       { role: 'user', conteudo: mensagem },
//       { role: 'model', conteudo: respostaFinal }
//     ]).catch(err => console.error('Erro ao salvar histórico:', err.message));

//     return res.status(200).json({ resposta: respostaFinal });

//   } catch (err) {
//     console.error('FALHA CRÍTICA NO BACKEND:', err);
//     return res.status(500).json({ erro: err.message || 'Erro interno no servidor do Dante.' });
//   }
// }


import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  const rawUrl = process.env.SUPABASE_URL;
  const rawKey = process.env.SUPABASE_KEY;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !rawUrl || !rawKey) {
    return res.status(500).json({ 
      erro: 'Variáveis de ambiente ausentes na Vercel. Verifique GEMINI_API_KEY, SUPABASE_URL e SUPABASE_KEY.' 
    });
  }

  if (req.headers['authorization'] !== process.env.SENHA_MESTRA) {
    return res.status(401).json({ erro: 'Acesso negado: Senha incorreta' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const supabaseUrl = String(rawUrl).trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
    const supabaseKey = String(rawKey).trim().replace(/^['"]|['"]$/g, '');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { mensagem } = req.body;
    if (!mensagem) {
      return res.status(400).json({ erro: 'Mensagem vazia.' });
    }

    let memorias = [];
    let historico = [];

    const { data: memData } = await supabase.from('memorias').select('fato, categoria').catch(() => ({ data: [] }));
    memorias = memData || [];

    const { data: histData } = await supabase
      .from('mensagens')
      .select('role, conteudo')
      .order('criado_em', { ascending: false })
      .limit(15)
      .catch(() => ({ data: [] }));
    
    historico = histData || [];

    const textoMemorias = memorias.length > 0 
      ? memorias.map(m => `- [${m.categoria}] ${m.fato}`).join('\n') 
      : 'Nenhuma memória salva ainda.';

    const contextoChat = historico.reverse().map(m => ({
      role: m.role,
      parts: [{ text: m.conteudo }]
    }));
    contextoChat.push({ role: 'user', parts: [{ text: mensagem }] });

    const salvarMemoriaTool = {
      functionDeclarations: [{
        name: 'salvar_memoria',
        description: 'Salva um fato importante, preferência ou projeto permanente sobre o usuário.',
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

    // ATUALIZADO: Usando o modelo padrão recomendado ('gemini-2.5-flash')
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
        }).catch(err => console.error('Erro ao salvar memória:', err.message));
      }
    }

    const respostaFinal = response.text || 'Memória registrada, chefe.';

    await supabase.from('mensagens').insert([
      { role: 'user', conteudo: mensagem },
      { role: 'model', conteudo: respostaFinal }
    ]).catch(err => console.error('Erro ao salvar histórico:', err.message));

    return res.status(200).json({ resposta: respostaFinal });

  } catch (err) {
    console.error('FALHA CRÍTICA NO BACKEND:', err);
    return res.status(500).json({ erro: err.message || 'Erro interno no servidor do Dante.' });
  }
}