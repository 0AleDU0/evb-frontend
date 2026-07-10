import { Component, HostListener, computed, signal } from '@angular/core';

const MAX_MOUTH_DISTANCE_PX = 200;
const WRINKLE_THRESHOLD = 0.7;

function easeOutQuad(x: number): number {
  return 1 - (1 - x) * (1 - x);
}

@Component({
  selector: 'app-angry',
  imports: [],
  templateUrl: './angry.html',
  styleUrl: './angry.scss',
})
export class Angry {
  protected talking = signal(false);
  protected mouthOpen = signal(0);

  protected topControlY = computed(() => 170 - this.mouthOpen() * 40);
  protected bottomControlY = computed(() => 170 + this.mouthOpen() * 40);
  protected showWrinkles = computed(() => this.mouthOpen() > WRINKLE_THRESHOLD);

  private lastPointerY = 0;
  private basePointerY = 0;

  /** Controla la apertura de la boca desde afuera (0 a 1), p. ej. sincronizada con TTS. */
  setMouthLevel(nivel: number): void {
    this.mouthOpen.set(Math.max(0, Math.min(1, nivel)));
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (event.key !== ' ') return;
    event.preventDefault();
    if (!this.talking()) {
      this.basePointerY = this.lastPointerY;
      this.talking.set(true);
    }
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyup(event: KeyboardEvent): void {
    if (event.key !== ' ') return;
    this.talking.set(false);
    this.mouthOpen.set(0);
  }

  @HostListener('window:pointermove', ['$event'])
  handlePointermove(event: PointerEvent): void {
    this.lastPointerY = event.clientY;
    if (!this.talking()) return;
    const distance = Math.abs(event.clientY - this.basePointerY);
    const linear = Math.min(distance / MAX_MOUTH_DISTANCE_PX, 1);
    this.mouthOpen.set(easeOutQuad(linear));
  }
}
