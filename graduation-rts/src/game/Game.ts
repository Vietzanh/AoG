import {
    Entity,
    Vec2,
    Vec3, 
    AppBase,
    Mouse,
    MouseEvent,
    Keyboard,
    KEY_CONTROL,
    RaycastResult,
    KEY_1,
    KEY_B
} from "playcanvas";
import {Villager} from "../entities/Villager.ts";
import {RtsCameraController} from "../camera/RtsCameraController.ts";
import {ResourceNode, type ResourceType} from "../entities/ResourceNode.ts";
import {TownCenter} from "../entities/TownCenter.ts";
import { ResourceHUD } from "../ui/ResourceHUD.ts";
import type { Building } from "../entities/Building.ts";
import { BuildingPlacementController } from "../build/BuildingPlacementController.ts";

export class Game {
    private app: AppBase;
    private ground: Entity;
    private camera: Entity;
    private light: Entity;
    private mouse: Mouse;
    private mousePosition = new Vec2();
    private cameraController: RtsCameraController;
    private canvas: HTMLCanvasElement;
    private keyboard: Keyboard;
    private buildingPlacementController: BuildingPlacementController;

    private dragStart: Vec2 | null = null;
    private dragCurrent: Vec2 | null = null;
    private isDragging = false;
    private readonly DRAG_THRESHOLD = 5;
    private selectionRect: HTMLDivElement;

    private villagers: Villager[] = [];
    private selectedVillagers: Set<Villager> = new Set();
    private controlGroups: Map<number, Set<Villager>> = new Map();
    private lastKeyPressTime: Map<number, number> = new Map();
    private readonly DOUBLE_TAP_INTERVAL = 300;

    private playerResources: Record<ResourceType, number> = {
        wood: 0,
        food: 0,
        gold: 0
    }
    private resourceHUD: ResourceHUD;
    private resourceNodes: ResourceNode[] = [];

    private buildings: Building[] = [];

    // units lineup formation
    private readonly UNIT_SPACING = 2.5;

    constructor(app: AppBase, mouse: Mouse, keyboard: Keyboard, canvas: HTMLCanvasElement) {
        this.app = app;
        this.ground = new Entity("ground");
        this.camera = new Entity("camera");
        this.light = new Entity("light");
        this.cameraController = new RtsCameraController(this.camera, mouse, keyboard);
        this.buildingPlacementController = new BuildingPlacementController();
        this.villagers.push(new Villager(new Vec3(0,0,0)));
        this.villagers.push(new Villager(new Vec3(5,0,0)));
        this.villagers.push(new Villager(new Vec3(10,0,0)));
        this.villagers.push(new Villager(new Vec3(15,0,0)));
        this.villagers.push(new Villager(new Vec3(20,0,0)));
        this.villagers.push(new Villager(new Vec3(0,0,5)));
        this.villagers.push(new Villager(new Vec3(0,0,10)));
        this.villagers.push(new Villager(new Vec3(0,0,15)));
        this.villagers.push(new Villager(new Vec3(0,0,20)));

        this.resourceNodes.push(new ResourceNode(new Vec3(15,2.5,15), "wood"));

        this.buildings.push(new TownCenter(new Vec3(-5,0,10)));
        
        this.app.root.addChild(this.ground);
        this.app.root.addChild(this.camera);
        this.app.root.addChild(this.light);
        for (const villager of this.villagers) {
            this.app.root.addChild(villager);
        }
        for (const resourceNode of this.resourceNodes) {
            this.app.root.addChild(resourceNode);
        }
        for (const building of this.buildings) {
            this.app.root.addChild(building);
        }

        // initialize ground
        this.ground.addComponent("render", {
            type: "box"
        });
        this.ground.addComponent("collision", {
            type: "box",
            halfExtents: new Vec3(25,0.05,25)
        });
        this.ground.setLocalScale(50,0.1,50);

        // initialize camera
        this.camera.addComponent("camera", {
            projection: "orthographic",
            orthoHeight: 15
        });
        this.camera.setPosition(0,10,0);
        this.camera.setLocalEulerAngles(-45,45,0);

        // initialize light
        this.light.addComponent("light", {
            type: "directional"
        });
        this.light.setLocalEulerAngles(-45,0,0);

        // initialize resource HUD
        this.resourceHUD = new ResourceHUD();
        this.resourceHUD.renderResources(this.playerResources);

        // sync game's update funtion with app's update function
        this.app.on("update", (dt) => {
            this.update(dt);
        });

        // mouse event listener
        this.mouse = mouse;
        this.mouse.on("mousedown", (event) => {
            this.onMouseDown(event);
        }); 
        this.mouse.on("mousemove", (event) => {
            this.mousePosition.set(event.x, event.y);
            this.onMouseMove(event);
        });
        this.mouse.on("mouseup", (event) => {
            this.onMouseUp(event);
        });

        // selection rectangle HTML element
        this.selectionRect = document.createElement("div");
        this.selectionRect.className = "selection-rectangle";
        document.body.appendChild(this.selectionRect);
        this.canvas = canvas;

        // keyboard event listener
        this.keyboard = keyboard;
        this.keyboard.on("keydown", (event) => {
            // playcanvas.KeyboardEvent wraps browser's KeyboardEvent
            const originalEvent = event.event;

            if (event.key === KEY_B) {
                const building = this.buildingPlacementController.createPreview(new Vec3(5,5,5));
                if (building) {
                    const position = this.raycastMousePosition();
                    if (position) {
                        this.buildingPlacementController.updatePreviewPosition(position);
                        this.buildingPlacementController.updatePreviewAppearane(this.resourceNodes, this.buildings);
                        this.app.root.addChild(building);
                    }
                }
            }

            // if key 1 is not tapped or key 1 is being hold instead of tapping, do nothing
            if (event.key !== KEY_1 || originalEvent?.repeat) {
                return;
            }

            // if CTRL is being hold, assign group 1
            if (originalEvent?.ctrlKey) {
                // prevent browser from implementing default action of ctrl + 1 (jump to another tab)
                originalEvent.preventDefault();
                this.assignControlGroups(1);
                this.lastKeyPressTime.delete(1);
                return;
            } 
            // if CTRL is not being hold, select group 1
            else {
                const group = this.controlGroups.get(1);
                if (group && group.size > 0) {
                    this.selectControlGroups(group);
                }
            }

            const now = Date.now();
            const lastPress = this.lastKeyPressTime.get(1);

            // check if key 1 is double tapped
            if (lastPress !== undefined && now - lastPress <= this.DOUBLE_TAP_INTERVAL) {
                const group = this.controlGroups.get(1);
                
                // if group is not empty, select units of group and move camera to 1 of the units
                if (group && group.size > 0) {
                    // get the first unit in the group set using generator
                    const targetUnit = group.values().next().value;

                    if (targetUnit) {
                        this.focusCameraOnUnit(targetUnit);
                    }
                }

                this.lastKeyPressTime.delete(1);
                return;
            } else {
                this.lastKeyPressTime.set(1, now);
            }
        });
    }

    // assign selected villagers into a group
    private assignControlGroups(groupNumber: number): void {
        if (this.selectedVillagers.size === 0) {
            return;
        }
        this.controlGroups.set(groupNumber, new Set(this.selectedVillagers));
    }

    // select a control group
    private selectControlGroups(group: Set<Villager>): void {
        // select villagers of group 1
        this.unselectVillagers();
        for (const villager of group) {
            villager.setSelected(true);
            this.selectedVillagers.add(villager);
        }
    }

    // focus camera on an unit
    private focusCameraOnUnit(unit: Villager) {
        // center of canvas
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // create ray through center of screen
        const from = new Vec3();
        const to = new Vec3();

        this.camera.camera?.screenToWorld(
            centerX,
            centerY,
            this.camera.camera.nearClip,
            from
        );
        this.camera.camera?.screenToWorld(
            centerX,
            centerY,
            this.camera.camera.farClip,
            to
        );

        // find position of the intersection point with ground
        const direction = to.clone().sub(from);
        // check if ray is parrallel to ground
        if (Math.abs(direction.y) < 0.0001) {
            return;
        }

        const t = -from.y / direction.y;    // because ground's y-axis = 0 and from.y + t*direction.y = ground.y = 0
        // if t < 0, intersection point is behind "to"
        if (t < 0) {
            return;
        }

        // calculate X and Z offset from current screen center to unit
        const groundIntersectionPoint = from.clone().add(direction.mulScalar(t));
        const targetUnitPosititon = unit.getPosition();

        const offsetX = targetUnitPosititon.x - groundIntersectionPoint.x;
        const offsetZ = targetUnitPosititon.z - groundIntersectionPoint.z;

        const newCameraPosition = this.camera.getPosition().clone();
        newCameraPosition.x += offsetX;
        newCameraPosition.z += offsetZ;

        this.camera.setPosition(newCameraPosition);
    }

    // update size of selection rectangle
    private updateSelectionRect(): void {
        if (!this.dragStart || !this.dragCurrent) {
            return;
        }

        const xmin = Math.min(this.dragStart.x, this.dragCurrent.x);
        const xmax = Math.max(this.dragStart.x, this.dragCurrent.x);
        const ymin = Math.min(this.dragStart.y, this.dragCurrent.y);
        const ymax = Math.max(this.dragStart.y, this.dragCurrent.y);

        const canvasRect = this.canvas.getBoundingClientRect();

        this.selectionRect.style.left = `${canvasRect.left + xmin}px`;
        this.selectionRect.style.top = `${canvasRect.top + ymin}px`;
        this.selectionRect.style.width = `${xmax - xmin}px`;
        this.selectionRect.style.height = `${ymax - ymin}px`;
    }

    // write initial mouse clicking position on screen, set isDragging = false
    private onMouseDown(event: MouseEvent): void {
        if (event.button !== 0) {
            return;
        }

        this.dragStart = new Vec2(event.x, event.y);
        this.dragCurrent = new Vec2(event.x, event.y);
        this.isDragging = false;
    }

    // update current mouse position on screen; if distance moved > 5 pixels, change mouse status to dragging
    private onMouseMove(event: MouseEvent): void {
        if (!this.dragStart) {
            return;
        }

        // always update current mouse position
        this.dragCurrent = new Vec2(event.x, event.y);

        // only compare mouse moving distance with threshold at the beginning, click/drag is not defined yet
        if (!this.isDragging) {
            const dx = this.dragCurrent.x - this.dragStart.x;
            const dy = this.dragCurrent.y - this.dragStart.y;
            const distance = Math.sqrt(dx*dx + dy*dy);

            if (distance > this.DRAG_THRESHOLD) {
                this.isDragging = true;
            }
        }

        // update selection rectangle
        if (this.isDragging) {
            this.selectionRect.style.display = "block";
            this.updateSelectionRect();
        }
    }

    // manage left mouse click | drag and right mouse click
    private onMouseUp(event: MouseEvent): void {
        // event.button: 0 - left, 1 - wheel, 2 - right
        // left mouse
        if (event.button === 0 && this.dragStart) {
            this.dragCurrent = new Vec2(event.x, event.y);

            // manage left mouse drag
            if (this.isDragging) {
                this.unselectVillagers();
                this.selectVillagersInRect();
            }
            // manage left mouse click
            else {
                const result = this.raycast(event);
                if (result) {
                    this.leftMouseClicked(result.entity);
                } else {
                    this.unselectVillagers();
                }
            }

            this.selectionRect.style.display = "none";
            this.dragStart = null;
            this.dragCurrent = null;
            this.isDragging = false;
        }
        // right mouse
        else if (event.button === 2) {
            const result = this.raycast(event);
            if (result) {
                this.rightMouseClicked(result.entity, result.point);
            }
        }
    }

    // select villagers inside rectangle on screen
    private selectVillagersInRect(): void {
        if (!this.dragStart || !this.dragCurrent) {
            return;
        };

        // normalize for both dragging: left -> right, right -> left
        const xmin = Math.min(this.dragStart.x, this.dragCurrent.x);
        const xmax = Math.max(this.dragStart.x, this.dragCurrent.x);
        const ymin = Math.min(this.dragStart.y, this.dragCurrent.y);
        const ymax = Math.max(this.dragStart.y, this.dragCurrent.y);

        for (const villager of this.villagers) {
            // get villagers screen position
            const villagerWorldPosition = villager.getPosition();
            const villagerScreenPosition = new Vec3();
            this.camera.camera?.worldToScreen(villagerWorldPosition, villagerScreenPosition);

            // check if villager is inside screen rectangle
            if (villagerScreenPosition.x >= xmin && 
                villagerScreenPosition.x <= xmax && 
                villagerScreenPosition.y >= ymin &&
                villagerScreenPosition.y <= ymax
            ) {
                villager.setSelected(true);
                this.selectedVillagers.add(villager);
            }
        }
    }

    // raycasting when a mouse event happens
    private raycast(event: MouseEvent): RaycastResult | null {
        const from = new Vec3();
        const to = new Vec3();

        this.camera.camera?.screenToWorld(
            event.x,
            event.y,
            this.camera.camera.nearClip,
            from
        );

        this.camera.camera?.screenToWorld(
            event.x,
            event.y,
            this.camera.camera.farClip,
            to
        );

        const rigidbody = this.app.systems.rigidbody;
        const result = rigidbody?.raycastFirst(from, to);

        if (!result) {
            return null;
        }
        return result;
    }

    // raycasting without need a mouse event happens, return position
    private raycastMousePosition(): Vec3 | null {
        const from = new Vec3();
        const to = new Vec3();

        this.camera.camera?.screenToWorld(
            this.mousePosition.x,
            this.mousePosition.y,
            this.camera.camera.nearClip,
            from
        );

        this.camera.camera?.screenToWorld(
            this.mousePosition.x,
            this.mousePosition.y,
            this.camera.camera.farClip,
            to
        );

        const rigidbody = this.app.systems.rigidbody;
        const result = rigidbody?.raycastFirst(from, to);

        if (!result) {
            return null;
        }
        const position = result.point.clone();

        position.y = 2.5;
        return position;
    }

    // unselect all villagers
    private unselectVillagers(): void {
        for (const villager of this.selectedVillagers) {
            villager.setSelected(false);
        }
        this.selectedVillagers.clear();
    }

    // if left mouse clicked on a villager, select/unselect villager
    private leftMouseClicked(entity: Entity): void {
        // if entity is Villager => unselect all villagers, then select the new villager
        if (entity instanceof Villager) {
            // hold CTRL and click to select multiple units
            if (!this.keyboard.isPressed(KEY_CONTROL)) {
                this.unselectVillagers();
            }
            entity.setSelected(true);
            this.selectedVillagers.add(entity);
        }
        // if entity is not Villager, unselect all villagers
        else {
            this.unselectVillagers();
        }

        // if a building pewview is existing, call placement function
        if (this.buildingPlacementController.getPreview()) {
            const building = this.buildingPlacementController.confirmPlacement(this.resourceNodes, this.buildings);

            if (building) {
                this.buildings.push(building);
            }
        }
    }

    // move selected villagers || gather resource
    private rightMouseClicked(hitEntity: Entity, hitPosition: Vec3): void {
        // if right click on ground, villager move to town center
        if (hitEntity === this.ground) {
            // lineup selected villagers
            this.lineupUnits(hitPosition, this.selectedVillagers);
        }
        // if right click on resource node, villager move to and gather resource
        else if (hitEntity instanceof ResourceNode) {
            for (const villager of this.selectedVillagers) {
                villager.moveToResourceNode(hitEntity);
            }
        }
        // if right click on town center, villager move to town center
        else if (hitEntity instanceof TownCenter) {
            for (const villager of this.selectedVillagers) {
                villager.moveToTownCenter(hitEntity);
            }
        }
    }

    // arrange lineup
    private lineupUnits(center: Vec3, selectedUnits: Set<Villager>): void {
        // if no selected unit, do nothing
        const numUnits = selectedUnits.size;
        if (numUnits === 0) {
            return;
        }

        // number of columns and rows
        const numCol = Math.ceil(Math.sqrt(numUnits));
        const numRow = Math.ceil(numUnits / numCol);

        // arrange unit to row and column according to index
        const selectedUnitsArray = Array.from(selectedUnits);
        for (const [index, villager] of selectedUnitsArray.entries()) {
            const row = Math.floor(index / numCol);
            const col = index % numCol;

            // last row can have less units than other rows
            const offsetZ = (row !== numRow - 1) 
            ? (col - (numCol-1)/2) * this.UNIT_SPACING 
            : (col - (numCol-1)/2 + (numRow*numCol-numUnits)/2) * this.UNIT_SPACING;
            const offsetX = (row - (numRow-1)/2) * this.UNIT_SPACING;

            const villagerLineupPosition = center.clone().add(new Vec3(offsetX,0,offsetZ));
            villager.moveTo(villagerLineupPosition);
        }
    }

    // update function every frame
    private update(dt: number): void {
        // variable used for detecting if need to change resource HUD
        let resourcesChanged = false;

        for (const villager of this.villagers) {
            villager.update(dt);

            // if villager carries resource to TC, add up to player's resources
            const delivery = villager.consumeCompleteDelivery();

            if (!delivery) {
                continue;
            }

            this.playerResources[delivery.resourceType] += delivery.resourceAmount;

            resourcesChanged = true;
        }

        if (resourcesChanged) {
            this.resourceHUD.renderResources(this.playerResources);
        }

        this.cameraController.update(dt);

        for (const resourceNode of this.resourceNodes) {
            resourceNode.update(dt);
        }

        // update building preview and apperance based on raycast position
        if (this.buildingPlacementController.getPreview()) {
            const position = this.raycastMousePosition();
            if (position) {
                this.buildingPlacementController.updatePreviewPosition(position);
            }
            this.buildingPlacementController.updatePreviewAppearane(this.resourceNodes, this.buildings);
        }

    }
}