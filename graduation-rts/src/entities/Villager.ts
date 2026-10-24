import {Entity, Vec3} from "playcanvas";
import type {ResourceNode, ResourceType} from "./ResourceNode";
import type { TownCenter } from "./TownCenter";


type VillagerState = "idle" | "moving" | "gathering" | "building" | "movingToResource" | "movingToTownCenter";

export type ResourceCargo = {
    carriedResourceType: ResourceType | null,
    carriedAmount: number
};

export class Villager extends Entity {
    private speed: number = 5;
    private targetPosition: Vec3 | null = null;
    private selected: boolean = false;

    private body: Entity = new Entity("body");
    private head: Entity = new Entity("head");

    private state: VillagerState = "idle";
    private cargo: ResourceCargo = {
        carriedResourceType: null,
        carriedAmount: 0
    };
    private targetResource: ResourceNode | null = null;
    private gatherTimer = 0;
    private readonly GATHER_AMOUNT = 10;
    private readonly GATHER_INTERVAL = 1;

    private targetTownCenter: TownCenter | null = null;
    private deliveryCompleted = false;

    constructor(initialPosition: Vec3 | null = null) {
        super("Villager");

        // initial position in world, default at (0,0,0)
        if (initialPosition) {
            this.setPosition(initialPosition);
        }
        else {
            this.setPosition(0,0,0,);
        }

        // simulate body with a box
        this.body.addComponent("render", {
            type: "box"
        });
        this.body.setLocalPosition(0,0.5,0);
        this.addChild(this.body);

        // simulate head with a sphere
        this.head.addComponent("render", {
            type: "sphere"
        });
        this.head.setLocalPosition(0,1.5,0);
        this.addChild(this.head);

        // set collision
        this.addComponent("collision", {
            type: "box",
            halfExtents: new Vec3(0.5,1,0.5),   // collider is not automatically scaled accordingly to setLocalScale
            linearOffset: new Vec3(0,1,0)
        });

        this.setLocalScale(1,1,1);
    }

    // set selection status of the villager
    setSelected(select: boolean): void {
        this.selected = select;

        if (select) {
            this.setLocalScale(1.5,1.5,1.5);
        } else {
            this.setLocalScale(1,1,1);
        }
    }

    // check if this villager is selected
    isSelected(): boolean {
        return this.selected;
    }

    // cancel current gathering task when a new order from user interacted
    cancelCurrentTask(): void {
        this.targetResource?.releaseInteractionSlot(this);
        this.targetResource = null;
        this.gatherTimer = 0;
        this.targetTownCenter = null;
    }

    // set target position for villager to move to
    moveTo(target: Vec3): void {
        this.cancelCurrentTask();

        this.state = "moving";
        this.targetPosition = target.clone();
    }

    // villager moves to near resource node
    moveToResourceNode(resourceNode: ResourceNode): void {
        if (!resourceNode) {
            return;
        }

        const resourceSlot = resourceNode.reserveInteractionSlot(this);
        if (!resourceSlot) {
            return;
        }

        this.cancelCurrentTask();
        this.targetResource = resourceNode;

        this.state = "movingToResource";
        const resourcePosition = resourceNode.getPosition().clone().add(resourceSlot.localOffset);
        resourcePosition.y = 0;
        this.targetPosition = resourcePosition;
    }

    // gather from a resource node, increase carriedAmount
    gatherFrom(resourceNode: ResourceNode): void {
        if (resourceNode.canGather()) {
            this.cargo.carriedResourceType = resourceNode.getResourceType();
            this.cargo.carriedAmount += resourceNode.gather(this.GATHER_AMOUNT);
        } else {
            this.state = "idle";
            this.targetResource?.releaseInteractionSlot(this);
            this.targetResource = null;
        }
        this.gatherTimer = 0;
    }

    // move to town center
    moveToTownCenter(townCenter: TownCenter): void {
        // if villager does not carry anything, do nothing
        if (this.cargo.carriedResourceType === null || this.cargo.carriedAmount <= 0) {
            return;
        }

        if (!townCenter) {
            return;
        }

        this.cancelCurrentTask();
        this.targetTownCenter = townCenter;

        this.state = "movingToTownCenter";
        const targetPosition = townCenter.getApproachPosition(this.getPosition().clone());
        this.targetPosition = targetPosition;
    }

    // move a distance each frame
    move(dt: number): void {
        if (this.targetPosition === null) {
            return;
        }

        const currentPosition = this.getPosition().clone();
        const toTarget = this.targetPosition.clone().sub(currentPosition);
        const distance = toTarget.length();
        const maxStep = this.speed * dt;

        // if close to target position, move to exact target position
        if (distance <= maxStep) {
            this.setPosition(this.targetPosition);
            this.targetPosition = null;

            if (this.state === "moving") {
                this.state = "idle";
            } else if (this.state === "movingToResource") {
                this.state = "gathering";
            } else if (this.state === "movingToTownCenter") {
                this.markDeliveryCompleted();
                this.state = "idle";
            }


            return;
        }

        const direction = toTarget.normalize();
        const movementThisFrame = direction.mulScalar(this.speed * dt);
        this.setPosition(currentPosition.add(movementThisFrame));
    }

    // get cargo
    getCargo(): ResourceCargo {
        return this.cargo;
    }

    // set state when villager finishes moving to town center
    markDeliveryCompleted(): void {
        const {carriedResourceType, carriedAmount} = this.cargo;
        if (carriedResourceType === null || carriedAmount <= 0) {
            return;
        }

        this.deliveryCompleted = true;
    }

    // check if moved to town center, return cargo | null
    consumeCompleteDelivery(): {
        resourceType: ResourceType,
        resourceAmount: number
    } | null {
        if (!this.deliveryCompleted) {
            return null;
        }

        const {carriedResourceType, carriedAmount} = this.cargo;
        if (carriedResourceType === null || carriedAmount <= 0) {
            this.deliveryCompleted = false;
            return null;
        }

        this.deliveryCompleted = false;
        this.cargo.carriedResourceType = null;
        this.cargo.carriedAmount = 0;

        return {resourceType: carriedResourceType, resourceAmount: carriedAmount};
    }


    // update function every frame
    update(dt: number): void {
        this.move(dt);

        // start gather timer if state is gathering
        if (this.state === "gathering") {
            this.gatherTimer += dt;

            if (this.gatherTimer >= this.GATHER_INTERVAL && this.targetResource !== null) {
                this.gatherFrom(this.targetResource);
            }
        }
    }
}