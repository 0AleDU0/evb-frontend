import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Pixel } from './pixel/pixel';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Pixel],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');

  /** Textos cargados desde el editor, para usar luego con el bot. */
  protected textos = signal<string[]>([]);

  /** true una vez que se presiona "Empezar bot": muestra el Pixel en vez del editor. */
  protected mostrarPixel = signal(false);

  onIniciarBot(textos: string[]): void {
    this.textos.set(textos);
    this.mostrarPixel.set(true);
  }
}
