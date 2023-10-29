import PianoRoll from "./pianoroll.js";
const pianoRollContainer = document.getElementById("pianoRollContainer");
const mainPianoRoll = document.getElementById("mainPianoRoll");
const sidePianoRolls = document.getElementById("sidePianoRolls");

class PianoRollDisplay {
    constructor(csvURL) {
        this.csvURL = csvURL;
        this.data = null;
    }

    async loadPianoRollData() {
        try {
            const response = await fetch("https://pianoroll.ai/random_notes");
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            this.data = await response.json();
        } catch (error) {
            console.error("Error loading data:", error);
        }
    }

    openPianoRoll(rollId) {
        mainPianoRoll.innerHTML = "";
        sidePianoRolls.classList.add("compact");
        const roll = sidePianoRolls.children[rollId].cloneNode(true);
        roll.querySelector("svg").setAttribute("height", 500);
        mainPianoRoll.appendChild(roll);
        mainPianoRoll.classList.add("show");
    }

    preparePianoRollCard(rollId) {
        const cardDiv = document.createElement("div");
        cardDiv.classList.add("piano-roll-card");

        // Create and append other elements to the card container as needed
        const descriptionDiv = document.createElement("div");
        descriptionDiv.classList.add("description");
        descriptionDiv.textContent = `This is a piano roll number ${rollId}`;
        cardDiv.onclick = () => this.openPianoRoll(rollId);
        cardDiv.appendChild(descriptionDiv);

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.classList.add("piano-roll-svg");
        svg.setAttribute("width", "80%");
        svg.setAttribute("height", "150");

        // Append the SVG to the card container
        cardDiv.appendChild(svg);

        return {cardDiv, svg};
    }

    async generateSVGs() {
        if (!this.data) await this.loadPianoRollData();
        if (!this.data) return;

        sidePianoRolls.innerHTML = "";
        for (let it = 0; it < 20; it++) {
            const start = it * 60;
            const end = start + 60;
            const partData = this.data.slice(start, end);

            const {cardDiv, svg} = this.preparePianoRollCard(it);

            sidePianoRolls.appendChild(cardDiv);
            const roll = new PianoRoll(svg, partData);
        }
    }
}

document.getElementById("loadCSV").addEventListener("click", async () => {
    const csvToSVG = new PianoRollDisplay();
    await csvToSVG.generateSVGs();
});
