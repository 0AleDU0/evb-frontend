import { Component, HostListener, Input, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Sad } from './expressions/sad/sad';
import { Angry } from './expressions/angry/angry';
import { Surprised } from './expressions/surprised/surprised';
import { Thinking } from './expressions/thinking/thinking';
import { Sleepy } from './expressions/sleepy/sleepy';
import { Confused } from './expressions/confused/confused';
import { Listening } from './expressions/listening/listening';
import { Neutral } from './expressions/neutral/neutral';
import { Tts } from '../services/tts';
import { AsistenteNino } from '../services/asistente-nino';

export type PixelMood =
  | 'happy' | 'sad' | 'angry' | 'surprised' | 'thinking'
  | 'sleepy' | 'confused' | 'listening' | 'neutral';

const KEY_TO_MOOD: Record<string, PixelMood> = {
  a: 'neutral',
  s: 'sad',
  d: 'angry',
  f: 'surprised',
  g: 'thinking',
  h: 'sleepy',
  j: 'confused',
  k: 'listening',
};

interface ExpresionHablante {
  setMouthLevel(nivel: number): void;
}

const MAPA_AUDIOS: Record<number, string> = {
  1: 'soy-creado-1.mp3', 2: 'soy-creado-2.mp3', 3: 'soy-creado-3.mp3', 4: 'soy-creado-4.mp3',
  5: 'soy-guardado-5.mp3', 6: 'soy-guardado-6.mp3', 7: 'soy-guardado-7.mp3', 8: 'soy-guardado-8.mp3',
  9: 'soy-guardado-9.mp3', 10: 'soy-guardado-10.mp3',
  11: 'soy-amado-11.mp3', 12: 'soy-amado-12.mp3', 13: 'soy-amado-13.mp3', 14: 'soy-amado-14.mp3',
  15: 'soy-amado-15.mp3', 16: 'soy-amado-16.mp3', 17: 'soy-amado-17.mp3', 18: 'soy-amado-18.mp3',
  19: 'soy-libre-19.mp3', 20: 'soy-libre-20.mp3', 21: 'soy-libre-21.mp3', 22: 'soy-libre-22.mp3',
  23: 'soy-libre-23.mp3', 24: 'soy-libre-24.mp3', 25: 'soy-libre-25.mp3', 26: 'soy-libre-26.mp3',
  27: 'soy-libre-27.mp3', 28: 'soy-libre-28.mp3',
  29: 'soy-transformado-29.mp3', 30: 'soy-transformado-30.mp3', 31: 'soy-transformado-31.mp3',
  32: 'soy-transformado-32.mp3', 33: 'soy-transformado-33.mp3', 34: 'soy-transformado-34.mp3',
  35: 'soy-transformado-35.mp3',
};

@Component({
  selector: 'app-pixel',
  imports: [FormsModule, Sad, Angry, Surprised, Thinking, Sleepy, Confused, Listening, Neutral],
  templateUrl: './pixel.html',
  styleUrl: './pixel.scss'
})
export class Pixel {
  @ViewChild(Neutral) private neutralRef?: Neutral;
  @ViewChild(Sad) private sadRef?: Sad;
  @ViewChild(Angry) private angryRef?: Angry;
  @ViewChild(Surprised) private surprisedRef?: Surprised;
  @ViewChild(Thinking) private thinkingRef?: Thinking;
  @ViewChild(Sleepy) private sleepyRef?: Sleepy;
  @ViewChild(Confused) private confusedRef?: Confused;
  @ViewChild(Listening) private listeningRef?: Listening;

  protected numeroIngresado = signal('');

  protected mood = signal<PixelMood>('neutral');
  protected emocionSeleccionada = signal(false);

  protected listaTextos = signal<string[]>([]);
  protected indiceTexto = signal(0);

  @Input()
  set textos(value: string[]) {
    this.listaTextos.set(value ?? []);
    this.indiceTexto.set(0);
  }

  protected textoAHablar = signal('');
  protected hablando = signal(false);

  protected grabando = signal(false);

  private mediaRecorder?: MediaRecorder;
  private audioChunks: Blob[] = [];

  /** Un solo AudioContext compartido: los navegadores limitan cuántos se pueden crear. */
  private audioContext?: AudioContext;

  constructor(
    private tts: Tts,
    private asistenteNino: AsistenteNino
  ) {}

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const escribiendoEnCampo =
      target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

    if (event.key === 'Enter' && !escribiendoEnCampo) {
      event.preventDefault();
      this.hablarSiguienteTexto();
      return;
    }

    const key = event.key.toLowerCase();

    if (key === 'k') {
      event.preventDefault();
      if (this.grabando()) {
        this.detenerGrabacionYProcesar();
      } else {
        this.setMood('listening');
        this.iniciarGrabacion();
      }
      return;
    }

    const newMood = KEY_TO_MOOD[key];
    if (newMood) {
      if (this.grabando()) {
        this.detenerGrabacionYProcesar();
      }
      this.setMood(newMood);
    }
  }

  setMood(newMood: PixelMood): void {
    if (this.mood() !== newMood) {
      this.obtenerExpresionActiva()?.setMouthLevel(0);
    }

    this.mood.set(newMood);
    this.emocionSeleccionada.set(true);
  }

  private obtenerExpresionActiva(): ExpresionHablante | undefined {
    switch (this.mood()) {
      case 'neutral': return this.neutralRef;
      case 'sad': return this.sadRef;
      case 'angry': return this.angryRef;
      case 'surprised': return this.surprisedRef;
      case 'thinking': return this.thinkingRef;
      case 'sleepy': return this.sleepyRef;
      case 'confused': return this.confusedRef;
      case 'listening': return this.listeningRef;
      default: return undefined;
    }
  }

  private obtenerAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  /**
   * Reproduce cualquier audio (TTS o pregrabado) y anima la boca de la
   * expresión activa EN VIVO, analizando el audio real con la Web Audio API:
   * - Volumen general (energía total) -> qué tan abierta va la boca.
   * - Balance graves/agudos -> ajusta la apertura según la "tonalidad":
   *   sonidos graves (o, u, m) cierran un poco más, sonidos agudos
   *   (i, e, s) abren un poco más, imitando cómo se ve realmente hablar.
   *
   * En cada frame se vuelve a buscar la expresión activa (no se fija al
   * principio), así si cambiás de mood a mitad del audio, la animación
   * "salta" a la cara nueva en vez de seguir en la vieja.
   */
  private reproducirConAnalisisDeAudio(audio: HTMLAudioElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const audioContext = this.obtenerAudioContext();

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const source = audioContext.createMediaElementSource(audio);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.6;

      const bufferLength = analyser.frequencyBinCount;
      const datosFrecuencia = new Uint8Array(bufferLength);

      source.connect(analyser);
      analyser.connect(audioContext.destination);

      let frameId = 0;
      let ultimaExpresionAnimada: ExpresionHablante | undefined;

      const limpiar = () => {
        cancelAnimationFrame(frameId);
        source.disconnect();
        analyser.disconnect();
      };

      const animar = () => {
        if (audio.paused || audio.ended) {
          return;
        }

        analyser.getByteFrequencyData(datosFrecuencia);

        // Dividimos el espectro en tres tercios: graves, medios, agudos.
        const tercio = Math.floor(bufferLength / 3);
        const graves = datosFrecuencia.subarray(0, tercio);
        const agudos = datosFrecuencia.subarray(tercio * 2, bufferLength);

        const promedio = (valores: Uint8Array): number =>
          valores.reduce((suma, valor) => suma + valor, 0) / valores.length;

        const promedioGeneral = promedio(datosFrecuencia);
        const promedioGraves = promedio(graves);
        const promedioAgudos = promedio(agudos);

        // Volumen general normalizado a 0-1 (120 es un techo razonable
        // para voz hablada, ajustable si se ve muy tímida o muy exagerada).
        const nivelVolumen = Math.min(promedioGeneral / 120, 1);

        // Balance tonal: positivo si predominan agudos, negativo si graves.
        const balanceTonal = (promedioAgudos - promedioGraves) / 255;

        // Sonidos agudos abren un poco más, graves cierran un poco más.
        const nivelFinal = Math.max(0, Math.min(1, nivelVolumen + balanceTonal * 0.2));

        const expresionActual = this.obtenerExpresionActiva();

        if (ultimaExpresionAnimada && ultimaExpresionAnimada !== expresionActual) {
          ultimaExpresionAnimada.setMouthLevel(0);
        }

        expresionActual?.setMouthLevel(nivelFinal);
        ultimaExpresionAnimada = expresionActual;

        frameId = requestAnimationFrame(animar);
      };

      audio.addEventListener('play', () => { frameId = requestAnimationFrame(animar); }, { once: true });
      audio.addEventListener(
        'ended',
        () => {
          limpiar();
          this.obtenerExpresionActiva()?.setMouthLevel(0);
          resolve();
        },
        { once: true }
      );
      audio.addEventListener('error', (evento) => {
        limpiar();
        reject(evento);
      }, { once: true });

      audio.play().catch((error) => {
        limpiar();
        reject(error);
      });
    });
  }

  private async hablarTextoConBoca(texto: string): Promise<void> {
    if (this.hablando()) return;

    this.hablando.set(true);
    try {
      const audio = await this.tts.obtenerAudio(texto);
      await this.reproducirConAnalisisDeAudio(audio);
    } catch (error) {
      console.error('Error al generar/reproducir el audio:', error);
    } finally {
      this.hablando.set(false);
    }
  }

  async hablarSiguienteTexto(): Promise<void> {
    if (!this.emocionSeleccionada()) {
      console.info('Elegí primero una emoción (a, s, d, f, g, h, j, k) antes de presionar Enter.');
      return;
    }

    const textos = this.listaTextos();
    const indice = this.indiceTexto();
    if (indice >= textos.length) return;

    await this.hablarTextoConBoca(textos[indice]);
    this.indiceTexto.update((i) => i + 1);
  }

  async hablar(): Promise<void> {
    const texto = this.textoAHablar().trim();
    if (!texto) return;
    await this.hablarTextoConBoca(texto);
  }

  private async iniciarGrabacion(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (evento) => {
        if (evento.data.size > 0) {
          this.audioChunks.push(evento.data);
        }
      };

      this.mediaRecorder.start();
      this.grabando.set(true);
    } catch (error) {
      console.error('No se pudo acceder al micrófono:', error);
    }
  }

  private detenerGrabacionYProcesar(): void {
    if (!this.mediaRecorder || !this.grabando()) return;

    this.mediaRecorder.addEventListener(
      'stop',
      async () => {
        this.grabando.set(false);
        this.mediaRecorder?.stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        await this.procesarPreguntaDelUsuario(audioBlob);
      },
      { once: true }
    );

    this.mediaRecorder.stop();
  }

  private async procesarPreguntaDelUsuario(audioBlob: Blob): Promise<void> {
    if (audioBlob.size === 0) return;

    try {
      const { respuesta } = await this.asistenteNino.preguntar(audioBlob);
      await this.hablarTextoConBoca(respuesta);
    } catch (error) {
      console.error('Error al procesar la pregunta:', error);
    }
  }

  async reproducirPorNumero(): Promise<void> {
    const numero = parseInt(this.numeroIngresado(), 10);
    if (Number.isNaN(numero)) return;

    const archivo = MAPA_AUDIOS[numero];
    if (!archivo) {
      console.warn(`No hay audio registrado para el número ${numero}`);
      return;
    }

    if (this.hablando()) return;

    this.setMood('neutral');
    this.hablando.set(true);

    try {
      const audio = new Audio(`/audio/${archivo}`);
      await this.reproducirConAnalisisDeAudio(audio);
    } catch (error) {
      console.error('Error al reproducir el audio:', error);
    } finally {
      this.hablando.set(false);
      this.numeroIngresado.set('');
    }
  }
}
