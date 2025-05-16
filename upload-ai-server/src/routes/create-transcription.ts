import { FastifyInstance } from "fastify";
import { readFile } from "node:fs/promises"; // Usaremos readFile para obter o buffer
import { z } from "zod";
import { geminiModel, safetySettings } from "../lib/gemini"; // Importando o modelo Gemini
import { prisma } from "../lib/prisma";
import mime from "mime-types"; // Para detectar o tipo MIME

export async function createTranscriptionRoute(app: FastifyInstance) {
  app.post("/videos/:videoId/transcription", async (req, reply) => {
    const paramsSchema = z.object({
      videoId: z.string().uuid(),
    });

    let videoId: string;
    try {
      const params = paramsSchema.parse(req.params);
      videoId = params.videoId;
    } catch (error) {
      return reply.status(400).send({ error: "Invalid video ID format." });
    }

    const bodySchema = z.object({
      prompt: z.string(),
    });

    let prompt: string;
    try {
      const body = bodySchema.parse(req.body);
      prompt = body.prompt;
    } catch (error) {
      return reply.status(400).send({ error: "Invalid request body." });
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

    const videoPath = video.path;

    try {
      const fileBuffer = await readFile(videoPath);
      const fileBase64 = fileBuffer.toString("base64");
      const mimeType = mime.lookup(videoPath);

      if (!mimeType) {
        return reply.status(400).send({ error: "Could not determine MIME type for the file." });
      }
      
      // Gemini aceita audio/* ou video/* para transcrição
      if (!mimeType.startsWith("audio/") && !mimeType.startsWith("video/")) {
        console.warn(`File ${videoPath} has MIME type ${mimeType}, which might not be optimal or directly supported for audio transcription by Gemini. Attempting anyway.`);
        // Poderia retornar um erro aqui se quisesse ser mais estrito
        // return reply.status(400).send({ error: `Unsupported file type: ${mimeType}. Gemini expects audio or video files.` });
      }

      const generationConfig = {
        // temperature: 0, // Gemini tem seu próprio range, 0.0 a 1.0 (ou mais dependendo do modelo). Default é geralmente bom.
        // maxOutputTokens: 8192, // Opcional
        // responseMimeType: "text/plain", // Para garantir que a resposta seja apenas texto
      };

      // Construindo a mensagem para o Gemini
      // O prompt do usuário pode ser usado para dar contexto ou guiar a transcrição
      const fullPrompt = `Transcreva o áudio deste arquivo em português. O contexto adicional é: "${prompt}". Se não houver contexto relevante no prompt do usuário, apenas transcreva.`;

      const parts = [
        {
          inlineData: {
            mimeType: mimeType,
            data: fileBase64,
          },
        },
        { text: fullPrompt },
      ];
      
      const result = await geminiModel.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig,
        safetySettings, // Opcional, mas bom ter
      });
      
      const response = result.response;
      
      // Verificando se há texto na resposta
      if (!response.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error("Gemini API response error or empty transcription:", JSON.stringify(response, null, 2));
        // Você pode querer inspecionar response.promptFeedback se houver um block
        if (response.promptFeedback?.blockReason) {
            return reply.status(500).send({ error: `Content blocked by Gemini. Reason: ${response.promptFeedback.blockReason}` });
        }
        return reply.status(500).send({ error: "Failed to transcribe audio or transcription is empty." });
      }
      
      const transcription = response.candidates[0].content.parts[0].text;


      await prisma.video.update({
        where: {
          id: videoId,
        },
        data: {
          transcription,
        },
      });

      return { transcription };

    } catch (error: any) {
      console.error("Error during transcription with Gemini:", error);
      // Pode ser um erro de API, erro de leitura de arquivo, etc.
      return reply.status(500).send({ 
        error: "Error processing transcription with Gemini.", 
        details: error.message 
      });
    }
  });
}