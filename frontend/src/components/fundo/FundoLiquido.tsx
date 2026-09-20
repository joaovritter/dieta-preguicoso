import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useColorScheme } from '@mui/material/styles';
import { Color, type ShaderMaterial } from 'three';

const VERDE = { light: '#0CA85D', dark: '#3fa87c' } as const;
const OPACIDADE = { light: 0.18, dark: 0.22 } as const;
const INTERVALO_QUADRO_MS = 1000 / 30;

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Ruído simplex 2D de Ashima Arts / Stefan Gustavson (licença MIT).
const fragment = /* glsl */ `
  precision mediump float;
  uniform float uTempo;
  uniform vec3 uCor;
  uniform float uOpacidade;
  uniform vec2 uProporcao;
  varying vec2 vUv;

  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 p = vUv * uProporcao * 1.6;
    float t = uTempo * 0.06;
    float n = snoise(p + vec2(t, -t * 0.7));
    n += 0.5 * snoise(p * 2.1 - vec2(t * 1.3, t));
    float onda = smoothstep(-0.2, 1.1, n);
    float realce = smoothstep(0.55, 0.95, n) * 0.6;
    // Mais forte no topo, onde fica a headline; some em direção ao formulário.
    float mascara = smoothstep(0.0, 0.85, vUv.y);
    float alpha = (onda * 0.7 + realce) * uOpacidade * mascara;
    gl_FragColor = vec4(uCor + realce * 0.25, alpha);
  }
`;

function modoResolvido(mode: string | undefined, systemMode: string | undefined): 'light' | 'dark' {
  const efetivo = mode === 'system' ? systemMode : mode;
  return efetivo === 'dark' ? 'dark' : 'light';
}

function Plano({ modo }: { modo: 'light' | 'dark' }) {
  const material = useRef<ShaderMaterial>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTempo: { value: 0 },
      uCor: { value: new Color(VERDE.light) },
      uOpacidade: { value: OPACIDADE.light as number },
      uProporcao: { value: [1, 1] as [number, number] },
    }),
    [],
  );

  useEffect(() => {
    uniforms.uCor.value.set(VERDE[modo]);
    uniforms.uOpacidade.value = OPACIDADE[modo];
  }, [modo, uniforms]);

  useEffect(() => {
    const maior = Math.max(size.width, size.height, 1);
    uniforms.uProporcao.value = [size.width / maior, size.height / maior];
  }, [size.width, size.height, uniforms]);

  useFrame(({ clock }) => {
    if (material.current) material.current.uniforms.uTempo.value = clock.elapsedTime;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

// frameloop="demand" + invalidate a cada ~33 ms segura o fundo em ~30 fps.
function Relogio30fps() {
  const invalidate = useThree((estado) => estado.invalidate);
  useEffect(() => {
    const id = window.setInterval(() => invalidate(), INTERVALO_QUADRO_MS);
    return () => window.clearInterval(id);
  }, [invalidate]);
  return null;
}

export default function FundoLiquido() {
  const { mode, systemMode } = useColorScheme();
  const modo = modoResolvido(mode, systemMode);

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <Relogio30fps />
      <Plano modo={modo} />
    </Canvas>
  );
}
