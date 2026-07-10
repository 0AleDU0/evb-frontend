// Genera los audios de los 35 diálogos llamando al servidor TTS local
// y los guarda en public/audio/<tema>-<numero>.mp3
//
// Uso:
//   1. Asegúrate de tener corriendo: python tts-server/app.py
//   2. node scripts/generate-dialogues-audio.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const TTS_URL = 'http://127.0.0.1:5001/api/tts';
const OUTPUT_DIR = path.resolve('public/audio');
const VOZ = 'es-UY-ValentinaNeural';
const DELAY_MS = 300; // pausa entre peticiones para no saturar el server local

const dialogues = [
  // Soy creado
  { tema: 'soy-creado', numero: 1, texto: '¡Hola a todos! Soy PIXEL, su asistente virtual. Estoy aquí para ayudarlos con datos bíblicos y tecnológicos para descubrir juntos su identidad en Cristo. Hoy hablaremos sobre propósito. ¿Sabían que un diseñador de software no solo hace que un programa se vea bonito? También le da funciones específicas. Cada línea de código tiene un objetivo.' },
  { tema: 'soy-creado', numero: 2, texto: '¡Exactamente! Así como un diseñador planifica cada función, Dios también nos diseñó con un propósito. Tal vez aún no sabes cuál es, pero Él ya lo pensó todo antes de que nacieras. ¿Quieren saber de alguien en la Biblia que también fue diseñado con un propósito?' },
  { tema: 'soy-creado', numero: 3, texto: '¡Sí! ¿Quieren conocer a alguien que fue llamado por Dios con un gran propósito desde antes de nacer?' },
  { tema: 'soy-creado', numero: 4, texto: '¡Muy bien! Vamos a nuestra lección número 1' },

  // Soy guardado
  { tema: 'soy-guardado', numero: 5, texto: '¡Hola, chicos! Parece que tenemos una amenaza digital. Pero no se preocupen, ¡estoy aquí para ayudar!' },
  { tema: 'soy-guardado', numero: 6, texto: '¡Claro que sí! Así como los dispositivos necesitan protección contra virus, ¡también nosotros necesitamos cuidar lo que dejamos entrar en nuestra mente y corazón!' },
  { tema: 'soy-guardado', numero: 7, texto: 'Exactamente, Tobi. Piensa en ti como un sistema especial que Dios diseñó. Si dejas que cosas dañinas entren, como en un juego sin filtros, tu corazón se puede "infectar". Pero si usas el "firewall" de Dios (Su Palabra y oración), estarás protegido.' },
  { tema: 'soy-guardado', numero: 8, texto: '¡Exacto! Daniel eligió no contaminarse con la comida del rey. Aunque estaba rodeado de cosas nuevas, protegió su fe. Su fidelidad fue su antivirus.' },
  { tema: 'soy-guardado', numero: 9, texto: '¡Muy bien dicho, Tobi! Y recuerden, Dios está con ustedes para ayudarlos a decidir bien. ¿Les gustaría saber sobre alguien que eligió protegerse y confiar en Dios en medio de la presión?' },
  { tema: 'soy-guardado', numero: 10, texto: '¡Vamos a descubrirlo en la lección de hoy!' },

  // Soy amado
  { tema: 'soy-amado', numero: 11, texto: 'Notificación nueva recibida.' },
  { tema: 'soy-amado', numero: 12, texto: 'De alguien muy importante… Dice: "Eres valioso para mí."' },
  { tema: 'soy-amado', numero: 13, texto: 'Ese es el punto, Tobi. El amor de Dios no se gana como puntos en un juego. Él ama porque eres su hijo.' },
  { tema: 'soy-amado', numero: 14, texto: '¡Exacto! La del hijo que decidió irse de casa creyendo que estaría mejor lejos de su padre.' },
  { tema: 'soy-amado', numero: 15, texto: 'Ese mismo. Pensó que al volver sería rechazado… pero su padre hizo algo increíble.' },
  { tema: 'soy-amado', numero: 16, texto: 'Sin condiciones. Porque nunca dejó de ser su hijo.' },
  { tema: 'soy-amado', numero: 17, texto: 'Nunca. Cuando te alejas, Él espera. Cuando caes, Él abraza. Cuando vuelves, hay fiesta.' },
  { tema: 'soy-amado', numero: 18, texto: 'Y hoy vamos a descubrirla juntos. ¿Listos para conocer esta historia de amor sin condiciones?' },

  // Soy libre
  { tema: 'soy-libre', numero: 19, texto: 'Sistema detecta bloqueo.' },
  { tema: 'soy-libre', numero: 20, texto: 'No siempre son visibles. Algunos se llaman miedo, culpa, pecado, vergüenza… o situaciones que nos hacen sentir atrapados.' },
  { tema: 'soy-libre', numero: 21, texto: 'Exacto. Hay prisiones sin barrotes.' },
  { tema: 'soy-libre', numero: 22, texto: 'Hay algo que nunca deja de funcionar: hablar con Dios' },
  { tema: 'soy-libre', numero: 23, texto: 'Sí. La oración no siempre cambia las circunstancias al instante, pero siempre activa el poder de Dios.' },
  { tema: 'soy-libre', numero: 24, texto: 'Especialmente ahí. Ninguna cadena es más fuerte que Dios.' },
  { tema: 'soy-libre', numero: 25, texto: 'Nos libera para vivir como fuimos diseñados: libres para obedecer, amar y avanzar en Su propósito.' },
  { tema: 'soy-libre', numero: 26, texto: 'Nunca lo es cuando Dios está presente.' },
  { tema: 'soy-libre', numero: 27, texto: 'Sino confiar en Aquel que puede abrir cualquier puerta.' },
  { tema: 'soy-libre', numero: 28, texto: 'Mensaje principal: Cuando Dios actúa, ninguna prisión permanece cerrada.' },

  // Soy transformado
  { tema: 'soy-transformado', numero: 29, texto: '¡Hola, equipo digital! Escuché algo sobre actualizaciones… ¿necesitan ayuda?' },
  { tema: 'soy-transformado', numero: 30, texto: '¡Muy real, Tobi! Así como las aplicaciones reciben nuevas versiones para funcionar mejor, nuestra vida también necesita renovación constante. ¡Y eso incluye nuestro corazón!' },
  { tema: 'soy-transformado', numero: 31, texto: '¡Exacto, Lía! Pero hay buenas noticias: en Cristo, ¡siempre hay una nueva oportunidad! ¿Han escuchado sobre Saulo?' },
  { tema: 'soy-transformado', numero: 32, texto: 'El mismo. Pero un día, Jesús "interrumpió su sistema" en el camino a Damasco. Quedó ciego por tres días… y después de un encuentro transformador, ¡se convirtió en Pablo! Predicó con pasión y su vida cambió completamente.' },
  { tema: 'soy-transformado', numero: 33, texto: '¡Mejor aún! Dios no solo actualiza, ¡renueva! Lo que importa no es tu pasado, sino quién eres en Cristo.' },
  { tema: 'soy-transformado', numero: 34, texto: 'Así es Tobi, ¿Les gustaría saber sobre alguien que pasó de ser enemigo de Dios a ser uno de sus grandes mensajeros?' },
  { tema: 'soy-transformado', numero: 35, texto: '¡Prepárense para conocer la historia de Saulo convertido en Pablo!' },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generarAudio(texto) {
  const response = await fetch(TTS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto, voz: VOZ }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  console.log(`Generando ${dialogues.length} audios en ${OUTPUT_DIR}...\n`);

  for (const { tema, numero, texto } of dialogues) {
    const filename = `${tema}-${numero}.mp3`;
    const filepath = path.join(OUTPUT_DIR, filename);

    try {
      const audioBuffer = await generarAudio(texto);
      await writeFile(filepath, audioBuffer);
      console.log(`✅ ${filename}`);
    } catch (error) {
      console.error(`❌ ${filename} — ${error.message}`);
    }

    await sleep(DELAY_MS);
  }

  console.log('\nListo.');
}

main();
