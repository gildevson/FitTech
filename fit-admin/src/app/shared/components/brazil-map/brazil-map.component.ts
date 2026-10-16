import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { UserService } from '../../../core/services/user.service';

export interface StateCount {
  state: string;
  total: number;
  active: number;
}

export interface CityCount {
  city: string;
  total: number;
  active: number;
}

interface StateShape {
  uf: string;
  name: string;
  path: string;
  labelX: number;
  labelY: number;
}

// Código IBGE (codarea) -> UF / nome
const IBGE_UF: Record<string, [string, string]> = {
  '11': ['RO', 'Rondônia'], '12': ['AC', 'Acre'], '13': ['AM', 'Amazonas'], '14': ['RR', 'Roraima'],
  '15': ['PA', 'Pará'], '16': ['AP', 'Amapá'], '17': ['TO', 'Tocantins'], '21': ['MA', 'Maranhão'],
  '22': ['PI', 'Piauí'], '23': ['CE', 'Ceará'], '24': ['RN', 'Rio Grande do Norte'], '25': ['PB', 'Paraíba'],
  '26': ['PE', 'Pernambuco'], '27': ['AL', 'Alagoas'], '28': ['SE', 'Sergipe'], '29': ['BA', 'Bahia'],
  '31': ['MG', 'Minas Gerais'], '32': ['ES', 'Espírito Santo'], '33': ['RJ', 'Rio de Janeiro'], '35': ['SP', 'São Paulo'],
  '41': ['PR', 'Paraná'], '42': ['SC', 'Santa Catarina'], '43': ['RS', 'Rio Grande do Sul'], '50': ['MS', 'Mato Grosso do Sul'],
  '51': ['MT', 'Mato Grosso'], '52': ['GO', 'Goiás'], '53': ['DF', 'Distrito Federal']
};

// Estados pequenos demais para caber o rótulo dentro do contorno
const NO_LABEL = new Set(['DF', 'SE', 'AL', 'RN', 'PB', 'ES', 'RJ']);

const WIDTH = 600;

interface CityShape {
  id: string;
  name: string;
  path: string;
}

const norm = (v: string) => (v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const UF_CODE: Record<string, string> = Object.fromEntries(Object.entries(IBGE_UF).map(([code, [uf]]) => [uf, code]));

@Component({
  selector: 'ui-brazil-map',
  standalone: true,
  styles: [`
    :host { display: block; }
    .wrap { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(220px, 1fr); gap: 20px; padding: 18px; align-items: start; }
    @media (max-width: 900px) { .wrap { grid-template-columns: 1fr; } }

    .map { position: relative; }
    svg { width: 100%; max-width: 520px; height: auto; display: block; margin: 0 auto; }
    path {
      stroke: var(--color-card-bg); stroke-width: 1.2; stroke-linejoin: round;
      cursor: pointer; transition: opacity 0.15s;
    }
    path.dim { opacity: 0.45; }
    path.selected { stroke: var(--color-primary); stroke-width: 2.4; }
    path.city { stroke: color-mix(in srgb, var(--color-text-muted) 45%, var(--color-card-bg)); stroke-width: 0.5; }
    path.city.has { stroke: var(--color-card-bg); stroke-width: 0.8; }
    path.city.dim { opacity: 0.6; }
    .back { background: none; border: 0; padding: 0; margin-bottom: 8px; color: var(--color-primary); font-size: 0.78rem; font-weight: 600; cursor: pointer; }
    .hint { margin-top: 12px; font-size: 0.74rem; color: var(--color-text-muted); }
    .city-name { font-size: 0.82rem; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cities li { grid-template-columns: minmax(70px, 1.2fr) 1fr auto; }
    .label { font-size: 10px; font-weight: 700; fill: var(--color-text); pointer-events: none; text-anchor: middle; dominant-baseline: central; }
    .label.on-dark { fill: #fff; }

    .hover-card {
      position: absolute; top: 0; left: 0;
      background: var(--color-card-bg); border: 1px solid var(--color-border);
      border-radius: var(--radius-sm); box-shadow: var(--shadow-md);
      padding: 8px 12px; font-size: 0.8rem; min-width: 150px;
    }
    .hover-card strong { display: block; color: var(--color-text); margin-bottom: 2px; }
    .hover-card span { color: var(--color-text-muted); }

    .legend { display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 0.72rem; color: var(--color-text-muted); }
    .legend-bar { flex: 0 0 140px; height: 8px; border-radius: 4px;
      background: linear-gradient(90deg, var(--map-empty), color-mix(in srgb, var(--color-primary) 35%, var(--color-card-bg)), var(--color-primary)); }

    .side-title { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 10px; }
    .rank { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .rank li { display: grid; grid-template-columns: 34px 1fr auto; gap: 8px; align-items: center; font-size: 0.82rem; cursor: default; }
    .rank li.hl .uf { background: var(--color-primary); color: #fff; }
    .uf { font-weight: 700; font-size: 0.72rem; text-align: center; padding: 2px 0; border-radius: 6px;
      background: var(--color-primary-soft); color: var(--color-primary); }
    .bar-bg { height: 6px; background: var(--color-surface-hover); border-radius: 3px; overflow: hidden; }
    .bar { height: 100%; background: var(--color-primary); border-radius: 3px; }
    .num { font-weight: 700; color: var(--color-text); min-width: 24px; text-align: right; }
    .empty { color: var(--color-text-muted); font-size: 0.85rem; padding: 12px 0; line-height: 1.5; }
    .summary { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--color-border); font-size: 0.78rem; color: var(--color-text-muted); }
    .summary strong { color: var(--color-text); }
    .msg { padding: 40px; text-align: center; color: var(--color-text-muted); font-size: 0.85rem; }

    .loading { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
      min-height: 160px; color: var(--color-text-muted); font-size: 0.78rem; animation: fade-in 0.2s ease; }
    .loading.inline { flex-direction: row; justify-content: flex-start; min-height: 0; padding: 12px 0; }
    .spinner { width: 26px; height: 26px; border-radius: 50%; flex: none;
      border: 3px solid var(--color-primary-soft); border-top-color: var(--color-primary);
      animation: spin 0.8s linear infinite; }
    .loading.inline .spinner { width: 16px; height: 16px; border-width: 2px; }
    .fade-in { animation: fade-in 0.35s ease; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

    /* Modo compacto: mapa pequeno + top 5 ao lado */
    .wrap.compact { grid-template-columns: auto minmax(0, 1fr); gap: 18px; padding: 12px 16px; align-items: center; }
    .compact svg { width: 300px; max-width: 100%; }
    .compact .label { font-size: 20px; }
    .compact .hover-card { padding: 5px 9px; font-size: 0.72rem; min-width: 0; white-space: nowrap; }
    .compact .legend { margin-top: 6px; font-size: 0.66rem; }
    .compact .legend-bar { flex-basis: 90px; height: 6px; }
    .compact .side-title { margin-bottom: 8px; font-size: 0.66rem; }
    .compact .rank { gap: 6px; }
    .compact .rank li { font-size: 0.78rem; grid-template-columns: 30px 1fr auto; }
    .compact .empty { font-size: 0.78rem; padding: 4px 0; }
    .compact .summary { margin-top: 10px; padding-top: 8px; font-size: 0.72rem; }
    @media (max-width: 480px) { .wrap.compact { grid-template-columns: 1fr; justify-items: center; } }
  `],
  template: `
    @if (loadError()) {
      <div class="msg">Não foi possível carregar o mapa.</div>
    } @else if (shapes().length === 0) {
      <div class="msg">Carregando mapa...</div>
    } @else {
      <div class="wrap" [class.compact]="compact()" [style.--map-empty]="emptyFill">
        <div class="map">
          @if (selected()) {
            @if (cityLoading()) {
              <div class="loading"><div class="spinner"></div>Carregando mapa de {{ selectedName() }}...</div>
            } @else if (cityError()) {
              <div class="msg">Não foi possível carregar o mapa das cidades.</div>
            } @else {
              <svg class="fade-in" [attr.viewBox]="'0 0 ' + width + ' ' + cityHeight()" role="img" [attr.aria-label]="'Mapa de ' + selectedName() + ' com alunos por cidade'">
                @for (c of cityShapes(); track c.id) {
                  <path class="city" [attr.d]="c.path" [class.has]="cityTotal(c.name) > 0" [class.dim]="hoveredCity() && hoveredCity() !== c.id"
                        [style.fill]="cityFill(c.name)"
                        (mouseenter)="hoveredCity.set(c.id)" (mouseleave)="hoveredCity.set(null)">
                    <title>{{ c.name }}: {{ cityTotal(c.name) }} aluno(s)</title>
                  </path>
                }
              </svg>
              @if (hoveredCityInfo(); as hc) {
                <div class="hover-card">
                  <strong>{{ hc.name }}</strong>
                  <span>{{ hc.total }} aluno(s) · {{ hc.active }} ativo(s)</span>
                </div>
              }
            }
          } @else if (returning()) {
            <div class="loading"><div class="spinner"></div>Carregando mapa do Brasil...</div>
          } @else {
          <svg class="fade-in" [attr.viewBox]="'0 0 ' + width + ' ' + height()" role="img" aria-label="Mapa do Brasil com usuários por estado">
            @for (s of shapes(); track s.uf) {
              <path [attr.d]="s.path"
                    [style.fill]="fillFor(s.uf)"
                    [class.dim]="hovered() && hovered() !== s.uf"
                    [class.selected]="selected() === s.uf"
                    (click)="selectState(s.uf)"
                    (mouseenter)="hovered.set(s.uf)"
                    (mouseleave)="hovered.set(null)">
                <title>{{ s.name }}: {{ countOf(s.uf) }} usuário(s)</title>
              </path>
            }
            @for (s of shapes(); track s.uf) {
              @if (showLabel(s.uf)) {
                <text class="label" [class.on-dark]="ratio(s.uf) > 0.55" [attr.x]="s.labelX" [attr.y]="s.labelY">
                  {{ compact() ? countOf(s.uf) : s.uf + (countOf(s.uf) ? ' ' + countOf(s.uf) : '') }}
                </text>
              }
            }
          </svg>
          }

          @if (!selected() && hoveredInfo(); as h) {
            <div class="hover-card">
              <strong>{{ h.name }} ({{ h.uf }})</strong>
              <span>{{ h.total }} usuário(s) · {{ h.active }} ativo(s)</span>
            </div>
          }

          <div class="legend">
            <span>0</span><div class="legend-bar"></div><span>{{ max() }}</span>
          </div>
        </div>

        <div>
          @if (selected(); as uf) {
            <button type="button" class="back" (click)="backToAll()">&larr; Todos os estados</button>
            <div class="side-title">Cidades — {{ selectedName() }} ({{ uf }})</div>
            @if (citiesLoading()) {
              <div class="loading inline"><div class="spinner"></div>Carregando cidades...</div>
            } @else if (citiesError()) {
              <div class="empty">Não foi possível carregar as cidades. Verifique se a API foi reiniciada com a versão mais recente.</div>
            } @else if (cities().length === 0) {
              <div class="empty">Nenhum aluno com cidade cadastrada neste estado.</div>
            } @else {
              <ul class="rank cities">
                @for (c of cities(); track c.city) {
                  <li>
                    <span class="city-name" [title]="c.city">{{ c.city }}</span>
                    <div class="bar-bg"><div class="bar" [style.width.%]="(c.total / maxCity()) * 100"></div></div>
                    <span class="num">{{ c.total }}</span>
                  </li>
                }
              </ul>
            }
          } @else if (returning()) {
            <div class="loading inline"><div class="spinner"></div>Carregando estados...</div>
          } @else {
          <div class="side-title">Estados com mais alunos</div>
          @if (ranking().length === 0) {
            <div class="empty">Nenhum usuário com estado cadastrado ainda.<br>Preencha o endereço em Usuários.</div>
          } @else {
            <ul class="rank">
              @for (r of ranking(); track r.state) {
                <li [class.hl]="hovered() === r.state" (mouseenter)="hovered.set(r.state)" (mouseleave)="hovered.set(null)">
                  <span class="uf">{{ r.state }}</span>
                  <div class="bar-bg"><div class="bar" [style.width.%]="(r.total / max()) * 100"></div></div>
                  <span class="num">{{ r.total }}</span>
                </li>
              }
            </ul>
          }
          <div class="summary">
            <strong>{{ totalUsers() }}</strong> aluno(s) em <strong>{{ data().length }}</strong> estado(s)
          </div>
          <div class="hint">Clique em um estado para ver as cidades.</div>
          }
        </div>
      </div>
    }
  `
})
export class BrazilMapComponent implements OnInit {
  private readonly userService = inject(UserService);

  data = input<StateCount[]>([]);
  compact = input(false);

  readonly width = WIDTH;
  // Cinza derivado da cor do texto: contrasta tanto no tema claro quanto no escuro
  readonly emptyFill = 'color-mix(in srgb, var(--color-text-muted) 28%, var(--color-card-bg))';

  shapes = signal<StateShape[]>([]);
  height = signal(600);
  hovered = signal<string | null>(null);
  loadError = signal(false);
  selected = signal<string | null>(null);
  cities = signal<CityCount[]>([]);
  citiesLoading = signal(false);
  citiesError = signal(false);
  maxCity = computed(() => Math.max(1, ...this.cities().map(c => c.total)));
  selectedName = computed(() => this.shapes().find(s => s.uf === this.selected())?.name ?? this.selected());

  cityShapes = signal<CityShape[]>([]);
  cityHeight = signal(500);
  cityLoading = signal(false);
  cityError = signal(false);
  hoveredCity = signal<string | null>(null);
  private readonly cityMapCache = new Map<string, { shapes: CityShape[]; height: number }>();

  private cityByName = computed(() => new Map(this.cities().map(c => [norm(c.city), c])));
  cityTotal(name: string): number { return this.cityByName().get(norm(name))?.total ?? 0; }
  cityFill(name: string): string {
    const total = this.cityTotal(name);
    if (!total) return this.emptyFill;
    const pct = Math.round(45 + 55 * (total / this.maxCity()));
    return `color-mix(in srgb, var(--color-primary) ${pct}%, var(--color-card-bg))`;
  }
  hoveredCityInfo = computed(() => {
    const id = this.hoveredCity();
    const shape = id ? this.cityShapes().find(c => c.id === id) : null;
    if (!shape) return null;
    const c = this.cityByName().get(norm(shape.name));
    return { name: shape.name, total: c?.total ?? 0, active: c?.active ?? 0 };
  });

  private async loadCityMap(uf: string) {
    this.cityError.set(false);
    this.hoveredCity.set(null);
    const cached = this.cityMapCache.get(uf);
    if (cached) { this.cityShapes.set(cached.shapes); this.cityHeight.set(cached.height); return; }

    this.cityLoading.set(true);
    this.cityShapes.set([]);
    try {
      const code = UF_CODE[uf];
      const [geoRes, namesRes] = await Promise.all([
        fetch(`https://servicodados.ibge.gov.br/api/v3/malhas/estados/${code}?intrarregiao=municipio&formato=application/vnd.geo+json&qualidade=minima`),
        fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
      ]);
      if (!geoRes.ok || !namesRes.ok) throw new Error();
      const geo = await geoRes.json();
      const names: { id: number; nome: string }[] = await namesRes.json();
      const nameById = new Map(names.map(n => [String(n.id), n.nome]));
      const built = this.buildCityShapes(geo, nameById);
      this.cityMapCache.set(uf, built);
      if (this.selected() === uf) { this.cityShapes.set(built.shapes); this.cityHeight.set(built.height); }
    } catch {
      if (this.selected() === uf) this.cityError.set(true);
    } finally {
      if (this.selected() === uf) this.cityLoading.set(false);
    }
  }

  private buildCityShapes(geo: any, nameById: Map<string, string>) {
    const features: any[] = geo.features ?? [];
    const polygonsOf = (g: any): number[][][][] =>
      g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];

    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const f of features)
      for (const poly of polygonsOf(f.geometry))
        for (const ring of poly)
          for (const [lon, lat] of ring) {
            minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
            minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
          }

    const kx = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
    const scale = WIDTH / ((maxLon - minLon) * kx);
    const height = Math.ceil((maxLat - minLat) * scale);

    const shapes: CityShape[] = features.map(f => {
      const id = String(f.properties?.codarea);
      let d = '';
      for (const poly of polygonsOf(f.geometry))
        for (const ring of poly)
          d += 'M' + ring.map(([lon, lat]) =>
            `${((lon - minLon) * kx * scale).toFixed(1)},${((maxLat - lat) * scale).toFixed(1)}`).join('L') + 'Z';
      return { id, name: nameById.get(id) ?? id, path: d };
    });
    return { shapes, height };
  }

  returning = signal(false);
  private returnTimer?: ReturnType<typeof setTimeout>;

  backToAll() {
    this.selected.set(null);
    this.hovered.set(null);
    this.returning.set(true);
    clearTimeout(this.returnTimer);
    this.returnTimer = setTimeout(() => this.returning.set(false), 500);
  }

  selectState(uf: string) {
    clearTimeout(this.returnTimer);
    this.returning.set(false);
    this.loadCityMap(uf);
    this.selected.set(uf);
    this.cities.set([]);
    this.citiesError.set(false);
    this.citiesLoading.set(true);
    this.userService.countByCity(uf).subscribe({
      next: data => { if (this.selected() === uf) { this.cities.set(data); this.citiesLoading.set(false); } },
      error: () => { if (this.selected() === uf) { this.cities.set([]); this.citiesError.set(true); this.citiesLoading.set(false); } }
    });
  }

  private byUf = computed(() => new Map(this.data().map(d => [d.state, d])));
  max = computed(() => Math.max(1, ...this.data().map(d => d.total)));
  ranking = computed(() => [...this.data()].sort((a, b) => b.total - a.total).slice(0, this.compact() ? 5 : 10));
  totalUsers = computed(() => this.data().reduce((s, d) => s + d.total, 0));

  hoveredInfo = computed(() => {
    const uf = this.hovered();
    if (!uf) return null;
    const d = this.byUf().get(uf);
    return { uf, name: this.shapes().find(s => s.uf === uf)?.name ?? uf, total: d?.total ?? 0, active: d?.active ?? 0 };
  });

  async ngOnInit() {
    try {
      // GeoJSON da malha de UFs do IBGE, servido localmente a partir de /public
      const res = await fetch('/brazil-states.geojson');
      if (!res.ok) throw new Error();
      this.buildShapes(await res.json());
    } catch {
      this.loadError.set(true);
    }
  }

  showLabel(uf: string): boolean {
    // No compacto só os estados com alunos ganham rótulo (o número)
    return this.compact() ? this.countOf(uf) > 0 : !NO_LABEL.has(uf);
  }

  countOf(uf: string): number {
    return this.byUf().get(uf)?.total ?? 0;
  }

  ratio(uf: string): number {
    return this.countOf(uf) / this.max();
  }

  fillFor(uf: string): string {
    const count = this.countOf(uf);
    if (!count) return this.emptyFill;
    // 35% a 100% da cor primária conforme a proporção em relação ao maior estado
    const pct = Math.round(35 + 65 * (count / this.max()));
    return `color-mix(in srgb, var(--color-primary) ${pct}%, var(--color-card-bg))`;
  }

  private buildShapes(geo: any) {
    const features: any[] = geo.features ?? [];
    const polygonsOf = (g: any): number[][][][] =>
      g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];

    // Bounding box para a projeção equiretangular
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const f of features)
      for (const poly of polygonsOf(f.geometry))
        for (const ring of poly)
          for (const [lon, lat] of ring) {
            minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
            minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
          }

    const kx = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
    const scale = WIDTH / ((maxLon - minLon) * kx);
    const project = (lon: number, lat: number): [number, number] =>
      [(lon - minLon) * kx * scale, (maxLat - lat) * scale];
    this.height.set(Math.ceil((maxLat - minLat) * scale));

    const shapes: StateShape[] = [];
    for (const f of features) {
      const info = IBGE_UF[String(f.properties?.codarea)];
      if (!info) continue;

      let d = '';
      let biggest: { area: number; cx: number; cy: number } = { area: -1, cx: 0, cy: 0 };
      for (const poly of polygonsOf(f.geometry)) {
        poly.forEach((ring, ri) => {
          const pts = ring.map(([lon, lat]) => project(lon, lat));
          d += 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L') + 'Z';
          if (ri === 0) {
            const c = this.centroid(pts);
            if (c.area > biggest.area) biggest = c;
          }
        });
      }
      shapes.push({ uf: info[0], name: info[1], path: d, labelX: biggest.cx, labelY: biggest.cy });
    }
    this.shapes.set(shapes);
  }

  /** Centroide de polígono (fórmula do shoelace) para posicionar o rótulo */
  private centroid(pts: [number, number][]) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const cross = pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
      a += cross;
      cx += (pts[j][0] + pts[i][0]) * cross;
      cy += (pts[j][1] + pts[i][1]) * cross;
    }
    a /= 2;
    return a === 0 ? { area: 0, cx: pts[0][0], cy: pts[0][1] } : { area: Math.abs(a), cx: cx / (6 * a), cy: cy / (6 * a) };
  }
}
