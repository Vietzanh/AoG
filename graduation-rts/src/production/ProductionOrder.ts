import {
    Entity,
    Vec3
} from "playcanvas";
import type {BuildingState} from "../entities/Building";
import type {ResourceType} from "../entities/ResourceNode";

export interface ProductionOrder {
    unitType: string;
    elapsedTime: number;
    productionTime: number;
}