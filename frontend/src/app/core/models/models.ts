// ──────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────
export interface LoginRequest {
  identificacion: string;
  contrasenna: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface PermisoMenu {
  formulario: string;
  redirect: string;
  icono: string | null;
  orden: number;
  nodo_principal: string;
  crear: 'S' | 'N';
  editar: 'S' | 'N';
  leer: 'S' | 'N';
  eliminar: 'S' | 'N';
}

// ──────────────────────────────────────────
// USUARIO
// ──────────────────────────────────────────
export interface Usuario {
  identificacion: string;
  id_tipo_documento: number;
  correo: string;
  celular: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  perfil: number;
  perfil_nombre?: string;
}

// ──────────────────────────────────────────
// PROPIEDADES
// ──────────────────────────────────────────
export interface Edificio {
  id_edificio: string;
  nombre: string;
  direccion: string;
}

export interface Piso {
  id_piso: number;
  edificio: string;
  edificio_nombre?: string;
}

export interface Apartamento {
  id_apartamento: number;
  piso: number;
  edificio: string;
  edificio_nombre?: string;
}

export interface Propietario {
  identificacion: string;
  nombre_usuario?: string;
  apartamento: number;
  piso: number;
  edificio: string;
  edificio_nombre?: string;
}

// ──────────────────────────────────────────
// PAGOS
// ──────────────────────────────────────────
export interface Pago {
  id_pago: number;
  fecha_pago: string;
  fecha_limite: string;
  valor: number;
  descripcion: string;
  estado_pago: number;
  estado_pago_nombre?: string;
  tipo_pago: number;
  tipo_pago_nombre?: string;
  apartamento: number;
  piso: number;
  edificio: string;
  edificio_nombre?: string;
}

export interface TipoPago {
  id_tipo_pago: number;
  nombre: string;
}

export interface EstadoPago {
  id_estado_pago: number;
  nombre: string;
}

// ──────────────────────────────────────────
// NOTIFICACIONES
// ──────────────────────────────────────────
export interface Notificacion {
  id_notificacion: number;
  descripcion: string;
  pago: number;
  pago_descripcion?: string;
  pago_valor?: number;
  tipo_notificacion: number;
  tipo_notificacion_nombre?: string;
}

export interface TipoNotificacion {
  id_tipo_notificacion: number;
  nombre: string;
  descripcion: string;
}

// ──────────────────────────────────────────
// UI helpers (compatibilidad con componentes del compañero)
// ──────────────────────────────────────────
export type EstadoPagoLabel = 'Pagado' | 'Pendiente' | 'Vencido';

export interface User {
  id: string;
  nombre: string;
  email?: string;
  rol: 'admin' | 'residente' | 'propietario';
  torre?: string;
  apartamento?: string;
  piso?: number;
  initials?: string;
  perfil?: number;
}

export interface TowerFloor {
  number: number;
  apartments: string[];
}

export interface Tower {
  id: string;
  name: string;
  floors: TowerFloor[];
}

export interface Toast {
  id: number;
  icon: string;
  message: string;
}