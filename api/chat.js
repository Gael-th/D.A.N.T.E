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

//     // 1. Busca rápida em paralelo (com limite estrito para não travar)
//     let memorias = [];
//     let historico = [];

//     try {
//       const [memRes, histRes] = await Promise.all([
//         supabase.from('memorias').select('fato, categoria').limit(20),
//         supabase.from('mensagens').select('role, conteudo').order('criado_em', { ascending: false }).limit(5)
//       ]);
//       memorias = memRes.data || [];
//       historico = histRes.data || [];
//     } catch (e) {
//       console.warn('Aviso ao consultar Supabase (continuando sem histórico completo).');
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

//     // 2. Chamada direta ao Gemini 3.8 Flash com limite de tokens compacto para resposta imediata
//     const response = await ai.models.generateContent({
//       model: 'gemini-3.8-flash',
//       contents: contextoChat,
//       config: {
//         systemInstruction: `Você é o Dante, o assistente pessoal, leal e de alta performance do Gabriel. Seja direto, técnico e objetivo.
//         MEMÓRIAS PERMANENTES:
//         ${textoMemorias}
//         Sempre que o Gabriel compartilhar algo relevante, chame a função 'salvar_memoria'.`,
//         tools: [salvarMemoriaTool],
//         maxOutputTokens: 500
//       }
//     });

//     const respostaFinal = response.text || 'Processado, chefe.';

//     // 3. Responde imediatamente ao usuário (zero delay de espera do banco)
//     res.status(200).json({ resposta: respostaFinal });

//     // 4. Salva as mensagens e tool calls em segundo plano (após a resposta já ter sido enviada)
//     if (response.functionCalls && response.functionCalls.length > 0) {
//       const call = response.functionCalls[0];
//       if (call.name === 'salvar_memoria') {
//         supabase.from('memorias').insert({
//           fato: call.args.fato,
//           categoria: call.args.categoria || 'geral'
//         }).catch(() => {});
//       }
//     }

//     supabase.from('mensagens').insert([
//       { role: 'user', conteudo: mensagem },
//       { role: 'model', conteudo: respostaFinal }
//     ]).catch(() => {});

//   } catch (err) {
//     console.error('FALHA CRÍTICA NO BACKEND:', err);
//     if (!res.headersSent) {
//       return res.status(500).json({ erro: err.message || 'Erro interno no servidor do Dante.' });
//     }
//   }
// }
























































// import { createClient } from '@supabase/supabase-js';

// export default async function handler(req, res) {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

//   if (req.method === 'OPTIONS') return res.status(200).end();
//   if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

//   const rawUrl = process.env.SUPABASE_URL;
//   const rawKey = process.env.SUPABASE_KEY;
//   const groqKey = process.env.GROQ_API_KEY;

//   if (!groqKey || !rawUrl || !rawKey) {
//     return res.status(500).json({ 
//       erro: 'Variáveis ausentes na Vercel. Verifique GROQ_API_KEY, SUPABASE_URL e SUPABASE_KEY.' 
//     });
//   }

//   if (req.headers['authorization'] !== process.env.SENHA_MESTRA) {
//     return res.status(401).json({ erro: 'Acesso negado: Senha incorreta' });
//   }

//   try {
//     const supabaseUrl = String(rawUrl).trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
//     const supabaseKey = String(rawKey).trim().replace(/^['"]|['"]$/g, '');
//     const supabase = createClient(supabaseUrl, supabaseKey);

//     const { mensagem } = req.body;
//     if (!mensagem) {
//       return res.status(400).json({ erro: 'Mensagem vazia.' });
//     }

//     // 1. Busca memórias, histórico e modelos ativos da Groq em paralelo
//     const [memRes, histRes, modelsRes] = await Promise.all([
//       supabase.from('memorias').select('fato, categoria').limit(30),
//       supabase.from('mensagens').select('role, conteudo').order('criado_em', { ascending: false }).limit(16),
//       fetch('https://api.groq.com/openai/v1/models', {
//         headers: { 'Authorization': `Bearer ${groqKey}` }
//       }).then(r => r.json()).catch(() => ({ data: [] }))
//     ]);

//     const memorias = memRes.data || [];
//     const historico = histRes.data || [];

//     // Escolhe automaticamente o melhor modelo de texto ativo na sua conta
//     const idsDisponiveis = (modelsRes.data || [])
//       .map(m => m.id)
//       .filter(id => !id.includes('whisper') && !id.includes('guard') && !id.includes('tts'));

//     const prioridades = [
//       'meta-llama/llama-4-maverick-17b-128e-instruct',
//       'meta-llama/llama-4-scout-17b-16e-instruct',
//       'llama-3.3-70b-versatile',
//       'llama-3.1-70b-versatile',
//       'llama-3.1-8b-instant',
//       'qwen/qwen3-32b'
//     ];

//     const modeloEscolhido =
//       prioridades.find(p => idsDisponiveis.includes(p)) ||
//       idsDisponiveis.find(id => id.includes('llama') || id.includes('qwen') || id.includes('gemma')) ||
//       idsDisponiveis[0] ||
//       'llama-3.1-8b-instant';

//     const textoMemorias = memorias.length > 0 
//       ? memorias.map(m => `- [${m.categoria}] ${m.fato}`).join('\n') 
//       : 'Nenhuma memória salva ainda.';

//     const mensagensGroq = [
//       {
//         role: 'system',
//         content: `Você é o Dante, o assistente pessoal, leal e de alta performance do Gabriel. Seja direto, técnico, natural para fala em voz alta (evite markdown pesado como asteriscos ou tabelas) e objetivo.
// MEMÓRIAS PERMANENTES DO USUÁRIO:
// ${textoMemorias}
// Sempre que o Gabriel compartilhar um fato importante, preferência, projeto ou pedir para lembrar de algo, use a ferramenta 'salvar_memoria'.`
//       },
//       ...historico.reverse().map(m => ({
//         role: m.role === 'model' ? 'assistant' : m.role,
//         content: m.conteudo
//       })),
//       { role: 'user', content: mensagem }
//     ];

//     const tools = [
//       {
//         type: 'function',
//         function: {
//           name: 'salvar_memoria',
//           description: 'Salva um fato importante, preferência ou projeto permanente sobre o usuário no banco de dados.',
//           parameters: {
//             type: 'object',
//             properties: {
//               fato: { type: 'string', description: 'O fato a ser lembrado de forma clara.' },
//               categoria: { type: 'string', description: 'Categoria: projeto, preferencia, agenda, pessoal' }
//             },
//             required: ['fato']
//           }
//         }
//       }
//     ];

//     // 2. Chamada para a Groq usando o modelo detectado automaticamente
//     const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${groqKey}`,
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         model: modeloEscolhido,
//         messages: mensagensGroq,
//         tools: tools,
//         tool_choice: 'auto',
//         max_tokens: 600,
//         temperature: 0.6
//       })
//     });

//     const groqData = await groqResponse.json();

//     if (!groqResponse.ok) {
//       throw new Error(`${groqData.error?.message || 'Erro na API da Groq'} (Modelo tentado: ${modeloEscolhido})`);
//     }

//     const choice = groqData.choices[0].message;
//     let respostaFinal = choice.content || '';

//     // 3. Executa tool call de memória se acionada
//     if (choice.tool_calls && choice.tool_calls.length > 0) {
//       for (const toolCall of choice.tool_calls) {
//         if (toolCall.function.name === 'salvar_memoria') {
//           const args = JSON.parse(toolCall.function.arguments);
//           await supabase.from('memorias').insert({
//             fato: args.fato,
//             categoria: args.categoria || 'geral'
//           });

//           if (!respostaFinal) {
//             respostaFinal = `Anotado, Gabriel. Guardei isso na minha memória permanente: ${args.fato}.`;
//           }
//         }
//       }
//     }

//     if (!respostaFinal) {
//       respostaFinal = 'Processado, chefe.';
//     }

//     // 4. Salva o histórico completo antes de encerrar a requisição
//     await supabase.from('mensagens').insert([
//       { role: 'user', conteudo: mensagem },
//       { role: 'assistant', conteudo: respostaFinal }
//     ]);

//     return res.status(200).json({ resposta: respostaFinal });

//   } catch (err) {
//     console.error('FALHA CRÍTICA NO BACKEND:', err);
//     return res.status(500).json({ erro: err.message || 'Erro interno no servidor do Dante.' });
//   }
// }



















































































































// import { createClient } from '@supabase/supabase-js';

// export default async function handler(req, res) {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

//   if (req.method === 'OPTIONS') return res.status(200).end();
//   if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

//   const rawUrl = process.env.SUPABASE_URL;
//   const rawKey = process.env.SUPABASE_KEY;
//   const groqKey = process.env.GROQ_API_KEY;

//   if (!groqKey || !rawUrl || !rawKey) {
//     return res.status(500).json({ 
//       erro: 'Variáveis ausentes na Vercel. Verifique GROQ_API_KEY, SUPABASE_URL e SUPABASE_KEY.' 
//     });
//   }

//   if (req.headers['authorization'] !== process.env.SENHA_MESTRA) {
//     return res.status(401).json({ erro: 'Acesso negado: Senha incorreta' });
//   }

//   try {
//     const supabaseUrl = String(rawUrl).trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
//     const supabaseKey = String(rawKey).trim().replace(/^['"]|['"]$/g, '');
//     const supabase = createClient(supabaseUrl, supabaseKey);

//     const { mensagem } = req.body;
//     if (!mensagem) {
//       return res.status(400).json({ erro: 'Mensagem vazia.' });
//     }

//     // 1. Busca diretivas, memórias, histórico e modelos em paralelo (checando erros reais)
//     const [memRes, histRes, modelsRes] = await Promise.all([
//       supabase.from('memorias').select('id, fato, categoria').order('criado_em', { ascending: false }).limit(40),
//       supabase.from('mensagens').select('role, conteudo').order('criado_em', { ascending: false }).limit(16),
//       fetch('https://api.groq.com/openai/v1/models', {
//         headers: { 'Authorization': `Bearer ${groqKey}` }
//       }).then(r => r.json()).catch(() => ({ data: [] }))
//     ]);

//     if (memRes.error) {
//       throw new Error(`Erro ao ler tabela memorias no Supabase: ${memRes.error.message}`);
//     }

//     const memorias = memRes.data || [];
//     const historico = histRes.data || [];

//     const idsDisponiveis = (modelsRes.data || [])
//       .map(m => m.id)
//       .filter(id =>
//         !id.includes('whisper') &&
//         !id.includes('guard') &&
//         !id.includes('tts') &&
//         !id.includes('orpheus') &&
//         !id.includes('arabic') &&
//         !id.includes('playai')
//       );

//     const prioridades = [
//       'llama-3.3-70b-versatile',
//       'meta-llama/llama-4-maverick-17b-128e-instruct',
//       'meta-llama/llama-4-scout-17b-16e-instruct',
//       'llama-3.1-70b-versatile',
//       'llama-3.1-8b-instant',
//       'qwen/qwen3-32b'
//     ];

//     const modeloEscolhido =
//       prioridades.find(p => idsDisponiveis.includes(p)) ||
//       idsDisponiveis.find(id => id.includes('llama') || id.includes('qwen')) ||
//       'llama-3.1-8b-instant';

//     const textoDiretivas = memorias
//       .filter(m => m.categoria === 'diretiva')
//       .map(m => `- [ID: ${m.id}] ${m.fato}`)
//       .join('\n') || 'Nenhuma diretiva cadastrada.';

//     const textoOutrasMemorias = memorias
//       .filter(m => m.categoria !== 'diretiva')
//       .map(m => `- [ID: ${m.id} | ${m.categoria}] ${m.fato}`)
//       .join('\n') || 'Nenhuma memória adicional.';

//     const mensagensGroq = [
//       {
//         role: 'system',
//         content: `Você é o Dante, assistente pessoal de alta performance do Gabriel.
// DIRETRIZES FUNDAMENTAIS DO BANCO:
// ${textoDiretivas}

// MEMÓRIAS E DADOS ATUAIS NO BANCO (${memorias.length} registros):
// ${textoOutrasMemorias}

// REGRAS OBRIGATÓRIAS:
// 1. Chame o usuário de "chefe" ou "mestre". O mestre do Dante é o Gabriel.
// 2. FILTRO DE LINGUAGEM: Espelhe exatamente o estilo, gírias e nível de formalidade que o Gabriel usar. Evite asteriscos ou markdown pesado para a fala em voz soar natural.
// 3. NUNCA FINJA QUE SALVOU OU CONSULTOU: Para salvar, editar, apagar ou ver o status do banco de dados, você OBRIGATORIAMENTE deve chamar as ferramentas disponíveis (criar_registro, atualizar_registro, apagar_registro ou status_banco). Jamais diga que salvou sem acionar a ferramenta.`
//       },
//       ...historico.reverse().map(m => ({
//         role: m.role === 'model' ? 'assistant' : m.role,
//         content: m.conteudo
//       })),
//       { role: 'user', content: mensagem }
//     ];

//     const tools = [
//       {
//         type: 'function',
//         function: {
//           name: 'criar_registro',
//           description: 'Grava uma nova memória, diretiva ou anotação de projeto no banco de dados.',
//           parameters: {
//             type: 'object',
//             properties: {
//               fato: { type: 'string', description: 'Conteúdo exato a ser salvo.' },
//               categoria: { type: 'string', description: 'Categoria: diretiva, projeto, preferencia, pessoal' }
//             },
//             required: ['fato']
//           }
//         }
//       },
//       {
//         type: 'function',
//         function: {
//           name: 'status_banco',
//           description: 'Consulta em tempo real o status do banco de dados, total de registros e lista as memórias gravadas.',
//           parameters: {
//             type: 'object',
//             properties: {}
//           }
//         }
//       },
//       {
//         type: 'function',
//         function: {
//           name: 'atualizar_registro',
//           description: 'Atualiza o texto ou categoria de um registro existente usando o ID.',
//           parameters: {
//             type: 'object',
//             properties: {
//               id: { type: 'string', description: 'UUID do registro.' },
//               fato: { type: 'string', description: 'Novo texto.' },
//               categoria: { type: 'string', description: 'Nova categoria (opcional).' }
//             },
//             required: ['id', 'fato']
//           }
//         }
//       },
//       {
//         type: 'function',
//         function: {
//           name: 'apagar_registro',
//           description: 'Apaga um registro do banco de dados pelo ID.',
//           parameters: {
//             type: 'object',
//             properties: {
//               id: { type: 'string', description: 'UUID do registro.' }
//             },
//             required: ['id']
//           }
//         }
//       }
//     ];

//     // Primeira chamada à Groq
//     const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${groqKey}`,
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         model: modeloEscolhido,
//         messages: mensagensGroq,
//         tools: tools,
//         tool_choice: 'auto',
//         max_tokens: 700,
//         temperature: 0.5
//       })
//     });

//     const groqData = await groqResponse.json();
//     if (!groqResponse.ok) {
//       throw new Error(`${groqData.error?.message || 'Erro na API da Groq'} (Modelo: ${modeloEscolhido})`);
//     }

//     const choice = groqData.choices[0].message;
//     let respostaFinal = choice.content || '';

//     // Executa ferramentas reais no Supabase e captura qualquer erro
//     if (choice.tool_calls && choice.tool_calls.length > 0) {
//       const resultadosTools = [];

//       for (const toolCall of choice.tool_calls) {
//         const args = JSON.parse(toolCall.function.arguments || '{}');

//         if (toolCall.function.name === 'criar_registro') {
//           const { data, error } = await supabase
//             .from('memorias')
//             .insert({ fato: args.fato, categoria: args.categoria || 'geral' })
//             .select();

//           if (error) {
//             resultadosTools.push(`FALHA AO SALVAR NO SUPABASE: ${error.message}`);
//           } else {
//             resultadosTools.push(`SUCESSO: Registro salvo com ID ${data[0].id}: "${args.fato}"`);
//           }
//         } 
//         else if (toolCall.function.name === 'status_banco') {
//           const [mCount, hCount] = await Promise.all([
//             supabase.from('memorias').select('id, categoria, fato'),
//             supabase.from('mensagens').select('id', { count: 'exact', head: true })
//           ]);

//           if (mCount.error) {
//             resultadosTools.push(`ERRO AO LER BANCO: ${mCount.error.message}`);
//           } else {
//             const lista = (mCount.data || []).map(r => `[${r.categoria}] ${r.fato}`).join(' | ');
//             resultadosTools.push(`BANCO ONLINE: ${mCount.data.length} memórias salvas e ${hCount.count || 0} mensagens no histórico. Itens: ${lista || 'Nenhum item ainda'}`);
//           }
//         }
//         else if (toolCall.function.name === 'atualizar_registro') {
//           const updateData = { fato: args.fato };
//           if (args.categoria) updateData.categoria = args.categoria;
//           const { error } = await supabase.from('memorias').update(updateData).eq('id', args.id);

//           if (error) {
//             resultadosTools.push(`FALHA AO ATUALIZAR: ${error.message}`);
//           } else {
//             resultadosTools.push(`SUCESSO: Registro ${args.id} atualizado.`);
//           }
//         }
//         else if (toolCall.function.name === 'apagar_registro') {
//           const { error } = await supabase.from('memorias').delete().eq('id', args.id);

//           if (error) {
//             resultadosTools.push(`FALHA AO APAGAR: ${error.message}`);
//           } else {
//             resultadosTools.push(`SUCESSO: Registro ${args.id} removido.`);
//           }
//         }
//       }

//       // Segundo turno: devolve o resultado real do banco para o Dante responder com base nos fatos
//       const segundaChamada = await fetch('https://api.groq.com/openai/v1/chat/completions', {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${groqKey}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           model: modeloEscolhido,
//           messages: [
//             ...mensagensGroq,
//             choice,
//             ...choice.tool_calls.map((tc, idx) => ({
//               role: 'tool',
//               tool_call_id: tc.id,
//               content: resultadosTools[idx]
//             }))
//           ],
//           max_tokens: 700,
//           temperature: 0.5
//         })
//       });

//       const segundaData = await segundaChamada.json();
//       if (segundaChamada.ok && segundaData.choices?.[0]?.message?.content) {
//         respostaFinal = segundaData.choices[0].message.content;
//       } else {
//         respostaFinal = resultadosTools.join('\n');
//       }
//     }

//     if (!respostaFinal) {
//       respostaFinal = 'Processado, chefe.';
//     }

//     // Salva histórico e verifica erro
//     const { error: histInsertError } = await supabase.from('mensagens').insert([
//       { role: 'user', conteudo: mensagem },
//       { role: 'assistant', conteudo: respostaFinal }
//     ]);

//     if (histInsertError) {
//       console.error('Erro ao gravar histórico na tabela mensagens:', histInsertError.message);
//     }

//     return res.status(200).json({ resposta: respostaFinal });

//   } catch (err) {
//     console.error('FALHA CRÍTICA NO BACKEND:', err);
//     return res.status(500).json({ erro: err.message || 'Erro interno no servidor do Dante.' });
//   }
// }






































































































import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });

  const rawUrl = process.env.SUPABASE_URL;
  const rawKey = process.env.SUPABASE_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (!groqKey || !rawUrl || !rawKey) {
    return res.status(500).json({ 
      erro: 'Variáveis ausentes na Vercel. Verifique GROQ_API_KEY, SUPABASE_URL e SUPABASE_KEY.' 
    });
  }

  if (req.headers['authorization'] !== process.env.SENHA_MESTRA) {
    return res.status(401).json({ erro: 'Acesso negado: Senha incorreta' });
  }

  try {
    const supabaseUrl = String(rawUrl)
      .trim()
      .replace(/^['"]|['"]$/g, '')
      .replace(/\/rest\/v1.*$/i, '')
      .replace(/\/+$/, '');

    const supabaseKey = String(rawKey).trim().replace(/^['"]|['"]$/g, '');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { mensagem } = req.body;
    if (!mensagem) {
      return res.status(400).json({ erro: 'Mensagem vazia.' });
    }

    // 1. Busca diretivas, memórias, histórico enxuto (6 mensagens) e modelos ativos na Groq
    const [memRes, histRes, modelsRes] = await Promise.all([
      supabase.from('memorias').select('id, fato, categoria').order('criado_em', { ascending: false }).limit(30),
      supabase.from('mensagens').select('role, conteudo').order('criado_em', { ascending: false }).limit(6),
      fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${groqKey}` }
      }).then(r => r.json()).catch(() => ({ data: [] }))
    ]);

    if (memRes.error) {
      throw new Error(`Erro ao ler tabela memorias no Supabase: ${memRes.error.message}`);
    }

    const memorias = memRes.data || [];
    const historico = histRes.data || [];

    // Filtra apenas modelos de chat que suportam Tool Calling (bloqueia allam, whisper, tts, guard, compound)
    const idsDisponiveis = (modelsRes.data || [])
      .map(m => m.id)
      .filter(id =>
        !id.includes('whisper') &&
        !id.includes('guard') &&
        !id.includes('tts') &&
        !id.includes('orpheus') &&
        !id.includes('arabic') &&
        !id.includes('playai') &&
        !id.includes('audio') &&
        !id.includes('allam') &&
        !id.includes('compound') &&
        (id.includes('llama') || id.includes('qwen') || id.includes('deepseek') || id.includes('gemma') || id.includes('mixtral'))
      );

    // Ordena priorizando os melhores modelos compatíveis com ferramentas
    const prioridades = [
      'llama-3.3-70b-versatile',
      'meta-llama/llama-4-scout-17b-16e-instruct',
      'meta-llama/llama-4-maverick-17b-128e-instruct',
      'qwen-qwq-32b',
      'deepseek-r1-distill-llama-70b',
      'gemma2-9b-it'
    ];

    const filaModelos = [
      ...prioridades.filter(p => idsDisponiveis.includes(p)),
      ...idsDisponiveis.filter(id => !prioridades.includes(id))
    ];

    if (filaModelos.length === 0) {
      filaModelos.push('llama-3.3-70b-versatile');
    }

    const textoDiretivas = memorias
      .filter(m => m.categoria === 'diretiva')
      .map(m => `- [ID: ${m.id}] ${m.fato}`)
      .join('\n') || 'Nenhuma diretiva cadastrada.';

    const textoOutrasMemorias = memorias
      .filter(m => m.categoria !== 'diretiva')
      .map(m => `- [ID: ${m.id} | ${m.categoria}] ${m.fato}`)
      .join('\n') || 'Nenhuma memória adicional.';

    const mensagensGroq = [
      {
        role: 'system',
        content: `Você é o Dante, assistente pessoal de alta performance do Gabriel.
DIRETRIZES FUNDAMENTAIS DO BANCO:
${textoDiretivas}

MEMÓRIAS E DADOS ATUAIS NO BANCO (${memorias.length} registros):
${textoOutrasMemorias}

REGRAS OBRIGATÓRIAS:
1. Chame o usuário de "chefe" ou "mestre". O mestre do Dante é o Gabriel.
2. FILTRO DE LINGUAGEM: Espelhe exatamente o estilo, gírias e nível de formalidade que o Gabriel usar. Evite asteriscos ou markdown pesado para a fala em voz soar natural.
3. PRIVACIDADE: Só fale sobre projetos pessoais ou dados confidenciais se tiver certeza de que é o Gabriel.
4. NUNCA FINJA QUE SALVOU OU CONSULTOU: Para salvar, editar, apagar ou ver o status do banco de dados, acione obrigatoriamente as ferramentas disponíveis (criar_registro, atualizar_registro, apagar_registro ou status_banco).`
      },
      ...historico.reverse().map(m => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: m.conteudo
      })),
      { role: 'user', content: mensagem }
    ];

    const tools = [
      {
        type: 'function',
        function: {
          name: 'criar_registro',
          description: 'Grava uma nova memória, diretiva ou anotação de projeto no banco de dados.',
          parameters: {
            type: 'object',
            properties: {
              fato: { type: 'string', description: 'Conteúdo exato a ser salvo.' },
              categoria: { type: 'string', description: 'Categoria: diretiva, projeto, preferencia, pessoal' }
            },
            required: ['fato']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'status_banco',
          description: 'Consulta em tempo real o status do banco de dados, total de registros e lista as memórias gravadas.',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'atualizar_registro',
          description: 'Atualiza o texto ou categoria de um registro existente usando o ID.',
          parameters: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'UUID do registro.' },
              fato: { type: 'string', description: 'Novo texto.' },
              categoria: { type: 'string', description: 'Nova categoria (opcional).' }
            },
            required: ['id', 'fato']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'apagar_registro',
          description: 'Apaga um registro do banco de dados pelo ID.',
          parameters: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'UUID do registro.' }
            },
            required: ['id']
          }
        }
      }
    ];

    let modeloAtivo = filaModelos[0];

    // Testa cada modelo válido da fila até encontrar um que suporte tools e tenha cota disponível
    async function chamarGroq(mensagensParaEnviar, usarTools = true) {
      let ultimoErro = null;

      for (const modeloAtual of filaModelos) {
        const bodyReq = {
          model: modeloAtual,
          messages: mensagensParaEnviar,
          max_tokens: 650,
          temperature: 0.5
        };

        if (usarTools) {
          bodyReq.tools = tools;
          bodyReq.tool_choice = 'auto';
        }

        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(bodyReq)
        });

        const data = await resp.json();

        if (resp.ok) {
          modeloAtivo = modeloAtual;
          return data;
        }

        ultimoErro = `${data.error?.message || 'Erro na API da Groq'} (Modelo: ${modeloAtual})`;
        // Continua o loop para o próximo modelo se der erro de tool_calling, rate limit (429) ou modelo indisponível
      }

      throw new Error(ultimoErro || 'Nenhum modelo compatível respondeu na Groq.');
    }

    // Primeira chamada à Groq
    const groqData = await chamarGroq(mensagensGroq, true);
    const choice = groqData.choices[0].message;
    let respostaFinal = choice.content || '';

    // Executa ferramentas reais no Supabase
    if (choice.tool_calls && choice.tool_calls.length > 0) {
      const resultadosTools = [];

      for (const toolCall of choice.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments || '{}');

        if (toolCall.function.name === 'criar_registro') {
          const { data, error } = await supabase
            .from('memorias')
            .insert({ fato: args.fato, categoria: args.categoria || 'geral' })
            .select();

          if (error) {
            resultadosTools.push(`FALHA AO SALVAR NO SUPABASE: ${error.message}`);
          } else {
            resultadosTools.push(`SUCESSO: Registro salvo com ID ${data[0].id}: "${args.fato}"`);
          }
        } 
        else if (toolCall.function.name === 'status_banco') {
          const [mCount, hCount] = await Promise.all([
            supabase.from('memorias').select('id, categoria, fato'),
            supabase.from('mensagens').select('id', { count: 'exact', head: true })
          ]);

          if (mCount.error) {
            resultadosTools.push(`ERRO AO LER BANCO: ${mCount.error.message}`);
          } else {
            const lista = (mCount.data || []).map(r => `[${r.categoria}] ${r.fato}`).join(' | ');
            resultadosTools.push(`BANCO ONLINE: ${mCount.data.length} memórias salvas e ${hCount.count || 0} mensagens no histórico. Itens: ${lista || 'Nenhum item ainda'}`);
          }
        }
        else if (toolCall.function.name === 'atualizar_registro') {
          const updateData = { fato: args.fato };
          if (args.categoria) updateData.categoria = args.categoria;
          const { error } = await supabase.from('memorias').update(updateData).eq('id', args.id);

          if (error) {
            resultadosTools.push(`FALHA AO ATUALIZAR: ${error.message}`);
          } else {
            resultadosTools.push(`SUCESSO: Registro ${args.id} atualizado.`);
          }
        }
        else if (toolCall.function.name === 'apagar_registro') {
          const { error } = await supabase.from('memorias').delete().eq('id', args.id);

          if (error) {
            resultadosTools.push(`FALHA AO APAGAR: ${error.message}`);
          } else {
            resultadosTools.push(`SUCESSO: Registro ${args.id} removido.`);
          }
        }
      }

      // Segundo turno: devolve o resultado do banco para o Dante responder
      const mensagensSegundoTurno = [
        ...mensagensGroq,
        choice,
        ...choice.tool_calls.map((tc, idx) => ({
          role: 'tool',
          tool_call_id: tc.id,
          content: resultadosTools[idx]
        }))
      ];

      try {
        const segundaData = await chamarGroq(mensagensSegundoTurno, false);
        respostaFinal = segundaData.choices?.[0]?.message?.content || resultadosTools.join('\n');
      } catch (e) {
        respostaFinal = resultadosTools.join('\n');
      }
    }

    if (!respostaFinal) {
      respostaFinal = 'Processado, chefe.';
    }

    // Salva histórico
    const { error: histInsertError } = await supabase.from('mensagens').insert([
      { role: 'user', conteudo: mensagem },
      { role: 'assistant', conteudo: respostaFinal }
    ]);

    if (histInsertError) {
      console.error('Erro ao gravar histórico na tabela mensagens:', histInsertError.message);
    }

    return res.status(200).json({ resposta: respostaFinal, modelo: modeloAtivo });

  } catch (err) {
    console.error('FALHA CRÍTICA NO BACKEND:', err);
    return res.status(500).json({ erro: err.message || 'Erro interno no servidor do Dante.' });
  }
}