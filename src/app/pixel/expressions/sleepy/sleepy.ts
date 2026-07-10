import { Component, HostListener, computed, signal } from '@angular/core';

const MAX_MOUTH_DISTANCE_PX = 200;

function easeOutQuad(x: number): number {
  return 1 - (1 - x) * (1 - x);
}

@Component({
  selector: 'app-sleepy',
  imports: [],
  templateUrl: './sleepy.html',
  styleUrl: './sleepy.scss',
})
export class Sleepy {
  /** true mientras la boca controlada está activa (oculta el bostezo cíclico). */
  protected talking = signal(false);
  protected mouthOpen = signal(0);

  protected topControlY = computed(() => 183 - this.mouthOpen() * 40);
  protected bottomControlY = computed(() => 183 + this.mouthOpen() * 40);

  private lastPointerY = 0;
  private basePointerY = 0;

  /**
   * Controla la apertura desde afuera. nivel > 0 activa la boca controlada
   * (oculta el bostezo cíclico); nivel === 0 vuelve al bostezo automático.
   */
  setMouthLevel(nivel: number): void {
    const clamped = Math.max(0, Math.min(1, nivel));
    this.talking.set(clamped > 0);
    this.mouthOpen.set(clamped);
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
