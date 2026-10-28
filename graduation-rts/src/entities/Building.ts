import {
    Entity,
    StandardMaterial,
    Vec3,
    BLEND_NORMAL
} from "playcanvas";
import type { ResourceType } from "./ResourceNode";

export type BuildingState = "underConstruction" | "completed";
export type BuildingCost = Record<ResourceType,number>;

export class Building extends Entity {
    // approach positions around building
    protected approachPositions: Vec3[] = [];
    protected cost: BuildingCost | null = null;
    protected buildAmount: number = 0;
    protected readonly MAX_BUILD_AMOUNT: Record<string,number> = {
        "TownCenter": 100
    };
    protected state: BuildingState = "underConstruction";

    protected buildingMaterial = new StandardMaterial();

    constructor(name: string) {
        super(name);

        // initial apperance with low opacity
        this.buildingMaterial.blendType = BLEND_NORMAL;
        this.buildingMaterial.opacity = 10 / this.MAX_BUILD_AMOUNT[this.name];
        this.buildingMaterial.update();
        if (this.render) {
            this.render.material = this.buildingMaterial;
        }
    }

    // create approach positions around building
    protected createApproachPositions(): void {
        const offsetFromCenter = (this.getLocalScale().clone().x / 2) * (Math.sqrt(2) + 0.4);
        const offsets = [
            new Vec3(offsetFromCenter,0,0),
            new Vec3(offsetFromCenter,0,1),
            new Vec3(offsetFromCenter,0,2),
            new Vec3(offsetFromCenter,0,-1),
            new Vec3(offsetFromCenter,0,-2),

            new Vec3(-offsetFromCenter,0,0),
            new Vec3(-offsetFromCenter,0,1),
            new Vec3(-offsetFromCenter,0,2),
            new Vec3(-offsetFromCenter,0,-1),
            new Vec3(-offsetFromCenter,0,-2),

            new Vec3(0,0,offsetFromCenter),
            new Vec3(1,0,offsetFromCenter),
            new Vec3(2,0,offsetFromCenter),
            new Vec3(-1,0,offsetFromCenter),
            new Vec3(-2,0,offsetFromCenter),

            new Vec3(0,0,-offsetFromCenter),
            new Vec3(1,0,-offsetFromCenter),
            new Vec3(2,0,-offsetFromCenter),
            new Vec3(-1,0,-offsetFromCenter),
            new Vec3(-2,0,-offsetFromCenter),
        ]

        const buildingPosition = this.getPosition().clone();
        buildingPosition.y = 0;
        for (const offset of offsets) {
            const position = buildingPosition.clone().add(offset);
            this.approachPositions.push(position);
        }
    }

    // get nearst approach position
    getApproachPosition(villagerPosition: Vec3): Vec3 {
        let nearest = this.approachPositions[0];
        let minDistance = Infinity;

        for (const approachPosition of this.approachPositions) {
            const distance = approachPosition.clone().sub(villagerPosition).length();

            if (distance < minDistance) {
                minDistance = distance;
                nearest = approachPosition; 
            }
        }

        return nearest;
    }

    // get building footprint in X and Z
    getFootprintHalfExtents(): {x: number, z: number} {
        const scale = this.getLocalScale().clone();

        return {
            x: scale.x / 2,
            z: scale.z / 2
        };
    }

    getState(): BuildingState {
        return this.state;
    }

    setState(state: BuildingState): void {
        this.state = state;
    }

    getCost(): BuildingCost {
        return this.cost ? this.cost : {wood: 0, food: 0, gold: 0};
    }

    // check if building is under construction
    isUnderConstruction(): boolean {
        if (this.buildAmount < this.MAX_BUILD_AMOUNT[this.name]) {
            return true;
        }
        return false;
    }

    // get max build amount of the building
    getMaxBuildAmount(): number {
        return this.MAX_BUILD_AMOUNT[this.name];
    }

    // add build amount to building, update apperance based on built amount
    build(buildAmount: number): void {
        if (buildAmount > 0) {
            this.buildAmount += buildAmount;
        }
        this.updateApperance(this.buildAmount);
    }

    // update building apperance while under construction
    updateApperance(buildAmount: number): void {
        this.buildingMaterial.opacity = buildAmount / this.MAX_BUILD_AMOUNT[this.name];
        this.buildingMaterial.update();
        if (this.render) {
            this.render.material = this.buildingMaterial;
        }
    }


}