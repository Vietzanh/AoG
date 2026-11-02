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