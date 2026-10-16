import {
  AfterViewInit, Component, ElementRef, NgZone, OnDestroy, effect, inject, input, signal, viewChild
} from '@angular/core';
import {
  BufferGeometry, CircleGeometry, Color, DirectionalLight, Float32BufferAttribute, Group, HemisphereLight,
  Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, Scene, SphereGeometry, WebGLRenderer
} from 'three';

/** Medidas do corpo (cm). O que faltar é preenchido com proporções médias. */
export interface BodyShape {
  heightCm: number;
  neckCm?: number | null;
  shouldersCm?: number | null;
  chestCm?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  rightArmCm?: number | null;
  leftArmCm?: number | null;
  rightThighCm?: number | null;
  leftThighCm?: number | null;
  rightCalfCm?: number | null;
  leftCalfCm?: number | null;
}

type Sex = 'M' | 'F' | null;

// Medidas de referência para altura 175 cm
const DEFAULTS = {
  M: { neck: 38, shoulders: 112, chest: 98, waist: 84, hip: 98, arm: 33, thigh: 56, calf: 37 },
  F: { neck: 32, shoulders: 100, chest: 90, waist: 74, hip: 100, arm: 28, thigh: 57, calf: 36 }
};

interface Dims {
  H: number; neck: number; shoulders: number; chest: number; waist: number; hip: number;
  armR: number; armL: number; thighR: number; thighL: number; calfR: number; calfL: number;
}

function complete(s: BodyShape, sex: Sex): Dims {
  const d = DEFAULTS[sex === 'F' ? 'F' : 'M'];
  const k = s.heightCm / 175;
  const v = (value: number | null | undefined, fallback: number) => value ?? fallback * k;
  const armR = v(s.rightArmCm ?? s.leftArmCm, d.arm);
  const thighR = v(s.rightThighCm ?? s.leftThighCm, d.thigh);
  const calfR = v(s.rightCalfCm ?? s.leftCalfCm, d.calf);
  return {
    H: s.heightCm,
    neck: v(s.neckCm, d.neck), shoulders: v(s.shouldersCm, d.shoulders), chest: v(s.chestCm, d.chest),
    waist: v(s.waistCm, d.waist), hip: v(s.hipCm, d.hip),
    armR, armL: v(s.leftArmCm ?? s.rightArmCm, d.arm),
    thighR, thighL: v(s.leftThighCm ?? s.rightThighCm, d.thigh),
    calfR, calfL: v(s.leftCalfCm ?? s.rightCalfCm, d.calf)
  };
}

/** Semi-largura (a) de uma elipse com perímetro `circ` e profundidade = k * largura (aprox. de Ramanujan). */
function semi(circ: number, k: number): number {
  return circ / (Math.PI * (3 * (1 + k) - Math.sqrt((3 + k) * (1 + 3 * k))));
}

interface Section { y: number; a: number; b: number; }

const catmull = (p0: number, p1: number, p2: number, p3: number, t: number) =>
  0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);

/** Sólido "loftado": anéis elípticos empilhados e suavizados entre as seções de controle. */
function loftGeometry(sections: Section[], cx = 0, steps = 30, radial = 28): BufferGeometry {
  const n = sections.length;
  const at = (i: number) => sections[Math.max(0, Math.min(n - 1, i))];
  const positions: number[] = [];
  const rings = steps + 1;

  for (let r = 0; r < rings; r++) {
    const u = (r / steps) * (n - 1);
    const i = Math.min(Math.floor(u), n - 2);
    const t = u - i;
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const y = catmull(p0.y, p1.y, p2.y, p3.y, t);
    const a = Math.max(0.1, catmull(p0.a, p1.a, p2.a, p3.a, t));
    const b = Math.max(0.1, catmull(p0.b, p1.b, p2.b, p3.b, t));
    for (let j = 0; j < radial; j++) {
      const th = (j / radial) * Math.PI * 2;
      positions.push(cx + a * Math.cos(th), y, b * Math.sin(th));
    }
  }

  const index: number[] = [];
  for (let r = 0; r < rings - 1; r++) {
    for (let j = 0; j < radial; j++) {
      const a = r * radial + j, b = r * radial + ((j + 1) % radial);
      const c = (r + 1) * radial + j, d = (r + 1) * radial + ((j + 1) % radial);
      index.push(a, c, b, b, c, d);
    }
  }
  // Tampas (leque a partir do centro de cada ponta)
  const capBottom = positions.length / 3;
  positions.push(cx, positions[1], 0);
  const capTop = capBottom + 1;
  positions.push(cx, positions[(rings - 1) * radial * 3 + 1], 0);
  for (let j = 0; j < radial; j++) {
    const k = (j + 1) % radial;
    index.push(capBottom, k, j);
    index.push(capTop, (rings - 1) * radial + j, (rings - 1) * radial + k);
  }

  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(positions, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

@Component({
  selector: 'app-body-3d',
  standalone: true,
  styles: [`
    :host { display: block; position: relative; }
    canvas { width: 100%; height: 100%; display: block; touch-action: pan-y; cursor: grab; user-select: none; -webkit-user-select: none; }
    canvas:active { cursor: grabbing; }
    .msg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      padding: 16px; text-align: center; color: var(--ft-text-muted); font-size: 0.85rem; }
  `],
  template: `
    <canvas #cv></canvas>
    @if (unsupported()) { <div class="msg">3D indisponível neste aparelho.</div> }
  `
})
export class Body3dComponent implements AfterViewInit, OnDestroy {
  shape = input.required<BodyShape>();
  /** Corpo de comparação ("antes"), desenhado como malha transparente. */
  ghost = input<BodyShape | null>(null);
  sex = input<Sex>(null);
  /** 'side': antes e depois lado a lado; 'overlay': "antes" como malha sobre o corpo. */
  layout = input<'overlay' | 'side'>('overlay');

  unsupported = signal(false);

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('cv');
  private readonly zone = inject(NgZone);

  private renderer?: WebGLRenderer;
  private scene?: Scene;
  private camera?: PerspectiveCamera;
  private figure?: Group;
  private spinners: Group[] = [];
  private raf = 0;
  private visible = true;
  private dragging = false;
  private lastX = 0;
  private resumeAt = 0;
  private rotY = -0.5;
  private resizeObs?: ResizeObserver;
  private visObs?: IntersectionObserver;

  constructor() {
    effect(() => {
      // Lê os sinais aqui para reconstruir o corpo quando as medidas mudarem
      const s = this.shape(), g = this.ghost(), sex = this.sex();
      this.layout();
      if (this.scene) this.rebuild(s, g, sex);
    });
  }

  ngAfterViewInit() {
    const el = this.canvas().nativeElement;
    try {
      this.renderer = new WebGLRenderer({ canvas: el, antialias: true, alpha: true });
    } catch {
      this.unsupported.set(true);
      return;
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.scene = new Scene();
    this.camera = new PerspectiveCamera(32, 1, 0.1, 50);
    this.scene.add(new HemisphereLight(0xffffff, 0x2a3350, 1.15));
    const key = new DirectionalLight(0xffffff, 1.6);
    key.position.set(1.5, 2.5, 3);
    this.scene.add(key);
    const rim = new DirectionalLight(0xe94560, 0.9);
    rim.position.set(-2, 1.5, -2.5);
    this.scene.add(rim);

    this.rebuild(this.shape(), this.ghost(), this.sex());
    this.resize();

    el.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);

    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(el);
    this.visObs = new IntersectionObserver(([e]) => (this.visible = e.isIntersecting));
    this.visObs.observe(el);

    // Animação fora do Angular: não dispara detecção de mudanças a cada frame
    this.zone.runOutsideAngular(() => {
      const loop = () => {
        this.raf = requestAnimationFrame(loop);
        if (!this.visible || !this.figure) return;
        if (!this.dragging && performance.now() > this.resumeAt) this.rotY += 0.006;
        for (const s of this.spinners) s.rotation.y = this.rotY;
        this.renderer!.render(this.scene!, this.camera!);
      };
      loop();
    });
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.raf);
    this.resizeObs?.disconnect();
    this.visObs?.disconnect();
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    this.canvas().nativeElement.removeEventListener('pointerdown', this.onDown);
    this.disposeFigure();
    this.renderer?.dispose();
  }

  private onDown = (e: PointerEvent) => { e.preventDefault(); this.dragging = true; this.lastX = e.clientX; };
  private onMove = (e: PointerEvent) => {
    if (!this.dragging) return;
    this.rotY += (e.clientX - this.lastX) * 0.012;
    this.lastX = e.clientX;
  };
  private onUp = () => {
    if (!this.dragging) return;
    this.dragging = false;
    this.resumeAt = performance.now() + 2500; // volta a girar sozinho depois de uns segundos
  };

  private resize() {
    const el = this.canvas().nativeElement;
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h || !this.renderer || !this.camera) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private disposeFigure() {
    if (!this.figure) return;
    this.figure.traverse(o => {
      const m = o as Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as Material | Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach(x => x.dispose()); else mat?.dispose();
    });
    this.scene?.remove(this.figure);
    this.figure = undefined;
  }

  private rebuild(s: BodyShape, ghost: BodyShape | null, sex: Sex) {
    if (!this.scene || !this.camera) return;
    this.disposeFigure();

    const after = new MeshStandardMaterial({ color: new Color('#e94560'), roughness: 0.55, metalness: 0.05 });
    const floorDisc = () => {
      // Chão: disco discreto para dar noção de apoio
      const floor = new Mesh(new CircleGeometry(0.5, 48), new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06 }));
      floor.rotation.x = -Math.PI / 2;
      return floor;
    };

    const root = new Group();
    this.spinners = [];
    const side = ghost && this.layout() === 'side';

    if (side) {
      // Dois corpos sólidos lado a lado (antes à esquerda, depois à direita), girando juntos
      const before = new MeshStandardMaterial({ color: new Color('#7f93d6'), roughness: 0.55, metalness: 0.05 });
      const spread = 0.52;
      for (const [shape, mat, x] of [[ghost, before, -spread], [s, after, spread]] as const) {
        const spin = new Group();
        spin.position.x = x;
        spin.add(this.buildBody(shape, sex, mat), floorDisc());
        root.add(spin);
        this.spinners.push(spin);
      }
    } else {
      const spin = new Group();
      spin.add(this.buildBody(s, sex, after));
      if (ghost) {
        // Malha rala (poucos polígonos) para não esconder o corpo sólido
        const wire = new MeshBasicMaterial({ color: 0x9db4ff, wireframe: true, transparent: true, opacity: 0.55, depthTest: false });
        const g = this.buildBody(ghost, sex, wire, true);
        g.renderOrder = 5;
        spin.add(g);
      }
      spin.add(floorDisc());
      root.add(spin);
      this.spinners.push(spin);
    }

    this.scene.add(root);
    this.figure = root;

    // Enquadra o corpo inteiro conforme a altura (mais afastado para caber os dois lado a lado)
    const h = s.heightCm * 0.01;
    this.camera.position.set(0, h * 0.54, h * (side ? 2.5 : 1.95));
    this.camera.lookAt(0, h * 0.5, 0);
  }

  /** Monta o corpo (unidade da cena: metro). Frente do corpo = +z; lado direito da pessoa = -x. */
  private buildBody(s: BodyShape, sex: Sex, mat: Material, sparse = false): Group {
    const d = complete(s, sex);
    const steps = sparse ? 14 : 30, radial = sparse ? 12 : 28;
    const loft = (sections: Section[], cx = 0) => loftGeometry(sections, cx, steps, radial);
    const H = d.H;
    const y = (f: number) => f * H;
    const body = new Group();
    const add = (geo: BufferGeometry, x = 0, py = 0, rz = 0) => {
      const m = new Mesh(geo, mat);
      m.position.set(x, py, 0);
      m.rotation.z = rz;
      body.add(m);
      return m;
    };
    const circle = (circ: number) => circ / (2 * Math.PI);

    // Tronco + pescoço
    const sec = (f: number, circ: number, k: number): Section => {
      const a = semi(circ, k);
      return { y: y(f), a, b: a * k };
    };
    add(loft([
      sec(0.43, d.hip * 0.72, 0.72),
      sec(0.47, d.hip * 0.92, 0.72),
      sec(0.52, d.hip, 0.72),
      sec(0.62, d.waist, 0.7),
      sec(0.72, d.chest, 0.62),
      sec(0.80, d.shoulders * 0.82, 0.48),
      sec(0.835, d.neck * 1.25, 0.9),
      sec(0.875, d.neck, 1)
    ]));

    // Cabeça
    const head = new Mesh(new SphereGeometry(1, 28, 20), mat);
    head.scale.set(0.045 * H, 0.066 * H, 0.056 * H);
    head.position.set(0, y(0.94), 0.003 * H);
    body.add(head);

    // Pernas
    const hipHalf = semi(d.hip, 0.72);
    for (const side of [-1, 1]) {
      const right = side < 0;
      const thigh = right ? d.thighR : d.thighL;
      const calf = right ? d.calfR : d.calfL;
      const x = side * hipHalf * 0.5;
      const c = (f: number, circ: number): Section => ({ y: y(f), a: circle(circ), b: circle(circ) });
      add(loft([
        c(0.04, calf * 0.58), c(0.20, calf), c(0.285, calf * 0.92), c(0.40, thigh), c(0.50, thigh * 0.97), c(0.56, thigh * 0.8)
      ], x));

      const foot = new Mesh(new SphereGeometry(1, 16, 12), mat);
      foot.scale.set(circle(calf * 0.58) * 1.35, 0.03 * H, 0.075 * H);
      foot.position.set(x, 0.03 * H, 0.04 * H);
      body.add(foot);
    }

    // Braços (pivô no ombro, levemente afastados do tronco)
    const shoulderHalf = semi(d.shoulders * 0.82, 0.48);
    const pivotY = y(0.805);
    for (const side of [-1, 1]) {
      const right = side < 0;
      const arm = right ? d.armR : d.armL;
      const r = circle(arm);
      const c = (f: number, k: number): Section => ({ y: y(f) - pivotY, a: r * k, b: r * k });
      const group = new Group();
      group.position.set(side * (shoulderHalf + r * 0.55), pivotY, 0);
      group.rotation.z = side * 0.09;
      const mesh = new Mesh(loft([c(0.485, 0.5), c(0.575, 0.82), c(0.62, 0.78), c(0.74, 1), c(0.81, 0.95)]), mat);
      group.add(mesh);
      // Deltoide arredondado: esfera no topo do braço
      const delt = new Mesh(new SphereGeometry(1, 18, 14), mat);
      delt.scale.set(r * 1.02, r * 1.05, r * 1.0);
      delt.position.set(0, y(0.805) - pivotY, 0);
      group.add(delt);
      const hand = new Mesh(new SphereGeometry(1, 14, 10), mat);
      hand.scale.set(r * 0.55, 0.04 * H, r * 0.4);
      hand.position.set(0, y(0.45) - pivotY, 0);
      group.add(hand);
      body.add(group);
    }

    body.scale.setScalar(0.01); // cm -> m
    return body;
  }
}
