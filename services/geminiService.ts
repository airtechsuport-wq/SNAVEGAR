import { GoogleGenAI } from "@google/genai";
import { DailyRecord } from "../types";

// --- ROBUST API KEY STRATEGY FOR PWA ---
// O PWA em modo standalone muitas vezes perde acesso ao process.env injetado pelo bundler/editor.
// Esta função tenta recuperar a chave do ambiente e, se bem-sucedida, faz cache dela para uso futuro no PWA.
const getApiKey = () => {
  let key = '';
  const CACHE_KEY = 'snavegar_gemini_key_secure_cache';

  // 1. Tenta obter do ambiente (Funciona no Navegador/Dev)
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      key = process.env.API_KEY;
      // Sucesso: Salva no cofre local para o PWA usar depois
      try { localStorage.setItem(CACHE_KEY, key); } catch(e) {}
    }
  } catch (e) {
    // process is undefined
  }

  // 2. Se falhou (Modo PWA), tenta recuperar do cofre local
  if (!key) {
    try { 
      key = localStorage.getItem(CACHE_KEY) || ''; 
      if (key) console.log("Gemini: Usando chave recuperada do cache local (Modo PWA).");
    } catch(e) {}
  }

  // 3. (Opcional) Espaço para hardcode manual se tudo mais falhar
  // const MANUAL_KEY = 'SUA_KEY_AQUI'; 
  // if (!key && MANUAL_KEY) key = MANUAL_KEY;

  return key;
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

// Helper function to crunch the numbers before sending to AI
const generateAnalysisContext = (records: DailyRecord[]) => {
  if (records.length === 0) return "Sem registros disponíveis no banco de dados.";

  // 1. Calculate Global Totals
  const totalKm = records.reduce((sum, r) => sum + (Number(r.km_total) || 0), 0);
  const totalFuel = records.reduce((sum, r) => sum + (Number(r.fuel_amount) || 0), 0);
  const totalTolls = records.reduce((sum, r) => sum + (Number(r.toll_amount) || 0), 0);
  const totalDelivered = records.reduce((sum, r) => sum + (Number(r.articles_delivered) || 0), 0);
  const totalFailed = records.reduce((sum, r) => sum + (Number(r.articles_not_delivered) || 0), 0);
  const totalRecords = records.length;
  
  // 2. Calculate Stats per Team
  const teamStats: Record<string, { km: number, delivered: number, failed: number, cost: number, days: number }> = {};
  
  records.forEach(r => {
    const team = r.team || "Equipe Desconhecida";
    if (!teamStats[team]) {
        teamStats[team] = { km: 0, delivered: 0, failed: 0, cost: 0, days: 0 };
    }
    teamStats[team].km += (Number(r.km_total) || 0);
    teamStats[team].delivered += (Number(r.articles_delivered) || 0);
    teamStats[team].failed += (Number(r.articles_not_delivered) || 0);
    teamStats[team].cost += (Number(r.fuel_amount) || 0) + (Number(r.toll_amount) || 0);
    teamStats[team].days += 1;
  });

  // 3. Format the text block (Translate headers for context consistency)
  return `
  === RESUMO EXECUTIVO ===
  - Total de Registros: ${totalRecords}
  - Distância Total Percorrida: ${totalKm.toFixed(1)} km
  - Despesas Totais (Combustível + Pedágio): €${(totalFuel + totalTolls).toFixed(2)} (Combustível: €${totalFuel}, Pedágio: €${totalTolls})
  - Sucesso Geral de Entrega: ${totalDelivered} entregues / ${totalFailed} falhas
  
  === DESEMPENHO POR EQUIPE ===
  ${Object.entries(teamStats).map(([team, stats]) => 
    `- ${team}: ${stats.days} turnos, ${stats.km.toFixed(0)}km, ${stats.delivered} entregues, ${stats.failed} falhas, €${stats.cost.toFixed(2)} custo.`
  ).join('\n')}

  === REGISTROS RECENTES (Data | Equipe | KM | Entregues/Falhas | Custo | Obs) ===
  ${records.slice(0, 50).map(r => 
    `${r.date} | ${r.team} | ${r.km_total}km | ${r.articles_delivered}/${r.articles_not_delivered} | €${((r.fuel_amount||0)+(r.toll_amount||0)).toFixed(0)} | ${r.notes ? r.notes.substring(0, 50) + '...' : '-'}`
  ).join('\n')}
  `;
};

export const geminiService = {
  // Chatbot using Gemini 3 Pro for deep reasoning over analytics
  async chatWithBot(message: string, records: DailyRecord[]) {
    if (!apiKey) {
        return "ERRO CRÍTICO: API Key não encontrada no PWA. Por favor, abra o app no navegador uma vez para sincronizar a chave.";
    }
    
    const context = generateAnalysisContext(records);
    
    const systemInstruction = `Você é o Analista de IA especializado para 'SNavegar', uma empresa de logística e entregas.
    
    SUAS CAPACIDADES:
    1. Você tem acesso às estatísticas completas do banco de dados (Resumo) e registros detalhados abaixo.
    2. Você pode responder perguntas sobre custos totais, eficiência da equipe, falhas de entrega específicas e tendências de distância.
    3. Se perguntado sobre uma equipe específica, olhe a seção "DESEMPENHO POR EQUIPE".
    4. Mantenha as respostas profissionais, concisas e baseadas em dados. Use Euro (€) para moeda.
    5. RESPONDA SEMPRE EM PORTUGUÊS DO BRASIL.
    
    CONTEXTO DE DADOS ATUAL:
    ${context}
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: message,
        config: {
          systemInstruction,
          temperature: 0.3,
        }
      });
      return response.text || "Analisei os dados, mas não consegui gerar uma resposta em texto.";
    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      
      // Error handling amigável para o usuário final
      let cleanMsg = error.message || 'Falha desconhecida';
      if (cleanMsg.includes('API key not valid')) {
          cleanMsg = "A chave de API não foi reconhecida. Tente reabrir o app pelo navegador para atualizar as credenciais.";
      }
      
      return `Erro ao conectar com a IA: ${cleanMsg}`;
    }
  },

  // Fast responses using Gemini Flash Lite
  async getQuickInsight(records: DailyRecord[]) {
    if (!apiKey) return "SNavegar: Organize suas rotas.";
    
    const totalDelivered = records.reduce((sum, r) => sum + (Number(r.articles_delivered) || 0), 0);
    const totalFailed = records.reduce((sum, r) => sum + (Number(r.articles_not_delivered) || 0), 0);
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest', 
        contents: `Com base em ${records.length} registros com ${totalDelivered} sucessos e ${totalFailed} falhas, me dê UMA única frase motivadora ou uma dica breve de eficiência em Português do Brasil.`,
      });
      return response.text || "Continue buscando a excelência!";
    } catch (error) {
      console.error("Gemini Flash Lite Error:", error);
      return "Pronto para um novo dia!";
    }
  }
};