import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

const ENDPOINT = `${environment.ttsServerUrl}/api/asistente-nino`;

export interface RespuestaAsistente {
  transcripcion: string;
  respuesta: string;
}

@Injectable({
  providedIn: 'root',
})
export class AsistenteNino {
  constructor(private http: HttpClient) {}

  async preguntar(audioBlob: Blob): Promise<RespuestaAsistente> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'pregunta.webm');

    return firstValueFrom(
      this.http.post<RespuestaAsistente>(ENDPOINT, formData)
    );
  }
}
