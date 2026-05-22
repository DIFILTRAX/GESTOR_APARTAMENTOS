import { Injectable, signal } from '@angular/core';
import { Toast } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private counter = 0;

  show(icon: string, message: string, duration = 3200): void {
    const id = ++this.counter;
    this._toasts.update(t => [...t, { id, icon, message }]);
    setTimeout(() => this._toasts.update(t => t.filter(x => x.id !== id)), duration);
  }

  success(msg: string) { this.show('✅', msg); }
  error(msg: string)   { this.show('❌', msg); }
  warn(msg: string)    { this.show('⚠️', msg); }
  info(msg: string)    { this.show('ℹ️', msg); }
}