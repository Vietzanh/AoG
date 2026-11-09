import type {UnitType} from "../entities/Building";

export interface ProductionOrder {
    unitType: UnitType;
    elapsedTime: number;
    productionTime: number;
}