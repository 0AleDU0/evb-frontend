import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

const TTS_ENDPOINT = `${environment.ttsServerUrl}/api/tts`;

@Injectable({
  providedIn: 'root',
})
export class Tts {
  constructor(private http: HttpClient) {}

  async obtenerAudio(texto: string): Promise<HTMLAudioElement> {
    const blob = await firstValueFrom(
      this.http.post(TTS_ENDPOINT, { texto }, { responseType: 'blob' })
    );

    const audioUrl = URL.createObjectURL(blob);
    return new Audio(audioUrl);
  }

  async hablar(texto: string): Promise<void> {
    const audio = await this.obtenerAudio(texto);
    await audio.play();
  }
}
