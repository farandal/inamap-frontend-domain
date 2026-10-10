/**
 * Contratos de datos INAMAP, espejo de los Resources del backend
 * (inamap-backend-domain, README Parte 9). Coordenadas en la unidad del
 * inamap (v1: metros), origen arriba-izquierda, y hacia abajo.
 */

export type Point = [number, number];

export type InamapStatus = 'draft' | 'published';
export type AccessMode = 'open' | 'token_required';
export type PathDirection = 'forward' | 'backward' | 'both';
export type LinkKind = 'vertex' | 'link' | 'vertical';
export type VerticalType = 'elevator' | 'ramp' | 'stairs' | 'escalator';
export type PathEnd = 'start' | 'end';
export type EndpointType = 'location' | 'structure' | 'zone';

export interface InamapSettings {
    access_mode?: AccessMode;
    session_ttl_minutes?: number;
    has_access_key?: boolean;
    initial_layout_id?: string | null;
    initial_zoom?: number | null;
    primary_color?: string | null;
    [key: string]: unknown;
}

export interface Layout {
    id: string;
    inamap_id?: string;
    name: string;
    level: number;
    sort?: number;
    width: number;
    height: number;
    image_url?: string | null;
}

export interface Inamap {
    id: string;
    tenant_id?: string;
    name: string;
    slug?: string;
    description?: string | null;
    unit: string;
    status?: InamapStatus;
    published_at?: string | null;
    is_active?: boolean;
    settings?: InamapSettings;
    public_url?: string;
    layouts?: Layout[];
}

/** Estilo visual guardado en metadata.style (el backend solo tiene `color`). */
export interface ShapeStyle {
    stroke?: string;
    opacity?: number;
}

export interface Polygonal {
    id: string;
    layout_id: string;
    code?: string | null;
    label: string;
    color?: string | null;
    polygon: Point[];
    terms?: string[];
    metadata?: { style?: ShapeStyle; [key: string]: unknown } | null;
}

export type Zone = Polygonal;
export type Structure = Polygonal;

export interface Category {
    id: string;
    category_id?: string | null;
    name: string;
    breadcrumbed_name?: string;
    color?: string | null;
    icon?: string | null;
    image_url?: string | null;
}

export interface Location {
    id: string;
    layout_id: string;
    structure_id?: string | null;
    category_id?: string | null;
    category?: Pick<Category, 'id' | 'name' | 'color' | 'icon'> | null;
    code?: string | null;
    label: string;
    x: number;
    y: number;
    icon?: string | null;
    qr_url?: string | null;
    terms?: string[];
    metadata?: Record<string, unknown> | null;
}

export interface Path {
    id: string;
    layout_id: string;
    label?: string | null;
    points: Point[];
    direction: PathDirection;
    metadata?: Record<string, unknown> | null;
}

export interface PathLink {
    id: string;
    from_path_id: string;
    from_end: PathEnd;
    to_path_id: string;
    to_end: PathEnd;
    kind: LinkKind;
    vertical_type?: VerticalType | null;
    is_accessible?: boolean;
    cost?: number | null;
    bidirectional?: boolean;
}

/** Payload de GET api/inamap/{id} (API pública). */
export interface PublicInamap {
    id: string;
    name: string;
    description?: string | null;
    unit: string;
    settings: InamapSettings;
    layouts: Layout[];
    zones: Zone[];
    structures: Structure[];
    locations: Location[];
    categories: Category[];
    paths?: Path[];
    path_links?: PathLink[];
}

export interface SearchHit {
    type: EndpointType;
    id: string;
    label: string;
    code?: string | null;
    layout_id: string;
    category_id?: string | null;
    score: number;
}

export interface RouteTransition {
    kind: 'vertical';
    vertical_type: VerticalType | null;
    to_layout_id: string;
}

export interface RouteStep {
    layout_id: string;
    layout_name?: string | null;
    points: Point[];
    distance: number;
    transition: RouteTransition | null;
}

export interface RouteEndpoint {
    type: EndpointType;
    id: string;
    label: string;
    code?: string | null;
    layout_id: string;
}

export interface RouteResult {
    inamap_id: string;
    unit: string;
    accessible: boolean;
    distance: number;
    estimated_seconds: number;
    walking_speed_mps: number;
    from: RouteEndpoint;
    to: RouteEndpoint;
    steps: RouteStep[];
}

export interface RouteSession {
    session_id: string;
    token?: string;
    view_url?: string;
    qr_svg?: string;
    expires_at: string;
    route: RouteResult;
}

/** Contenido de un layout para dibujar (subconjunto común a editor y visor). */
export interface LayoutContent {
    zones: Zone[];
    structures: Structure[];
    locations: Location[];
    paths: Path[];
    links?: PathLink[];
}

export type ApiErrorCode =
    | 'INAMAP_NOT_PUBLISHED'
    | 'UNREACHABLE'
    | 'UNREACHABLE_ACCESSIBLE'
    | 'NO_PATH_NEAR_ENDPOINT'
    | 'ENDPOINT_NOT_FOUND'
    | 'TOKEN_REQUIRED'
    | 'TOKEN_EXPIRED'
    | 'TOKEN_INVALID'
    | 'ACCESS_KEY_INVALID'
    | 'PLAN_LIMIT_REACHED'
    | 'THROTTLED'
    | 'NETWORK';
