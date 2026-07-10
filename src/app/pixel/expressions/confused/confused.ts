import { Component, HostListener, computed, signal } from '@angular/core';

const LEFT_SOCKET = { x: 100, y: 82, width: 70, height: 65 };
const RIGHT_SOCKET = { x: 230, y: 82, width: 70, height: 65 };
const PUPIL_SIZE = { width: 16, height: 16 };
const PADDING = 6;
const MAX_MOUTH_DISTANCE_PX = 200;
const WRINKLE_THRESHOLD = 0.7;

function easeOutQuad(x: number): number {
  return 1 - (1 - x) * (1 - x);
}

function pupilPosition(
  socket: { x: number; y: number; width: number; height: number },
  normalizedX: number,
  normalizedY: number
): { x: number; y: number } {
  const rangeX = socket.width - PUPIL_SIZE.width - PADDING * 2;
  const rangeY = socket.height - PUPIL_SIZE.height - PADDING * 2;
  const centerOffsetX = ((normalizedX + 1) / 2) * rangeX;
  const centerOffsetY = ((normalizedY + 1) / 2) * rangeY;
  return {
    x: socket.x + PADDING + centerOffsetX,
    y: socket.y + PADDING + centerOffsetY,
  };
}

@Component({
  selector: 'app-confused',
  imports: [],
  templateUrl: './confused.html',
  styleUrl: './confused.scss',
})
export class Confused {
  protected leftPupil = signal(pupilPosition(LEFT_SOCKET, 0, 0));
  protected rightPupil = signal(pupilPosition(RIGHT_SOCKET, 0, 0));
  protected talking = signal(false);
  protected mouthOpen = signal(0);

  protected topControlY = computed(() => 200 - this.mouthOpen() * 40);
  protected bottomControlY = computed(() => 200 + this.mouthOpen() * 40);
  protected showWrinkles = computed(() => this.mouthOpen() > WRINKLE_THRESHOLD);

  private lastPointerY = 0;
  private basePointerY = 0;

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

  @HostListener('window:mousemove', ['$event'])
  handleMouseMove(event: MouseEvent): void {
    this.lastPointerY = event.clientY;

    if (!this.talking()) {
      const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
      const normalizedY = (event.clientY / window.innerHeight) * 2 - 1;
      this.leftPupil.set(pupilPosition(LEFT_SOCKET, normalizedX, normalizedY));
      this.rightPupil.set(pupilPosition(RIGHT_SOCKET, normalizedX, normalizedY));
      return;
    }

    const distance = Math.abs(event.clientY - this.basePointerY);
    const linear = Math.min(distance / MAX_MOUTH_DISTANCE_PX, 1);
    this.mouthOpen.set(easeOutQuad(linear));
  }
}
