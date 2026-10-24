import {
    Entity,
    StandardMaterial,
    Vec3,
    Color
} from "playcanvas";
import type {Villager} from "../entities/Villager";

export class TownCenter extends Entity {
    
    // deposit positions
    private approachPositions: Vec3[] = [];

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

        this.createDepositPositions();
    }

    // create deposit positions around town center
    createDepositPositions(): void {
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

        const townPosition = this.getPosition().clone();
        townPosition.y = 0;
        for (const offset of offsets) {
            const position = townPosition.clone().add(offset);
            this.approachPositions.push(position);
        }
    }

    getApproachPosition(villagerPosition: Vec3): Vec3 {
        let nearest = this.approachPositions[0];
        let minDistance = Infinity;
        const townPosition = this.getPosition().clone();

        for (const approachPosition of this.approachPositions) {
            const distance = approachPosition.clone().sub(villagerPosition).length();

            if (distance < minDistance) {
                minDistance = distance;
                nearest = approachPosition; 
            }
        }

        return nearest;
    }
}