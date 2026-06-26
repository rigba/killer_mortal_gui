export class Vec3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    clone() { return new Vec3(this.x, this.y, this.z); }
    add(v) { return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z); }
    sub(v) { return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z); }
    scale(s) { return new Vec3(this.x * s, this.y * s, this.z * s); }
    dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
    cross(v) { return new Vec3(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x); }
    length() { return Math.hypot(this.x, this.y, this.z); }
    normalize() {
        const length = this.length();
        return length > 0 ? this.scale(1 / length) : new Vec3();
    }
}

export class Mat4 {
    static identity() {
        return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
    }

    static multiply(a, b) {
        const out = new Float32Array(16);
        for (let column = 0; column < 4; column++) {
            for (let row = 0; row < 4; row++) {
                let value = 0;
                for (let k = 0; k < 4; k++) value += a[k * 4 + row] * b[column * 4 + k];
                out[column * 4 + row] = value;
            }
        }
        return out;
    }

    static translation(v) {
        const out = Mat4.identity();
        out[12] = v.x; out[13] = v.y; out[14] = v.z;
        return out;
    }

    static scale(v) {
        const out = Mat4.identity();
        out[0] = v.x; out[5] = v.y; out[10] = v.z;
        return out;
    }

    static rotationX(radians) {
        const c = Math.cos(radians), s = Math.sin(radians);
        return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]);
    }

    static rotationY(radians) {
        const c = Math.cos(radians), s = Math.sin(radians);
        return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]);
    }

    static rotationZ(radians) {
        const c = Math.cos(radians), s = Math.sin(radians);
        return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]);
    }

    static compose(position, rotation, scale) {
        let matrix = Mat4.translation(position);
        matrix = Mat4.multiply(matrix, Mat4.rotationZ(rotation.z));
        matrix = Mat4.multiply(matrix, Mat4.rotationY(rotation.y));
        matrix = Mat4.multiply(matrix, Mat4.rotationX(rotation.x));
        return Mat4.multiply(matrix, Mat4.scale(scale));
    }

    static perspective(fovRadians, aspect, near, far) {
        const f = 1 / Math.tan(fovRadians / 2);
        const nf = 1 / (near - far);
        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, 2 * far * near * nf, 0,
        ]);
    }

    static lookAt(eye, target, up = new Vec3(0, 0, 1)) {
        const z = eye.sub(target).normalize();
        const x = up.cross(z).normalize();
        const y = z.cross(x);
        return new Float32Array([
            x.x, y.x, z.x, 0,
            x.y, y.y, z.y, 0,
            x.z, y.z, z.z, 0,
            -x.dot(eye), -y.dot(eye), -z.dot(eye), 1,
        ]);
    }
}

export class Material {
  constructor(color, {
        grain = 0,
        emissive = 0,
        boxLightResponse = 1,
        texture = null,
        textureBackground = null,
        textureMipBias = 0,
        surfaceTexture = null,
        surfaceTextureStrength = 0,
        surfaceTextureScale = [1, 1],
        surfaceTextureRotation = 0,
        surfaceTextureContrast = 1,
        surfaceTextureContrastPivot = 0.5,
        surfaceTextureBlend = 'soft-light',
        colorMultiplier = 1,
        opacity = 1,
        softEdge = 0,
        splitColor = null,
        splitZ = 0,
        splitDirection = 1,
        shadowStencil = false, // Add this option
    } = {}) {
        this.color = Material.parseColor(color);
        this.grain = grain;
        this.emissive = emissive;
        this.boxLightResponse = boxLightResponse;
        this.texture = texture;
        this.textureBackground = textureBackground;
        this.textureMipBias = textureMipBias;
        this.surfaceTexture = surfaceTexture;
        this.surfaceTextureStrength = surfaceTextureStrength;
        this.surfaceTextureScale = surfaceTextureScale;
        this.surfaceTextureRotation = surfaceTextureRotation;
        this.surfaceTextureContrast = surfaceTextureContrast;
        this.surfaceTextureContrastPivot = surfaceTextureContrastPivot;
        this.surfaceTextureBlend = surfaceTextureBlend === 'screen' ? 1 : 0;
        this.colorMultiplier = colorMultiplier;
        this.opacity = opacity;
        this.softEdge = softEdge;
        this.splitColor = splitColor ? Material.parseColor(splitColor) : [0, 0, 0];
        this.useSplitColor = splitColor ? 1 : 0;
        this.splitZ = splitZ;
        this.splitDirection = splitDirection;
        this.shadowStencil = shadowStencil; // Save the property
    }

    static parseColor(hex) {
        const value = Number.parseInt(hex.replace('#', ''), 16);
        // CSS-style hex values are sRGB; shaders perform lighting in linear space.
        return [value >> 16 & 255, value >> 8 & 255, value & 255]
            .map(channel => Math.pow(channel / 255, 2.2));
    }
}

export class Geometry {
    constructor(positions, normals, indices, uvs = null) {
        this.positions = new Float32Array(positions);
        this.normals = new Float32Array(normals);
        this.indices = new Uint16Array(indices);
        this.uvs = new Float32Array(uvs || new Array(positions.length / 3 * 2).fill(0));
        this.gpu = null;
    }

    static box() {
        const positions = [];
        const normals = [];
        const uvs = [];
        const indices = [];
        const face = (vertices, normal) => {
            const offset = positions.length / 3;
            const faceUvs = [[0, 0], [1, 0], [1, 1], [0, 1]];
            vertices.forEach((vertex, index) => {
                positions.push(...vertex);
                normals.push(...normal);
                uvs.push(...faceUvs[index]);
            });
            indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
        };
        face([[-.5,-.5,-.5],[ .5,-.5,-.5],[ .5,-.5, .5],[-.5,-.5, .5]],[0,-1,0]);
        face([[ .5, .5,-.5],[-.5, .5,-.5],[-.5, .5, .5],[ .5, .5, .5]],[0,1,0]);
        face([[-.5, .5,-.5],[-.5,-.5,-.5],[-.5,-.5, .5],[-.5, .5, .5]],[-1,0,0]);
        face([[ .5,-.5,-.5],[ .5, .5,-.5],[ .5, .5, .5],[ .5,-.5, .5]],[1,0,0]);
        face([[-.5,-.5, .5],[ .5,-.5, .5],[ .5, .5, .5],[-.5, .5, .5]],[0,0,1]);
        face([[-.5, .5,-.5],[ .5, .5,-.5],[ .5,-.5,-.5],[-.5,-.5,-.5]],[0,0,-1]);
        return new Geometry(positions, normals, indices, uvs);
    }

    static plane() {
        return new Geometry(
            [-.5,-.5,0, .5,-.5,0, .5,.5,0, -.5,.5,0],
            [0,0,1, 0,0,1, 0,0,1, 0,0,1],
            [0,1,2, 0,2,3],
            [0,0, 1,0, 1,1, 0,1],
        );
    }

    static cylinder(segments = 32) {
        const positions = [];
        const normals = [];
        const uvs = [];
        const indices = [];
        const addVertex = (position, normal, uv) => {
            positions.push(...position);
            normals.push(...normal);
            uvs.push(...uv);
            return positions.length / 3 - 1;
        };
        const topCentre = addVertex([0, 0, .5], [0, 0, 1], [.5, .5]);
        const bottomCentre = addVertex([0, 0, -.5], [0, 0, -1], [.5, .5]);
        const top = [];
        const bottom = [];
        const sideTop = [];
        const sideBottom = [];
        for (let segment = 0; segment < segments; segment++) {
            const angle = segment / segments * Math.PI * 2;
            const x = Math.cos(angle) * .5;
            const y = Math.sin(angle) * .5;
            const u = segment / segments;
            top.push(addVertex([x, y, .5], [0, 0, 1], [x + .5, y + .5]));
            bottom.push(addVertex([x, y, -.5], [0, 0, -1], [x + .5, y + .5]));
            sideTop.push(addVertex([x, y, .5], [Math.cos(angle), Math.sin(angle), 0], [u, 1]));
            sideBottom.push(addVertex([x, y, -.5], [Math.cos(angle), Math.sin(angle), 0], [u, 0]));
        }
        for (let segment = 0; segment < segments; segment++) {
            const next = (segment + 1) % segments;
            indices.push(topCentre, top[segment], top[next]);
            indices.push(bottomCentre, bottom[next], bottom[segment]);
            indices.push(sideBottom[segment], sideBottom[next], sideTop[next]);
            indices.push(sideBottom[segment], sideTop[next], sideTop[segment]);
        }
        return new Geometry(positions, normals, indices, uvs);
    }

static roundedBoxEdges(bevel = .025, edgeSegments = 3) {
    const positions = [], normals = [], uvs = [], indices = [];
    const outer = .5;
    const inner = outer - bevel;
    const addPolygon = points => {
        const a = points[0], b = points[1], c = points[2];
        const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
        const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
        let normal = [
            ab[1] * ac[2] - ab[2] * ac[1],
            ab[2] * ac[0] - ab[0] * ac[2],
            ab[0] * ac[1] - ab[1] * ac[0],
        ];
        const centre = points.reduce(
            (sum, point) => sum.map((value, axis) => value + point[axis]),
            [0, 0, 0],
        ).map(value => value / points.length);
        if (normal[0] * centre[0] + normal[1] * centre[1] + normal[2] * centre[2] < 0) {
            points = [...points].reverse();
            normal = normal.map(value => -value);
        }
        const length = Math.hypot(...normal) || 1;
        normal = normal.map(value => value / length);
        const offset = positions.length / 3;
        for (const point of points) {
            positions.push(...point);
            normals.push(...normal);
            uvs.push(point[0] + .5, point[1] + .5);
        }
        for (let index = 1; index < points.length - 1; index++) {
            indices.push(offset, offset + index, offset + index + 1);
        }
    };
    const point = (axis, value, first, second) => {
        const result = [0, 0, 0];
        result[axis] = value;
        result[(axis + 1) % 3] = first;
        result[(axis + 2) % 3] = second;
        return result;
    };

    // Six inset main faces.
    for (let axis = 0; axis < 3; axis++) {
        for (const sign of [-1, 1]) {
            addPolygon([
                point(axis, sign * outer, -inner, -inner),
                point(axis, sign * outer, inner, -inner),
                point(axis, sign * outer, inner, inner),
                point(axis, sign * outer, -inner, inner),
            ]);
        }
    }

    // Twelve narrow, segmented edge faces.
    for (const [axisA, axisB, remaining] of [[0, 1, 2], [0, 2, 1], [1, 2, 0]]) {
        for (const signA of [-1, 1]) {
            for (const signB of [-1, 1]) {
                const make = (a, b, r) => {
                    const result = [0, 0, 0];
                    result[axisA] = a;
                    result[axisB] = b;
                    result[remaining] = r;
                    return result;
                };
                for (let segment = 0; segment < edgeSegments; segment++) {
                    const start = segment / edgeSegments * Math.PI / 2;
                    const end = (segment + 1) / edgeSegments * Math.PI / 2;
                    const at = angle => [
                        signA * (inner + Math.cos(angle) * bevel),
                        signB * (inner + Math.sin(angle) * bevel),
                    ];
                    const [startA, startB] = at(start);
                    const [endA, endB] = at(end);
                    addPolygon([
                        make(startA, startB, -inner),
                        make(startA, startB, inner),
                        make(endA, endB, inner),
                        make(endA, endB, -inner),
                    ]);
                }
            }
        }
    }

    // Cap each corner with a smooth 2-D spherical patch.
    // u sweeps the XY quarter-circle, v sweeps toward Z — every point lies
    // on the sphere of radius `bevel` centred at the inner cube corner vertex.
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
        const N = edgeSegments;
        const cornerPts = [];
        for (let vi = 0; vi <= N; vi++) {
            const phi = (vi / N) * Math.PI / 2;
            const row = [];
            for (let ui = 0; ui <= N; ui++) {
                const theta = (ui / N) * Math.PI / 2;
                row.push([
                    x * (inner + Math.cos(theta) * Math.cos(phi) * bevel),
                    y * (inner + Math.sin(theta) * Math.cos(phi) * bevel),
                    z * (inner + Math.sin(phi) * bevel),
                ]);
            }
            cornerPts.push(row);
        }
        for (let vi = 0; vi < N; vi++) {
            for (let ui = 0; ui < N; ui++) {
                addPolygon([
                    cornerPts[vi    ][ui    ],
                    cornerPts[vi    ][ui + 1],
                    cornerPts[vi + 1][ui + 1],
                    cornerPts[vi + 1][ui    ],
                ]);
            }
        }
    }

    return new Geometry(positions, normals, indices, uvs);
}

}

export class Node {
    constructor({ geometry = null, material = null } = {}) {
        this.geometry = geometry;
        this.material = material;
        this.position = new Vec3();
        this.rotation = new Vec3();
        this.scale = new Vec3(1, 1, 1);
        this.visible = true;
        this.children = [];
    }

    add(child) {
        this.children.push(child);
        return child;
    }

    localMatrix() { return Mat4.compose(this.position, this.rotation, this.scale); }
}

export class Scene extends Node {
    constructor() { super(); }
}

export class PerspectiveCamera {
    constructor({ fov = 35.5, near = 0.05, far = 250 } = {}) {
        this.position = new Vec3();
        this.forward = new Vec3(0, 1, 0);
        this.up = new Vec3(0, 0, 1);
        this.fov = fov;
        this.near = near;
        this.far = far;
    }

    lookInDirection(forward) { this.forward = forward.normalize(); }

    viewProjection(aspect) {
        const view = Mat4.lookAt(this.position, this.position.add(this.forward), this.up);
        const projection = Mat4.perspective(this.fov * Math.PI / 180, aspect, this.near, this.far);
        return Mat4.multiply(projection, view);
    }
}

export class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl', { antialias: true, alpha: false, depth: true, stencil: true });
        if (!this.gl) throw new Error('WebGL is required to render the 3D table.');
        this.program = this.createProgram();
        this.locations = this.getLocations();
        this.textureCache = new Map();
        this.anisotropy = this.gl.getExtension('EXT_texture_filter_anisotropic')
            || this.gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic')
            || this.gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
        this.onTextureLoad = null;
        this.clearColor = [0.012, 0.025, 0.048, 1];
        this.maxPixelRatio = 4;
        this.ambientLight = 0.38;
        this.boxLight = {
            position: new Vec3(0, 5, 10),
            size: [5, 5],
            color: [1, 1, 1],
            intensity: 0.92,
        };
    }

    compile(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
        return shader;
    }

    createProgram() {
        const gl = this.gl;
        const vertex = this.compile(gl.VERTEX_SHADER, `
            attribute vec3 aPosition;
            attribute vec3 aNormal;
            attribute vec2 aUv;
            uniform mat4 uModel;
            uniform mat4 uViewProjection;
            varying vec3 vNormal;
            varying vec3 vWorldPosition;
            varying vec3 vLocalPosition;
            varying vec2 vUv;
            void main() {
                vec4 world = uModel * vec4(aPosition, 1.0);
                vWorldPosition = world.xyz;
                vLocalPosition = aPosition;
                vNormal = normalize(mat3(uModel) * aNormal);
                vUv = aUv;
                gl_Position = uViewProjection * world;
            }
        `);
        const fragment = this.compile(gl.FRAGMENT_SHADER, `
            precision highp float;
            uniform vec3 uColor;
            uniform vec3 uSplitColor;
            uniform float uUseSplitColor;
            uniform float uSplitZ;
            uniform float uSplitDirection;
            uniform float uGrain;
            uniform float uEmissive;
            uniform float uAmbientLight;
            uniform vec3 uBoxLightPosition;
            uniform vec2 uBoxLightSize;
            uniform vec3 uBoxLightColor;
            uniform float uBoxLightIntensity;
            uniform float uBoxLightResponse;
            uniform sampler2D uTexture;
            uniform float uUseTexture;
            uniform float uTextureMipBias;
            uniform sampler2D uSurfaceTexture;
            uniform float uUseSurfaceTexture;
            uniform float uSurfaceTextureStrength;
            uniform vec2 uSurfaceTextureScale;
            uniform float uSurfaceTextureRotation;
            uniform float uSurfaceTextureContrast;
            uniform float uSurfaceTextureContrastPivot;
            uniform float uSurfaceTextureBlend;
            uniform float uColorMultiplier;
            uniform float uOpacity;
            uniform float uSoftEdge;
            varying vec3 vNormal;
            varying vec3 vWorldPosition;
            varying vec3 vLocalPosition;
            varying vec2 vUv;
            float noise(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
            vec3 screenBlend(vec3 base, vec3 layer) {
                return 1.0 - (1.0 - base) * (1.0 - layer);
            }
            vec3 softLightBlend(vec3 base, vec3 layer) {
                vec3 dark = 2.0 * base * layer + base * base * (1.0 - 2.0 * layer);
                vec3 light = sqrt(max(base, vec3(0.0))) * (2.0 * layer - 1.0)
                    + 2.0 * base * (1.0 - layer);
                return mix(dark, light, step(vec3(0.5), layer));
            }
            void main() {
                vec3 normal = normalize(vNormal);
                vec2 lightMinimum = uBoxLightPosition.xy - uBoxLightSize * 0.5;
                vec2 lightMaximum = uBoxLightPosition.xy + uBoxLightSize * 0.5;
                vec2 nearestLightPoint = clamp(vWorldPosition.xy, lightMinimum, lightMaximum);
                vec3 lightDirection = normalize(
                    vec3(nearestLightPoint, uBoxLightPosition.z) - vWorldPosition
                );
                float lightFacing = dot(normal, lightDirection);
                float litBand = smoothstep(-0.12, 0.72, lightFacing);
                float litAmount = clamp(
                    litBand * uBoxLightIntensity * uBoxLightResponse,
                    0.0,
                    1.0
                );
                float textureNoise = (noise(vWorldPosition.xy * 42.0) - 0.5) * uGrain;
                vec4 textureSample = texture2D(uTexture, vUv, uTextureMipBias);
                vec3 textureColor = pow(textureSample.rgb, vec3(2.2));
                float splitAmount = uUseSplitColor
                    * step(0.0, (vLocalPosition.z - uSplitZ) * uSplitDirection);
                vec3 baseColor = mix(uColor, uSplitColor, splitAmount);
                vec3 surfaceColor = mix(baseColor, textureColor, textureSample.a * uUseTexture);
                vec2 surfaceUv = vUv * uSurfaceTextureScale;
                float surfaceCos = cos(uSurfaceTextureRotation);
                float surfaceSin = sin(uSurfaceTextureRotation);
                surfaceUv = mat2(surfaceCos, -surfaceSin, surfaceSin, surfaceCos)
                    * (surfaceUv - 0.5) + 0.5;
                vec3 layerSample = texture2D(uSurfaceTexture, fract(surfaceUv)).rgb;
                layerSample = clamp(
                    (layerSample - uSurfaceTextureContrastPivot) * uSurfaceTextureContrast
                        + uSurfaceTextureContrastPivot,
                    0.0,
                    1.0
                );
                vec3 layerColor = pow(layerSample, vec3(2.2));
                vec3 softLightColor = softLightBlend(surfaceColor, layerColor);
                vec3 screenColor = screenBlend(surfaceColor, layerColor);
                vec3 blendedSurface = mix(softLightColor, screenColor, uSurfaceTextureBlend);
                surfaceColor = mix(
                    surfaceColor,
                    blendedSurface,
                    uUseSurfaceTexture * uSurfaceTextureStrength
                );
                vec3 lightColor = mix(vec3(uAmbientLight), uBoxLightColor, litAmount);
                vec3 color = surfaceColor * (lightColor + uEmissive + textureNoise) * uColorMultiplier;
                
                // --- INTEGRATED ROUNDED BOX SHADOW FIELD ---
                vec2 p = (vUv - 0.5) * 2.0;
                float aspect = 0.82;
                p.x *= aspect;
                
                vec2 b = vec2(aspect, 1.0);
                float r = 0.29;
                
                vec2 q = abs(p) - b + r;
                float dist = min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
                
                float softWidth = max(uSoftEdge, 0.0001);
                float softMask = 1.0 - smoothstep(-0.15, softWidth, dist);
                // -------------------------------------------

                float textureAlpha = mix(1.0, textureSample.a, uUseTexture);
                float alpha = uOpacity * textureAlpha * mix(1.0, softMask, step(0.001, uSoftEdge));

                if (uSoftEdge < 0.1 && alpha < 0.05) {
                    discard;
                }

                gl_FragColor = vec4(pow(color, vec3(1.0 / 2.2)), alpha);
            }
        `);
        const program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
        return program;
    }

    getLocations() {
        const gl = this.gl, program = this.program;
        return {
            position: gl.getAttribLocation(program, 'aPosition'),
            normal: gl.getAttribLocation(program, 'aNormal'),
            uv: gl.getAttribLocation(program, 'aUv'),
            model: gl.getUniformLocation(program, 'uModel'),
            viewProjection: gl.getUniformLocation(program, 'uViewProjection'),
            color: gl.getUniformLocation(program, 'uColor'),
            splitColor: gl.getUniformLocation(program, 'uSplitColor'),
            useSplitColor: gl.getUniformLocation(program, 'uUseSplitColor'),
            splitZ: gl.getUniformLocation(program, 'uSplitZ'),
            splitDirection: gl.getUniformLocation(program, 'uSplitDirection'),
            grain: gl.getUniformLocation(program, 'uGrain'),
            emissive: gl.getUniformLocation(program, 'uEmissive'),
            ambientLight: gl.getUniformLocation(program, 'uAmbientLight'),
            boxLightPosition: gl.getUniformLocation(program, 'uBoxLightPosition'),
            boxLightSize: gl.getUniformLocation(program, 'uBoxLightSize'),
            boxLightColor: gl.getUniformLocation(program, 'uBoxLightColor'),
            boxLightIntensity: gl.getUniformLocation(program, 'uBoxLightIntensity'),
            boxLightResponse: gl.getUniformLocation(program, 'uBoxLightResponse'),
            texture: gl.getUniformLocation(program, 'uTexture'),
            useTexture: gl.getUniformLocation(program, 'uUseTexture'),
            textureMipBias: gl.getUniformLocation(program, 'uTextureMipBias'),
            surfaceTexture: gl.getUniformLocation(program, 'uSurfaceTexture'),
            useSurfaceTexture: gl.getUniformLocation(program, 'uUseSurfaceTexture'),
            surfaceTextureStrength: gl.getUniformLocation(program, 'uSurfaceTextureStrength'),
            surfaceTextureScale: gl.getUniformLocation(program, 'uSurfaceTextureScale'),
            surfaceTextureRotation: gl.getUniformLocation(program, 'uSurfaceTextureRotation'),
            surfaceTextureContrast: gl.getUniformLocation(program, 'uSurfaceTextureContrast'),
            surfaceTextureContrastPivot: gl.getUniformLocation(program, 'uSurfaceTextureContrastPivot'),
            surfaceTextureBlend: gl.getUniformLocation(program, 'uSurfaceTextureBlend'),
            colorMultiplier: gl.getUniformLocation(program, 'uColorMultiplier'),
            opacity: gl.getUniformLocation(program, 'uOpacity'),
            softEdge: gl.getUniformLocation(program, 'uSoftEdge'),
        };
    }

    upload(geometry) {
        if (geometry.gpu) return geometry.gpu;
        const gl = this.gl;
        const createBuffer = (target, data) => {
            const buffer = gl.createBuffer();
            gl.bindBuffer(target, buffer);
            gl.bufferData(target, data, gl.STATIC_DRAW);
            return buffer;
        };
        geometry.gpu = {
            positions: createBuffer(gl.ARRAY_BUFFER, geometry.positions),
            normals: createBuffer(gl.ARRAY_BUFFER, geometry.normals),
            uvs: createBuffer(gl.ARRAY_BUFFER, geometry.uvs),
            indices: createBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.indices),
            count: geometry.indices.length,
        };
        return geometry.gpu;
    }

    getTexture(source, background = null) {
        if (source?.getContext && Number.isFinite(source.width) && Number.isFinite(source.height)) {
            return this.getCanvasTexture(source);
        }

        const url = source;
        const cacheKey = `${url}\n${background || ''}`;
        if (this.textureCache.has(cacheKey)) return this.textureCache.get(cacheKey);
        const gl = this.gl;
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        const record = { texture, ready: false };
        this.textureCache.set(cacheKey, record);
        const image = new Image();
        image.addEventListener('load', () => {
            const raster = document.createElement('canvas');
            raster.width = 512;
            raster.height = 512;
            const context = raster.getContext('2d');
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';
            // Transparent artwork produces dark, weak edges when automatic
            // mipmaps average its RGB against transparent black and the shader
            // subsequently applies that averaged alpha again. Composite decals
            // onto their real surface colour first so every mip level retains
            // correct stroke colour and coverage.
            if (background) {
                context.fillStyle = background;
                context.fillRect(0, 0, raster.width, raster.height);
            }
            context.drawImage(image, 0, 0, raster.width, raster.height);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, raster);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            if (this.anisotropy) {
                const maximum = gl.getParameter(this.anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
                gl.texParameterf(
                    gl.TEXTURE_2D,
                    this.anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,
                    maximum,
                );
            }
            record.ready = true;
            requestAnimationFrame(() => this.onTextureLoad?.());
        });
        image.src = url;
        return record;
    }

    getCanvasTexture(canvas) {
        if (this.textureCache.has(canvas)) {
            const record = this.textureCache.get(canvas);
            this.updateCanvasTexture(record);
            return record;
        }
        const gl = this.gl;
        const texture = gl.createTexture();
        const record = { texture, ready: true, source: canvas };
        this.textureCache.set(canvas, record);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        this.updateCanvasTexture(record);
        return record;
    }

    updateCanvasTexture(record) {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, record.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, record.source);
    }

    resize() {
        const ratio = Math.min(window.devicePixelRatio || 1, this.maxPixelRatio);
        const width = Math.max(1, Math.round(this.canvas.clientWidth * ratio));
        const height = Math.max(1, Math.round(this.canvas.clientHeight * ratio));
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
    }

    render(scene, camera) {
        this.resize();
        const gl = this.gl;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(...this.clearColor);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.useProgram(this.program);
        gl.uniformMatrix4fv(this.locations.viewProjection, false, camera.viewProjection(this.canvas.width / this.canvas.height));
        gl.uniform1f(this.locations.ambientLight, this.ambientLight);
        gl.uniform3f(
            this.locations.boxLightPosition,
            this.boxLight.position.x,
            this.boxLight.position.y,
            this.boxLight.position.z,
        );
        gl.uniform2fv(this.locations.boxLightSize, this.boxLight.size);
        gl.uniform3fv(this.locations.boxLightColor, this.boxLight.color);
        gl.uniform1f(this.locations.boxLightIntensity, this.boxLight.intensity);
        gl.uniform1i(this.locations.texture, 0);
        gl.uniform1i(this.locations.surfaceTexture, 1);
        this.drawNode(scene, Mat4.identity());
    }

    drawNode(node, parentMatrix) {
        if (!node.visible) return;
        const model = Mat4.multiply(parentMatrix, node.localMatrix());
        if (node.geometry && node.material) this.drawMesh(node.geometry, node.material, model);
        for (const child of node.children) this.drawNode(child, model);
    }

    drawMesh(geometry, material, model) {
        const gl = this.gl, gpu = this.upload(geometry);
        const transparent = material.opacity < 1;

        // --- CORRECTED STENCIL CONFIGURATION START ---
        if (material.shadowStencil) {
            gl.enable(gl.STENCIL_TEST);
            gl.stencilFunc(gl.EQUAL, 0, 0xFF);
            // Use gl.INCR instead of gl.REPLACE to write a non-zero value
            gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);
            gl.stencilMask(0xFF);
        }
        // --- CORRECTED STENCIL CONFIGURATION END ---

        if (transparent) {
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.depthMask(false);
        } else {
            gl.disable(gl.BLEND);
            gl.depthMask(true);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, gpu.positions);
        gl.enableVertexAttribArray(this.locations.position);
        gl.vertexAttribPointer(this.locations.position, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, gpu.normals);
        gl.enableVertexAttribArray(this.locations.normal);
        gl.vertexAttribPointer(this.locations.normal, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, gpu.uvs);
        gl.enableVertexAttribArray(this.locations.uv);
        gl.vertexAttribPointer(this.locations.uv, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gpu.indices);
        gl.uniformMatrix4fv(this.locations.model, false, model);
        gl.uniform3fv(this.locations.color, material.color);
        gl.uniform3fv(this.locations.splitColor, material.splitColor);
        gl.uniform1f(this.locations.useSplitColor, material.useSplitColor);
        gl.uniform1f(this.locations.splitZ, material.splitZ);
        gl.uniform1f(this.locations.splitDirection, material.splitDirection);
        gl.uniform1f(this.locations.grain, material.grain);
        gl.uniform1f(this.locations.emissive, material.emissive);
        gl.uniform1f(this.locations.boxLightResponse, material.boxLightResponse);
        const texture = material.texture
            ? this.getTexture(material.texture, material.textureBackground)
            : null;
        const surfaceTexture = material.surfaceTexture
            ? this.getTexture(material.surfaceTexture)
            : null;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture?.texture || null);
        gl.uniform1f(this.locations.useTexture, texture?.ready ? 1 : 0);
        gl.uniform1f(this.locations.textureMipBias, material.textureMipBias);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, surfaceTexture?.texture || null);
        gl.uniform1f(this.locations.useSurfaceTexture, surfaceTexture?.ready ? 1 : 0);
        gl.uniform1f(this.locations.surfaceTextureStrength, material.surfaceTextureStrength);
        gl.uniform2fv(this.locations.surfaceTextureScale, material.surfaceTextureScale);
        gl.uniform1f(this.locations.surfaceTextureRotation, material.surfaceTextureRotation);
        gl.uniform1f(this.locations.surfaceTextureContrast, material.surfaceTextureContrast);
        gl.uniform1f(this.locations.surfaceTextureContrastPivot, material.surfaceTextureContrastPivot);
        gl.uniform1f(this.locations.surfaceTextureBlend, material.surfaceTextureBlend);
        gl.uniform1f(this.locations.colorMultiplier, material.colorMultiplier);
        gl.uniform1f(this.locations.opacity, material.opacity);
        gl.uniform1f(this.locations.softEdge, material.softEdge);
        gl.drawElements(gl.TRIANGLES, gpu.count, gl.UNSIGNED_SHORT, 0);
        if (transparent) gl.depthMask(true);

        // --- STENCIL CLEANUP START ---
        if (material.shadowStencil) {
            gl.disable(gl.STENCIL_TEST);
        }
        // --- STENCIL CLEANUP END ---
    }
}
