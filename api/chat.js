// import { GoogleGenAI, Type } from '@google/genai';
// import { createClient } from '@supabase/supabase-js';

// export default async function handler(req, res) {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

//   if (req.method === 'OPTIONS') return res.status(200).end();
//   if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

//   const rawUrl = process.env.SUPABASE_URL;
//   const rawKey = process.env.SUPABASE_KEY;
//   const apiKey = process.env.GEMINI_API_KEY;

//   if (!apiKey || !rawUrl || !rawKey) {
//     return res.status(500).json({ 
//       erro: 'Variáveis de ambiente ausentes na Vercel. Verifique GEMINI_API_KEY, SUPABASE_URL e SUPABASE_KEY.' 
//     });
//   }

//   if (req.headers['authorization'] !== process.env.SENHA_MESTRA) {
//     return res.status(401).json({ erro: 'Acesso negado: Senha incorreta' });
//   }

//   try {
//     const ai = new GoogleGenAI({ apiKey });
    
//     const supabaseUrl = String(rawUrl).trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
//     const supabaseKey = String(rawKey).trim().replace(/^['"]|['"]$/g, '');

//     const supabase = createClient(supabaseUrl, supabaseKey);

//     const { mensagem } = req.body;
//     if (!mensagem) {
//       return res.status(400).json({ erro: 'Mensagem vazia.' });
//     }

//     let memorias = [];
//     let historico = [];

//     // Consultas protegidas com blocos try/catch individuais seguros
//     try {
//       const { data: memData } = await supabase.from('memorias').select('fato, categoria');
//       if (memData) memorias = memData;
//     } catch (e) {
//       console.warn('Tabela memorias vazia ou inacessível.');
//     }

//     try {
//       const { data: histData } = await supabase
//         .from('mensagens')
//         .select('role, conteudo')
//         .order('criado_em', { ascending: false })
//         .limit(15);
//       if (histData) historico = histData;
//     } catch (e) {
//       console.warn('Tabela mensagens vazia ou inacessível.');
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
//       model: 'gemini-1.5-flash',
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
//         try {
//           await supabase.from('memorias').insert({
//             fato: call.args.fato,
//             categoria: call.args.categoria || 'geral'
//           });
//         } catch (err) {
//           console.error('Erro ao salvar memória:', err.message);
//         }
//       }
//     }

//     const respostaFinal = response.text || 'Memória registrada, chefe.';

//     try {
//       await supabase.from('mensagens').insert([
//         { role: 'user', conteudo: mensagem },
//         { role: 'model', conteudo: respostaFinal }
//       ]);
//     } catch (err) {
//       console.error('Erro ao salvar histórico:', err.message);
//     }

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

    try {
      const { data: memData } = await supabase.from('memorias').select('fato, categoria');
      if (memData) memorias = memData;
    } catch (e) {
      console.warn('Tabela memorias vazia ou inacessível.');
    }

    try {
      const { data: histData } = await supabase
        .from('mensagens')
        .select('role, conteudo')
        .order('criado_em', { ascending: false })
        .limit(15);
      if (histData) historico = histData;
    } catch (e) {
      console.warn('Tabela mensagens vazia ou inacessível.');
    }

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

    const configGeracao = {
      systemInstruction: `Você é o Dante, o assistente pessoal, leal e de alta performance do Gabriel. Seja direto, técnico e objetivo.
      MEMÓRIAS PERMANENTES DO USUÁRIO:
      ${textoMemorias}
      Sempre que o Gabriel compartilhar algo relevante sobre projetos, preferências ou pedir para lembrar de algo, chame a função 'salvar_memoria'.`,
      tools: [salvarMemoriaTool]
    };

    // Sistema de fallback automático de modelos
    const modelosDisponiveis = ['gemini-3.8-flash', 'gemini-3.0-flash', 'gemini-2.5-flash-latest'];
    let response = null;
    let ultimoErro = null;

    for (const modelo of modelosDisponiveis) {
      try {
        response = await ai.models.generateContent({
          model: modelo,
          contents: contextoChat,
          config: configGeracao
        });
        if (response) break; // Se respondeu com sucesso, sai do loop
      } catch (errModelo) {
        ultimoErro = errModelo;
        console.warn(`Modelo ${modelo} falhou, tentando próximo...`);
      }
    }

    if (!response) {
      throw ultimoErro || new Error('Nenhum modelo do Gemini respondeu à requisição.');
    }

    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === 'salvar_memoria') {
        try {
          await supabase.from('memorias').insert({
            fato: call.args.fato,
            categoria: call.args.categoria || 'geral'
          });
        } catch (err) {
          console.error('Erro ao salvar memória:', err.message);
        }
      }
    }

    const respostaFinal = response.text || 'Memória registrada, chefe.';

    try {
      await supabase.from('mensagens').insert([
        { role: 'user', conteudo: mensagem },
        { role: 'model', conteudo: respostaFinal }
      ]);
    } catch (err) {
      console.error('Erro ao salvar histórico:', err.message);
    }

    return res.status(200).json({ resposta: respostaFinal });

  } catch (err) {
    console.error('FALHA CRÍTICA NO BACKEND:', err);
    return res.status(500).json({ erro: err.message || 'Erro interno no servidor do Dante.' });
  }
}