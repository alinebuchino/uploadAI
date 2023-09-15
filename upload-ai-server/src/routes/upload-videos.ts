import { fastifyMultipart } from "@fastify/multipart";
import { FastifyInstance } from "fastify";
import fs from "fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import { prisma } from "../lib/prisma";

const pump = promisify(pipeline); // vai salvando o vídeo aos poucos na máquina para reduzir o tempo de espera até o carregamento terminar

export async function uploadVideoRoute(app: FastifyInstance) {
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1_048_576 * 25, // 25mb
    },
  });
  app.post("/videos", async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.status(400).send({ error: "Nenhum vídeo selecionado." });
    }

    const extension = path.extname(data.filename);

    if (extension !== ".mp3") {
      return reply
        .status(400)
        .send({ error: "Tipo de vídeo inválido. Extensão necessita ser MP3." });
    }

    const fileBaseName = path.basename(data.filename, extension);
    const fileUploadName = `${fileBaseName}-${randomUUID()}${extension}`;

    const uploadDestination = path.resolve(
      __dirname,
      "../../videos",
      fileUploadName
    );

    await pump(data.file, fs.createWriteStream(uploadDestination)); // recebo os dados do arquivo e escrevo aos poucos conforme o video for sendo carregado.

    const video = await prisma.video.create({
      data: {
        name: data.filename,
        path: uploadDestination,
      },
    });

    return {
      video,
    };
  });
}
