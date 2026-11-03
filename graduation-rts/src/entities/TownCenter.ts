import {
    Vec3,
    Color,
} from "playcanvas";
import { Building } from "./Building";
import type {ProductionOrder} from "../production/ProductionOrder";
import type {ResourceType} from "./ResourceNode";
import type {UnitCost, UnitType} from "./Building";

export class TownCenter extends Building {
    private spawnPositions: Vec3[] = [];
    private rallyPoint: Vec3;

    private currentProduction: ProductionOrder | null = null;

    private readonly productionCosts: Partial<Record<UnitType, UnitCost>> = {
        Villager: {wood: 0, food: 50, gold: 0}
    };

    constructor (initialPosition: Vec3) {
        super("TownCenter");

        initialPosition.y = 2.5;
        this.setPosition(initialPosition.clone());

        this.addComponent("render", {
            type: "box"
        });
        this.addComponent("collision", {
            type: "box",
            halfExtents: new Vec3(2.5,2.5,2.5)
        });

        this.setLocalScale(5,5,5);

        // initial apperance with low opcaity
        this.buildingMaterial.diffuse = new Color(0.72, 0.52, 0.20);
        this.buildingMaterial.update();
        this.render!.material = this.buildingMaterial;
        
        this.cost = {
            wood: 50,
            food: 0,
            gold: 0
        };

        // create spawn positions, approach positions and initial rally point
        this.createSpawnPositions();
        this.createApproachPositions();
        this.rallyPoint = this.spawnPositions[0].clone();
    }

    // create villager spawn positions
    private createSpawnPositions(): void {
        const offsetFromCenter = (this.getLocalScale().clone().x / 2) * (Math.sqrt(2) + 0.3);
        const offsets = [
            new Vec3(offsetFromCenter,0,0),
            new Vec3(-offsetFromCenter,0,0),
            new Vec3(0,0,offsetFromCenter),
            new Vec3(0,0,-offsetFromCenter)
        ] 

        const centerPosition = this.getPosition().clone();
        centerPosition.y = 0;
        for (const offset of offsets) {
            const position = centerPosition.clone().add(offset);
            this.spawnPositions.push(position);
        }
    }

    // get nearest spawn position to rally point
    getSpawnPosition(): Vec3 {
        let nearest = this.approachPositions[0];
        let minDistance = Infinity;
        const rallyPoint = this.rallyPoint.clone();

        for (const position of this.spawnPositions) {
            const distance = position.clone().sub(rallyPoint).length();

            if (distance < minDistance) {
                minDistance = distance;
                nearest = position;
            }
        }

        return nearest;
    }

    // get rally point
    getRallyPoint(): Vec3 {
        return this.rallyPoint.clone();
    }

    // set rally point
    setRallyPoint(position: Vec3): void {
        this.rallyPoint = position.clone();
    }


    // check condition to start production of a unit
    canStartProduction(availableResources: Record<ResourceType, number>): boolean {
        // check if the building is completed and not currently producing a unit
        if (this.state !== "completed" || this.currentProduction !== null) {
            console.log("Building is not completed or currently producing a unit");
            return false;
        }

        // check if resources are sufficient
        const villagerCost = this.productionCosts.Villager;
        if (!villagerCost) {
            return false;
        }
        
        if (
            villagerCost.food > availableResources.food
            || villagerCost.wood > availableResources.wood
            || villagerCost.gold > availableResources.gold
        ) {
            console.log("Insufficient resources to start production");
            return false;
        }
        
        return true;
    }

    // start a production, returns true if production started successfully and decrease resouces
    startProduction(resources: Record<ResourceType, number>): boolean {
        if (!this.canStartProduction) {
            return false;
        }

        this.currentProduction = {
            unitType: "Villager",
            elapsedTime: 0,
            productionTime: 5
        };

        // decrease resouces based on the production cost
        resources.food -= this.productionCosts.Villager!.food;
        resources.wood -= this.productionCosts.Villager!.wood;
        resources.gold -= this.productionCosts.Villager!.gold;

        return true;
    }

    // update production progress and return ProductionOrder if production is completed
    updateProduction(dt: number): ProductionOrder | null {
        if (!this.currentProduction) {
            return null;
        }

        this.currentProduction.elapsedTime += dt;

        if (this.currentProduction.elapsedTime >= this.currentProduction.productionTime) {
            const completedProduction = this.currentProduction;
            this.currentProduction = null;
            return completedProduction;
        }

        return null;
    }

}