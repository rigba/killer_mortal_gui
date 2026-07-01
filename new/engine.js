import {
    Geometry,
    Material,
    Node,
    PerspectiveCamera,
    Scene,
    Vec3,
    WebGLRenderer,
} from './engine-core.js?v=58';

const canvas = document.querySelector('#table-canvas');
const decalCanvas = document.querySelector('#decal-canvas');
const decalContext = decalCanvas.getContext('2d');
const compassCanvas = document.querySelector('#compass-canvas');
const compassContext = compassCanvas.getContext('2d');
const beginOverlay = document.querySelector('#begin-overlay');
const beginButton = document.querySelector('#begin-button');
const doraIndicatorsElement = document.querySelector('#dora-indicators');
const zoomInput = document.querySelector('#camera-zoom');
const zoomOutput = document.querySelector('#camera-zoom-value');
const angleInput = document.querySelector('#camera-angle');
const angleOutput = document.querySelector('#camera-angle-value');
const tableWorldZInput = document.querySelector('#table-world-z');
const tableWorldZOutput = document.querySelector('#table-world-z-value');
const topViewInput = document.querySelector('#top-view');
const previousRoundButton = document.querySelector('#previous-round');
const nextRoundButton = document.querySelector('#next-round');
const roundPositionOutput = document.querySelector('#round-position');
const previousTurnButton = document.querySelector('#previous-turn');
const nextTurnButton = document.querySelector('#next-turn');
const turnPositionOutput = document.querySelector('#turn-position');
const navPreviousRoundButton = document.querySelector('#nav-previous-round');
const navNextRoundButton = document.querySelector('#nav-next-round');
const navRoundLabel = document.querySelector('#nav-round-label');
const navPreviousTurnButton = document.querySelector('#nav-previous-turn');
const navNextTurnButton = document.querySelector('#nav-next-turn');
const navTurnLabel = document.querySelector('#nav-turn-label');
const navPreviousAiReviewButton = document.querySelector('#nav-previous-ai-review');
const navNextAiReviewButton = document.querySelector('#nav-next-ai-review');
const aiReviewSettingsToggle = document.querySelector('#ai-review-settings-toggle');
const aiReviewSettings = document.querySelector('#ai-review-settings');
const appSettingsToggle = document.querySelector('#app-settings-toggle');
const appSettings = document.querySelector('#app-settings');
const dealInModeSelect = document.querySelector('#setting-dealin-mode');
const aiScoreModeSelect = document.querySelector('#setting-ai-score-mode');
const maxAiSuggestionsInput = document.querySelector('#setting-max-ai-suggestions');
const diffToleranceInput = document.querySelector('#setting-diff-tolerance');
const sfxVolumeInput = document.querySelector('#setting-sfx-volume');
const sfxVolumeOutput = document.querySelector('#setting-sfx-volume-value');
const navigationReplayDelayInput = document.querySelector('#setting-navigation-replay-delay');
const navigationReplayDelayOutput = document.querySelector('#setting-navigation-replay-delay-value');
const userNavDock = document.querySelector('.user-nav-dock');
const seatMarkers = document.querySelector('.seat-markers');
const heroSeatRoundGrade = document.querySelector('#hero-seat-round-grade');
const heroSeatOverallGrade = document.querySelector('#hero-seat-overall-grade');
const heroTilePrototype = document.querySelector('#hero-tile-prototype');
const heroHand = document.querySelector('#hero-hand');
const actionDecision = document.querySelector('#action-decision');
const actionDecisionOptions = document.querySelector('#action-decision-options');
const roundResultOverlay = document.querySelector('#round-result-overlay');
const roundResultTitle = document.querySelector('#round-result-title');
const roundResultClose = document.querySelector('#round-result-close');
const roundResultRanking = document.querySelector('#round-result-ranking');
const roundResultDetails = document.querySelector('#round-result-details');
const HUD_DESIGN_WIDTH = 1600;
const MAX_AI_SUGGESTIONS_LIMIT = 14;
const ROUND_RESULT_DELAY_MS = 250;
const DEFAULT_SFX_VOLUME = 50;
const SFX_VOLUME_STORAGE_KEY = 'killer-mortal-sfx-volume';
const DEFAULT_NAVIGATION_REPLAY_DELAY_MS = 0;
const MAX_NAVIGATION_REPLAY_DELAY_MS = 250;
const NAVIGATION_REPLAY_DELAY_STORAGE_KEY = 'killer-mortal-navigation-replay-delay';
const ENGINE_DEBUG_VERSION = 'grade-full-details-v58';
const GRADE_DEBUG = false;
const SFX_SOURCES = {
    chi: '/media/sfx/chii_f.mp3',
    pon: '/media/sfx/pon_f.mp3',
    kan: '/media/sfx/kan_f.mp3',
    reach: '/media/sfx/riichi_f.mp3',
    ron: '/media/sfx/ron_f.mp3',
    tsumo: '/media/sfx/tsumo_f.mp3',
};
const TILE_PLACEMENT_SOURCES = [
    '/media/sfx/tile_discard_1.mp3',
    '/media/sfx/tile_discard_2.mp3',
    '/media/sfx/tile_discard_3.mp3',
];
const AUDIO_SOURCES = [
    ...Object.values(SFX_SOURCES),
    ...TILE_PLACEMENT_SOURCES,
];
let aiReviewDeltaThreshold = .05;
let maxAiSuggestions = 4;
let dealInMode = 'hover';
let aiScoreMode = 'always';
let sfxVolume = storedSfxVolume();
let navigationReplayDelay = storedNavigationReplayDelay();
let selectedTurnIdentity = '0:0';
let navigationReplayTimer = null;
let navigationReplayToken = 0;
let roundResultTimer = null;
let roundResultVisible = false;
let roundResultPending = false;
let pendingRoundResultKey = '';
let lastShownRoundResultKey = '';
let audioWarmupStarted = false;
let audioContext = null;
const audioBuffers = new Map();
const audioBufferPromises = new Map();
const loggedGradeDebugKeys = new Set();
const TABLE_SIZE_SCALE = 1.1;
const TILE_SIZE_SCALE = .90;
const HUD_TILE_SIZE_SCALE = .9;
const TILE_MARBLE_DEPTH = .18;
const TILE_BACK_DEPTH = .075;
const TILE_DEPTH = TILE_MARBLE_DEPTH + TILE_BACK_DEPTH;
const TILE_BACK_SPLIT_Z = .5 - TILE_BACK_DEPTH / TILE_DEPTH;
const TILE_SHADOW_Z = .158;
const TILE_SHADOW_LIGHT_SCALE = 1.05;
const TILE_SHADOW_MAX_SCALE = .075;
const TILE_SHADOW_UPRIGHT_MAX_SCALE = .012;
const TILE_SHADOW_FLAT_WIDTH = .53;
const TILE_SHADOW_FLAT_HEIGHT = .64;
const TILE_SHADOW_UPRIGHT_WIDTH = .48;
const TILE_SHADOW_UPRIGHT_DEPTH = .37;
// Manual upright hand shadow tuning in tile-local space.
// Y moves side-player shadows inward/outward relative to the table edge:
// positive pulls left/right lord shadows back under the tile from the rail side.
// X moves shadows along each player's hand row; because left/right hands face
// opposite directions, use the per-side X constants below if only one side is off.
const TILE_SHADOW_UPRIGHT_OFFSET_Y = -0.085;
const TILE_SHADOW_UPRIGHT_RIGHT_OFFSET_X = 0.045;
const TILE_SHADOW_UPRIGHT_LEFT_OFFSET_X = -0.025;
const TILE_SHADOW_UPRIGHT_TOP_OFFSET_X = 0;
const COMPASS_HALF_SIZE = 1.325 * .95 * .95;
const COMPASS_TEXTURE_HALF_SIZE = 1.75;
const COMPASS_TABLE_Z = .152;
const COMPASS_RIICHI_BAR_TUNING = {
    // Compass-local units from the centre: higher moves every riichi bar outward.
    distanceFromCentre: .95,
    // Size values are in source canvas pixels.
    width: 320,
    height: 27,
    depth: 9,
    fillColor: '#ffffff',
    dotRadius: 10,
    dotDepth: 0.1,
    dotColor: '#db454b',
};
const DANGER_WEIGHTS = {
    ryanmen: 3.5,
    honorTankiShanpon: 1.7,
    nonHonorTankiShanpon: 1.0,
    kanchan: .21,
    kanchanRiichiSujiTrap: 2.6,
    uraSuji: 1.3,
    matagiSujiEarly: .6,
    matagiSujiRiichi: 1.2,
    doraGreed: 1.2,
    akaDiscard: .14,
};

console.log(`[Killer Mortal] loaded ${ENGINE_DEBUG_VERSION}`);

const renderer = new WebGLRenderer(canvas);
const camera = new PerspectiveCamera({ fov: 35.49, near: 0.05, far: 250 });
const scene = new Scene();
const boxGeometry = Geometry.box();
const tileGeometry = Geometry.roundedBoxEdges(.05, 4);
const tileFaceGeometry = Geometry.plane();
const tileShadowGeometry = Geometry.plane();
const riichiStickGeometry = Geometry.box();
const riichiDotGeometry = Geometry.cylinder(40);
const TABLE_POSITION = new Vec3(0, -2.4, 5.2);
const MAT_CENTRE_LOCAL = new Vec3(0, .2, .1);
let tableWorldZ = TABLE_POSITION.z;

// Material values intended for visual hand-tuning. Higher textureScale values
// make the pattern repeat more often, so the visible texture appears smaller.
const MATERIAL_TUNING = {
    rails: {
        color: '#150300',
        textureScale: [1, 1],
        textureStrength: .78,
        textureContrast: .15,
        textureContrastPivot: .1,
    },
    felt: {
        color: '#143669',
        textureScale: [3, 3],
        textureStrength: .2,
    },
};

const railTexture = {
    surfaceTexture: '/media/textures/walnut-3200-mm-architextures.jpg',
    surfaceTextureStrength: MATERIAL_TUNING.rails.textureStrength,
    surfaceTextureScale: MATERIAL_TUNING.rails.textureScale,
    surfaceTextureContrast: MATERIAL_TUNING.rails.textureContrast,
    surfaceTextureContrastPivot: MATERIAL_TUNING.rails.textureContrastPivot,
    surfaceTextureBlend: 'screen',
};

const materials = {
    wood: new Material(MATERIAL_TUNING.rails.color, railTexture),
    woodVertical: new Material(MATERIAL_TUNING.rails.color, {
        ...railTexture,
        surfaceTextureRotation: Math.PI / 2,
    }),
    feltBase: new Material('#160b09', { boxLightResponse: 0.12 }),
    felt: new Material(MATERIAL_TUNING.felt.color, {
        boxLightResponse: 0.52,
        surfaceTexture: '/media/textures/felt-500-mm-architextures.jpg',
        surfaceTextureStrength: MATERIAL_TUNING.felt.textureStrength,
        surfaceTextureScale: MATERIAL_TUNING.felt.textureScale,
        surfaceTextureBlend: 'soft-light',
    }),
    tileFaceUp: new Material('#f3f2ed', {
        grain: .012,
        splitColor: '#ff9d28',
        splitZ: -TILE_BACK_SPLIT_Z,
        splitDirection: -1,
    }),
    tileFaceDown: new Material('#f3f2ed', {
        grain: .012,
        splitColor: '#ff9d28',
        splitZ: TILE_BACK_SPLIT_Z,
        splitDirection: 1,
    }),
    tileFaceUpHovered: new Material('#f3f2ed', {
        grain: .012,
        splitColor: '#ff9d28',
        splitZ: -TILE_BACK_SPLIT_Z,
        splitDirection: -1,
        colorMultiplier: .45,
    }),
    tileShadowCore: new Material('#030406', {
        opacity: .2,        // The main shadow body
        softEdge: .001,       // Tighter edge to hide the stencil cut
        boxLightResponse: 0,
        shadowStencil: true, // Use stencil to prevent core overlap
    }),
    tileShadowGlow: new Material('#030406', {
        opacity: 0,        // Extremely faint outer glow
        softEdge: 0.05,       // Very wide, soft fade
        boxLightResponse: 0,
        shadowStencil: false, // No stencil, blends smoothly
    }),
};

function box(parent, size, position, material) {
    const node = new Node({ geometry: boxGeometry, material });
    node.scale = new Vec3(...size);
    node.position = new Vec3(...position);
    parent.add(node);
    return node;
}

function createTable() {
    const table = new Node();
    table.position = new Vec3(
        TABLE_POSITION.x,
        TABLE_Y_POSITION,
        TABLE_POSITION.z,
    );
    table.scale = new Vec3(TABLE_SIZE_SCALE, TABLE_SIZE_SCALE, 1);
    scene.add(table);

    box(table, [10.78, 10.78, .12], [0, .2, .01], materials.feltBase);
    box(table, [10.18, 10.18, .10], [0, .2, .10], materials.felt);

    box(table, [11.8, .78, .48], [0, -5.31, .19], materials.wood);
    box(table, [11.8, .78, .48], [0, 5.71, .19], materials.wood);
    box(table, [.78, 10.24, .48], [-5.51, .2, .19], materials.woodVertical);
    box(table, [.78, 10.24, .48], [5.51, .2, .19], materials.woodVertical);

    return table;
}

function createTile(parent, tile, position, {
    rotation = 0,
    faceDown = false,
    standUpright = false,
    darkened = false,
    castShadow = true,
    shadowSide = 'flat',
} = {}) {
    if (castShadow) createTileShadow(parent, position, { rotation, standUpright, shadowSide });

    const tileNode = new Node();
    tileNode.position = new Vec3(...position);
    tileNode.rotation.x = standUpright ? Math.PI / 2 : 0;
    tileNode.rotation.z = rotation;
    tileNode.scale = new Vec3(TILE_SIZE_SCALE, TILE_SIZE_SCALE, TILE_SIZE_SCALE);
    parent.add(tileNode);

    const tileMesh = new Node({
        geometry: tileGeometry,
        material: faceDown
            ? materials.tileFaceDown
            : darkened
                ? materials.tileFaceUpHovered
                : materials.tileFaceUp,
    });
    tileMesh.scale = new Vec3(.423, .585, TILE_DEPTH);
    tileMesh.position.z = TILE_DEPTH / 2;
    tileNode.add(tileMesh);

    if (!faceDown) {
        const faceMaterial = new Material('#f3f2ed', {
            texture: `/media/Regular_shortnames/${tileAssetName(tile)}.svg`,
            textureBackground: '#f3f2ed',
            textureMipBias: -.4,
            colorMultiplier: darkened ? .45 : 1,
        });
        const face = new Node({ geometry: tileFaceGeometry, material: faceMaterial });
        // Match the 2D HUD face's 6px horizontal and 8px vertical padding.
        face.scale = new Vec3(.423 * 59 / 71, .585 * 84 / 100, 1);
        face.position.z = TILE_DEPTH + .001;
        tileNode.add(face);
    }
    return tileNode;
}

function createTileShadow(parent, position, {
    rotation = 0,
    standUpright = false,
    shadowSide = 'flat',
} = {}) {
    const lightLocal = renderer.boxLight.position.sub(parent.position);
    const heightAboveTable = standUpright
        ? .585 * TILE_SIZE_SCALE
        : TILE_DEPTH * TILE_SIZE_SCALE;
    const casterZ = standUpright
        ? position[2]
        : position[2] + heightAboveTable * 0;
    const contactOffset = standUpright
        ? uprightShadowManualOffset(rotation, shadowSide)
        : [0, 0];
    const casterX = position[0] + contactOffset[0];
    const casterY = position[1] + contactOffset[1];
    const lightX = clamp(
        casterX,
        lightLocal.x - renderer.boxLight.size[0] * .5,
        lightLocal.x + renderer.boxLight.size[0] * .5,
    );
    const lightY = clamp(
        casterY,
        lightLocal.y - renderer.boxLight.size[1] * .5,
        lightLocal.y + renderer.boxLight.size[1] * .5,
    );
    const shadowOffsetScale = Math.min(
        standUpright ? TILE_SHADOW_UPRIGHT_MAX_SCALE : TILE_SHADOW_MAX_SCALE,
        Math.max(0, casterZ - TILE_SHADOW_Z)
            / Math.max(.1, lightLocal.z - casterZ)
            * TILE_SHADOW_LIGHT_SCALE,
    );
    const offsetX = (casterX - lightX) * shadowOffsetScale;
    const offsetY = (casterY - lightY) * shadowOffsetScale;

    const shadowScale = standUpright
        ? new Vec3(
            TILE_SHADOW_UPRIGHT_WIDTH,
            TILE_SHADOW_UPRIGHT_DEPTH + shadowOffsetScale * .45,
            1,
        )
        : new Vec3(
            TILE_SHADOW_FLAT_WIDTH + shadowOffsetScale * .2,
            TILE_SHADOW_FLAT_HEIGHT + shadowOffsetScale * .28,
            1,
        );

    // Pass 1: Render the faint, wide, unclipped outer glow (stencil disabled)
    const glowShadow = new Node({ geometry: tileShadowGeometry, material: materials.tileShadowGlow });
    glowShadow.position = new Vec3(
        casterX + offsetX,
        casterY + offsetY,
        TILE_SHADOW_Z,
    );
    glowShadow.rotation.z = rotation;
    glowShadow.scale = shadowScale;
    parent.add(glowShadow);

    // Pass 2: Render the darker, tight, inner core (stencil enabled, Z raised by 0.001)
    const coreShadow = new Node({ geometry: tileShadowGeometry, material: materials.tileShadowCore });
    coreShadow.position = new Vec3(
        casterX + offsetX,
        casterY + offsetY,
        TILE_SHADOW_Z + 0.001,
    );
    coreShadow.rotation.z = rotation;
    coreShadow.scale = shadowScale;
    parent.add(coreShadow);

    return coreShadow;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function uprightShadowManualOffset(rotation, shadowSide) {
    const localX = shadowSide === 'right'
        ? TILE_SHADOW_UPRIGHT_RIGHT_OFFSET_X
        : shadowSide === 'left'
            ? TILE_SHADOW_UPRIGHT_LEFT_OFFSET_X
            : TILE_SHADOW_UPRIGHT_TOP_OFFSET_X;
    const localY = TILE_SHADOW_UPRIGHT_OFFSET_Y;
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);
    return [
        localX * cosine - localY * sine,
        localX * sine + localY * cosine,
    ];
}

const TABLE_Y_POSITION = TABLE_POSITION.y + MAT_CENTRE_LOCAL.y * (1 - TABLE_SIZE_SCALE);

function createDiscardLayer() {
    const layer = new Node();
    layer.position = new Vec3(TABLE_POSITION.x, TABLE_Y_POSITION, TABLE_POSITION.z);
    scene.add(layer);
    return layer;
}

function createTableOverlayLayer() {
    const layer = new Node();
    layer.position = new Vec3(TABLE_POSITION.x, TABLE_POSITION.y, TABLE_POSITION.z);
    scene.add(layer);
    return layer;
}

const tableNode = createTable();
const compassSurface = new Node({
    geometry: tileFaceGeometry,
    material: new Material('#17233a', {
        texture: compassCanvas,
        boxLightResponse: .52,
        opacity: .999,
    }),
});
compassSurface.position = new Vec3(
    TABLE_POSITION.x,
    TABLE_POSITION.y + MAT_CENTRE_LOCAL.y,
    TABLE_POSITION.z + COMPASS_TABLE_Z,
);
compassSurface.scale = new Vec3(COMPASS_HALF_SIZE * 2, COMPASS_HALF_SIZE * 2, 1);
scene.add(compassSurface);
renderer.onTextureLoad = render;
const matCentre = TABLE_POSITION.add(MAT_CENTRE_LOCAL);
renderer.boxLight.position = matCentre.add(new Vec3(0, 6, 12));

const topViewDistance = 18.92;
const defaultAngle = 56 * Math.PI / 180;
const defaultCameraPosition = new Vec3(
    0,
    -Math.cos(defaultAngle) * topViewDistance,
    Math.sin(defaultAngle) * topViewDistance,
);
const defaultOrbitOffset = defaultCameraPosition.sub(matCentre);
const cameraOrbitRadius = defaultOrbitOffset.length();
const baseFov = 35.49 * Math.PI / 180;

const defaultRound = {
    bakaze: 'E', kyoku: 1, honba: 0, kyotaku: 0, oya: 0,
    scores: [25000, 25000, 25000, 25000], remainingTiles: 70,
};
let round = defaultRound;
let rounds = [defaultRound];
let roundIndex = 0;
let turnIndex = 0;
let heroPlayer = 0;
let startingDealer = 0;

const WINDS = ['E', 'S', 'W', 'N'];
const HONOR_ASSET_NAMES = { E: '1z', S: '2z', W: '3z', N: '4z', P: '5z', F: '6z', C: '7z' };
const TILE_CODE_NAMES = {
    41: 'E',
    42: 'S',
    43: 'W',
    44: 'N',
    45: 'P',
    46: 'F',
    47: 'C',
};
const TILE_FACE_ASSET_NAMES = [
    ...['m', 'p', 's'].flatMap(suit => ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(number => `${number}${suit}`)),
    '1z', '2z', '3z', '4z', '5z', '6z', '7z',
];
const preloadedTileFaceImages = [];
let renderedHeroHandKey = '';
let hoveredHeroTileKind = null;

function tileAssetName(tile) {
    if (HONOR_ASSET_NAMES[tile]) return HONOR_ASSET_NAMES[tile];
    const match = /^(\d)([mps])(r)?$/.exec(tile);
    if (!match) return 'Blank';
    const [, number, suit, red] = match;
    return `${red ? '0' : number}${suit}`;
}

function tileKind(tile) {
    return typeof tile === 'string' ? tile.replace(/r$/, '') : '';
}

function preloadTileFaceImages() {
    if (preloadedTileFaceImages.length) return;
    for (const assetName of TILE_FACE_ASSET_NAMES) {
        const image = new Image();
        image.loading = 'eager';
        image.decoding = 'sync';
        image.src = `/media/Regular_shortnames/${assetName}.svg`;
        preloadedTileFaceImages.push(image);
    }
}

const discardLayer = createDiscardLayer();
const opponentHandLayer = createDiscardLayer();
const meldLayer = createDiscardLayer();
const riichiMarkerLayer = createTableOverlayLayer();

const DISCARD_COLUMN_SPACING = .43 * TILE_SIZE_SCALE;
const DISCARD_TILE_GAP = (.43 - .423) * TILE_SIZE_SCALE;
const DISCARD_ROW_SPACING = .585 * TILE_SIZE_SCALE + DISCARD_TILE_GAP;
const DISCARD_INNER_EDGE = 1.62;
const PENDING_DISCARD_OFFSET = .09;
let renderedDiscardsKey = '';
let renderedMeldsKey = '';

// World-space positions of all hoverable face-up tiles on the board.
// Rebuilt each time discards or melds re-render.
let visibleTileNodes = [];
let renderedRiichiMarkersKey = '';

function compassPixelsToLocalUnits(value) {
    return value / compassCanvas.width * COMPASS_TEXTURE_HALF_SIZE * 2;
}

function riichiMarkerTransforms() {
    const centreY = MAT_CENTRE_LOCAL.y;
    const distance = COMPASS_RIICHI_BAR_TUNING.distanceFromCentre;
    return [
        { x: 0, y: centreY - distance, rotation: 0 },
        { x: distance, y: centreY, rotation: -Math.PI / 2 },
        { x: 0, y: centreY + distance, rotation: Math.PI },
        { x: -distance, y: centreY, rotation: Math.PI / 2 },
    ];
}

function createRiichiMarker({ x, y, rotation }) {
    const tuning = COMPASS_RIICHI_BAR_TUNING;
    const width = compassPixelsToLocalUnits(tuning.width);
    const height = compassPixelsToLocalUnits(tuning.height);
    const depth = compassPixelsToLocalUnits(tuning.depth);
    const dotDiameter = compassPixelsToLocalUnits(tuning.dotRadius * 2);
    const dotDepth = compassPixelsToLocalUnits(tuning.dotDepth);
    const baseZ = COMPASS_TABLE_Z + .02;

    const marker = new Node();
    marker.position = new Vec3(x, y, baseZ);
    marker.rotation.z = rotation;
    riichiMarkerLayer.add(marker);

    const stick = new Node({
        geometry: riichiStickGeometry,
        material: new Material(tuning.fillColor, {
            grain: .006,
            boxLightResponse: .74,
        }),
    });
    stick.scale = new Vec3(width, height, depth);
    stick.position.z = depth / 2;
    marker.add(stick);

    const dot = new Node({
        geometry: riichiDotGeometry,
        material: new Material(tuning.dotColor, {
            grain: .004,
            boxLightResponse: .82,
        }),
    });
    dot.scale = new Vec3(dotDiameter, dotDiameter, dotDepth);
    dot.position.z = depth + dotDepth / 2 + .002;
    marker.add(dot);
}

function renderRiichiMarkers() {
    const riichiDiscardIndices = Array.isArray(round.riichiDiscardIndices)
        ? round.riichiDiscardIndices
        : [null, null, null, null];
    const key = `${roundIndex}:${turnIndex}:${heroPlayer}:${riichiDiscardIndices.join(',')}`;
    if (key === renderedRiichiMarkersKey) return;
    renderedRiichiMarkersKey = key;
    riichiMarkerLayer.children = [];
    riichiMarkerTransforms().forEach((transform, relativeSeat) => {
        const actor = (heroPlayer + relativeSeat) % 4;
        if (Number.isInteger(riichiDiscardIndices[actor])) createRiichiMarker(transform);
    });
}

function discardTransform(relativeSeat, index, acrossAdjustment = 0) {
    const column = index % 6;
    const row = Math.floor(index / 6);
    
    // Kept at tight, unscaled spacing
    const acrossRow = (column - 2.5) * DISCARD_COLUMN_SPACING + acrossAdjustment;
    const outward = DISCARD_INNER_EDGE + row * DISCARD_ROW_SPACING;
    const centreY = MAT_CENTRE_LOCAL.y;
    
    if (relativeSeat === 0) return { position: [acrossRow, centreY - outward, .17], rotation: 0 };
    if (relativeSeat === 1) return { position: [outward, centreY + acrossRow, .17], rotation: Math.PI / 2 };
    if (relativeSeat === 2) return { position: [-acrossRow, centreY + outward, .17], rotation: Math.PI };
    return { position: [-outward, centreY - acrossRow, .17], rotation: -Math.PI / 2 };
}

function rebuildVisibleTileNodes() {
    // Called after both discards and melds have re-rendered so the array is
    // always complete. Positions are stored in world space.
    visibleTileNodes = [];

    // Discard tiles (layer offset not yet baked into transform.position)
    const discards = Array.isArray(round.discards) ? round.discards : [[], [], [], []];
    const riichiDiscardIndices = Array.isArray(round.riichiDiscardIndices)
        ? round.riichiDiscardIndices : [null, null, null, null];
    discards.forEach((tiles, actor) => {
        const relativeSeat = (actor - heroPlayer + 4) % 4;
        const riichiIndex = riichiDiscardIndices[actor];
        const riichiWidthDifference = (.585 - .423) * TILE_SIZE_SCALE;
        tiles.forEach((tile, index) => {
            const sharesRiichiRow = Number.isInteger(riichiIndex)
                && Math.floor(index / 6) === Math.floor(riichiIndex / 6);
            const acrossAdjustment = !sharesRiichiRow || index < riichiIndex
                ? 0
                : index === riichiIndex
                    ? riichiWidthDifference / 2
                    : riichiWidthDifference;
            const transform = discardTransform(relativeSeat, index, acrossAdjustment);
            visibleTileNodes.push({
                kind: tileKind(tile),
                // Bake layer offset into world position
                wx: transform.position[0] + discardLayer.position.x,
                wy: transform.position[1] + discardLayer.position.y,
                wz: transform.position[2] + discardLayer.position.z + TILE_DEPTH * TILE_SIZE_SCALE,
            });
        });
    });

    // Meld tiles (face-up only; layer offset baked in)
    const melds = Array.isArray(round.melds) ? round.melds : [[], [], [], []];
    melds.forEach((playerMelds, actor) => {
        const relativeSeat = (actor - heroPlayer + 4) % 4;
        const basis = meldSeatBasis(relativeSeat);
        let cursor = 0;
        playerMelds.forEach(meld => {
            const items = meldTiles(meld);
            items.forEach(item => {
                const width = (item.rotated ? .585 : .423) * TILE_SIZE_SCALE;
                const distance = cursor + width / 2;
                let px = basis.corner[0] + basis.inward[0] * distance;
                let py = basis.corner[1] + basis.inward[1] * distance;
                if (item.rotated) {
                    const shiftDist = ((0.585 - 0.423) / 2) * TILE_SIZE_SCALE;
                    px += Math.sin(basis.rotation) * shiftDist;
                    py -= Math.cos(basis.rotation) * shiftDist;
                }
                if (!item.faceDown) {
                    visibleTileNodes.push({
                        kind: tileKind(item.tile),
                        wx: px + meldLayer.position.x,
                        wy: py + meldLayer.position.y,
                        wz: MELD_BASE_Z + meldLayer.position.z + TILE_DEPTH * TILE_SIZE_SCALE,
                    });
                }
                if (item.frontTile) {
                    const frontPosition = frontMeldTilePosition([px, py, MELD_BASE_Z], basis.rotation);
                    visibleTileNodes.push({
                        kind: tileKind(item.frontTile),
                        wx: frontPosition[0] + meldLayer.position.x,
                        wy: frontPosition[1] + meldLayer.position.y,
                        wz: MELD_BASE_Z + meldLayer.position.z + TILE_DEPTH * TILE_SIZE_SCALE,
                    });
                }
                cursor += width + MELD_TILE_GAP;
            });
            cursor += MELD_GROUP_GAP - MELD_TILE_GAP;
        });
    });
}

function renderDiscards() {
    const discards = Array.isArray(round.discards)
        ? round.discards
        : [[], [], [], []];
    const riichiDiscardIndices = Array.isArray(round.riichiDiscardIndices)
        ? round.riichiDiscardIndices
        : [null, null, null, null];
    const pendingDiscard = round.actionDecision?.trigger;
    const key = `${roundIndex}:${turnIndex}:${heroPlayer}:${hoveredHeroTileKind || ''}:${JSON.stringify(pendingDiscard)}:${riichiDiscardIndices.join(',')}:${discards.map(tiles => tiles.join(',')).join('|')}`;
    if (key === renderedDiscardsKey) return;
    renderedDiscardsKey = key;
    discardLayer.children = [];
    discards.forEach((tiles, actor) => {
        const relativeSeat = (actor - heroPlayer + 4) % 4;
        const riichiIndex = riichiDiscardIndices[actor];
        const riichiWidthDifference = (.585 - .423) * TILE_SIZE_SCALE;
        tiles.forEach((tile, index) => {
            const sharesRiichiRow = Number.isInteger(riichiIndex)
                && Math.floor(index / 6) === Math.floor(riichiIndex / 6);
            const acrossAdjustment = !sharesRiichiRow || index < riichiIndex
                ? 0
                : index === riichiIndex
                    ? riichiWidthDifference / 2
                    : riichiWidthDifference;
            const transform = discardTransform(relativeSeat, index, acrossAdjustment);
            if (
                actor === pendingDiscard?.actor
                && index === tiles.length - 1
                && sameTileKind(tile, pendingDiscard.pai)
            ) {
                // Hold the triggering discard just short of its settled
                // position in the pool's own row/outward basis. Both axes use
                // the same distance so the diagonal is even.
                const alongRow = PENDING_DISCARD_OFFSET;
                const outward = -PENDING_DISCARD_OFFSET;
                const cosine = Math.cos(transform.rotation);
                const sine = Math.sin(transform.rotation);
                transform.position[0] += alongRow * cosine - outward * sine;
                transform.position[1] += alongRow * sine + outward * cosine;
            }
            const riichiRotation = index === riichiDiscardIndices[actor] ? Math.PI / 2 : 0;
            createTile(discardLayer, tile, transform.position, {
                rotation: transform.rotation + riichiRotation,
                darkened: tileKind(tile) === hoveredHeroTileKind,
            });
        });
    });
}

const HAND_TILE_SPACING = .43 * TILE_SIZE_SCALE;
const HAND_PLAYER_LEFT_SHIFT = HAND_TILE_SPACING * 1.5;
const HAND_LEFT_ANCHOR = HAND_TILE_SPACING * 6 + HAND_PLAYER_LEFT_SHIFT;
const HAND_EDGE = 4.55 * TABLE_SIZE_SCALE - .423 * TILE_SIZE_SCALE;
const HAND_DRAW_GAP = .16;
const HAND_STANDING_CENTRE_Z = .15 + .585 * TILE_SIZE_SCALE / 2;
let renderedOpponentHandsKey = '';

function opponentHandTransform(relativeSeat, index, extraOffset = 0) {
    const offset = index * HAND_TILE_SPACING + extraOffset;
    const centreY = MAT_CENTRE_LOCAL.y;
    if (relativeSeat === 1) {
        return {
            position: [HAND_EDGE, centreY - HAND_LEFT_ANCHOR + offset, HAND_STANDING_CENTRE_Z],
            rotation: Math.PI / 2,
        };
    }
    if (relativeSeat === 2) {
        return {
            position: [HAND_LEFT_ANCHOR - offset, centreY + HAND_EDGE, HAND_STANDING_CENTRE_Z],
            rotation: Math.PI,
        };
    }
    return {
        position: [-HAND_EDGE, centreY + HAND_LEFT_ANCHOR - offset, HAND_STANDING_CENTRE_Z],
        rotation: -Math.PI / 2,
    };
}

function renderOpponentHands() {
    const hands = Array.isArray(round.tehais) ? round.tehais : [[], [], [], []];
    const drawnTiles = Array.isArray(round.drawnTiles) ? round.drawnTiles : [];
    const key = `${roundIndex}:${turnIndex}:${heroPlayer}:${hands.map((tiles, actor) => (
        `${tiles.join(',')};${drawnTiles[actor] || ''}`
    )).join('|')}`;
    if (key === renderedOpponentHandsKey) return;
    renderedOpponentHandsKey = key;
    opponentHandLayer.children = [];
    for (let relativeSeat = 1; relativeSeat <= 3; relativeSeat++) {
        const actor = (heroPlayer + relativeSeat) % 4;
        const tiles = [...(hands[actor] || [])]
            .sort((a, b) => tileSortValue(a) - tileSortValue(b));
        tiles.forEach((tile, index) => {
            const transform = opponentHandTransform(relativeSeat, index);
            createTile(opponentHandLayer, tile, transform.position, {
                rotation: transform.rotation,
                standUpright: true,
                shadowSide: relativeSeat === 1 ? 'right' : relativeSeat === 3 ? 'left' : 'top',
            });
        });
        const drawnTile = drawnTiles[actor];
        if (drawnTile) {
            const transform = opponentHandTransform(relativeSeat, tiles.length, HAND_DRAW_GAP);
            createTile(opponentHandLayer, drawnTile, transform.position, {
                rotation: transform.rotation,
                standUpright: true,
                shadowSide: relativeSeat === 1 ? 'right' : relativeSeat === 3 ? 'left' : 'top',
            });
        }
    }
}

// Meld layout tuning. MELD_EDGE_DISTANCE controls how far each group sits
// toward its player's table edge; MELD_RIGHT_CORNER_DISTANCE moves it along
// that edge toward the player's right corner. Reduce either value to move the
// melds toward the table centre. The two gap values control tile/group spacing.
const MELD_EDGE_DISTANCE = 4.6;
const MELD_RIGHT_CORNER_DISTANCE = 4;
const MELD_TILE_GAP = .018;
const MELD_GROUP_GAP = 0.1;
const MELD_BASE_Z = .17;
const MELD_FRONT_TILE_OFFSET = (.423 + MELD_TILE_GAP) * TILE_SIZE_SCALE;

function cloneMelds(melds) {
    return melds.map(playerMelds => playerMelds.map(meld => ({
        ...meld,
        consumed: [...(meld.consumed || [])],
    })));
}

function meldSeatBasis(relativeSeat) {
    const centreY = MAT_CENTRE_LOCAL.y;
    if (relativeSeat === 0) return {
        corner: [MELD_RIGHT_CORNER_DISTANCE, centreY - MELD_EDGE_DISTANCE],
        inward: [-1, 0],
        rotation: 0,
    };
    if (relativeSeat === 1) return {
        corner: [MELD_EDGE_DISTANCE, centreY + MELD_RIGHT_CORNER_DISTANCE],
        inward: [0, -1],
        rotation: Math.PI / 2,
    };
    if (relativeSeat === 2) return {
        corner: [-MELD_RIGHT_CORNER_DISTANCE, centreY + MELD_EDGE_DISTANCE],
        inward: [1, 0],
        rotation: Math.PI,
    };
    return {
        corner: [-MELD_EDGE_DISTANCE, centreY - MELD_RIGHT_CORNER_DISTANCE],
        inward: [0, 1],
        rotation: -Math.PI / 2,
    };
}

function calledTileIndexFromRight(meld, tileCount) {
    const source = (meld.target - meld.actor + 4) % 4;
    if (source === 1) return 0; // Player on the caller's right.
    if (source === 2) return Math.max(1, tileCount - 2); // Opposite player.
    return tileCount - 1; // Player on the caller's left (also every chi).
}

function meldForwardOffset(rotation, distance = MELD_FRONT_TILE_OFFSET) {
    return [
        -Math.sin(rotation) * distance,
        Math.cos(rotation) * distance,
    ];
}

function frontMeldTilePosition(position, rotation) {
    const offset = meldForwardOffset(rotation);
    return [
        position[0] + offset[0],
        position[1] + offset[1],
        MELD_BASE_Z,
    ];
}

function meldTiles(meld) {
    if (meld.type === 'ankan') {
        const tiles = [...(meld.consumed || [])];
        while (tiles.length < 4) tiles.push(meld.pai);
        return tiles.slice(0, 4).map((tile, index) => ({
            tile,
            faceDown: index === 0 || index === 3,
            rotated: false,
        }));
    }

    const isKan = meld.type === 'daiminkan';
    const count = isKan ? 4 : 3;
    const calledIndex = calledTileIndexFromRight(meld, count);
    const concealed = [...(meld.consumed || [])];
    const result = [];
    for (let index = 0; index < count; index++) {
        result.push(index === calledIndex
            ? { tile: meld.pai, rotated: true, faceDown: false }
            : { tile: concealed.shift() || meld.pai, rotated: false, faceDown: false });
    }
    if (meld.type === 'kakan') {
        result[calledIndex].frontTile = meld.addedPai || meld.pai;
    }
    return result;
}

function renderMelds() {
    const melds = Array.isArray(round.melds) ? round.melds : [[], [], [], []];
    const key = `${roundIndex}:${turnIndex}:${heroPlayer}:${hoveredHeroTileKind || ''}:${JSON.stringify(melds)}`;
    if (key === renderedMeldsKey) return;
    renderedMeldsKey = key;
    meldLayer.children = [];

    melds.forEach((playerMelds, actor) => {
        const relativeSeat = (actor - heroPlayer + 4) % 4;
        const basis = meldSeatBasis(relativeSeat);
        let cursor = 0;
        playerMelds.forEach(meld => {
            const items = meldTiles(meld);
            items.forEach(item => {
                const width = (item.rotated ? .585 : .423) * TILE_SIZE_SCALE;
                const distance = cursor + width / 2;

                let position = [
                    basis.corner[0] + basis.inward[0] * distance,
                    basis.corner[1] + basis.inward[1] * distance,
                    MELD_BASE_Z,
                ];

                // If the tile is rotated, shift its position toward the player to align bottom edges
                if (item.rotated) {
                    const shiftDist = ((0.585 - 0.423) / 2) * TILE_SIZE_SCALE;
                    position[0] += Math.sin(basis.rotation) * shiftDist;
                    position[1] -= Math.cos(basis.rotation) * shiftDist;
                }

                const rotation = basis.rotation + (item.rotated ? Math.PI / 2 : 0);
                createTile(meldLayer, item.tile, position, {
                    rotation,
                    faceDown: item.faceDown,
                    darkened: !item.faceDown && tileKind(item.tile) === hoveredHeroTileKind,
                });

                if (item.frontTile) {
                    createTile(meldLayer, item.frontTile, frontMeldTilePosition(position, basis.rotation), {
                        rotation,
                        darkened: tileKind(item.frontTile) === hoveredHeroTileKind,
                    });
                }
                cursor += width + MELD_TILE_GAP;
            });
            cursor += MELD_GROUP_GAP - MELD_TILE_GAP;
        });
    });
}

function tileSortValue(tile) {
    if (HONOR_ASSET_NAMES[tile]) return 300 + Number(HONOR_ASSET_NAMES[tile][0]);
    const match = /^(\d)([mps])(r)?$/.exec(tile);
    if (!match) return 999;
    const [, number, suit, red] = match;
    const suitOffset = { m: 0, p: 100, s: 200 }[suit];
    return suitOffset + Number(number) * 2 + (red ? 1 : 0);
}

function formatSuggestionPercent(probability) {
    return String(Math.min(99, Math.ceil(probability * 100)));
}

function formatDealInPercent(rate) {
    return String(Math.min(99, Math.ceil(Math.max(0, rate) * 100)));
}

function createSuggestionMeter(probability, className) {
    const meter = document.createElement('span');
    meter.className = className;
    meter.style.setProperty('--suggestion-progress', `${Math.max(0, Math.min(100, probability * 100))}%`);
    meter.textContent = formatSuggestionPercent(probability);
    meter.setAttribute('aria-hidden', 'true');
    return meter;
}

function findRightmostSuggestedTileIndex(tiles, drawnTile, suggestion) {
    for (let index = tiles.length - 1; index >= 0; index--) {
        if (tiles[index] === suggestion.tile) return index;
    }
    for (let index = tiles.length - 1; index >= 0; index--) {
        if (sameTileKind(tiles[index], suggestion.tile)) return index;
    }
    if (drawnTile === suggestion.tile || sameTileKind(drawnTile, suggestion.tile)) return tiles.length;
    return -1;
}

function suggestionsByTileIndex(tiles, drawnTile, suggestions) {
    const byIndex = [...tiles, drawnTile].map(() => []);
    for (const suggestion of suggestions) {
        const index = findRightmostSuggestedTileIndex(tiles, drawnTile, suggestion);
        if (index >= 0) byIndex[index].push(suggestion);
    }
    return byIndex;
}

function relativeSeat(actor) {
    return (actor - heroPlayer + 4) % 4;
}

function seatColorForActor(actor) {
    const selectorBySeat = {
        0: '.seat-marker--hero',
        1: '.seat-marker--shimocha',
        2: '.seat-marker--toimen',
        3: '.seat-marker--kamicha',
    };
    const marker = document.querySelector(selectorBySeat[relativeSeat(actor)]);
    return marker
        ? getComputedStyle(marker).getPropertyValue('--seat-color').trim()
        : '#facc15';
}

function bottomDealInCapColor(dealInRates) {
    return dealInRates[0] ? seatColorForActor(dealInRates[0].actor) : '#facc15';
}

function createDealInCap(dealInRate) {
    const cap = document.createElement('div');
    cap.className = 'hud-dealin';
    cap.style.setProperty('--dealin-color', seatColorForActor(dealInRate.actor));

    const label = document.createElement('span');
    label.className = 'hud-dealin__label';
    label.textContent = 'Deal-In';

    const meter = document.createElement('span');
    meter.className = 'hud-dealin__meter';
    const progress = Math.max(0, Math.min(100, dealInRate.rate * 100));
    meter.style.setProperty('--suggestion-progress', `${progress}%`);
    meter.textContent = formatDealInPercent(dealInRate.rate);
    meter.setAttribute('aria-hidden', 'true');

    cap.append(label, meter);
    return cap;
}

function dealInRatesForTile(tile) {
    const tileCode = normalizeRedFive(tileToCode(tile));
    if (!tileCode || !Array.isArray(round.dangerRates)) return [];
    return round.dangerRates
        .map(dealInRate => ({
            actor: dealInRate.actor,
            rate: dealInRate.rates?.[tileCode] || 0,
        }))
        .filter(dealInRate => Number.isInteger(dealInRate.actor) && Number.isFinite(dealInRate.rate))
        .sort((a, b) => relativeSeat(a.actor) - relativeSeat(b.actor));
}

function dealInRatesByTileIndex(tiles, drawnTile) {
    const tileSlots = [...tiles, drawnTile];
    const byIndex = tileSlots.map(() => []);
    const assignedTileCodes = new Set();
    for (let index = tileSlots.length - 1; index >= 0; index--) {
        const tileCode = normalizeRedFive(tileToCode(tileSlots[index]));
        if (!tileCode || assignedTileCodes.has(tileCode)) continue;
        byIndex[index] = dealInRatesForTile(tileSlots[index]);
        assignedTileCodes.add(tileCode);
    }
    return byIndex;
}

function hasHeroDiscardDecision(aiSuggestions) {
    return aiSuggestions.some(suggestion => suggestion.type === 'dahai');
}

function createSuggestionCap(suggestion) {
    const cap = document.createElement('div');
    cap.className = `hud-suggestion${suggestion.rank === 0 ? ' hud-suggestion--best' : ''}`;

    const label = document.createElement('span');
    label.className = 'hud-suggestion__label';
    label.textContent = suggestion.label;

    cap.append(label, createSuggestionMeter(suggestion.probability, 'hud-suggestion__meter'));
    return cap;
}

function createHeroDecisionMarker(label) {
    const marker = document.createElement('div');
    marker.className = 'hud-tile__hero-decision';
    marker.textContent = label;
    marker.setAttribute('aria-hidden', 'true');
    return marker;
}

function hudTileRenderKey(tile, extraClass = '', suggestions = [], dealInRates = [], heroDecisionLabel = '') {
    const suggestionKey = suggestions
        .map(suggestion => `${suggestion.rank}:${suggestion.type}:${suggestion.tile}:${suggestion.probability}:${suggestion.label}`)
        .join(',');
    const dealInKey = dealInRates
        .map(dealInRate => `${dealInRate.actor}:${dealInRate.rate}`)
        .join(',');
    return `${tile}|${extraClass}|${heroDecisionLabel}|${suggestionKey}|${dealInKey}`;
}

function hudTileStableKey(tile, extraClass = '') {
    return `${tile}|${extraClass}`;
}

function hudTileClassName(extraClass, suggestions, dealInRates, heroDecisionLabel) {
    const hasSuggestions = suggestions.length > 0;
    const hasBestSuggestion = suggestions.some(suggestion => suggestion.rank === 0);
    const hasDealInRates = dealInRates.length > 0;
    const hasHeroDecision = Boolean(heroDecisionLabel);
    return [
        'hud-tile',
        extraClass,
        hasSuggestions ? 'hud-tile--suggested' : '',
        hasBestSuggestion ? 'hud-tile--best-suggestion' : '',
        hasDealInRates ? 'hud-tile--has-dealin' : '',
        hasHeroDecision ? 'hud-tile--hero-decision' : '',
    ].filter(Boolean).join(' ');
}

function syncHudTileElement(tileElement, tile, extraClass = '', suggestions = [], dealInRates = [], heroDecisionLabel = '') {
    const renderKey = hudTileRenderKey(tile, extraClass, suggestions, dealInRates, heroDecisionLabel);
    if (tileElement.dataset.renderKey === renderKey) return tileElement;

    tileElement.className = hudTileClassName(extraClass, suggestions, dealInRates, heroDecisionLabel);
    tileElement.dataset.tileKind = tileKind(tile);
    tileElement.dataset.stableKey = hudTileStableKey(tile, extraClass);
    tileElement.dataset.renderKey = renderKey;
    tileElement.setAttribute('aria-label', heroDecisionLabel ? `${tile}, ${heroDecisionLabel}` : tile);
    if (dealInRates.length) {
        tileElement.style.setProperty('--dealin-outline-color', bottomDealInCapColor(dealInRates));
    } else {
        tileElement.style.removeProperty('--dealin-outline-color');
    }

    tileElement.querySelector('.hud-tile__suggestions')?.replaceChildren(
        ...suggestions.map(createSuggestionCap),
        ...dealInRates.map(createDealInCap),
    );

    const marker = tileElement.querySelector('.hud-tile__hero-decision');
    if (heroDecisionLabel) {
        if (marker) {
            marker.textContent = heroDecisionLabel;
        } else {
            tileElement.append(createHeroDecisionMarker(heroDecisionLabel));
        }
    } else {
        marker?.remove();
    }
    return tileElement;
}

function createHudTile(tile, extraClass = '', suggestions = [], dealInRates = [], heroDecisionLabel = '') {
    const tileElement = document.createElement('div');
    const hasDealInRates = dealInRates.length > 0;
    tileElement.className = hudTileClassName(extraClass, suggestions, dealInRates, heroDecisionLabel);
    if (hasDealInRates) {
        tileElement.style.setProperty('--dealin-outline-color', bottomDealInCapColor(dealInRates));
    }
    tileElement.dataset.tileKind = tileKind(tile);
    tileElement.dataset.stableKey = hudTileStableKey(tile, extraClass);
    tileElement.dataset.renderKey = hudTileRenderKey(tile, extraClass, suggestions, dealInRates, heroDecisionLabel);
    tileElement.setAttribute('role', 'img');
    tileElement.setAttribute('aria-label', tile);

    const suggestionStack = document.createElement('div');
    suggestionStack.className = 'hud-tile__suggestions';
    suggestionStack.setAttribute('aria-hidden', 'true');
    suggestionStack.append(
        ...suggestions.map(createSuggestionCap),
        ...dealInRates.map(createDealInCap),
    );

    const cap = document.createElement('div');
    cap.className = 'hud-tile__top';
    cap.setAttribute('aria-hidden', 'true');
    const marble = document.createElement('div');
    marble.className = 'hud-tile__back-edge';
    marble.setAttribute('aria-hidden', 'true');
    const face = document.createElement('div');
    face.className = 'hud-tile__face';
    const image = document.createElement('img');
    image.loading = 'eager';
    image.decoding = 'sync';
    image.src = `/media/Regular_shortnames/${tileAssetName(tile)}.svg`;
    image.alt = tile;
    face.append(image);
    tileElement.append(suggestionStack, cap, marble, face);
    if (heroDecisionLabel) {
        tileElement.append(createHeroDecisionMarker(heroDecisionLabel));
        tileElement.setAttribute('aria-label', `${tile}, ${heroDecisionLabel}`);
    }
    return tileElement;
}

function reusableHudTileBuckets() {
    const buckets = new Map();
    for (const tileElement of heroHand.children) {
        const key = tileElement.dataset?.stableKey;
        if (!key) continue;
        const bucket = buckets.get(key) || [];
        bucket.push(tileElement);
        buckets.set(key, bucket);
    }
    return buckets;
}

function reconcileHeroHandTiles(tileConfigs) {
    const reusableTiles = reusableHudTileBuckets();
    const nextElements = tileConfigs.map(config => {
        const key = hudTileStableKey(
            config.tile,
            config.extraClass,
        );
        const reused = reusableTiles.get(key)?.shift();
        if (reused) {
            return syncHudTileElement(
                reused,
                config.tile,
                config.extraClass,
                config.suggestions,
                config.dealInRates,
                config.heroDecisionLabel,
            );
        }
        return createHudTile(
            config.tile,
            config.extraClass,
            config.suggestions,
            config.dealInRates,
            config.heroDecisionLabel,
        );
    });

    nextElements.forEach((tileElement, index) => {
        if (heroHand.children[index] !== tileElement) {
            heroHand.insertBefore(tileElement, heroHand.children[index] || null);
        }
    });

    while (heroHand.children.length > nextElements.length) {
        heroHand.lastElementChild.remove();
    }
}

function createDoraBackTile() {
    const tileElement = document.createElement('div');
    tileElement.className = 'hud-tile dora-card__tile dora-card__tile--back';
    tileElement.setAttribute('role', 'img');
    tileElement.setAttribute('aria-label', 'Unrevealed dora indicator');

    const cap = document.createElement('div');
    cap.className = 'hud-tile__top';
    cap.setAttribute('aria-hidden', 'true');
    const marble = document.createElement('div');
    marble.className = 'hud-tile__back-edge';
    marble.setAttribute('aria-hidden', 'true');
    const face = document.createElement('div');
    face.className = 'hud-tile__face';
    face.setAttribute('aria-hidden', 'true');

    tileElement.append(cap, marble, face);
    return tileElement;
}

function updateHeroHandHoverClasses() {
    heroHand.querySelectorAll('.hud-tile').forEach(tileElement => {
        tileElement.classList.toggle(
            'hud-tile--kind-hovered',
            Boolean(hoveredHeroTileKind) && tileElement.dataset.tileKind === hoveredHeroTileKind,
        );
    });
}

function setHoveredHeroTileKind(tileKindValue) {
    const nextKind = tileKindValue || null;
    if (nextKind === hoveredHeroTileKind) return;
    hoveredHeroTileKind = nextKind;
    renderedDiscardsKey = '';
    renderedMeldsKey = '';
    updateHeroHandHoverClasses();
    renderDiscards();
    renderMelds();
    rebuildVisibleTileNodes();
    renderer.render(scene, camera);
}

function renderHeroHand() {
    const heroDecision = round.heroDecision || null;
    const tiles = Array.isArray(round.tehais?.[heroPlayer])
        ? [...round.tehais[heroPlayer]].sort((a, b) => tileSortValue(a) - tileSortValue(b))
        : [];
    const drawnTile = round.drawnTile || null;
    const aiSuggestions = Array.isArray(round.aiSuggestions)
        ? round.aiSuggestions
        : [];
    const visibleAiSuggestions = aiSuggestions.slice(0, maxAiSuggestions);
    const showDealInRates = hasHeroDiscardDecision(aiSuggestions)
        && Array.isArray(round.dangerRates)
        && round.dangerRates.length > 0;
    heroHand.classList.toggle('hero-hand--decision', showDealInRates);
    heroHand.dataset.dealinMode = dealInMode;
    heroHand.dataset.aiScoreMode = aiScoreMode;
    if (hoveredHeroTileKind && ![...tiles, drawnTile].some(tile => tileKind(tile) === hoveredHeroTileKind)) {
        setHoveredHeroTileKind(null);
    }
    const heroDecisionIndex = heroDecision
        ? findRightmostSuggestedTileIndex(tiles, drawnTile, { tile: heroDecision.tile })
        : -1;
    const suggestionKey = visibleAiSuggestions
        .map(item => `${item.rank}:${item.type}:${item.tile}:${item.probability}`)
        .join('|');
    const dealInKey = showDealInRates
        ? round.dangerRates
            .map(item => `${item.actor}:${ALL_TILE_CODES.map(tile => item.rates?.[tile] || 0).join(',')}`)
            .join('|')
        : '';
    const heroDecisionKey = heroDecision
        ? `${heroDecision.type}:${heroDecision.tile}:${heroDecision.label}:${heroDecisionIndex}`
        : '';
    const handKey = `${heroPlayer}:${tiles.join(',')}:${drawnTile || ''}:${suggestionKey}:${showDealInRates}:${dealInKey}:${heroDecisionKey}:${maxAiSuggestions}`;
    if (handKey === renderedHeroHandKey) return;
    renderedHeroHandKey = handKey;
    const suggestionsByIndex = suggestionsByTileIndex(tiles, drawnTile, visibleAiSuggestions);
    const dealInRatesByIndex = showDealInRates
        ? dealInRatesByTileIndex(tiles, drawnTile)
        : [...tiles, drawnTile].map(() => []);
    const tileConfigs = tiles.map((tile, index) => ({
        tile,
        extraClass: '',
        suggestions: suggestionsByIndex[index],
        dealInRates: dealInRatesByIndex[index],
        heroDecisionLabel: index === heroDecisionIndex ? heroDecision.label : '',
    }));
    if (drawnTile) {
        tileConfigs.push({
            tile: drawnTile,
            extraClass: 'hud-tile--drawn',
            suggestions: suggestionsByIndex[tiles.length],
            dealInRates: dealInRatesByIndex[tiles.length],
            heroDecisionLabel: tiles.length === heroDecisionIndex ? heroDecision.label : '',
        });
    }
    reconcileHeroHandTiles(tileConfigs);
    updateHeroHandHoverClasses();
}

function scaleHeroHudToCanvas() {
    const scale = String(canvas.clientWidth / HUD_DESIGN_WIDTH * HUD_TILE_SIZE_SCALE);
    heroTilePrototype.style.setProperty('--canvas-hud-scale', scale);
    actionDecision.style.setProperty('--canvas-hud-scale', scale);
    userNavDock.style.setProperty('--canvas-hud-scale', scale);
    seatMarkers.style.setProperty('--canvas-hud-scale', scale);
    doraIndicatorsElement.style.setProperty('--canvas-hud-scale', scale);
}

const ACTION_LABELS = {
    none: 'Skip',
    chi: 'Chi',
    pon: 'Pon',
    daiminkan: 'Kan',
    ankan: 'Kan',
    reach: 'Riichi',
};

function actionLabel(action) {
    if (action?._label) return action._label;
    if (action?.type === 'hora') {
        return action.actor === action.target ? 'Tsumo' : 'Ron';
    }
    return ACTION_LABELS[action?.type] || action?.type || '';
}

function storedSfxVolume() {
    let stored = NaN;
    try {
        stored = Number(localStorage.getItem(SFX_VOLUME_STORAGE_KEY));
    } catch {
        stored = NaN;
    }
    if (!Number.isFinite(stored)) return DEFAULT_SFX_VOLUME;
    return Math.max(0, Math.min(100, Math.round(stored)));
}

function storedNavigationReplayDelay() {
    let stored = NaN;
    try {
        stored = Number(localStorage.getItem(NAVIGATION_REPLAY_DELAY_STORAGE_KEY));
    } catch {
        stored = NaN;
    }
    if (!Number.isFinite(stored)) return DEFAULT_NAVIGATION_REPLAY_DELAY_MS;
    return Math.max(0, Math.min(MAX_NAVIGATION_REPLAY_DELAY_MS, Math.round(stored)));
}

function soundKeyForAction(action) {
    if (!action) return '';
    if (action.type === 'chi') return 'chi';
    if (action.type === 'pon') return 'pon';
    if (['ankan', 'daiminkan', 'kakan'].includes(action.type)) return 'kan';
    if (action.type === 'reach') return 'reach';
    if (action.type === 'hora') return action.actor === action.target ? 'tsumo' : 'ron';
    return '';
}

function soundKeyForEvent(event) {
    return soundKeyForAction(event);
}

function stateSoundKey(state) {
    return state?.soundKey || soundKeyForEvent(state?.event);
}

function getAudioContext() {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return null;
    if (!audioContext) audioContext = new AudioContextConstructor();
    return audioContext;
}

function loadAudioBuffer(source) {
    if (audioBuffers.has(source)) return Promise.resolve(audioBuffers.get(source));
    if (audioBufferPromises.has(source)) return audioBufferPromises.get(source);
    const promise = fetch(source)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.arrayBuffer();
        })
        .then(data => {
            const context = getAudioContext();
            if (!context) return null;
            return context.decodeAudioData(data);
        })
        .then(buffer => {
            if (buffer) audioBuffers.set(source, buffer);
            return buffer;
        })
        .catch(error => {
            console.warn(`Could not load audio ${source}:`, error);
            audioBufferPromises.delete(source);
            return null;
        });
    audioBufferPromises.set(source, promise);
    return promise;
}

function preloadAudioBuffers() {
    for (const source of AUDIO_SOURCES) loadAudioBuffer(source);
}

function warmAudioOnce() {
    if (audioWarmupStarted) return;
    const context = getAudioContext();
    preloadAudioBuffers();
    if (!context) return;
    if (context.state === 'running') {
        audioWarmupStarted = true;
        return;
    }
    context.resume()
        .then(() => {
            audioWarmupStarted = true;
        })
        .catch(() => {});
}

function beginReview() {
    warmAudioOnce();
    beginOverlay.hidden = true;
}

function playAudioSource(source, { volumeMultiplier = 1, playbackRate = 1 } = {}) {
    if (!source || sfxVolume <= 0) return;
    const context = getAudioContext();
    const buffer = audioBuffers.get(source);
    if (!context || !buffer) {
        loadAudioBuffer(source);
        return;
    }
    if (context.state !== 'running') {
        context.resume().catch(() => {});
        return;
    }
    const sourceNode = context.createBufferSource();
    const gainNode = context.createGain();
    sourceNode.buffer = buffer;
    sourceNode.playbackRate.value = playbackRate;
    gainNode.gain.value = Math.min(1, (sfxVolume / 100) * volumeMultiplier);
    sourceNode.connect(gainNode).connect(context.destination);
    sourceNode.start();
}

function playSfx(soundKey) {
    playAudioSource(SFX_SOURCES[soundKey]);
}

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function randomTilePlacementSource() {
    if (!TILE_PLACEMENT_SOURCES.length) return '';
    return TILE_PLACEMENT_SOURCES[Math.floor(Math.random() * TILE_PLACEMENT_SOURCES.length)];
}

function playTilePlacementSfx(volumeMultiplier = 1) {
    playAudioSource(randomTilePlacementSource(), {
        volumeMultiplier: volumeMultiplier * randomBetween(.86, 1),
        playbackRate: randomBetween(.96, 1.04),
    });
}

function playTilePlacementSequence() {
    if (Math.random() < .2) {
        playTilePlacementSfx(.62);
        setTimeout(() => playTilePlacementSfx(), 18);
        return;
    }
    playTilePlacementSfx();
}

function playSoundForVisibleTurn() {
    const state = rounds[roundIndex]?.turnStates?.[turnIndex];
    if (state?.tileSound) playTilePlacementSequence();
    playSfx(stateSoundKey(state));
}

function rankedActionOptions(actions) {
    const options = actions.map(action => ({ ...action }));
    const ranked = options
        .filter(action => Number.isFinite(action._probability) && action._probability >= .01)
        .sort((a, b) => b._probability - a._probability)
        .slice(0, maxAiSuggestions);
    ranked.forEach((action, rank) => {
        action._suggestionRank = rank;
    });
    return options;
}

function createActionOption(action, selected, showChiTiles) {
    const option = document.createElement('div');
    const isSuggested = Number.isInteger(action._suggestionRank);
    option.className = [
        'action-option',
        selected ? 'action-option--selected' : '',
        isSuggested ? 'action-option--suggested' : '',
        action._suggestionRank === 0 ? 'action-option--best-suggestion' : '',
    ].filter(Boolean).join(' ');
    option.setAttribute('role', 'img');
    option.setAttribute('aria-label', `${actionLabel(action)}${selected ? ', selected' : ''}`);

    if (isSuggested) {
        option.append(createSuggestionMeter(action._probability, 'action-option__meter'));
    }

    const label = document.createElement('span');
    label.textContent = actionLabel(action);
    option.append(label);

    if (action.type === 'chi' && showChiTiles) {
        const tiles = document.createElement('span');
        tiles.className = 'action-option__tiles';
        for (const tile of action.consumed || []) {
            const image = document.createElement('img');
            image.className = 'action-option__tile';
            image.src = `/media/Regular_shortnames/${tileAssetName(tile)}.svg`;
            image.alt = tile;
            tiles.append(image);
        }
        option.append(tiles);
    }
    return option;
}

function renderActionDecision() {
    const decision = round.actionDecision;
    if (!decision?.options?.length) {
        actionDecision.hidden = true;
        actionDecisionOptions.replaceChildren();
        return;
    }

    const options = rankedActionOptions(decision.options)
        .filter(action => action.type !== 'reach' && !(action.type === 'none' && action._label === 'Dama'));
    const skipIndex = options.findIndex(action => action.type === 'none');
    const skip = skipIndex >= 0 ? options.splice(skipIndex, 1)[0] : null;
    const ordered = skip ? [skip, ...options] : options;
    const rowCount = Math.ceil(ordered.length / 2);
    const chiCount = ordered.filter(action => action.type === 'chi').length;
    const cells = [];

    ordered.forEach((action, index) => {
        const element = createActionOption(
            action,
            action._decisionIndex === decision.selectedIndex,
            chiCount > 1,
        );
        // Fill from bottom-right to left, then continue right-to-left upward.
        const slot = index;
        element.style.gridRow = String(rowCount - Math.floor(slot / 2));
        element.style.gridColumn = String(2 - slot % 2);
        cells.push(element);
    });
    actionDecisionOptions.replaceChildren(...cells);
    actionDecision.hidden = false;
}

function renderDoraIndicators() {
    const indicators = doraIndicatorTiles();
    const slots = Array.from({ length: 5 }, (_, index) => {
        const tile = indicators[index];
        return tile
            ? createHudTile(tile, 'dora-card__tile')
            : createDoraBackTile();
    });
    doraIndicatorsElement.replaceChildren(...slots);
}

function getInitialRemainingTiles(event) {
    if (Number.isFinite(event.remaining_tiles)) return event.remaining_tiles;
    if (Number.isFinite(event.tiles_left)) return event.tiles_left;
    const hands = event.tehais;
    if (!Array.isArray(hands) || !hands.length) return 70;
    const dealtTiles = hands.reduce((total, hand) => total + (Array.isArray(hand) ? hand.length : 0), 0);
    const fullTileCount = hands.length === 3 ? 108 : 136;
    return fullTileCount - 14 - dealtTiles;
}

function removeTile(tiles, tile) {
    const index = tiles.indexOf(tile);
    if (index >= 0) tiles.splice(index, 1);
}

function sameTileKind(first, second) {
    return typeof first === 'string'
        && typeof second === 'string'
        && first.replace(/r$/, '') === second.replace(/r$/, '');
}

function tileToCode(tile) {
    if (HONOR_ASSET_NAMES[tile]) return 40 + Number(HONOR_ASSET_NAMES[tile][0]);
    const match = /^(\d)([mps])(r)?$/.exec(tile);
    if (!match) return null;
    const [, number, suit, red] = match;
    if (red) return { m: 51, p: 52, s: 53 }[suit];
    return { m: 10, p: 20, s: 30 }[suit] + Number(number);
}

function normalizeRedFive(tile) {
    if (tile === 51) return 15;
    if (tile === 52) return 25;
    if (tile === 53) return 35;
    return tile;
}

function doraFromIndicator(indicator) {
    const tile = normalizeRedFive(tileToCode(indicator));
    if (!tile) return null;
    if (tile % 10 === 9) return tile - 8;
    if (tile === 44) return 41;
    if (tile === 47) return 45;
    return tile + 1;
}

function indicatorFromDora(dora) {
    const tile = normalizeRedFive(typeof dora === 'number' ? dora : tileToCode(dora));
    if (!tile) return null;
    if (tile === 41) return 44;
    if (tile === 45) return 47;
    if (tile % 10 === 1) return tile + 8;
    return tile - 1;
}

function tileFromCode(code) {
    if (TILE_CODE_NAMES[code]) return TILE_CODE_NAMES[code];
    const suit = code < 20 ? 'm' : code < 30 ? 'p' : 's';
    return `${code % 10}${suit}`;
}

function doraIndicatorTiles() {
    return (round.doraIndicators || [])
        .map(indicator => indicatorFromDora(doraFromIndicator(indicator)))
        .filter(Boolean)
        .map(tileFromCode);
}

const ALL_TILE_CODES = [
    11, 12, 13, 14, 15, 16, 17, 18, 19,
    21, 22, 23, 24, 25, 26, 27, 28, 29,
    31, 32, 33, 34, 35, 36, 37, 38, 39,
    41, 42, 43, 44, 45, 46, 47,
];

const WAIT_TYPE = {
    ryanmen: 0,
    kanchan: 1,
    penchan: 2,
    tanki: 3,
    shanpon: 4,
};

function generateWaits() {
    const waits = [];
    for (const ryanmen of [[2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]]) {
        for (let suit = 1; suit <= 3; suit++) {
            waits.push({
                tiles: [suit * 10 + ryanmen[0], suit * 10 + ryanmen[1]],
                waitsOn: [suit * 10 + ryanmen[0] - 1, suit * 10 + ryanmen[1] + 1],
                type: WAIT_TYPE.ryanmen,
            });
        }
    }
    for (const kanchan of [[1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [6, 8], [7, 9]]) {
        for (let suit = 1; suit <= 3; suit++) {
            waits.push({
                tiles: [suit * 10 + kanchan[0], suit * 10 + kanchan[1]],
                waitsOn: [suit * 10 + kanchan[0] + 1],
                type: WAIT_TYPE.kanchan,
            });
        }
    }
    for (const penchan of [[1, 2, 3], [8, 9, 7]]) {
        for (let suit = 1; suit <= 3; suit++) {
            waits.push({
                tiles: [suit * 10 + penchan[0], suit * 10 + penchan[1]],
                waitsOn: [suit * 10 + penchan[2]],
                type: WAIT_TYPE.penchan,
            });
        }
    }
    for (const tile of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
        for (const type of [WAIT_TYPE.tanki, WAIT_TYPE.shanpon]) {
            for (let suit = 1; suit <= 4; suit++) {
                if (suit === 4 && tile > 7) continue;
                waits.push({
                    type,
                    tiles: Array(type === WAIT_TYPE.tanki ? 1 : 2).fill(suit * 10 + tile),
                    waitsOn: [suit * 10 + tile],
                });
            }
        }
    }
    return waits;
}

function calculateCombos(waits, genbutsu, discardsToRiichi, unseenTiles, dora) {
    const normalizedDiscards = discardsToRiichi.map(normalizeRedFive);
    const riichiTile = normalizedDiscards.at(-1);
    const combos = { all: 0 };
    for (const wait of waits) {
        if (wait.waitsOn.some(tile => genbutsu.has(tile))) continue;
        const involvedTiles = [...wait.tiles, ...wait.waitsOn];
        wait.combos = 1;
        wait.numUnseen = [];
        for (const [index, tile] of wait.tiles.entries()) {
            const count = Math.max(0, (unseenTiles[tile] || 0) - (index > 0 && wait.type === WAIT_TYPE.shanpon ? 1 : 0));
            wait.combos *= count;
            wait.numUnseen.push(count);
        }
        if (wait.type === WAIT_TYPE.shanpon) wait.combos /= wait.tiles.length;

        const honorTankiShanpon = [WAIT_TYPE.shanpon, WAIT_TYPE.tanki].includes(wait.type) && wait.tiles[0] > 40;
        const nonHonorTankiShanpon = [WAIT_TYPE.shanpon, WAIT_TYPE.tanki].includes(wait.type) && wait.tiles[0] < 40;
        if (wait.type === WAIT_TYPE.ryanmen) {
            let uraSuji = false;
            let matagiSujiEarly = false;
            let matagiSujiRiichi = false;
            for (const discard of normalizedDiscards) {
                if (wait.tiles.includes(discard)) continue;
                if (wait.tiles.some(waitTile => discard % 10 >= 4 && discard % 10 <= 6 && Math.abs(discard - waitTile) === 2)) {
                    uraSuji = true;
                }
            }
            for (const discard of normalizedDiscards) {
                if (!wait.tiles.includes(discard)) continue;
                if (discard === riichiTile) matagiSujiRiichi = true;
                else matagiSujiEarly = true;
            }
            wait.combos *= DANGER_WEIGHTS.ryanmen;
            if (uraSuji) wait.combos *= DANGER_WEIGHTS.uraSuji;
            if (matagiSujiEarly) wait.combos *= DANGER_WEIGHTS.matagiSujiEarly;
            if (matagiSujiRiichi) wait.combos *= DANGER_WEIGHTS.matagiSujiRiichi;
        } else if (honorTankiShanpon) {
            wait.combos *= DANGER_WEIGHTS.honorTankiShanpon;
        } else if (nonHonorTankiShanpon) {
            wait.combos *= DANGER_WEIGHTS.nonHonorTankiShanpon;
        } else if (wait.type === WAIT_TYPE.kanchan) {
            wait.combos *= riichiTile % 10 >= 4 && riichiTile % 10 <= 6 && Math.abs(wait.waitsOn[0] - riichiTile) === 3
                ? DANGER_WEIGHTS.kanchanRiichiSujiTrap
                : DANGER_WEIGHTS.kanchan;
        }

        if (dora && involvedTiles.includes(dora)) wait.combos *= DANGER_WEIGHTS.doraGreed;
        if (discardsToRiichi.some(discard => discard > 50 && involvedTiles.includes(normalizeRedFive(discard)))) {
            wait.combos *= DANGER_WEIGHTS.akaDiscard;
        }

        combos.all += wait.combos;
        if (wait.type === WAIT_TYPE.shanpon) wait.combos *= 2;
        for (const tile of wait.waitsOn) {
            if (!combos[tile]) combos[tile] = { all: 0 };
            combos[tile].all += wait.combos;
        }
    }
    return combos;
}

function initUnseenTilesForPlayer(startEvent, actor) {
    const unseen = Object.fromEntries(ALL_TILE_CODES.map(tile => [tile, 4]));
    for (const tile of startEvent.tehais?.[actor] || []) {
        const code = normalizeRedFive(tileToCode(tile));
        if (code) unseen[code]--;
    }
    const doraMarker = normalizeRedFive(tileToCode(startEvent.dora_marker));
    if (doraMarker) unseen[doraMarker]--;
    return unseen;
}

function markTileSeen(dangerState, tile, actorAlreadySaw = -1) {
    const code = normalizeRedFive(tileToCode(tile));
    if (!code) return;
    for (let actor = 0; actor < dangerState.unseenTiles.length; actor++) {
        if (actor === actorAlreadySaw) continue;
        dangerState.unseenTiles[actor][code]--;
    }
}

function updateDangerState(dangerState, event) {
    if (event.dora_marker) markTileSeen(dangerState, event.dora_marker);
    if (event.type === 'tsumo' && Number.isInteger(event.actor)) {
        const code = normalizeRedFive(tileToCode(event.pai));
        if (code) dangerState.unseenTiles[event.actor][code]--;
    } else if (event.type === 'dahai' && Number.isInteger(event.actor)) {
        markTileSeen(dangerState, event.pai, event.actor);
        const code = normalizeRedFive(tileToCode(event.pai));
        for (let actor = 0; actor < 4; actor++) {
            if (event.actor === actor || dangerState.riichiAccepted[actor]) {
                dangerState.genbutsu[actor].add(code);
            }
            if (event.actor === actor && !dangerState.riichiAccepted[actor]) {
                dangerState.discardsToRiichi[actor].push(tileToCode(event.pai));
            }
        }
        if (event.actor === dangerState.pendingRiichiActor) {
            dangerState.riichiAccepted[event.actor] = true;
            dangerState.pendingRiichiActor = null;
        }
    } else if (['chi', 'pon', 'daiminkan', 'ankan'].includes(event.type)) {
        for (const tile of event.consumed || []) markTileSeen(dangerState, tile, event.actor);
    } else if (event.type === 'kakan') {
        markTileSeen(dangerState, event.pai, event.actor);
        const code = normalizeRedFive(tileToCode(event.pai));
        for (let actor = 0; actor < 4; actor++) {
            if (dangerState.riichiAccepted[actor]) dangerState.genbutsu[actor].add(code);
        }
    } else if (event.type === 'reach' && Number.isInteger(event.actor)) {
        dangerState.pendingRiichiActor = event.actor;
    } else if (event.type === 'reach_accepted' && Number.isInteger(event.actor)) {
        dangerState.riichiAccepted[event.actor] = true;
    }
}

function calculateDangerRates(dangerState) {
    const rates = [];
    for (let actor = 0; actor < 4; actor++) {
        if (actor === heroPlayer || !dangerState.riichiAccepted[actor]) continue;
        const combos = calculateCombos(
            generateWaits(),
            dangerState.genbutsu[actor],
            dangerState.discardsToRiichi[actor],
            dangerState.unseenTiles[heroPlayer],
            dangerState.dora,
        );
        if (!combos.all) continue;
        const tileRates = {};
        for (const tile of ALL_TILE_CODES) {
            tileRates[tile] = combos[tile] ? combos[tile].all / combos.all : 0;
        }
        rates.push({ actor, rates: tileRates });
    }
    return rates;
}

const DECISION_ACTION_TYPES = ['chi', 'pon', 'daiminkan', 'ankan', 'hora', 'reach'];

function withReviewKeys(reviewEntries) {
    return (reviewEntries || []).map((entry, index) => ({
        ...entry,
        _reviewKey: String(index),
    }));
}

function reviewEntryKey(entry) {
    return entry?._reviewKey || '';
}

function actionMatchesActual(action, actual) {
    if (!action || !actual) return false;
    const actionTile = action.pai || null;
    const actualTile = actual.pai || null;
    return action.type === actual.type
        && (actionTile === actualTile || sameTileKind(actionTile, actualTile))
        && JSON.stringify(action.consumed || []) === JSON.stringify(actual.consumed || []);
}

function reviewEntryGradeStats(entry) {
    const details = entry?.details || [];
    const finiteDetails = details.filter(detail => Number.isFinite(detail.prob));
    if (!finiteDetails.length) return null;
    const bestProbability = finiteDetails.reduce((best, detail) => Math.max(best, detail.prob), 0);
    const actualDetail = Number.isInteger(entry.actual_index)
        ? details[entry.actual_index]
        : finiteDetails.find(detail => actionMatchesActual(detail.action, entry.actual || { type: 'none' }));
    const playerProbability = Number.isFinite(actualDetail?.prob) ? actualDetail.prob : 0;
    return {
        bestProbability,
        playerProbability,
        regret: Math.max(0, bestProbability - playerProbability),
    };
}

function isTileSuggestionDecision(entry) {
    return entry?.details?.some(detail => ['dahai', 'reach', 'none'].includes(detail.action?.type)) || false;
}

function actionSuggestionLabel(action, hasReachOption) {
    if (action?.type === 'reach') return 'Riichi';
    if (action?.type === 'none' && hasReachOption) return 'Dama';
    if (action?.type === 'dahai') return 'Discard';
    return actionLabel(action);
}

function tileSuggestions(entry, { riichiDiscardTile = null } = {}) {
    const suggestions = [];
    const hasReachOption = entry?.details?.some(detail => detail.action?.type === 'reach') || false;
    for (const detail of entry?.details || []) {
        const action = detail.action;
        if (!['dahai', 'reach', 'none'].includes(action?.type) || !Number.isFinite(detail.prob)) continue;
        const tile = action.type === 'dahai'
            ? action.pai
            : action.type === 'reach'
                ? riichiDiscardTile || entry.tile
                : entry.tile;
        if (!tile) continue;
        suggestions.push({
            type: action.type,
            tile,
            label: actionSuggestionLabel(action, hasReachOption),
            probability: detail.prob,
        });
    }
    return suggestions
        .sort((a, b) => b.probability - a.probability)
        .filter(item => item.probability >= .01)
        .slice(0, MAX_AI_SUGGESTIONS_LIMIT)
        .map((item, rank) => ({ ...item, rank }));
}

function decisionActions(entry) {
    const actions = [];
    for (const detail of entry?.details || []) {
        const action = detail.action;
        if (!action || (!DECISION_ACTION_TYPES.includes(action.type) && action.type !== 'none')) continue;
        actions.push({
            ...action,
            consumed: [...(action.consumed || [])],
            _probability: detail.prob,
        });
    }
    if (
        actions.some(action => DECISION_ACTION_TYPES.includes(action.type))
        && !actions.some(action => action.type === 'none')
        && entry?.details?.some(detail => detail.action?.type === 'dahai')
    ) {
        actions.push({ type: 'none' });
    }
    const isRiichiDecision = actions.some(action => action.type === 'reach');
    return actions.map((action, index) => ({
        ...action,
        _label: action.type === 'none' && isRiichiDecision ? 'Dama' : undefined,
        _decisionIndex: index,
    }));
}

function isActionDecision(entry) {
    const actionTypes = entry?.details?.map(detail => detail.action?.type) || [];
    return actionTypes.some(type => DECISION_ACTION_TYPES.includes(type))
        && (actionTypes.includes('none') || actionTypes.includes('dahai') || entry.actual?.type === 'hora');
}

function selectedDecisionIndex(entry, actions) {
    if (entry.actual?.type === 'dahai') return actions.find(action => action.type === 'none')?._decisionIndex ?? -1;
    const actual = entry.actual || { type: 'none' };
    const matching = actions.find(action => (
        action.type === actual.type
        && (action.pai || null) === (actual.pai || null)
        && JSON.stringify(action.consumed || []) === JSON.stringify(actual.consumed || [])
    ));
    return matching?._decisionIndex ?? -1;
}

function matchingDecisionIndex(entries, event, remainingTiles) {
    return entries.findIndex(entry => (
        entry.last_actor === event.actor
        && sameTileKind(entry.tile, event.pai)
        && (!Number.isFinite(entry.tiles_left) || entry.tiles_left === remainingTiles)
    ));
}

function nextSelfDiscardTile(events, eventIndex, actor) {
    const nextEvent = events[eventIndex + 1];
    if (nextEvent?.type === 'dahai' && nextEvent.actor === actor) return nextEvent.pai;
    if (nextEvent?.type !== 'reach' || nextEvent.actor !== actor) return null;
    const discardEvent = events[eventIndex + 2];
    return discardEvent?.type === 'dahai' && discardEvent.actor === actor
        ? discardEvent.pai
        : null;
}

function canCallCreateHeroDiscardDecision(event) {
    return event.actor === heroPlayer
        && ['chi', 'pon', 'daiminkan'].includes(event.type);
}

function matchingPostCallDiscardDecisionIndex(entries, event, remainingTiles) {
    const exactIndex = matchingDecisionIndex(entries, event, remainingTiles);
    if (exactIndex >= 0) return exactIndex;
    return entries.findIndex(entry => (
        entry.last_actor === event.actor
        && sameTileKind(entry.tile, event.pai)
        && entry.actual?.type === 'dahai'
    ));
}

function isDiscardCallEvent(event) {
    return ['chi', 'pon', 'daiminkan'].includes(event?.type)
        && Number.isInteger(event.actor)
        && Number.isInteger(event.target);
}

function isNonHeroCallOfDiscard(callEvent, discardEvent) {
    return isDiscardCallEvent(callEvent)
        && callEvent.actor !== heroPlayer
        && callEvent.target === discardEvent?.actor;
}

function buildTurnStates(startEvent, events, reviewEntries = []) {
    const hands = Array.from(
        { length: 4 },
        (_, actor) => [...(startEvent.tehais?.[actor] || [])],
    );
    const drawnTiles = [null, null, null, null];
    const discards = [[], [], [], []];
    const melds = [[], [], [], []];
    const riichiDiscardIndices = [null, null, null, null];
    const doraIndicators = startEvent.dora_marker ? [startEvent.dora_marker] : [];
    let pendingRiichiActor = null;
    let remainingTiles = getInitialRemainingTiles(startEvent);
    const dangerState = {
        unseenTiles: Array.from({ length: 4 }, (_, actor) => initUnseenTilesForPlayer(startEvent, actor)),
        genbutsu: Array.from({ length: 4 }, () => new Set()),
        discardsToRiichi: Array.from({ length: 4 }, () => []),
        riichiAccepted: [false, false, false, false],
        pendingRiichiActor: null,
        dora: doraFromIndicator(startEvent.dora_marker),
    };
    const states = [{
        tehais: hands.map(tiles => [...tiles]),
        drawnTile: null,
        drawnTiles: [...drawnTiles],
        remainingTiles,
        discards: discards.map(tiles => [...tiles]),
        melds: cloneMelds(melds),
        riichiDiscardIndices: [...riichiDiscardIndices],
        doraIndicators: [...doraIndicators],
        dangerRates: [],
    }];
    const keyedReviewEntries = withReviewKeys(reviewEntries);
    const pendingDecisions = keyedReviewEntries.filter(isActionDecision);
    const pendingTileSuggestionDecisions = keyedReviewEntries.filter(isTileSuggestionDecision);
    let pendingSettledDiscardSound = false;
    for (const [eventIndex, event] of events.entries()) {
        let soundKey = '';
        const settleDiscardSound = pendingSettledDiscardSound;
        let tileSound = settleDiscardSound;
        if (event.type === 'tsumo') {
            remainingTiles = Math.max(0, remainingTiles - 1);
            if (Number.isInteger(event.actor) && hands[event.actor]) {
                drawnTiles[event.actor] = event.pai;
            }
        } else if (event.type === 'dahai') {
            tileSound = true;
            const isRiichiDiscard = event.actor === pendingRiichiActor;
            if (Number.isInteger(event.actor) && discards[event.actor]) {
                discards[event.actor].push(event.pai);
            }
            if (Number.isInteger(event.actor) && hands[event.actor]) {
                const actor = event.actor;
                if (drawnTiles[actor] === event.pai && event.tsumogiri) {
                    drawnTiles[actor] = null;
                }
                else {
                    removeTile(hands[actor], event.pai);
                    if (drawnTiles[actor]) hands[actor].push(drawnTiles[actor]);
                    drawnTiles[actor] = null;
                }
            }
            if (isRiichiDiscard) {
                riichiDiscardIndices[event.actor] = discards[event.actor].length - 1;
                pendingRiichiActor = null;
                soundKey = 'reach';
            }
        } else if (event.type === 'reach' && Number.isInteger(event.actor)) {
            pendingRiichiActor = event.actor;
        } else if (
            Number.isInteger(event.actor)
            && hands[event.actor]
            && ['chi', 'pon', 'ankan', 'daiminkan'].includes(event.type)
        ) {
            tileSound = true;
            const actor = event.actor;
            let usedDrawnTile = false;
            for (const tile of event.consumed || []) {
                if (!usedDrawnTile && drawnTiles[actor] === tile) {
                    usedDrawnTile = true;
                    drawnTiles[actor] = null;
                } else {
                    removeTile(hands[actor], tile);
                }
            }
            drawnTiles[actor] = null;
            melds[actor].push({
                type: event.type,
                actor,
                target: event.target,
                pai: event.pai,
                consumed: [...(event.consumed || [])],
            });
        } else if (Number.isInteger(event.actor) && hands[event.actor] && event.type === 'kakan') {
            tileSound = true;
            const actor = event.actor;
            if (drawnTiles[actor] === event.pai) drawnTiles[actor] = null;
            else removeTile(hands[actor], event.pai);
            const upgradedMeld = [...melds[actor]].reverse().find(meld => (
                meld.type === 'pon' && sameTileKind(meld.pai, event.pai)
            ));
            if (upgradedMeld) {
                upgradedMeld.type = 'kakan';
                upgradedMeld.addedPai = event.pai;
            }
        }
        if (event.dora_marker) doraIndicators.push(event.dora_marker);
        if (['chi', 'pon', 'daiminkan'].includes(event.type) && Number.isInteger(event.target)) {
            const targetDiscards = discards[event.target];
            if (targetDiscards?.length) targetDiscards.pop();
        }
        updateDangerState(dangerState, event);
        if (event.type === 'reach') continue;
        states.push({
            tehais: hands.map(tiles => [...tiles]),
            drawnTile: drawnTiles[heroPlayer],
            drawnTiles: [...drawnTiles],
            remainingTiles,
            discards: discards.map(tiles => [...tiles]),
            melds: cloneMelds(melds),
            riichiDiscardIndices: [...riichiDiscardIndices],
            doraIndicators: [...doraIndicators],
            dangerRates: calculateDangerRates(dangerState),
            soundKey,
            tileSound,
            event,
        });
        if (settleDiscardSound) pendingSettledDiscardSound = false;
        if (canCallCreateHeroDiscardDecision(event)) {
            const tileSuggestionDecisionIndex = matchingPostCallDiscardDecisionIndex(
                pendingTileSuggestionDecisions,
                event,
                remainingTiles,
            );
            if (tileSuggestionDecisionIndex >= 0) {
                const [entry] = pendingTileSuggestionDecisions.splice(tileSuggestionDecisionIndex, 1);
                const decisionState = states[states.length - 1];
                decisionState.aiSuggestions = tileSuggestions(entry);
                decisionState.aiReviewKey = reviewEntryKey(entry);
                decisionState.aiReviewGrade = reviewEntryGradeStats(entry);
                if (entry.actual?.type === 'dahai') {
                    decisionState.heroDecision = {
                        type: 'dahai',
                        label: 'Hero Discard',
                        tile: entry.actual.pai,
                    };
                }
            }
        }
        if (event.type === 'dahai' || (event.type === 'tsumo' && event.actor === heroPlayer)) {
            const decisionState = event.actor === heroPlayer && event.type === 'dahai'
                ? states[Math.max(0, states.length - 2)]
                : states[states.length - 1];
            const tileSuggestionDecisionIndex = event.actor === heroPlayer
                ? matchingDecisionIndex(pendingTileSuggestionDecisions, event, remainingTiles)
                : -1;
            if (tileSuggestionDecisionIndex >= 0) {
                const [entry] = pendingTileSuggestionDecisions.splice(tileSuggestionDecisionIndex, 1);
                decisionState.aiSuggestions = tileSuggestions(entry, {
                    riichiDiscardTile: event.type === 'tsumo'
                        ? nextSelfDiscardTile(events, eventIndex, event.actor)
                        : event.pai,
                });
                decisionState.aiReviewKey = reviewEntryKey(entry);
                decisionState.aiReviewGrade = reviewEntryGradeStats(entry);
            }
            if (event.actor === heroPlayer && event.type === 'dahai') {
                const isRiichiDiscard = riichiDiscardIndices[heroPlayer] === discards[heroPlayer].length - 1;
                decisionState.heroDecision = {
                    type: isRiichiDiscard ? 'reach' : 'dahai',
                    label: isRiichiDiscard ? 'Hero Riichi' : 'Hero Discard',
                    tile: event.pai,
                };
            }

            const decisionIndex = matchingDecisionIndex(pendingDecisions, event, remainingTiles);
            if (decisionIndex >= 0) {
                const [entry] = pendingDecisions.splice(decisionIndex, 1);
                const options = decisionActions(entry);
                const isDiscardReaction = event.type === 'dahai' && event.actor !== heroPlayer;
                const selectedIndex = selectedDecisionIndex(entry, options);
                const selectedAction = options.find(action => action._decisionIndex === selectedIndex);
                if (isDiscardReaction && !settleDiscardSound) states[states.length - 1].tileSound = false;
                states[states.length - 1].actionDecision = {
                    trigger: isDiscardReaction ? { actor: event.actor, pai: event.pai } : null,
                    options,
                    selectedIndex,
                    reviewKey: reviewEntryKey(entry),
                    reviewGrade: reviewEntryGradeStats(entry),
                };
                if (isDiscardReaction && selectedAction?.type === 'none') {
                    pendingSettledDiscardSound = true;
                }
            } else if (event.type === 'dahai' && isNonHeroCallOfDiscard(events[eventIndex + 1], event)) {
                states[states.length - 1].tileSound = false;
                states[states.length - 1].actionDecision = {
                    trigger: { actor: event.actor, pai: event.pai },
                    options: [],
                    selectedIndex: -1,
                };
            } else if (
                event.type === 'tsumo'
                && events[eventIndex + 1]?.type === 'hora'
                && events[eventIndex + 1]?.actor === heroPlayer
                && events[eventIndex + 1]?.target === heroPlayer
            ) {
                // Some replay producers omit the review entry for a taken
                // self-draw win. Preserve the UI decision state from MJAI.
                states[states.length - 1].actionDecision = {
                    trigger: null,
                    options: [
                        { type: 'hora', actor: heroPlayer, target: heroPlayer, _decisionIndex: 0 },
                        { type: 'none', _decisionIndex: 1 },
                    ],
                    selectedIndex: 0,
                };
            }
        }
    }
    return states;
}

function timelinePosition(roundPosition = roundIndex, turnPosition = turnIndex) {
    let position = 0;
    for (let index = 0; index < roundPosition; index++) {
        position += rounds[index]?.turnStates?.length || 1;
    }
    return position + turnPosition;
}

function selectTurn(index, { playSound = true, previousTimelinePosition = timelinePosition() } = {}) {
    const states = rounds[roundIndex].turnStates || [];
    turnIndex = Math.max(0, Math.min(index, states.length - 1));
    round = { ...rounds[roundIndex], ...(states[turnIndex] || {}) };
    const nextIdentity = `${roundIndex}:${turnIndex}`;
    const movedForward = timelinePosition() > previousTimelinePosition;
    if (playSound && movedForward && nextIdentity !== selectedTurnIdentity) playSoundForVisibleTurn();
    selectedTurnIdentity = nextIdentity;
}

function hasDecisionState(state) {
    return (Array.isArray(state.aiSuggestions) && state.aiSuggestions.length)
        || Boolean(state.heroDecision)
        || (Array.isArray(state.actionDecision?.options) && state.actionDecision.options.length);
}

function decisionIndicesForRound(roundPosition) {
    const states = rounds[roundPosition]?.turnStates || [];
    return states
        .map((state, index) => ({ state, index }))
        .filter(({ state }) => hasDecisionState(state))
        .map(({ index }) => index);
}

function decisionIndices() {
    return decisionIndicesForRound(roundIndex);
}

function moveToIndexInList(indices, direction) {
    const targetIndex = targetIndexInList(indices, direction);
    if (!Number.isInteger(targetIndex)) return false;
    selectTurn(targetIndex);
    return true;
}

function targetIndexInList(indices, direction, currentTurnIndex = turnIndex) {
    if (!indices.length || !direction) return false;
    const currentPosition = indices.findIndex(index => index >= currentTurnIndex);
    let targetPosition;
    if (direction > 0) {
        if (currentPosition < 0) return null;
        targetPosition = currentPosition >= 0 && indices[currentPosition] === currentTurnIndex
            ? currentPosition + 1
            : Math.max(0, currentPosition);
    } else {
        if (currentPosition < 0) {
            return indices[indices.length - 1];
        }
        targetPosition = currentPosition >= 0 && indices[currentPosition] === currentTurnIndex
            ? currentPosition - 1
            : currentPosition - 1;
    }
    if (targetPosition < 0 || targetPosition >= indices.length) return null;
    return indices[targetPosition];
}

function decisionTargetTurn(direction) {
    const indices = decisionIndices();
    if (!indices.length || !direction) return null;

    if (direction > 0) {
        const currentPosition = indices.findIndex(index => index >= turnIndex);
        const isAtLastDecision = currentPosition === indices.length - 1
            && indices[currentPosition] === turnIndex;
        const isPastLastDecision = currentPosition < 0;

        if (isAtLastDecision || isPastLastDecision) {
            const lastTurnIndex = Math.max(0, (rounds[roundIndex].turnStates?.length || 1) - 1);
            return turnIndex >= lastTurnIndex ? null : lastTurnIndex;
        }
    } else {
        const firstDecisionIndex = indices[0];
        if (turnIndex <= firstDecisionIndex) {
            return turnIndex <= 0 ? null : 0;
        }
    }

    return targetIndexInList(indices, direction);
}

function moveDecision(direction) {
    const targetTurnIndex = decisionTargetTurn(direction);
    if (!Number.isInteger(targetTurnIndex)) return false;
    selectTurn(targetTurnIndex);
    return true;
}

function bestProbability(items) {
    return items.reduce((best, item) => (
        Number.isFinite(item?._probability) || Number.isFinite(item?.probability)
            ? Math.max(best, item._probability ?? item.probability)
            : best
    ), 0);
}

function heroTileDecisionProbability(state) {
    if (!state.heroDecision || !Array.isArray(state.aiSuggestions)) return 0;
    const matching = state.aiSuggestions.find(suggestion => (
        sameTileKind(suggestion.tile, state.heroDecision.tile)
        && (
            suggestion.type === state.heroDecision.type
            || (state.heroDecision.type === 'reach' && suggestion.type === 'reach')
            || (state.heroDecision.type === 'dahai' && suggestion.type === 'dahai')
        )
    ));
    return Number.isFinite(matching?.probability) ? matching.probability : 0;
}

function heroActionDecisionProbability(state) {
    const decision = state.actionDecision;
    if (!Array.isArray(decision?.options)) return 0;
    const selected = decision.options.find(action => action._decisionIndex === decision.selectedIndex);
    return Number.isFinite(selected?._probability) ? selected._probability : 0;
}

function aiReviewDelta(state) {
    const tileDelta = state.heroDecision && Array.isArray(state.aiSuggestions)
        ? bestProbability(state.aiSuggestions) - heroTileDecisionProbability(state)
        : 0;
    const actionDelta = Array.isArray(state.actionDecision?.options)
        ? bestProbability(state.actionDecision.options) - heroActionDecisionProbability(state)
        : 0;
    return Math.max(tileDelta, actionDelta);
}

function matchGrade(score) {
    if (score >= 97) return 'S+';
    if (score >= 94) return 'S';
    if (score >= 90) return 'S-';
    if (score >= 87) return 'A+';
    if (score >= 84) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 77) return 'B+';
    if (score >= 74) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 67) return 'C+';
    if (score >= 64) return 'C';
    if (score >= 60) return 'C-';
    if (score >= 50) return 'D';
    return 'F';
}

function formatDebugPercent(value) {
    return Number.isFinite(value) ? `${(value * 100).toFixed(2)}%` : '-';
}

function debugGradeCalculation(label, result, rows) {
    if (!GRADE_DEBUG) return;
    const debugKey = [
        ENGINE_DEBUG_VERSION,
        label,
        result?.reviewedDecisions ?? 0,
        result?.grade ?? '-',
        result?.score?.toFixed?.(2) ?? '-',
        rows.map(row => `${row.stateIndex}:${row.reviewKey}:${row.status}:${row.regret}`).join('|'),
    ].join('::');
    if (loggedGradeDebugKeys.has(debugKey)) return;
    loggedGradeDebugKeys.add(debugKey);
    console.log(`[GradeDebug] ${label}`, {
        reviewedDecisions: result?.reviewedDecisions ?? 0,
        totalRegret: result?.totalRegret ?? 0,
        averageRegret: result?.averageRegret ?? 0,
        score: result?.score ?? null,
        grade: result?.grade ?? null,
    });
    console.table(rows);
}

function calculateGradeForStates(states, label = 'grade') {
    const stateList = states || [];
    const countedReviewKeys = new Set();
    let reviewedDecisions = 0;
    let totalRegret = 0;
    const debugRows = [];
    for (const [stateIndex, state] of stateList.entries()) {
        const hasTileReview = Boolean(state.heroDecision) && Array.isArray(state.aiSuggestions) && state.aiSuggestions.length;
        const hasActionReview = Array.isArray(state.actionDecision?.options)
            && state.actionDecision.options.some(action => (
                Number.isFinite(action?._probability) || Number.isFinite(action?.probability)
            ));
        const reviewKey = state.aiReviewKey || state.actionDecision?.reviewKey || '';
        const gradeStats = state.aiReviewGrade || state.actionDecision?.reviewGrade || null;
        const tileDelta = hasTileReview ? (
            bestProbability(state.aiSuggestions) - heroTileDecisionProbability(state)
        ) : 0;
        const actionDelta = hasActionReview ? (
            bestProbability(state.actionDecision.options) - heroActionDecisionProbability(state)
        ) : 0;
        const stateRegret = gradeStats?.regret;
        const debugRow = {
            stateIndex,
            reviewKey,
            event: state.event?.type || '',
            actor: Number.isInteger(state.event?.actor) ? state.event.actor : '',
            tile: state.event?.pai || state.heroDecision?.tile || '',
            hasTileReview: Boolean(hasTileReview),
            hasActionReview: Boolean(hasActionReview),
            tileDelta: formatDebugPercent(tileDelta),
            actionDelta: formatDebugPercent(actionDelta),
            bestProbability: formatDebugPercent(gradeStats?.bestProbability),
            playerProbability: formatDebugPercent(gradeStats?.playerProbability),
            regret: formatDebugPercent(stateRegret),
            status: 'counted',
        };
        if (!gradeStats) {
            debugRow.status = 'skip:no-review';
            debugRows.push(debugRow);
            continue;
        }
        if (reviewKey && countedReviewKeys.has(reviewKey)) {
            debugRow.status = 'skip:duplicate-review-key';
            debugRows.push(debugRow);
            continue;
        }
        if (!Number.isFinite(stateRegret)) {
            debugRow.status = 'skip:non-finite-regret';
            debugRows.push(debugRow);
            continue;
        }
        if (reviewKey) countedReviewKeys.add(reviewKey);
        reviewedDecisions++;
        totalRegret += Math.max(0, stateRegret);
        debugRows.push(debugRow);
    }
    if (!reviewedDecisions) {
        debugGradeCalculation(label, null, debugRows);
        return null;
    }
    const averageRegret = totalRegret / reviewedDecisions;
    const score = Math.max(0, Math.min(100, 100 - averageRegret * 180));
    const result = {
        reviewedDecisions,
        totalRegret,
        averageRegret,
        score,
        grade: matchGrade(score),
    };
    debugGradeCalculation(label, result, debugRows);
    return result;
}

function calculateRoundGrade(roundItem) {
    return calculateGradeForStates(roundItem?.turnStates || [], `round ${roundIndex + 1}`);
}

function calculateOverallGrade() {
    return calculateGradeForStates(rounds.flatMap(roundItem => roundItem.turnStates || []), 'overall');
}

function renderHeroSeatGrade() {
    if (!heroSeatRoundGrade || !heroSeatOverallGrade) return;
    const currentRoundGrade = calculateRoundGrade(rounds[roundIndex]);
    const overallGrade = calculateOverallGrade();
    heroSeatRoundGrade.textContent = `Round: ${currentRoundGrade?.grade || '-'}`;
    heroSeatOverallGrade.textContent = `Overall: ${overallGrade?.grade || '-'}`;
}

function aiReviewDecisionIndicesForRound(roundPosition) {
    const states = rounds[roundPosition]?.turnStates || [];
    return states
        .map((state, index) => ({ state, index }))
        .filter(({ state }) => aiReviewDelta(state) > aiReviewDeltaThreshold)
        .map(({ index }) => index);
}

function aiReviewDecisionIndices() {
    return aiReviewDecisionIndicesForRound(roundIndex);
}

function moveAiReviewDecision(direction) {
    return moveToIndexInList(aiReviewDecisionIndices(), direction);
}

function aiReviewDecisionTargetTurn(direction) {
    const indices = aiReviewDecisionIndices();
    if (!indices.length || !direction) return null;

    if (direction > 0) {
        const currentPosition = indices.findIndex(index => index >= turnIndex);
        const isAtLastDecision = currentPosition === indices.length - 1
            && indices[currentPosition] === turnIndex;
        const isPastLastDecision = currentPosition < 0;

        if (isAtLastDecision || isPastLastDecision) {
            const lastTurnIndex = Math.max(0, (rounds[roundIndex].turnStates?.length || 1) - 1);
            return turnIndex >= lastTurnIndex ? null : lastTurnIndex;
        }
    } else {
        const firstDecisionIndex = indices[0];
        if (turnIndex <= firstDecisionIndex) {
            return turnIndex <= 0 ? null : 0;
        }
    }

    return targetIndexInList(indices, direction);
}

function cancelNavigationReplay() {
    navigationReplayToken++;
    if (navigationReplayTimer) {
        clearTimeout(navigationReplayTimer);
        navigationReplayTimer = null;
    }
}

function selectTurnInRound(targetRoundIndex, targetTurnIndex, previousTimelinePosition = timelinePosition()) {
    roundIndex = targetRoundIndex;
    selectTurn(targetTurnIndex, { previousTimelinePosition });
}

function navigateToTurn(targetRoundIndex, targetTurnIndex) {
    if (
        !Number.isInteger(targetRoundIndex)
        || !Number.isInteger(targetTurnIndex)
        || !rounds[targetRoundIndex]?.turnStates?.length
    ) {
        return false;
    }
    if (targetRoundIndex === roundIndex && targetTurnIndex === turnIndex) return false;

    cancelNavigationReplay();
    const previousTimelinePosition = timelinePosition();
    const targetTimelinePosition = timelinePosition(targetRoundIndex, targetTurnIndex);
    const wrapsToEarlierRound = targetRoundIndex !== roundIndex
        && targetTimelinePosition < previousTimelinePosition;

    if (
        navigationReplayDelay <= 0
        || targetTimelinePosition === previousTimelinePosition
        || wrapsToEarlierRound
    ) {
        selectTurnInRound(targetRoundIndex, targetTurnIndex, previousTimelinePosition);
        render();
        return true;
    }

    const direction = targetTimelinePosition > previousTimelinePosition ? 1 : -1;
    const token = navigationReplayToken;
    const step = () => {
        if (token !== navigationReplayToken) return;
        if (roundIndex === targetRoundIndex && turnIndex === targetTurnIndex) {
            navigationReplayTimer = null;
            return;
        }
        if (!moveTurn(direction)) {
            selectTurnInRound(targetRoundIndex, targetTurnIndex, timelinePosition());
        }
        render();
        if (roundIndex === targetRoundIndex && turnIndex === targetTurnIndex) {
            navigationReplayTimer = null;
            return;
        }
        navigationReplayTimer = setTimeout(step, navigationReplayDelay);
    };

    navigationReplayTimer = setTimeout(step, navigationReplayDelay);
    return true;
}

function navigateDecision(direction) {
    const targetTurnIndex = decisionTargetTurn(direction);
    if (!Number.isInteger(targetTurnIndex)) return false;
    return navigateToTurn(roundIndex, targetTurnIndex);
}

function navigateAiReviewDecision(direction) {
    const targetTurnIndex = aiReviewDecisionTargetTurn(direction);
    if (!Number.isInteger(targetTurnIndex)) return false;
    return navigateToTurn(roundIndex, targetTurnIndex);
}

function navigateToNextRoundDecision(indicesForRound) {
    if (rounds.length <= 1) return false;

    for (let offset = 1; offset < rounds.length; offset++) {
        const targetRoundIndex = (roundIndex + offset) % rounds.length;
        const indices = indicesForRound(targetRoundIndex);
        if (!indices.length) continue;

        return navigateToTurn(targetRoundIndex, indices[0]);
    }

    return false;
}

function windName(wind) {
    return { E: 'East', S: 'South', W: 'West', N: 'North' }[wind] || wind || 'East';
}

function roundLabel() {
    return `${windName(round.bakaze)} ${round.kyoku || 1} R${round.honba || 0}`;
}

function decisionLabel() {
    const indices = decisionIndices();
    if (!indices.length) return 'Decision 0 / 0';
    let position = indices.findIndex(index => index === turnIndex);
    if (position < 0) position = indices.filter(index => index <= turnIndex).length - 1;
    return `Decision ${Math.max(0, position) + 1} / ${indices.length}`;
}

function moveTurn(direction) {
    const lastTurnIndex = Math.max(0, (rounds[roundIndex].turnStates?.length || 1) - 1);
    const previousTimelinePosition = timelinePosition();

    if (direction > 0) {
        if (turnIndex < lastTurnIndex) {
            selectTurn(turnIndex + 1, { previousTimelinePosition });
        } else if (roundIndex < rounds.length - 1) {
            roundIndex++;
            selectTurn(0, { previousTimelinePosition });
        } else {
            return false;
        }
    } else if (direction < 0) {
        if (turnIndex > 0) {
            selectTurn(turnIndex - 1, { previousTimelinePosition });
        } else if (roundIndex > 0) {
            roundIndex--;
            const previousRoundLastTurn = Math.max(0, (rounds[roundIndex].turnStates?.length || 1) - 1);
            selectTurn(previousRoundLastTurn, { previousTimelinePosition });
        } else {
            return false;
        }
    } else {
        return false;
    }

    return true;
}

function isTerminalRoundEvent(event) {
    return event?.type === 'hora' || event?.type === 'ryukyoku';
}

function sum(values) {
    return values.reduce((total, value) => total + value, 0);
}

function currentRoundRiichiStickCounts(events) {
    const sticks = [0, 0, 0, 0];
    for (const [index, event] of events.entries()) {
        if (event.type === 'reach_accepted' && Number.isInteger(event.actor)) {
            sticks[event.actor]++;
        } else if (
            event.type === 'ryukyoku'
            && sum(sticks) === 3
            && events[index - 2]?.type === 'reach'
            && Number.isInteger(events[index - 2].actor)
        ) {
            sticks[events[index - 2].actor]++;
        }
    }
    return sticks;
}

function parseSplitResult(splitResult) {
    if (!Array.isArray(splitResult)) return { type: '', deltas: null, handDetails: [] };
    const handDetails = [];
    let deltas = null;
    for (const item of splitResult.slice(1)) {
        if (!Array.isArray(item)) continue;
        if (item.length === 4 && item.every(value => Number.isFinite(value))) {
            deltas = deltas
                ? deltas.map((value, index) => value + item[index])
                : [...item];
        } else if (
            item.length >= 4
            && Number.isInteger(item[0])
            && Number.isInteger(item[1])
            && typeof item[3] === 'string'
        ) {
            handDetails.push({
                winner: item[0],
                payer: item[1],
                pao: item[2],
                scoreLine: item[3],
                yaku: item.slice(4),
            });
        }
    }
    return { type: splitResult[0] || '', deltas, handDetails };
}

function endStatusDeltas(endStatuses) {
    const deltas = [0, 0, 0, 0];
    for (const status of endStatuses) {
        if (!Array.isArray(status?.deltas)) continue;
        for (let index = 0; index < 4; index++) {
            deltas[index] += Number(status.deltas[index]) || 0;
        }
    }
    return deltas;
}

function startingDealerTieOrder(actor) {
    return (actor - startingDealer + 4) % 4;
}

function rankScores(scores) {
    const ordered = scores
        .map((score, actor) => ({ actor, score }))
        .sort((a, b) => b.score - a.score || startingDealerTieOrder(a.actor) - startingDealerTieOrder(b.actor));
    const ranks = Array(scores.length).fill(1);
    ordered.forEach((item, index) => {
        ranks[item.actor] = index + 1;
    });
    return ranks;
}

function terminalStatusesFromEvents(events) {
    return events
        .filter(event => isTerminalRoundEvent(event))
        .map(event => ({
            type: event.type,
            actor: event.actor,
            target: event.target,
            deltas: Array.isArray(event.deltas) ? [...event.deltas] : [0, 0, 0, 0],
            ura_markers: Array.isArray(event.ura_markers) ? [...event.ura_markers] : [],
        }));
}

function buildRoundResult(startEvent, events, reviewRound, splitLogRound, isGameEnd = false) {
    const splitResult = splitLogRound?.log?.[0]?.at?.(-1);
    const parsedSplitResult = parseSplitResult(splitResult);
    const endStatuses = Array.isArray(reviewRound?.end_status) && reviewRound.end_status.length
        ? reviewRound.end_status.map(status => ({ ...status }))
        : terminalStatusesFromEvents(events);
    if (!endStatuses.length && !parsedSplitResult.type) return null;

    const startScores = Array.isArray(startEvent.scores)
        ? startEvent.scores.slice(0, 4).map(score => Number(score) || 0)
        : [...defaultRound.scores];
    const baseDeltas = parsedSplitResult.deltas || endStatusDeltas(endStatuses);
    const riichiSticks = currentRoundRiichiStickCounts(events);
    const scoreDeltas = baseDeltas.map((delta, actor) => (Number(delta) || 0) - riichiSticks[actor] * 1000);
    const finalScores = startScores.map((score, actor) => score + scoreDeltas[actor]);
    const isDraw = parsedSplitResult.type === '流局'
        || (endStatuses.length > 0 && endStatuses.every(status => status.type === 'ryukyoku'));

    return {
        isGameEnd,
        isDraw,
        endStatuses,
        splitResult,
        handDetails: parsedSplitResult.handDetails,
        startScores,
        scoreDeltas,
        finalScores,
        startRanks: rankScores(startScores),
        finalRanks: rankScores(finalScores),
    };
}

function attachRoundResultToTerminalState(states, result) {
    if (!result) return;
    for (let index = states.length - 1; index >= 0; index--) {
        if (isTerminalRoundEvent(states[index].event)) {
            states[index].roundResult = result;
            return;
        }
    }
}

function relativeSeatName(actor) {
    return ['Hero', 'Shimocha', 'Toimen', 'Kamicha'][relativeSeat(actor)] || `Player ${actor + 1}`;
}

function formatScore(value) {
    return String(Number(value) || 0);
}

function formatSignedScore(value) {
    const number = Number(value) || 0;
    return `${number > 0 ? '+' : ''}${number}`;
}

function deltaClass(value) {
    const number = Number(value) || 0;
    if (number > 0) return 'round-result-delta--positive';
    if (number < 0) return 'round-result-delta--negative';
    return 'round-result-delta--zero';
}

function resultRoleForActor(actor, result) {
    if (result.isDraw) return 'Exhaustive draw';
    const roles = [];
    for (const status of result.endStatuses) {
        if (status.type !== 'hora') continue;
        if (status.actor === actor) roles.push(status.actor === status.target ? 'Tsumo' : 'Ron');
        else if (status.target === actor) roles.push('Deal-in');
    }
    return [...new Set(roles)].join(' / ');
}

const YAKU_TRANSLATIONS = {
    '流し満貫': 'Nagashi Mangan',
    '四家立直': 'Draw: Quadruple riichi',
    '切り上げ満貫': 'Mangan',
    '三倍満': 'Sanbaiman',
    '倍満': 'Baiman',
    '跳満': 'Haneman',
    '満貫': 'Mangan',
    '役満': 'Yakuman',
    '門前清自摸和': 'Fully Concealed Hand',
    'ダブル立直': 'Double Riichi',
    '混一色': 'Half Flush',
    '役牌:自風牌': 'Seat Wind',
    '役牌:場風牌': 'Prevalent Wind',
    '役牌 白': 'White Dragon',
    '役牌 發': 'Green Dragon',
    '役牌 中': 'Red Dragon',
    '断幺九': 'All Simples',
    '一盃口': 'Iipeikou',
    '平和': 'Pinfu',
    '一発': 'Ippatsu',
    '立直': 'Riichi',
    '赤ドラ': 'Red Five',
    '裏ドラ': 'Ura Dora',
    '抜きドラ': 'Kita',
    'ドラ': 'Dora',
};

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function translateResultText(value) {
    let text = String(value || '');
    const terms = Object.keys(YAKU_TRANSLATIONS).sort((a, b) => b.length - a.length);
    for (const term of terms) {
        text = text.replace(new RegExp(escapeRegExp(term), 'g'), YAKU_TRANSLATIONS[term]);
    }
    return text
        .replace(/([0-9]+)符/g, '$1 Fu')
        .replace(/([0-9]+)飜/g, '$1 Han')
        .replace(/点/g, ' points')
        .replace(/∀/g, ' all')
        .replace(/([A-Za-z])([0-9])/g, '$1 $2')
        .replace(/([A-Za-z])\(/g, '$1 (')
        .replace(/\s+/g, ' ')
        .trim();
}

function currentRoundResultKey() {
    return round.roundResult ? `${roundIndex}:${turnIndex}` : '';
}

function renderRoundResultOverlay() {
    const result = round.roundResult;
    if (!result) return;
    roundResultTitle.textContent = result.isGameEnd ? 'Game End' : 'Round End';

    const actors = [0, 1, 2, 3].sort((first, second) => (
        result.finalRanks[first] - result.finalRanks[second]
        || result.finalScores[second] - result.finalScores[first]
        || relativeSeat(first) - relativeSeat(second)
    ));
    const heading = document.createElement('div');
    heading.className = 'round-result-row round-result-row--head';
    for (const label of ['Place', '', 'Player', 'Score', 'Result', 'Points']) {
        const cell = document.createElement('span');
        cell.textContent = label;
        heading.append(cell);
    }
    const rows = actors.map(actor => {
        const row = document.createElement('div');
        row.className = `round-result-row${actor === heroPlayer ? ' round-result-row--hero' : ''}`;

        const place = document.createElement('span');
        place.className = 'round-result-place';
        place.textContent = String(result.finalRanks[actor]);

        const movement = document.createElement('span');
        const movementType = result.finalRanks[actor] < result.startRanks[actor]
            ? 'up'
            : result.finalRanks[actor] > result.startRanks[actor]
                ? 'down'
                : 'same';
        movement.className = `round-result-move round-result-move--${movementType}`;
        movement.setAttribute('aria-label', movementType === 'up' ? 'Rank up' : movementType === 'down' ? 'Rank down' : 'Rank unchanged');

        const name = document.createElement('span');
        name.className = 'round-result-name';
        name.textContent = relativeSeatName(actor);

        const score = document.createElement('span');
        score.className = 'round-result-score';
        score.textContent = formatScore(result.finalScores[actor]);

        const role = document.createElement('span');
        role.className = 'round-result-role';
        role.textContent = resultRoleForActor(actor, result);

        const delta = document.createElement('span');
        delta.className = `round-result-delta ${deltaClass(result.scoreDeltas[actor])}`;
        delta.textContent = formatSignedScore(result.scoreDeltas[actor]);

        row.append(place, movement, name, score, role, delta);
        return row;
    });
    roundResultRanking.replaceChildren(heading, ...rows);

    if (result.isDraw || !result.handDetails.length) {
        roundResultDetails.replaceChildren();
        roundResultDetails.hidden = true;
    } else {
        const details = result.handDetails.map(detail => {
            const hand = document.createElement('section');
            hand.className = 'round-result-hand';

            const header = document.createElement('div');
            header.className = 'round-result-hand__header';

            const title = document.createElement('div');
            title.className = 'round-result-hand__title';
            title.textContent = `${relativeSeatName(detail.winner)} ${detail.winner === detail.payer ? 'Tsumo' : 'Ron'}`;

            const score = document.createElement('div');
            score.className = 'round-result-hand__score';
            score.textContent = translateResultText(detail.scoreLine);

            header.append(title, score);

            const yaku = document.createElement('div');
            yaku.className = 'round-result-yaku';
            const yakuItems = detail.yaku.map(item => {
                const chip = document.createElement('span');
                chip.className = 'round-result-yaku__item';
                chip.textContent = translateResultText(item);
                return chip;
            });
            yaku.replaceChildren(...yakuItems);
            hand.append(header, yaku);
            return hand;
        });
        roundResultDetails.replaceChildren(...details);
        roundResultDetails.hidden = false;
    }
}

function cancelRoundResultTimer() {
    if (roundResultTimer) {
        clearTimeout(roundResultTimer);
        roundResultTimer = null;
    }
    roundResultPending = false;
    pendingRoundResultKey = '';
}

function hideRoundResultOverlay() {
    cancelRoundResultTimer();
    roundResultOverlay.hidden = true;
    roundResultVisible = false;
}

function cancelRoundResultOverlay() {
    hideRoundResultOverlay();
    lastShownRoundResultKey = '';
}

function scheduleRoundResultOverlay() {
    const key = currentRoundResultKey();
    if (!key) {
        cancelRoundResultOverlay();
        return;
    }
    if (lastShownRoundResultKey === key) return;
    if (roundResultPending && pendingRoundResultKey === key) return;
    cancelRoundResultTimer();
    roundResultPending = true;
    pendingRoundResultKey = key;
    roundResultTimer = setTimeout(() => {
        roundResultTimer = null;
        if (currentRoundResultKey() !== key) {
            roundResultPending = false;
            pendingRoundResultKey = '';
            return;
        }
        renderRoundResultOverlay();
        roundResultOverlay.hidden = false;
        roundResultVisible = true;
        roundResultPending = false;
        pendingRoundResultKey = '';
        lastShownRoundResultKey = key;
    }, ROUND_RESULT_DELAY_MS);
}

function syncRoundResultOverlay() {
    if (round.roundResult) scheduleRoundResultOverlay();
    else cancelRoundResultOverlay();
}

function consumeRoundResultInteraction(event) {
    if (roundResultVisible) {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        hideRoundResultOverlay();
        return true;
    }
    if (roundResultPending) {
        event?.preventDefault?.();
        event?.stopPropagation?.();
        return true;
    }
    return false;
}

function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(min, Math.min(max, number));
}

function closeAiReviewSettings() {
    aiReviewSettings.hidden = true;
    aiReviewSettingsToggle.setAttribute('aria-expanded', 'false');
}

function closeAppSettings() {
    appSettings.hidden = true;
    appSettingsToggle.setAttribute('aria-expanded', 'false');
}

function toggleAiReviewSettings() {
    const nextOpen = aiReviewSettings.hidden;
    if (nextOpen) closeAppSettings();
    aiReviewSettings.hidden = !nextOpen;
    aiReviewSettingsToggle.setAttribute('aria-expanded', String(nextOpen));
}

function toggleAppSettings() {
    const nextOpen = appSettings.hidden;
    if (nextOpen) closeAiReviewSettings();
    appSettings.hidden = !nextOpen;
    appSettingsToggle.setAttribute('aria-expanded', String(nextOpen));
}

function syncSfxVolumeFromInput({ persist = true } = {}) {
    sfxVolume = Math.round(clampNumber(sfxVolumeInput.value, 0, 100, sfxVolume));
    sfxVolumeInput.value = String(sfxVolume);
    sfxVolumeOutput.value = String(sfxVolume);
    if (persist) {
        try {
            localStorage.setItem(SFX_VOLUME_STORAGE_KEY, String(sfxVolume));
        } catch {}
    }
}

function syncNavigationReplayDelayFromInput({ persist = true } = {}) {
    navigationReplayDelay = Math.round(clampNumber(
        navigationReplayDelayInput.value,
        0,
        MAX_NAVIGATION_REPLAY_DELAY_MS,
        navigationReplayDelay,
    ));
    navigationReplayDelayInput.value = String(navigationReplayDelay);
    navigationReplayDelayOutput.value = navigationReplayDelay > 0
        ? `${navigationReplayDelay} ms`
        : 'Instant';
    if (persist) {
        try {
            localStorage.setItem(NAVIGATION_REPLAY_DELAY_STORAGE_KEY, String(navigationReplayDelay));
        } catch {}
    }
}

function syncReviewSettingsFromInputs() {
    dealInMode = dealInModeSelect.value;
    aiScoreMode = aiScoreModeSelect.value;
    maxAiSuggestions = Math.round(clampNumber(
        maxAiSuggestionsInput.value,
        1,
        MAX_AI_SUGGESTIONS_LIMIT,
        maxAiSuggestions,
    ));
    maxAiSuggestionsInput.value = String(maxAiSuggestions);
    const diffTolerance = clampNumber(diffToleranceInput.value, 0, 100, aiReviewDeltaThreshold * 100);
    diffToleranceInput.value = String(diffTolerance);
    aiReviewDeltaThreshold = diffTolerance / 100;
    heroHand.dataset.dealinMode = dealInMode;
    heroHand.dataset.aiScoreMode = aiScoreMode;
    renderedHeroHandKey = '';
    render();
}

function resolveReplaySource(file) {
    const source = file.trim();
    const isAbsoluteHttpUrl = /^https?:\/\//i.test(source);

    if (isAbsoluteHttpUrl) {
        const url = new URL(source);
        if (
            url.hostname === 'mjai.ekyu.moe'
            && url.pathname.startsWith('/report/')
            && url.origin !== location.origin
        ) {
            return new URL(`/api/report?url=${encodeURIComponent(url.href)}`, location.origin);
        }
        return url;
    }

    if (source.startsWith('/api/')) {
        return new URL(source, location.origin);
    }

    // Replay files are served from the app root while this view lives in /new/.
    const replayName = source.split(/[\\/]/).pop();
    return new URL(`/${encodeURIComponent(replayName)}`, location.origin);
}

async function loadRound() {
    const file = new URLSearchParams(location.search).get('data');
    if (!file) return;
    try {
        const response = await fetch(resolveReplaySource(file), { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (Number.isInteger(data.player_id) && data.player_id >= 0 && data.player_id < 4) {
            heroPlayer = data.player_id;
        }
        const replayRounds = data.mjai_log?.filter(item => item.type === 'start_kyoku') || [];
        if (replayRounds.length) {
            startingDealer = Number.isInteger(replayRounds[0].oya) ? replayRounds[0].oya : 0;
            rounds = replayRounds.map((event, replayRoundIndex) => {
                const eventIndex = data.mjai_log.indexOf(event);
                const turnEvents = [];
                for (let index = eventIndex + 1; index < data.mjai_log.length; index++) {
                    const nextEvent = data.mjai_log[index];
                    if (nextEvent.type === 'end_kyoku' || nextEvent.type === 'start_kyoku') break;
                    turnEvents.push(nextEvent);
                }
                const scoredRoundCount = data.split_logs?.length || data.review?.kyokus?.length || replayRounds.length;
                const reviewRound = data.review?.kyokus?.[replayRoundIndex];
                const splitLogRound = data.split_logs?.[replayRoundIndex];
                const replayRound = {
                    ...defaultRound,
                    ...event,
                    remainingTiles: getInitialRemainingTiles(event),
                };
                replayRound.turnStates = buildTurnStates(
                    event,
                    turnEvents,
                    reviewRound?.entries || [],
                );
                attachRoundResultToTerminalState(
                    replayRound.turnStates,
                    buildRoundResult(event, turnEvents, reviewRound, splitLogRound, replayRoundIndex === scoredRoundCount - 1),
                );
                return replayRound;
            });
            roundIndex = 0;
            selectTurn(0, { playSound: false });
        }
    } catch (error) {
        console.warn(`Could not load replay data ${file}:`, error);
    }
    render();
}

function project(localPoint) {
    const point = new Vec3(TABLE_POSITION.x, TABLE_POSITION.y, tableWorldZ).add(localPoint);
    const matrix = camera.viewProjection(decalCanvas.width / decalCanvas.height);
    const x = point.x, y = point.y, z = point.z;
    const clipX = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12];
    const clipY = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13];
    const clipW = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
    return {
        x: (clipX / clipW * .5 + .5) * decalCanvas.width,
        y: (1 - (clipY / clipW * .5 + .5)) * decalCanvas.height,
    };
}

function solveLinearSystem(matrix, values) {
    const size = values.length;
    for (let pivot = 0; pivot < size; pivot++) {
        let bestRow = pivot;
        for (let row = pivot + 1; row < size; row++) {
            if (Math.abs(matrix[row][pivot]) > Math.abs(matrix[bestRow][pivot])) bestRow = row;
        }
        [matrix[pivot], matrix[bestRow]] = [matrix[bestRow], matrix[pivot]];
        [values[pivot], values[bestRow]] = [values[bestRow], values[pivot]];
        const divisor = matrix[pivot][pivot];
        if (Math.abs(divisor) < 1e-10) return null;
        for (let column = pivot; column < size; column++) matrix[pivot][column] /= divisor;
        values[pivot] /= divisor;
        for (let row = 0; row < size; row++) {
            if (row === pivot) continue;
            const factor = matrix[row][pivot];
            for (let column = pivot; column < size; column++) matrix[row][column] -= factor * matrix[pivot][column];
            values[row] -= factor * values[pivot];
        }
    }
    return values;
}

function positionCompassSurface(bounds, z) {
    const source = [
        [0, 0], [compassCanvas.width, 0],
        [compassCanvas.width, compassCanvas.height], [0, compassCanvas.height],
    ];
    const backingToCssX = decalCanvas.clientWidth / decalCanvas.width;
    const backingToCssY = decalCanvas.clientHeight / decalCanvas.height;
    const destination = [
        project(new Vec3(bounds.left, bounds.top, z)),
        project(new Vec3(bounds.right, bounds.top, z)),
        project(new Vec3(bounds.right, bounds.bottom, z)),
        project(new Vec3(bounds.left, bounds.bottom, z)),
    ].map(point => ({ x: point.x * backingToCssX, y: point.y * backingToCssY }));
    const matrix = [];
    const values = [];
    source.forEach(([x, y], index) => {
        const target = destination[index];
        matrix.push([x, y, 1, 0, 0, 0, -target.x * x, -target.x * y]);
        values.push(target.x);
        matrix.push([0, 0, 0, x, y, 1, -target.y * x, -target.y * y]);
        values.push(target.y);
    });
    const h = solveLinearSystem(matrix, values);
    if (!h) return;
    compassCanvas.style.transform = `matrix3d(${[
        h[0], h[3], 0, h[6],
        h[1], h[4], 0, h[7],
        0, 0, 1, 0,
        h[2], h[5], 0, 1,
    ].join(',')})`;
}

function paintCompassTexture() {
    const context = compassContext;
    const centreY = MAT_CENTRE_LOCAL.y;
    const boundsHalfSize = COMPASS_TEXTURE_HALF_SIZE;
    const bounds = {
        left: -boundsHalfSize,
        right: boundsHalfSize,
        top: centreY + boundsHalfSize,
        bottom: centreY - boundsHalfSize,
    };
    const point = (x, y) => ({
        x: (x - bounds.left) / (bounds.right - bounds.left) * compassCanvas.width,
        y: (bounds.top - y) / (bounds.top - bounds.bottom) * compassCanvas.height,
    });
    const label = (text, x, y, { size = 74, color = '#f5f7fb', rotation = 0, weight = 700 } = {}) => {
        const position = point(x, y);
        context.save();
        context.translate(position.x, position.y);
        context.rotate(rotation);
        context.font = `${weight} ${size}px "Segoe UI Variable Display", "Segoe UI", sans-serif`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = color;
        context.fillText(text, 0, 0);
        context.restore();
    };
    const tileCountLabel = (count, x, y, { size = 46, color = '#a7b5ca', weight = 600 } = {}) => {
        const position = point(x, y);
        const iconWidth = 22;
        const iconHeight = 34;
        const gap = 14;
        context.save();
        context.font = `${weight} ${size}px "Segoe UI Variable Display", "Segoe UI", sans-serif`;
        const text = String(count);
        const textWidth = context.measureText(text).width;
        const totalWidth = iconWidth + gap + textWidth;
        context.translate(position.x - totalWidth / 2, position.y);
        context.fillStyle = color;
        context.beginPath();
        context.roundRect(0, -iconHeight / 2, iconWidth, iconHeight, 3);
        context.fill();
        context.textAlign = 'left';
        context.textBaseline = 'middle';
        context.fillText(text, iconWidth + gap, 0);
        context.restore();
    };
    context.clearRect(0, 0, compassCanvas.width, compassCanvas.height);

    // The compass is printed directly on the cloth rather than modelled as a
    // raised automatic-table unit.
    context.save();
    context.beginPath();
    context.roundRect(18, 18, compassCanvas.width - 36, compassCanvas.height - 36, 54);
    context.shadowColor = 'rgba(0, 0, 0, .34)';
    context.shadowBlur = 28;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 12;
    context.fillStyle = '#17233a';
    context.fill();
    context.shadowColor = 'transparent';
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.lineWidth = 5;
    context.strokeStyle = '#526784';
    context.stroke();
    const innerTopLeft = point(-1.15, 1.35);
    const innerBottomRight = point(1.15, -.95);
    context.beginPath();
    context.roundRect(
        innerTopLeft.x,
        innerTopLeft.y,
        innerBottomRight.x - innerTopLeft.x,
        innerBottomRight.y - innerTopLeft.y,
        34,
    );
    context.shadowColor = 'rgba(0, 0, 0, .3)';
    context.shadowBlur = 18;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 8;
    context.fillStyle = '#0c1526';
    context.fill();
    context.shadowColor = 'transparent';
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.lineWidth = 6;
    context.strokeStyle = '#40536f';
    context.stroke();
    context.restore();

    const seatWind = actor => WINDS[(actor - round.oya + 4) % 4];
    const actorAtPosition = position => (heroPlayer + position) % 4;
    const seatIndicator = (actor, x, y, rotation) => {
        const wind = seatWind(actor);
        const position = point(x, y);
        context.save();
        context.translate(position.x, position.y);
        context.rotate(rotation);
        context.beginPath();
        context.roundRect(-54, -54, 108, 108, 14);
        context.fillStyle = wind === 'E' ? '#db454b' : '#2c3d57';
        context.fill();
        context.font = '800 70px "Segoe UI Variable Display", "Segoe UI", sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#ffffff';
        context.fillText(wind, 0, 3);
        context.restore();
    };

    // Each marker sits on the player's left corner while facing the centre.
    seatIndicator(actorAtPosition(0), -1.35, -1.15, 0);
    seatIndicator(actorAtPosition(1), 1.35, -1.15, -Math.PI / 2);
    seatIndicator(actorAtPosition(2), 1.35, 1.55, Math.PI);
    seatIndicator(actorAtPosition(3), -1.35, 1.55, Math.PI / 2);

    const roundName = `${round.bakaze}${round.kyoku}`;
    label(roundName, 0, .18, { size: 100, color: '#56d6e4' });
    label(`● ${round.kyotaku}`, -.23, .49, { size: 50, color: '#a7b5ca', weight: 600 });
    label(`× ${round.honba}`, .23, .49, { size: 50, color: '#a7b5ca', weight: 600 });
    tileCountLabel(round.remainingTiles, 0, -.13, { size: 46, color: '#a7b5ca', weight: 600 });
    label(String(round.scores?.[actorAtPosition(0)] ?? 25000), 0, -.72, { size: 70, color: '#ffc75b', weight: 700 });
    label(String(round.scores?.[actorAtPosition(2)] ?? 25000), 0, 1.12, { size: 70, rotation: Math.PI, color: '#ffc75b', weight: 700 });
    label(String(round.scores?.[actorAtPosition(3)] ?? 25000), -.97, .2, { size: 70, rotation: Math.PI / 2, color: '#ffc75b', weight: 700 });
    label(String(round.scores?.[actorAtPosition(1)] ?? 25000), .97, .2, { size: 70, rotation: -Math.PI / 2, color: '#ffc75b', weight: 700 });
}

function drawDecals() {
    decalContext.clearRect(0, 0, decalCanvas.width, decalCanvas.height);
}

function setCamera(zoomPercent, topView, thetaDegrees) {
    const target = matCentre;
    const theta = thetaDegrees * Math.PI / 180;
    const position = topView
        ? target.add(new Vec3(0, 0, topViewDistance))
        : target.add(new Vec3(
            0,
            -Math.sin(theta) * cameraOrbitRadius,
            Math.cos(theta) * cameraOrbitRadius,
        ));
    const zoom = zoomPercent / 100;
    camera.position = position;
    camera.up = topView
        ? new Vec3(0, 1, 0)
        : new Vec3(0, Math.cos(theta), Math.sin(theta));
    camera.lookInDirection(target.sub(position));
    camera.fov = 2 * Math.atan(Math.tan(baseFov / 2) / zoom) * 180 / Math.PI;
}

function render() {
    const zoom = Number(zoomInput.value);
    zoomOutput.value = `${zoom}%`;
    const angle = Number(angleInput.value);
    angleOutput.value = `${angle}${String.fromCharCode(176)}`;
    tableWorldZ = Number(tableWorldZInput.value);
    tableWorldZOutput.value = tableWorldZ.toFixed(1);
    tableNode.position.z = tableWorldZ;
    compassSurface.position.z = tableWorldZ + COMPASS_TABLE_Z;
    riichiMarkerLayer.position.z = tableWorldZ;
    discardLayer.position.z = tableWorldZ;
    opponentHandLayer.position.z = tableWorldZ;
    meldLayer.position.z = tableWorldZ;
    roundPositionOutput.value = `${roundIndex + 1} / ${rounds.length}`;
    turnPositionOutput.value = `${turnIndex} / ${Math.max(0, (rounds[roundIndex].turnStates?.length || 1) - 1)}`;
    navRoundLabel.value = roundLabel();
    navTurnLabel.value = decisionLabel();
    renderHeroSeatGrade();
    scaleHeroHudToCanvas();
    renderDoraIndicators();
    renderHeroHand();
    renderActionDecision();
    renderDiscards();
    renderOpponentHands();
    renderMelds();
    renderRiichiMarkers();
    rebuildVisibleTileNodes();
    setCamera(zoom, topViewInput.checked, angle);
    paintCompassTexture();
    renderer.render(scene, camera);
    const ratio = Math.min(window.devicePixelRatio || 1, renderer.maxPixelRatio);
    const width = Math.max(1, Math.round(decalCanvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(decalCanvas.clientHeight * ratio));
    if (decalCanvas.width !== width || decalCanvas.height !== height) {
        decalCanvas.width = width;
        decalCanvas.height = height;
    }
    drawDecals();
    syncRoundResultOverlay();
}

sfxVolumeInput.value = String(sfxVolume);
syncSfxVolumeFromInput({ persist: false });
navigationReplayDelayInput.value = String(navigationReplayDelay);
syncNavigationReplayDelayFromInput({ persist: false });
preloadTileFaceImages();
preloadAudioBuffers();

document.addEventListener('pointerdown', warmAudioOnce, { capture: true, once: true });
document.addEventListener('keydown', warmAudioOnce, { capture: true, once: true });
document.addEventListener('wheel', warmAudioOnce, { capture: true, passive: true });

beginButton.addEventListener('click', beginReview);
beginButton.focus();

zoomInput.addEventListener('input', render);
angleInput.addEventListener('input', render);
tableWorldZInput.addEventListener('input', render);
topViewInput.addEventListener('change', render);
heroHand.addEventListener('pointerover', event => {
    const tileElement = event.target.closest?.('.hud-tile');
    if (!tileElement || !heroHand.contains(tileElement)) return;
    setHoveredHeroTileKind(tileElement.dataset.tileKind);
});
heroHand.addEventListener('pointerout', event => {
    if (event.relatedTarget && heroHand.contains(event.relatedTarget)) {
        const tileElement = event.relatedTarget.closest?.('.hud-tile');
        if (tileElement?.dataset.tileKind) {
            setHoveredHeroTileKind(tileElement.dataset.tileKind);
            return;
        }
    }
    setHoveredHeroTileKind(null);
});
window.addEventListener('resize', scaleHeroHudToCanvas);
window.visualViewport?.addEventListener('resize', scaleHeroHudToCanvas);
previousRoundButton.addEventListener('click', event => {
    if (consumeRoundResultInteraction(event)) return;
    cancelNavigationReplay();
    const previousTimelinePosition = timelinePosition();
    roundIndex = (roundIndex - 1 + rounds.length) % rounds.length;
    selectTurn(0, { previousTimelinePosition });
    render();
});
nextRoundButton.addEventListener('click', event => {
    if (consumeRoundResultInteraction(event)) return;
    cancelNavigationReplay();
    const previousTimelinePosition = timelinePosition();
    roundIndex = (roundIndex + 1) % rounds.length;
    selectTurn(0, { previousTimelinePosition });
    render();
});
navPreviousRoundButton.addEventListener('click', event => {
    if (consumeRoundResultInteraction(event)) return;
    cancelNavigationReplay();
    const previousTimelinePosition = timelinePosition();
    roundIndex = (roundIndex - 1 + rounds.length) % rounds.length;
    selectTurn(0, { previousTimelinePosition });
    render();
});
navNextRoundButton.addEventListener('click', event => {
    if (consumeRoundResultInteraction(event)) return;
    cancelNavigationReplay();
    const previousTimelinePosition = timelinePosition();
    roundIndex = (roundIndex + 1) % rounds.length;
    selectTurn(0, { previousTimelinePosition });
    render();
});
previousTurnButton.addEventListener('click', event => {
    if (consumeRoundResultInteraction(event)) return;
    cancelNavigationReplay();
    if (moveTurn(-1)) render();
});
nextTurnButton.addEventListener('click', event => {
    if (consumeRoundResultInteraction(event)) return;
    cancelNavigationReplay();
    if (moveTurn(1)) render();
});
navPreviousTurnButton.addEventListener('click', event => {
    if (consumeRoundResultInteraction(event)) return;
    navigateDecision(-1);
});
navNextTurnButton.addEventListener('click', event => {
    if (consumeRoundResultInteraction(event)) return;
    navigateDecision(1);
});
navPreviousAiReviewButton.addEventListener('click', event => {
    if (consumeRoundResultInteraction(event)) return;
    navigateAiReviewDecision(-1);
});
navNextAiReviewButton.addEventListener('click', event => {
    if (consumeRoundResultInteraction(event)) return;
    navigateAiReviewDecision(1);
});
roundResultOverlay.addEventListener('click', event => {
    consumeRoundResultInteraction(event);
});
roundResultClose.addEventListener('click', event => {
    consumeRoundResultInteraction(event);
});
aiReviewSettings.addEventListener('submit', event => {
    event.preventDefault();
});
aiReviewSettingsToggle.addEventListener('click', event => {
    event.stopPropagation();
    toggleAiReviewSettings();
});
aiReviewSettings.addEventListener('click', event => {
    event.stopPropagation();
});
appSettings.addEventListener('submit', event => {
    event.preventDefault();
});
appSettingsToggle.addEventListener('click', event => {
    event.stopPropagation();
    toggleAppSettings();
});
appSettings.addEventListener('click', event => {
    event.stopPropagation();
});
dealInModeSelect.addEventListener('change', syncReviewSettingsFromInputs);
aiScoreModeSelect.addEventListener('change', syncReviewSettingsFromInputs);
maxAiSuggestionsInput.addEventListener('change', syncReviewSettingsFromInputs);
diffToleranceInput.addEventListener('change', syncReviewSettingsFromInputs);
sfxVolumeInput.addEventListener('input', syncSfxVolumeFromInput);
navigationReplayDelayInput.addEventListener('input', syncNavigationReplayDelayFromInput);
document.addEventListener('click', event => {
    if (userNavDock.contains(event.target)) return;
    if (!aiReviewSettings.hidden) closeAiReviewSettings();
    if (!appSettings.hidden) closeAppSettings();
});

function isEditableKeyboardTarget(target) {
    if (!(target instanceof HTMLElement)) return false;
    const tagName = target.tagName;
    return target.isContentEditable
        || tagName === 'INPUT'
        || tagName === 'SELECT'
        || tagName === 'TEXTAREA';
}

function arrowNavigationKind(key) {
    if (key === 'ArrowRight' || key === 'ArrowLeft') return 'decision';
    if (key === 'ArrowUp' || key === 'ArrowDown') return 'aiReview';
    return '';
}

document.addEventListener('keydown', event => {
    const navigationKind = arrowNavigationKind(event.key);
    if (roundResultVisible && navigationKind) {
        event.preventDefault();
        event.stopPropagation();
        hideRoundResultOverlay();
        const moved = navigationKind === 'aiReview'
            ? navigateToNextRoundDecision(aiReviewDecisionIndicesForRound)
            : navigateToNextRoundDecision(decisionIndicesForRound);
        if (!moved) render();
        return;
    } else if (consumeRoundResultInteraction(event)) {
        return;
    }

    if (event.key === 'Escape') {
        if (!aiReviewSettings.hidden) closeAiReviewSettings();
        if (!appSettings.hidden) closeAppSettings();
        return;
    }
    if (isEditableKeyboardTarget(event.target)) return;

    if (event.key === 'ArrowRight') {
        navigateDecision(1);
    } else if (event.key === 'ArrowLeft') {
        navigateDecision(-1);
    } else if (event.key === 'ArrowUp') {
        navigateAiReviewDecision(1);
    } else if (event.key === 'ArrowDown') {
        navigateAiReviewDecision(-1);
    } else {
        return;
    }

    event.preventDefault();
});
document.addEventListener('wheel', event => {
    if (event.deltaY === 0) return;
    if (roundResultVisible || roundResultPending) {
        event.preventDefault();
        event.stopPropagation();
        return;
    }
    event.preventDefault();
    cancelNavigationReplay();
    if (moveTurn(-Math.sign(event.deltaY))) render();
}, { passive: false });
canvas.addEventListener('mousemove', event => {
    const rect = canvas.getBoundingClientRect();
    const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    const vp = camera.viewProjection(canvas.width / canvas.height);

    let closest = null;
    let closestDist = Infinity;

    for (const { kind, wx, wy, wz } of visibleTileNodes) {
        const clipX = vp[0]*wx + vp[4]*wy + vp[8]*wz + vp[12];
        const clipY = vp[1]*wx + vp[5]*wy + vp[9]*wz + vp[13];
        const clipW = vp[3]*wx + vp[7]*wy + vp[11]*wz + vp[15];
        const px = clipX / clipW;
        const py = clipY / clipW;
        const dist = Math.hypot(px - ndcX, py - ndcY);
        if (dist < closestDist) {
            closestDist = dist;
            closest = kind;
        }
    }

    if (closestDist < 0.08) {
        setHoveredHeroTileKind(closest);
    } else {
        setHoveredHeroTileKind(null);
    }
});
canvas.addEventListener('mouseleave', () => {
    setHoveredHeroTileKind(null);
});
new ResizeObserver(render).observe(canvas);
scaleHeroHudToCanvas();
render();
loadRound();
