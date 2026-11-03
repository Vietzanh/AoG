import "./BuildingHUD.css";

export class BuildingHUD {
    private readonly container: HTMLDivElement;
    private readonly grid: HTMLDivElement;

    // callback contains logic for starting production, implement as property so that it can be called everytime
    private readonly onProduction: () => void;

    constructor(onProduction: () => void) {
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

            if (i==0) {
                // production slot for training villagers
                slot.classList.add("production-slot");
                slot.textContent = "V";
                slot.title = "Train Villager";

                // add event listener
                slot.addEventListener("click", () => {
                    this.onProduction();
                })
            } else {
                // 15 slots do not have any functionality yet, disabled for no interaction
                slot.disabled = true;
            }

            this.grid.append(slot);
        }

        // add grid to container
        this.container.append(this.grid);

        // add container to document body
        document.body.append(this.container);

        // initially hide the building HUD
        this.hide();
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
}