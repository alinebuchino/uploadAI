import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.prompt.deleteMany();

  await prisma.prompt.create({
    data: {
      title: "Título",
      template: `✨ SUA MISSÃO: CRIAR TÍTULOS CHAMATIVOS! ✨

Você é um especialista em viralização no YouTube! Sua tarefa é gerar CINCO opções de títulos INCRÍVEIS e IRRESISTÍVEIS para um vídeo, com base na transcrição fornecida.

🎯 REGRAS DE OURO:
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

Transcrição do vídeo (a fonte da sua inspiração!):
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

🎯 REGRAS DE OURO:
1.  Nas primeiras 1-2 linhas, diga exatamente do que o vídeo trata e por que ele é útil para o espectador.
2.  Evite descrições muito longas
3.  Linguagem Cativante: Use palavras que brilham, despertam curiosidade e fazem o espectador querer MAIS!
4.  Hashtags Estratégicas: Ao final, inclua de 3 a 10 hashtags em minúsculas, super relevantes e que ajudem a encontrar o vídeo.

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

    await prisma.prompt.create({
    data: {
      title: "Posts",
      template:
        `✨ ✨ SUA MISSÃO: CRIAR POSTS QUE EXPLODEM DE ENGAJAMENTO! ✨

Você é um Gênio das Redes Sociais, um verdadeiro Alquimista de Conteúdo! 
Sua tarefa é transformar a transcrição do vídeo em 3 posts CURTOS, MAGNÉTICOS e OTIMIZADOS para diversas plataformas. Com voz autêntica, extraia a essência do vídeo para posts VIRAIS! 

🎯 REGRAS DE OURO PARA POSTS VIRAIS:
1. Impacto Imediato (Primeira Linha!): Comece com uma frase ou pergunta poderosa que prenda a atenção instantaneamente. Qual é a GRANDE IDEIA ou o MAIOR BENEFÍCIO do vídeo?
2. Concisão Poderosa
3. Instagram/Facebook: Até 4-5 frases curtas.
4. LinkedIn: Um pouco mais elaborado, focando no valor profissional/aprendizado (3-6 frases).
5. X/Twitter: Super direto, no máximo 280 caracteres (idealmente menos), talvez com uma pergunta chave.
6. Linguagem que Conecta: Use palavras que vibram, inspiram, geram FOMO (Fear Of Missing Out) e convidam à interação (comentários, compartilhamentos). Pense em EMOÇÃO e UTILIDADE!
7. Hashtags Estratégicas (por post): Inclua de 3 a 5 hashtags super relevantes e específicas para cada plataforma, ajudando na descoberta.

ENTREGUE OS POSTS GERADO NO FORMATO EXATO ABAIXO:
**Post para cada tipo de plataforma**

[Texto do Post com quebras de linha apropriadas]

#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5

Transcrição do vídeo (a fonte da sua inspiração!):
'''
{transcription}
'''
`.trim(),
    },
  });

  await prisma.prompt.create({
    data: {
      title: "Resumo",
      template:
        `✨ SUA MISSÃO: RESUMIR DE FORMA SUCINTA O CONTEÚDO DO VÍDEO! ✨

Você é uma IA especialista em comunicação clara e conteúdo estratégico. Sua tarefa é resumir o vídeo de forma sucinta, transformando a fala em texto objetivo, atrativo e entendível.

🎯 REGRAS DE OURO:
1. Comece com Impacto: A primeira frase deve entregar o tema central ou maior benefício/conhecimento do vídeo.
2. Foque nos pontos mais importantes: Identifique os tópicos-chave discutidos e destaque-os de forma clara.
3. Seja Conciso: O resumo completo deve ter no máximo 5 a 8 linhas.
4. Linguagem Acessível e Envolvente: Use um tom natural.

Transcrição do Vídeo (a fonte da sua inspiração!):
'''
{transcription}
'''

`.trim(),
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
