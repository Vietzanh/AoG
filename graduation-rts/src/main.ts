import {
    AppBase,
    AppOptions,
    CameraComponentSystem,
    Color,
    ContainerHandler,
    Entity,
    FILLMODE_FILL_WINDOW,
    LightComponentSystem,
    RESOLUTION_AUTO,
    RenderComponentSystem,
    RigidBodyComponentSystem,
    CollisionComponentSystem,
    TextureHandler,
    createGraphicsDevice,
    Vec3,
    Keyboard,
    Mouse,
    WasmModule
} from 'playcanvas';

import './style.css';
import {Game} from "./game/Game.ts";
import { RtsCameraController } from './camera/RtsCameraController.ts';

const canvas = document.getElementById('application-canvas') as HTMLCanvasElement;

const device = await createGraphicsDevice(canvas);
device.maxPixelRatio = Math.min(window.devicePixelRatio, 2);

const createOptions = new AppOptions();
createOptions.graphicsDevice = device;
createOptions.componentSystems = [RenderComponentSystem, CameraComponentSystem, LightComponentSystem, RigidBodyComponentSystem, CollisionComponentSystem];
createOptions.resourceHandlers = [TextureHandler, ContainerHandler];

const mouse = new Mouse(canvas);
const keyboard = new Keyboard(window, {
    preventDefault: false
});

WasmModule.setConfig("Ammo", {
    glueUrl:
        "https://developer.playcanvas.com/assets/modules/ammo/ammo.wasm.js",

    wasmUrl:
        "https://developer.playcanvas.com/assets/modules/ammo/ammo.wasm.wasm",

    fallbackUrl:
        "https://developer.playcanvas.com/assets/modules/ammo/ammo.js",
});

await new Promise<void>((resolve) => {
    WasmModule.getInstance("Ammo", () => resolve());
});

console.log("Ammo module loaded");

const app = new AppBase(canvas);
app.init(createOptions);
app.start();
const game = new Game(app, mouse, keyboard, canvas);


// Set the canvas to fill the window and automatically change resolution to be the same as the canvas size
app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
app.setCanvasResolution(RESOLUTION_AUTO);

// Ensure canvas is resized when window changes size
const resize = () => app.resizeCanvas();
window.addEventListener('resize', resize);
app.on('destroy', () => {
    window.removeEventListener('resize', resize);
});

