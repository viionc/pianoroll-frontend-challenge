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
        clonedRoll.onclick = (e) => this.startSelection(e, svg);
        // add class active (green background) to the clicked roll
        roll.classList.add("active");
        // append the cloned roll to main piano element

        mainPianoRoll.appendChild(clonedRoll);
        mainPianoRoll.classList.add("show");
    }

    startSelection(event, svg) {
        if (this.selectionEndPosition) {
            this.resetSelection();
            return;
        }
        const svgPos = svg.getBoundingClientRect();

        const clickedPos = {x: Math.max(event.clientX - svgPos.left, 0), y: Math.max(event.clientY - svgPos.top, 0)};
        if (!this.selectionStartPosition) {
            this.selectionStartPosition = clickedPos;
        } else {
            this.selectionEndPosition = clickedPos;
            this.drawSelection(svg, svgPos);
        }
    }

    drawSelection(svg, svgPos) {
        const selectionRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        selectionRect.id = "selection";
        const minY = Math.min(this.selectionStartPosition.y, this.selectionEndPosition.y);
        const minX = Math.min(this.selectionStartPosition.x, this.selectionEndPosition.x);
        const maxY = Math.max(this.selectionStartPosition.y, this.selectionEndPosition.y);
        const maxX = Math.max(this.selectionStartPosition.x, this.selectionEndPosition.x);
        const y = minY / svgPos.height;
        const x = minX / svgPos.width;
        const height = (maxY - minY) / svgPos.height;
        const width = (maxX - minX) / svgPos.width;
        selectionRect.setAttribute("fill", "#ffe6054b");
        selectionRect.setAttribute("x", x);
        selectionRect.setAttribute("y", y);
        selectionRect.setAttribute("height", height);
        selectionRect.setAttribute("width", width);
        svg.appendChild(selectionRect);
    }

    resetSelection() {
        document.getElementById("selection").remove();
        this.selectionEndPosition = null;
        this.selectionStartPosition = null;
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
