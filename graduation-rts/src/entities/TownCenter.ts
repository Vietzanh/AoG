import {
    Vec3,
    Color,
} from "playcanvas";
import { Building } from "./Building";
import type {ProductionOrder} from "../production/ProductionOrder";
import type {ResourceType} from "./ResourceNode";
import type {UnitCost, UnitType} from "./Building";

export class TownCenter extends Building {
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
        
        this.createApproachPositions();

        this.cost = {
            wood: 50,
            food: 0,
            gold: 0
        };
    }

    // check condition to start production of a unit
    canStartProduction(availableResources: Record<ResourceType, number>): boolean {
        // check if the building is completed and not currently producing a unit
        if (this.state !== "completed" || this.currentProduction !== null) {
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
            productionTime: 10
        };

        // decrease resouces based on the production cost
        resources.food -= this.productionCosts.Villager!.food;
        resources.wood -= this.productionCosts.Villager!.wood;
        resources.gold -= this.productionCosts.Villager!.gold;

        return true;
    }

    // update production progress
    updateProduction(dt: number): void {
        if (this.currentProduction && this.currentProduction.elapsedTime < this.currentProduction.productionTime) {
            this.currentProduction.elapsedTime += dt;
        }
    }

}