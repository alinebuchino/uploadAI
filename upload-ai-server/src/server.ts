import 'dotenv/config';

import { fastifyCors } from "@fastify/cors";
import {
    GoogleGenerativeAI,
    HarmBlockThreshold,
    HarmCategory
} from "@google/generative-ai";
import { fastify } from "fastify";
import { createTranscriptionRoute } from "./routes/create-transcription";
import { generateAICompletionRoute } from "./routes/generate-ai-completion";
import { getAllPromptsRoute } from "./routes/get-all-prompts";
import { uploadVideoRoute } from "./routes/upload-videos";

const app = fastify();

if (!process.env.GEMINI_API_KEY) {
  console.error("ERRO: GEMINI_API_KEY não está definida no ambiente.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
});

app.register(fastifyCors, {
  origin: "*", 
});

app.register(getAllPromptsRoute);
app.register(uploadVideoRoute);
app.register(createTranscriptionRoute);
app.register(generateAICompletionRoute);

const INITIAL_SYSTEM_PROMPT = `Você é o Assistente Virtual do Upload AI. Sua única responsabilidade é responder a perguntas e
fornecer informações precisas sobre o projeto Upload AI, suas funcionalidades (como upload de vídeo, geração de transcrição,
criação de títulos e descrições com IA), para que serve a temperatura do Gemini como utilizá-la,
como usar a plataforma e solucionar problemas comuns relacionados ao Upload AI. Se uma pergunta não estiver relacionada ao Upload AI,
responda educadamente que você só pode ajudar com tópicos sobre o Upload AI e não pode fornecer informações sobre outros assuntos.
Mantenha suas respostas focadas e relevantes para o Upload AI.`;

const RAG_SYSTEM_PROMPT_TEMPLATE = `Você é o Assistente Virtual do Upload AI. Use o "Contexto Adicional" fornecido abaixo para responder à "Pergunta do Usuário".
Sua resposta deve ser baseada exclusivamente neste contexto, quando ele for relevante para a pergunta.
Se o contexto não contiver a resposta ou a pergunta não estiver relacionada ao Upload AI, informe educadamente que você só pode ajudar com questões sobre o Upload AI.
Seja conciso e direto ao ponto. Não invente informações.

Contexto Adicional:
---
{CONTEXTO_AQUI}
---

Pergunta do Usuário: {PERGUNTA_USUARIO_AQUI}

Sua Resposta:`;


const knowledgeBase = [
    { keywords: ["transcrição", "legenda", "converter vídeo em texto"], 
        info: "A funcionalidade de transcrição do Upload AI permite que você extraia automaticamente o texto falado de vídeos enviados para a plataforma. Esse texto (a transcrição) pode ser utilizado para diversas finalidades, como gerar resumos, identificar tópicos importantes, criar legendas, ou alimentar prompts personalizados com o conteúdo do vídeo."

     },
    { keywords: ["título", "descrição", "gerar texto", "o que é upload ai", "o que upload ai faz", "sobre upload ai"], 
        info: "Com o Upload AI, você transforma cada vídeo em uma oportunidade real de engajamento e descoberta. Nossa inteligência artificial gera automaticamente títulos envolventes, descrições otimizadas, posts viraris para redes sociais e resumos sucintos, prontos para captar a atenção do público certo — tudo em poucos segundos." 
    },
    { keywords: ["temperatura", "o que é", "como usar", "criatividade", "imprevisibilidade"], 
        info: "A funcionalidade de temperatura no contexto de modelos de IA como o Gemini, e que pode ser usada no Upload AI para geração de texto, controla o nível de aleatoriedade ou 'criatividade' nas respostas. Um valor baixo (ex: 0.2) torna a resposta mais focada e determinística. Um valor alto (ex: 0.9) torna a resposta mais diversa e criativa, mas também com maior chance de se desviar do tópico ou cometer erros. No Upload AI, você ajusta a temperatura para controlar o estilo dos títulos e descrições gerados." 
    },
    {
        keywords: ["como funciona upload ai", "passo a passo upload ai", "usar upload ai"],
        info: "Usar o Upload AI é simples: 1. Faça o upload do seu arquivo de vídeo. 2. Escolha as ações que deseja realizar, como gerar transcrição, títulos ou descrições. 3. Ajuste configurações como a 'temperatura' da IA, se desejar. 4. A plataforma processará seu vídeo e fornecerá os resultados gerados pela inteligência artificial."
    },
    {
        keywords: ["tipos de vídeo suportados", "formatos de vídeo", "qual vídeo posso enviar"],
        info: "O Upload AI suporta os formatos de vídeo mais comuns, como MP4, MOV, AVI, e WebM. Se tiver dúvidas sobre um formato específico, consulte nossa documentação ou entre em contato com o suporte."
    },
    {
        keywords: ["quanto tempo demora", "velocidade processamento", "tempo para gerar"],
        info: "O tempo de processamento no Upload AI depende do tamanho e da duração do seu vídeo, além das tarefas selecionadas. Transcrições de vídeos longos podem levar alguns minutos, enquanto a geração de títulos e descrições costuma ser bem rápida, geralmente questão de segundos após o processamento inicial do vídeo."
    },
    {
        keywords: ["preciso de conta", "cadastro", "login", "criar conta"],
        info: "Não, basta acessar nossa plataforma e começar a usar! O Upload AI é totalmente gratuito e não requer registro ou login para começar a fazer upload de vídeos e gerar transcrições, títulos e descrições."
    },
    {
        keywords: ["é gratuito", "custo upload ai", "planos upload ai", "preço upload ai"],
        info: "O Upload AI é totalmente gratuito. Aproveite!"
    },
    {
        keywords: ["segurança dos meus vídeos", "privacidade vídeos", "meus vídeos são públicos"],
        info: "Levamos a segurança e a privacidade dos seus dados muito a sério. Seus vídeos enviados para o Upload AI são processados de forma segura e não são compartilhados publicamente, a menos que você explicitamente escolha fazer isso através de outras plataformas. Consulte nossa Política de Privacidade para mais detalhes."
    },
    {
        keywords: ["idiomas suportados", "transcrição outros idiomas", "tradução"],
        info: "A funcionalidade de transcrição do Upload AI suporta diversos idiomas. Atualmente, o foco principal é na transcrição, e funcionalidades de tradução direta podem variar."
    },
    {
        keywords: ["qual ia vocês usam", "modelo de ia", "tecnologia por trás"],
        info: "O Upload AI utiliza modelos de inteligência artificial de ponta, como os da família Gemini do Google, para fornecer resultados de alta qualidade em transcrição e geração de texto. Estamos sempre buscando as melhores tecnologias para aprimorar nossos serviços."
    },
    {
        keywords: ["posso editar transcrição", "corrigir texto", "editar resultado ia"],
        info: "Sim, após a IA gerar a transcrição do seu vídeo, você geralmente tem a opção de revisar e editar o texto diretamente na plataforma Upload AI para garantir a máxima precisão ou fazer ajustes conforme sua necessidade."
    },
    {
        keywords: ["suporte técnico", "ajuda upload ai", "contato suporte", "problemas"],
        info: "Se você encontrar qualquer problema ou tiver dúvidas ao usar o Upload AI, nossa equipe de suporte está pronta para ajudar! Você pode encontrar opções de contato, como e-mail ou um chat de suporte, em nossa página de 'Ajuda' ou 'Contato'."
    },
    {
        keywords: ["limite de upload", "tamanho máximo vídeo", "duração máxima vídeo"],
        info: "Os limites de tamanho e duração para upload de vídeos são ilimitados!"
    },
    {
        keywords: ["quem pode usar upload ai", "público alvo", "para quem é"],
        info: "O Upload AI é ideal para criadores de conteúdo, profissionais de marketing, educadores, empresas e qualquer pessoa que trabalhe com vídeos e queira otimizar seu tempo e melhorar o alcance e engajamento do seu material."
    },
    {
        keywords: ["api upload ai", "integração upload ai", "desenvolvedores"],
        info: "Atualmente, estamos focados em fornecer a melhor experiência através da nossa plataforma web. Informações sobre a disponibilidade de uma API para desenvolvedores seriam comunicadas em nossos canais oficiais caso se tornem disponíveis." 
    }
];

function findRelevantInfo(userMessage: string): string {
    let relevantContext = "";
    const foundInfos: string[] = [];
    for (const item of knowledgeBase) {
        const lowerKeywords = item.keywords.map(kw => kw.toLowerCase());
        if (lowerKeywords.some(kw => lowerKeywords.includes(kw))) {
            foundInfos.push(item.info);
        }
    }
    relevantContext = foundInfos.join("\n\n");
    return relevantContext.trim();
}

app.post('/api/chat', async (request, reply) => {
    try {
        const body = request.body as { message?: string };
        const userMessage = body?.message;

        if (!userMessage) {
            return reply.code(400).send({ error: 'Mensagem é obrigatória.' });
        }

        const relevantContext = findRelevantInfo(userMessage);
        let finalPromptForModel: string;

        if (relevantContext) {
            finalPromptForModel = RAG_SYSTEM_PROMPT_TEMPLATE
                .replace("{CONTEXTO_AQUI}", relevantContext)
                .replace("{PERGUNTA_USUARIO_AQUI}", userMessage);
        } else {
            finalPromptForModel = `${INITIAL_SYSTEM_PROMPT}\n\nPergunta do Usuário: ${userMessage}\n\nSua Resposta:`;
        }

        const result = await model.generateContent(finalPromptForModel);
        const response = result.response;

        if (!response) {
            console.error("Resposta da API Gemini foi indefinida.");
            return reply.code(500).send({ error: 'Não foi possível obter uma resposta do modelo de IA.' });
        }

        const botMessageText = response.text();

        reply.send({ reply: botMessageText });

    } catch (error) {
        console.error("Erro ao chamar a API do GEMINI! ", error);
        const typedError = error as any;

        if (typedError.response?.promptFeedback?.blockReason) {
            reply.code(400).send({ error: `Conteúdo bloqueado: ${typedError.response.promptFeedback.blockReason}` });
        } else if (typedError.message?.includes('API key not valid')) {
            reply.code(401).send({ error: 'Chave de API inválida ou não autorizada.' });
        } else {
            reply.code(500).send({ error: 'Erro ao processar sua mensagem.' });
        }
    }
});

app
  .listen({
    port: 3333,
    host: '0.0.0.0'
  })
  .then(() => {
    console.log("Servidor HTTP rodando na porta 3333");
  })
  .catch((err) => {
    console.error("Erro ao iniciar o servidor:", err);
    process.exit(1);
  });