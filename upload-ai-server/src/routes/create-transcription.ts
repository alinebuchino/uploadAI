import { FastifyInstance } from "fastify";
import mime from "mime-types";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { geminiModel, safetySettings } from "../lib/gemini";
import { prisma } from "../lib/prisma";

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
      
      if (!mimeType.startsWith("audio/") && !mimeType.startsWith("video/")) {
        console.warn(`File ${videoPath} has MIME type ${mimeType}, which might not be optimal or directly supported for audio transcription by Gemini. Attempting anyway.`);
      }

      const generationConfig = {
      };

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
        safetySettings, 
      });
      
      const response = result.response;
      
      if (!response.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error("Gemini API response error or empty transcription:", JSON.stringify(response, null, 2));
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
      return reply.status(500).send({ 
        error: "Error processing transcription with Gemini.", 
        details: error.message 
      });
    }
  });
}