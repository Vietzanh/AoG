import type { UnitType } from "../entities/Building";
import "./BuildingHUD.css";

export class BuildingHUD {
    private readonly container: HTMLDivElement;
    private readonly grid: HTMLDivElement;

    private readonly productionProgressSlot: HTMLElement;
    private readonly productionProgressTrack: HTMLElement;
    private readonly productionProgressFill: HTMLElement;

    // callback contains logic for starting production, implement as property so that it can be called everytime
    private readonly onProduction: (unitType: UnitType) => void;

    constructor(onProduction: (unitType: UnitType) => void) {
        this.onProduction = onProduction;
        // create HUD container
        this.container = document.createElement("div");
        this.container.id = "building-hud";

        // create 4x4 grid
        this.grid = document.createElement("div");
        this.grid.classList.add("building-hud-grid");

        // create 16 button slots
        for (let i=0; i<16; i++) {
            const slot = document.createElement("button");

            slot.type = "button";
            slot.classList.add("building-hud-slot");

            if (i === 0) {
                // production slot for training villagers
                slot.classList.add("production-slot");
                slot.textContent = "V";
                slot.title = "Train Villager";

                // add event listener
                slot.addEventListener("click", () => {
                    this.onProduction("Villager");
                })
            } else {
                // 15 slots do not have any functionality yet, disabled for no interaction
                slot.disabled = true;
            }

            this.grid.append(slot);
        }

        // create production progress slot
        this.productionProgressSlot = document.createElement("div");
        this.productionProgressSlot.classList.add("production-progress-slot");

        // create unit label
        const unitLabel = document.createElement("span");
        unitLabel.textContent = "V";
        unitLabel.classList.add("production-progress-label");

        // create progress bar background
        this.productionProgressTrack = document.createElement("div");
        this.productionProgressTrack.classList.add("production-progress-track");

        // create progress bar fill
        this.productionProgressFill = document.createElement("div");
        this.productionProgressFill.classList.add("production-progress-fill");

        this.productionProgressTrack.append(this.productionProgressFill);
        this.productionProgressSlot.append(unitLabel, this.productionProgressTrack);

        // add grid to container
        this.container.append(this.productionProgressSlot, this.grid);
        // add container to document body
        document.body.append(this.container);

        // initially hide the building HUD
        this.hide();
        // initially hiding progress slot
        this.productionProgressSlot.style.display = "none";
    }

    // show building HUD
    show(): void {
        this.container.style.display = "block";
    }

    // hide building HUD
    hide(): void {
        this.container.style.display = "none";
    }

    // check if mouse is over the building HUD
    isMouseOver(mouseX: number, mouseY: number): boolean {
        const element = document.elementFromPoint(mouseX, mouseY);

        return element !== null && this.container.contains(element);
    }

    // update unit production progress bar
    updateProductionProgress(progress: number | null): void {
        if (progress === null) {
            return;
        }

        // show progress slot
        this.productionProgressSlot.style.display = "flex";
        // update progress bar width
        this.productionProgressFill.style.width = `${progress * 100}%`;
    }

    // hide production progress
    hideProductionProgress(): void {
        this.productionProgressSlot.style.display = "none";
        // reset progress for later production
        this.productionProgressFill.style.width = "0%"
    }
}