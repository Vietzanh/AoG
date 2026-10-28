import {
    Entity,
    Vec3,
} from "playcanvas";

export class BuildingPreview extends Entity {

    constructor (buildingScale: Vec3, name: string) {
        super(name);

        this.addComponent("render", {
            type: "box"
        });
        this.addComponent("collision", {
            type: "box",
            halfExtents: new Vec3(2.5,2.5,2.5)
        });

        this.setLocalScale(buildingScale);
    }

    // get building preview footprint in X and Z
    getFootprintHalfExtents(): {x: number, z: number} {
        const scale = this.getLocalScale().clone();

        return {
            x: scale.x / 2,
            z: scale.z / 2
        };
    }
}