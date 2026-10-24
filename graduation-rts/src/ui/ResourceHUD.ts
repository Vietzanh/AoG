import type { ResourceType } from "../entities/ResourceNode";

export class ResourceHUD {
    private woodElement: HTMLElement;
    private foodElement: HTMLElement;
    private goldElement: HTMLElement;

    constructor() {
        const woodElement = document.querySelector<HTMLElement>("#resource-wood");
        const foodElement = document.querySelector<HTMLElement>("#resource-food");
        const goldElement = document.querySelector<HTMLElement>("#resource-gold");

        // if cannot find all resource elements
        if (!woodElement || !foodElement || !goldElement) {
            throw new Error(
                "ResourceHUD: Cannot find all resource elements"
            );
        }

        this.woodElement = woodElement;
        this.foodElement = foodElement;
        this.goldElement = goldElement;
    }

    renderResources(resources: Readonly<Record<ResourceType, number>>): void {
        this.woodElement.textContent = String(resources.wood);
        this.foodElement.textContent = String(resources.food);
        this.goldElement.textContent = String(resources.gold);
    }
}