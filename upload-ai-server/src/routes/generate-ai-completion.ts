import { GoogleGenerativeAIStream, streamToResponse } from "ai";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { geminiModel, safetySettings } from "../lib/gemini";
import { prisma } from "../lib/prisma";

// (Opcional, mas bom para tipagem mais forte se você construir o array de mensagens manualmente)
// Interface para as mensagens do Gemini (simplificada)
// A biblioteca 'ai' já lida com a conversão para o formato do Gemini
// se você passar um array de Message (do 'ai')
// Mas para clareza, o formato do Gemini é:
// interface GeminiPart { text: string; }
// interface GeminiContent { role: 'user' | 'model'; parts: GeminiPart[]; }

export async function generateAICompletionRoute(app: FastifyInstance) {
  app.post("/ai/complete", async (req, reply) => {
    const bodySchema = z.object({
      videoId: z.string().uuid(),
      prompt: z.string(), // Este é o template do prompt
      temperature: z.number().min(0).max(1).default(0.5),
    });

    let videoId: string, userPromptTemplate: string, temperature: number;
    try {
      const parsedBody = bodySchema.parse(req.body);
      videoId = parsedBody.videoId;
      userPromptTemplate = parsedBody.prompt;
      temperature = parsedBody.temperature;
    } catch (error) {
      return reply.status(400).send({ error: "Invalid request body.", details: error });
    }

    let video;
    try {
      video = await prisma.video.findUniqueOrThrow({
        where: {
          id: videoId,
        },
      });
    } catch (error) {
      return reply.status(404).send({ error: "Video not found." });
    }

    if (!video.transcription) {
      return reply
        .status(400)
        .send({ error: "Transcrição do vídeo não foi gerada." });
    }

    // Monta o prompt final substituindo o placeholder {transcription}
    const finalPrompt = userPromptTemplate.replace(
      "{transcription}",
      video.transcription
    );

    // Para o Gemini, o formato da mensagem é um pouco diferente,
    // mas a biblioteca 'ai' com GoogleGenerativeAIStream pode aceitar
    // um array de 'Message' (do pacote 'ai') ou diretamente
    // o formato 'contents' do Gemini.
    // Vamos usar o formato 'contents' para clareza aqui,
    // ou deixar o GoogleGenerativeAIStream fazer a conversão se passarmos Message[].

    // O Gemini espera 'contents' como um array de objetos com 'role' e 'parts'.
    // Para uma mensagem de usuário simples:
    const geminiContents = [{ role: "user", parts: [{ text: finalPrompt }] }];

    try {
      // Usando geminiModel.generateContentStream
      const geminiResponse = await geminiModel.generateContentStream({
        contents: geminiContents, // Passando o formato 'contents'
        generationConfig: {
          temperature,
          // candidateCount: 1, // Geralmente 1 para chat/completion
          // maxOutputTokens: 2048, // Defina se necessário
        },
        safetySettings, // Importante para moderação de conteúdo
      });

      // Usa GoogleGenerativeAIStream para adaptar a resposta do Gemini
      // A `geminiResponse` aqui é o objeto retornado por `generateContentStream`,
      // que contém um campo `.stream` que é o async iterable.
      // GoogleGenerativeAIStream espera esse objeto diretamente.
      const stream = GoogleGenerativeAIStream(geminiResponse);

      // streamToResponse continua o mesmo, pois recebe um ReadableStream
      return streamToResponse(stream, reply.raw, {
        headers: {
          "Access-Control-Allow-Origin": "*", // Mantenha ou ajuste conforme suas necessidades de CORS
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
      });

    } catch (error: any) {
      console.error("Error generating AI completion with Gemini:", error);
      // Verificar se é um erro da API do Gemini com detalhes
      if (error.response && error.response.data) {
        console.error("Gemini API Error Details:", error.response.data);
        return reply.status(500).send({
          error: "Failed to generate AI completion due to Gemini API error.",
          details: error.response.data,
        });
      }
      return reply.status(500).send({
        error: "Failed to generate AI completion.",
        details: error.message,
      });
    }
  });
}