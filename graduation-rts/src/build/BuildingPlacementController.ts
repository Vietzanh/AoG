import {
    Entity,
    Vec3,
    Color,
    StandardMaterial
} from "playcanvas";
import {Building} from "../entities/Building";
import type {ResourceNode} from "../entities/ResourceNode";
import {BuildingPreview} from "./BuildingPreview";
import {TownCenter} from "../entities/TownCenter";

// green
const validColor = new Color(0,1,0);
// red
const invalidColor = new Color(1,0,0);

export class BuildingPlacementController {
    private buildingPreview: BuildingPreview | null = null;
    
    createPreview(buildingScale: Vec3): BuildingPreview | null {
        if (this.buildingPreview) {
            return null;
        }

        const building = new BuildingPreview(buildingScale);
        console.log("TC preview created");
        return this.buildingPreview = building;
    }

    getPreview(): BuildingPreview | null {
        return this.buildingPreview;
    }

    removePreview(): void {
        this.buildingPreview?.destroy();
    }

    // check if can place building at the mouse position
    canPlaceBuilding(buildingPreview: BuildingPreview, resourceNodes: ResourceNode[], existBuildings: Building[]) {
        const previewCenter = buildingPreview.getPosition().clone();
        const previewCenterX = previewCenter.x;
        const previewCenterZ = previewCenter.z;
        const previewHalf = buildingPreview.getFootprintHalfExtents();

        // check if any existing buildings overlap with the planning building
        for (const existBuilding of existBuildings) {
            const checkCenter = existBuilding.getPosition().clone();
            const checkCenterX = checkCenter.x;
            const checkCenterZ = checkCenter.z;
            const checkHalf = existBuilding.getFootprintHalfExtents();

            if ((Math.abs(previewCenterX-checkCenterX) <= (previewHalf.x+checkHalf.x))
             && (Math.abs(previewCenterZ-checkCenterZ) <= (previewHalf.z+checkHalf.z))) {
                return false;    
            }
        }

        // check if any resource node overlap with the planning building
        for (const resourceNode of resourceNodes) {
            const checkCenter = resourceNode.getPosition().clone();
            const checkCenterX = checkCenter.x;
            const checkCenterZ = checkCenter.z;
            const checkHalf = resourceNode.getFootprintHalfExtents();

            if ((Math.abs(previewCenterX-checkCenterX) <= (previewHalf.x+checkHalf.x))
             && (Math.abs(previewCenterZ-checkCenterZ) <= (previewHalf.z+checkHalf.z))) {
                return false;
            }
        }

        return true;
    }

    // update preview position
    updatePreviewPosition(position: Vec3): void {
        this.buildingPreview?.setPosition(position);
    }

    // update preview apperance
    updatePreviewAppearane(resourceNodes: ResourceNode[], existBuildings: Building[]): void {
        if (!this.buildingPreview?.render?.material) {
            return;
        }

        const material = new StandardMaterial();

        if (this.canPlaceBuilding(this.buildingPreview, resourceNodes, existBuildings)) {
            material.diffuse = validColor;
        } else {
            material.diffuse = invalidColor;
        }

        material.update();
        this.buildingPreview.render.material = material;
    }

    confirmPlacement(resourceNodes: ResourceNode[], existBuildings: Building[]): Building | null {
        if (!this.buildingPreview) {
            return null;
        }

        if (this.canPlaceBuilding(this.buildingPreview, resourceNodes, existBuildings)) {
            const placementPosition = this.buildingPreview.getPosition().clone();

            const building = new TownCenter(placementPosition)
            return building;
        }

        return null;
    }


    
}