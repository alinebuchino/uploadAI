import { GoogleGenerativeAIStream, streamToResponse } from "ai";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { geminiModel, safetySettings } from "../lib/gemini";
import { prisma } from "../lib/prisma";

export async function generateAICompletionRoute(app: FastifyInstance) {
  app.post("/ai/complete", async (req, reply) => {
    const bodySchema = z.object({
      videoId: z.string().uuid(),
      prompt: z.string(), 
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

    const finalPrompt = userPromptTemplate.replace(
      "{transcription}",
      video.transcription
    );

    const geminiContents = [{ role: "user", parts: [{ text: finalPrompt }] }];

    try {
      const geminiResponse = await geminiModel.generateContentStream({
        contents: geminiContents,
        generationConfig: {
          temperature,
        },
        safetySettings, 
      });

      const stream = GoogleGenerativeAIStream(geminiResponse);

      return streamToResponse(stream, reply.raw, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
      });

    } catch (error: any) {
      console.error("Error generating AI completion with Gemini:", error);
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