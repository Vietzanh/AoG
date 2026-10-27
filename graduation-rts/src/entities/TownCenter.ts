import {
    Entity,
    StandardMaterial,
    Vec3,
    Color
} from "playcanvas";
import { Building } from "./Building";

export class TownCenter extends Building {


    constructor (initialPosition: Vec3) {
        super("TownCenter");

        this.setPosition(initialPosition.clone().add(new Vec3(0,2.5,0)));

        this.addComponent("render", {
            type: "box"
        });
        this.addComponent("collision", {
            type: "box",
            halfExtents: new Vec3(2.5,2.5,2.5)
        });
        
        const material = new StandardMaterial();
        material.diffuse = new Color(0.72, 0.52, 0.20);
        material.update();

        this.render!.material = material;
        this.setLocalScale(5,5,5);

        this.createApproachPositions();
    }
}