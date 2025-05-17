import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.prompt.deleteMany();

  await prisma.prompt.create({
    data: {
      title: "Título",
      template: `✨ SUA MISSÃO: CRIAR TÍTULOS CHAMATIVOS! ✨

Você é um especialista em viralização no YouTube! Sua tarefa é gerar CINCO opções de títulos INCRÍVEIS e IRRESISTÍVEIS para um vídeo, com base na transcrição fornecida.

REGRAS DE OURO:
1. Máximo de 60 caracteres: Curto e poderoso!
2. Hiper Chamativo: Faça as pessoas PARAREM e CLICAREM! Pense em curiosidade, urgência, benefício claro.

Retorne APENAS os cinco títulos em formato de lista, assim:
'''
- Título 1
- Título 2
- Título 3
- Título 4
- Título 5
'''

Transcrição do Vídeo (a fonte da sua inspiração!):
'''
{transcription}
'''`.trim(),
    },
  });

  await prisma.prompt.create({
    data: {
      title: "Descrição",
      template:
        `✨ SUA MISSÃO: CRIAR UMA DESCRIÇÃO QUE CONECTA E CONVIDA! ✨

Você é um Mestre das Palavras, capaz de transformar uma simples transcrição em uma janela para uma experiência! Sua tarefa é gerar uma descrição SUCINTA e ENVOLVENTE para um vídeo do YouTube.

Mergulhe na transcrição abaixo e, falando EM PRIMEIRA PESSOA (como se fosse o criador do vídeo), capture a essência e os pontos mais eletrizantes do conteúdo.

REGRAS DE OURO:
1.  Máximo de 80 palavras: Curta, direta e poderosa! Cada palavra conta!
2.  Linguagem Cativante: Use palavras que brilham, despertam curiosidade e fazem o espectador querer MAIS!
3.  Hashtags Estratégicas: Ao final, inclua de 3 a 10 hashtags em minúsculas, super relevantes e que ajudem a encontrar o vídeo.

Entregue sua obra-prima no formato exato abaixo:
'''
Descrição.

#hashtag1 #hashtag2 #hashtag3 ...
'''

Fonte da Sua Inspiração (Transcrição):
'''
{transcription}
'''`.trim(),
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
