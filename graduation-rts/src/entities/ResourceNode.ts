import {
    Entity, 
    Vec3,
    Color,
    StandardMaterial
} from "playcanvas";
import type {Villager} from "../entities/Villager";

export type ResourceType = "wood" | "food" | "gold";

type InteractionSlot = {
    localOffset: Vec3,
    reservedBy: Villager | null
};

export class ResourceNode extends Entity {
    private resourceType: ResourceType;
    private remainingAmount: number;

    // slots for villagers around resource node
    private interactionSlots: InteractionSlot[] = [];

    private readonly RESOURCE_CONFIG: Record<ResourceType, number> = {
        "wood": 100,
        "food": 500,
        "gold": 2000
    };

    constructor (initialPosition: Vec3, resourceType: ResourceType) {
        super("ResourceNode");

        this.resourceType = resourceType;
        this.remainingAmount = this.RESOURCE_CONFIG[this.resourceType];

        this.setPosition(initialPosition);

        this.addComponent("render", {
            type: "box"
        });
        this.addComponent("collision", {
            type: "box",
            halfExtents: new Vec3(1,2.5,1)
        });

        const material = new StandardMaterial();
        material.diffuse = new Color(0.545, 0.271, 0.075);
        material.update();
        
        this.render!.material = material;
        this.setLocalScale(2,5,2);

        this.createInteractionSlots();
    }

    // initialize interaction slots
    private createInteractionSlots(): void {
        const radius = 3;

        const offsets = [
            new Vec3(0,0,-radius),
            new Vec3(radius, 0, -radius),
            new Vec3(radius, 0, 0),
            new Vec3(radius, 0, radius),
            new Vec3(0, 0, radius),
            new Vec3(-radius, 0, radius),
            new Vec3(-radius, 0, 0),
            new Vec3(-radius, 0, -radius)
        ];

        for (const offset of offsets) {
            this.interactionSlots.push({
                localOffset: offset,
                reservedBy: null
            });
        }
    }

    getInteractionSlots(): InteractionSlot[] {
        return this.interactionSlots;
    }

    // check if there is still interaction slots, return 1; ì villager has already reserve 1, return it
    reserveInteractionSlot(villager: Villager): InteractionSlot | null {
        if (!this.canGather()) {
            return null;
        }

        // check if villager has already reserved a slot
        const existingSlot = this.interactionSlots.find(slot => slot.reservedBy === villager);
        if (existingSlot) {
            return existingSlot;
        }

        const availableSlot = this.interactionSlots.find(slot => slot.reservedBy === null);
        if (!availableSlot) {
            return null;
        }

        availableSlot.reservedBy = villager;
        return availableSlot;
    }

    // release an interaction slot reserved by a specific villager
    releaseInteractionSlot(villager: Villager): void {
        const reservedSlot = this.interactionSlots.find(slot => slot.reservedBy === villager);
        if (reservedSlot) {
            reservedSlot.reservedBy = null;
        }
    }

    // get resource type
    getResourceType(): ResourceType {
        return this.resourceType;
    }

    // get remaining resource amount
    getRemainingAmount(): number {
        return this.remainingAmount;
    }

    // check if this resource entity can be gathered
    canGather(): boolean {
        if (this.remainingAmount <= 0) {
            return false;
        }
        return true;
    }

    // return the amount of requested resource, not exceeding remainingAmount
    gather(requestedAmount: number): number {
        if (requestedAmount <= 0 && Number.isFinite(requestedAmount)) {
            return 0;
        }

        if (requestedAmount < this.remainingAmount) {
            this.remainingAmount -= requestedAmount;
            return requestedAmount;
        } else {
            const gatheredAmount = this.remainingAmount;
            this.remainingAmount = 0;
            return gatheredAmount;
        }
    }

    // get resource node footprint in X and Z
    getFootprintHalfExtents(): {x: number, z: number} {
        const scale = this.getLocalScale().clone();

        return {
            x: scale.x / 2,
            z: scale.z / 2
        };
    }
}