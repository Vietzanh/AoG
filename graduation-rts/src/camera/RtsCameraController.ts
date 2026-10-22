import {
    Entity, 
    Vec3, 
    Keyboard,
    Mouse,
    KEY_UP,
    KEY_DOWN,
    KEY_LEFT,
    KEY_RIGHT
} from "playcanvas";


export class RtsCameraController {
    private camera: Entity;
    private keyboard: Keyboard;
    private mouse: Mouse;
    private moveSpeed: number = 40;
    private zoomSpeed: number = 0.2;
    private minZoom: number = 10;
    private maxZoom: number = 30;
    private zoomInput: number = 0;

    constructor(camera: Entity, mouse: Mouse, keyboard: Keyboard) {
        this.camera = camera;
        this.keyboard = keyboard;
        this.mouse = mouse;
        this.mouse.on("mousewheel", (event) => {
            this.zoomInput += event.wheel;
        })
    }

    private getMoveDirection(inputForward: number, inputRight: number): Vec3 {
        if (inputForward === 0 && inputRight === 0) {
            return new Vec3(0, 0, 0);
        }

        const forward = this.camera.getWorldTransform().getZ().mulScalar(-1);
        forward.y = 0;
        forward.normalize();

        const right = this.camera.getWorldTransform().getX();
        right.y = 0;
        right.normalize();

        const direction = forward.clone().mulScalar(inputForward).add(right.clone().mulScalar(inputRight));
        direction.normalize();

        return direction;
    }

    private moveCamera(direction: Vec3, dt: number): void {
        const distance = this.moveSpeed * dt;

        this.camera.translate(
            direction.x * distance,
            direction.y * distance,
            direction.z * distance
        )
    }

    private zoomCamera(zoomDelta: number): void{
        const zoomAmount = zoomDelta * this.zoomSpeed;
        const newZoom = this.camera.camera.orthoHeight - zoomAmount;
        this.camera.camera.orthoHeight = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));

        console.log("orthoHeight: ", this.camera.camera.orthoHeight);
    }

    update(dt: number) {
        const inputForward = this.keyboard.isPressed(KEY_UP) ? 1 : (this.keyboard.isPressed(KEY_DOWN) ? -1 : 0);
        const inputRight = this.keyboard.isPressed(KEY_RIGHT) ? 1 : (this.keyboard.isPressed(KEY_LEFT) ? -1 : 0);
        const moveDirection = this.getMoveDirection(inputForward, inputRight);
        this.moveCamera(moveDirection, dt);

        this.zoomCamera(this.zoomInput);
        this.zoomInput = 0; // Reset zoom input after applying it
    }
}