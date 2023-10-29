import PianoRoll from "./pianoroll.js";
const pianoRollContainer = document.getElementById("pianoRollContainer");
const mainPianoRoll = document.getElementById("mainPianoRoll");
const sidePianoRolls = document.getElementById("sidePianoRolls");

class PianoRollDisplay {
    constructor(csvURL) {
        this.csvURL = csvURL;
        this.data = null;
        this.selectionStartPosition = null;
        this.selectionEndPosition = null;
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
        // reset main piano roll element
        mainPianoRoll.innerHTML = "";
        // add class to sided piano rolls that make them align vertically on the left
        sidePianoRolls.classList.add("compact");
        // check if there is an active roll and reset its color (for green background)
        const activeRoll = Array.from(sidePianoRolls.children).find((e) => e.classList.contains("active"));
        activeRoll ? activeRoll.classList.remove("active") : null;
        // get clicked roll element
        const roll = sidePianoRolls.children[rollId];
        // clone it so it doesnt get removed from side rolls
        const clonedRoll = roll.cloneNode(true);
        // make the cloned element bigger
        const svg = clonedRoll.querySelector("svg");
        svg.setAttribute("height", 500);
        clonedRoll.classList.add("main");
        clonedRoll.onclick = (e) => this.startSelection(e, clonedRoll);
        // add class active (green background) to the clicked roll
        roll.classList.add("active");
        // append the cloned roll to main piano element

        const selection = document.createElement("div");
        selection.id = "selection";
        clonedRoll.appendChild(selection);
        mainPianoRoll.appendChild(clonedRoll);
        mainPianoRoll.classList.add("show");
    }

    startSelection(event, element) {
        if (this.selectionEndPosition) {
            this.resetSelection();
            return;
        }
        const clonedRollPosition = element.getBoundingClientRect();
        const clickedPos = {x: event.clientX - clonedRollPosition.left, y: event.clientY - clonedRollPosition.top};
        if (!this.selectionStartPosition) {
            this.selectionStartPosition = clickedPos;
        } else {
            this.selectionEndPosition = clickedPos;
            this.drawSelection();
        }
    }

    drawSelection() {
        const selection = document.getElementById("selection");
        selection.style = `
            position: absolute;
            top: ${this.selectionStartPosition.y}px;
            bottom: ${this.selectionEndPosition.y}px;
            left: ${this.selectionStartPosition.x}px;
            right: ${this.selectionEndPosition.x}px;
            background-color: #ffe6054b;
            z-index: 20;
        `;
    }

    resetSelection() {
        this.selectionEndPosition = null;
        this.selectionStartPosition = null;
        selection.style = `
          position: absolute;
          background-color: #ffe6054b;
          z-index: 20;
      `;
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
