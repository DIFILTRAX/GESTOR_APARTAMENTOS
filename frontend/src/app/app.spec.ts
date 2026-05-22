import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app'; // 1. Cambiado de App a AppComponent

describe('AppComponent', () => { // 2. Nombre del test
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent], // 3. Importar la clase correcta
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent); // 4. Crear el componente correcto
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    // 5. Ajustado para que busque el título de tu proyecto
    expect(compiled.querySelector('h1')?.textContent).toContain('Gestor de Apartamentos');
  });
});