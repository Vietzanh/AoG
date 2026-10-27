import {
    Entity,
    Vec3,
} from "playcanvas";

type BuildingState = "underConstruction" | "completed";

export class Building extends Entity {
    // approach positions around building
    protected approachPositions: Vec3[] = [];

    private state: BuildingState | null = null;

    constructor(name: string) {
        super(name);
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
}