import { Injectable, computed, signal } from '@angular/core';
import { Tower } from '../models/models';

@Injectable({ providedIn: 'root' })
export class BuildingService {
  private readonly STORAGE_KEY = 'fyl.building.towers.v1';

  private readonly defaultTowers: Tower[] = [
    {
      id: 'tower-fyl',
      name: 'FYL ALIADOS EN PROPIEDAD',
      floors: [
        { number: 3, apartments: ['302', '303', '304'] },
        { number: 5, apartments: ['501', '502', '503', '504'] },
        { number: 8, apartments: ['805', '806'] },
        { number: 12, apartments: ['1201', '1204'] },
        { number: 15, apartments: ['1501', '1502'] }
      ]
    }
  ];

  private readonly _towers = signal<Tower[]>(this.loadTowers());
  readonly towers    = this._towers.asReadonly();
  readonly towerNames = computed(() =>
    this._towers().map(t => t.name).sort((a, b) => a.localeCompare(b, 'es-CO'))
  );

  getFloors(towerName: string): number[] {
    return this.findTower(towerName)?.floors.map(f => f.number).sort((a, b) => a - b) ?? [];
  }

  getApartments(towerName: string, floor: number | null): string[] {
    if (floor === null) return [];
    return [...(this.findTower(towerName)?.floors.find(f => f.number === floor)?.apartments ?? [])]
      .sort((a, b) => a.localeCompare(b, 'es-CO'));
  }

  addTower(name: string): { ok: boolean; message: string } {
    const n = name.trim();
    if (!n) return { ok: false, message: 'Nombre inválido.' };
    if (this.existsTower(n)) return { ok: false, message: 'Esa torre ya existe.' };
    this.updateAndPersist(t => [...t, { id: this.makeId(n), name: n, floors: [] }]);
    return { ok: true, message: 'Torre creada.' };
  }

  addFloor(towerName: string, floor: number): { ok: boolean; message: string } {
    if (!Number.isInteger(floor) || floor < 1) return { ok: false, message: 'Piso inválido.' };
    if (!this.findTower(towerName)) return { ok: false, message: 'Torre no existe.' };
    if (this.findTower(towerName)!.floors.some(f => f.number === floor))
      return { ok: false, message: 'Ese piso ya existe.' };
    this.updateAndPersist(towers =>
      towers.map(t => t.name === towerName
        ? { ...t, floors: [...t.floors, { number: floor, apartments: [] }].sort((a, b) => a.number - b.number) }
        : t)
    );
    return { ok: true, message: 'Piso creado.' };
  }

  addApartment(towerName: string, floor: number | null, apartment: string): { ok: boolean; message: string } {
    const apt = apartment.trim().toUpperCase();
    if (!apt || floor === null) return { ok: false, message: 'Datos inválidos.' };
    if (this.getApartments(towerName, floor).includes(apt))
      return { ok: false, message: 'Ese apartamento ya existe.' };
    this.updateAndPersist(towers =>
      towers.map(t => t.name !== towerName ? t : {
        ...t,
        floors: t.floors.map(f => f.number !== floor ? f : {
          ...f, apartments: [...f.apartments, apt].sort((a, b) => a.localeCompare(b, 'es-CO'))
        })
      })
    );
    return { ok: true, message: 'Apartamento agregado.' };
  }

  removeApartment(towerName: string, floor: number | null, apartment: string): { ok: boolean; message: string } {
    const apt = apartment.trim().toUpperCase();
    if (!apt || floor === null) return { ok: false, message: 'Datos inválidos.' };
    this.updateAndPersist(towers =>
      towers.map(t => t.name !== towerName ? t : {
        ...t,
        floors: t.floors.map(f => f.number !== floor ? f : {
          ...f, apartments: f.apartments.filter(a => a !== apt)
        })
      })
    );
    return { ok: true, message: 'Apartamento eliminado.' };
  }

  ensureUnit(towerName: string, floor: number, apartment: string): void {
    this.addTower(towerName);
    this.addFloor(towerName, floor);
    this.addApartment(towerName, floor, apartment);
  }

  private findTower(name: string): Tower | undefined {
    return this._towers().find(t => t.name === name);
  }

  private existsTower(name: string): boolean {
    return this._towers().some(t => t.name === name);
  }

  private makeId(name: string): string {
    return 'tower-' + name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  private loadTowers(): Tower[] {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : this.defaultTowers;
    } catch { return this.defaultTowers; }
  }

  private updateAndPersist(updater: (t: Tower[]) => Tower[]): void {
    this._towers.update(current => {
      const next = updater(current);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }
}