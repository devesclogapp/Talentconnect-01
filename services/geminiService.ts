import { GoogleGenAI } from "@google/genai";

// Lazy initialization - só cria o cliente quando necessário
const getAI = () => {
  // Try standard Vite prefix first, then fallback to defined process.env
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.GEMINI_API_KEY ||
    (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada. Configure no arquivo .env.local com o prefixo VITE_');
  }
  return new GoogleGenAI({ apiKey });
};

export const getAISupport = async (userPrompt: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: {
        systemInstruction: "Você é um assistente de IA prestativo da Justlife, uma plataforma de serviços domésticos. Você ajuda os usuários a encontrar serviços, explica procedimentos de limpeza ou oferece dicas de manutenção doméstica. Mantenha as respostas concisas e amigáveis em português do Brasil."
      }
    });
    return response.text || "Sinto muito, não consegui processar esse pedido.";
  } catch (error) {
    console.error("Erro Gemini:", error);
    return "Algo deu errado. Por favor, tente novamente mais tarde.";
  }
};
