import PianoRoll from "./pianoroll.js";
const pianoRollContainer = document.getElementById("pianoRollContainer");
const mainPianoRoll = document.getElementById("mainPianoRoll");
const sidePianoRolls = document.getElementById("sidePianoRolls");

class PianoRollDisplay {
    constructor(csvURL) {
        this.csvURL = csvURL;
        this.data = null;
        this.isSelecting = false;
        this.selectingEnded = false;
        this.selectionStartPosition = null;
        this.selectionEndPosition = null;
        this.previousColorsMap = [];
        this.isTouch = false;
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
        // Reset main piano roll element
        mainPianoRoll.innerHTML = "";
        // Add class to side piano rolls that make them align vertically on the right
        sidePianoRolls.classList.add("compact");
        // Check if there is an active roll and reset its color
        const activeRoll = Array.from(sidePianoRolls.children).find((e) => e.classList.contains("active"));
        activeRoll ? activeRoll.classList.remove("active") : null;
        // Get clicked roll element
        const roll = sidePianoRolls.children[rollId];
        // Clone it so it doesnt get removed from side rolls
        const clonedRoll = roll.cloneNode(true);
        // Make the cloned element bigger
        const svg = clonedRoll.querySelector("svg");
        svg.setAttribute("height", 500);
        svg.setAttribute("draggable", true);
        clonedRoll.classList.add("main");

        // Add class active (green background) to the clicked roll
        roll.classList.add("active");
        // Append the cloned roll to main piano element

        const selectedAreaText = document.createElement("div");
        selectedAreaText.id = "selectedAreaText";
        clonedRoll.appendChild(selectedAreaText);

        // Selection handlers
        svg.addEventListener("mousedown", (e) => {
            this.startSelection(e, svg);
        });
        svg.addEventListener("mousemove", (e) => this.drawSelection(e, svg));
        svg.addEventListener("mouseup", (e) => this.endSelection(e, svg));

        // Different handlers for phone.
        svg.addEventListener("touchstart", (e) => {
            this.isTouch = true;
            this.startSelection(e, svg);
        });
        svg.addEventListener("touchmove", (e) => this.drawSelection(e, svg));
        svg.addEventListener("touchend", (e) => {
            this.endSelection(e, svg);
            this.isTouch = false;
        });

        // Append cloned roll to document and show it.
        mainPianoRoll.appendChild(clonedRoll);
        mainPianoRoll.classList.add("show");
    }

    // Method that initializes selection.
    startSelection(event, svg) {
        // Reset selection area if previous selection is done
        if (this.selectingEnded) {
            this.resetSelection();
        }
        if (this.isSelecting) return;
        this.isSelecting = true;

        // Get starting click position
        const clickedPos = this.getMousePosition(event, svg);
        this.selectionStartPosition = clickedPos;
    }

    // Method that ends selection.
    endSelection(event, svg) {
        if (!this.isSelecting) return;
        this.isSelecting = false;
        this.selectingEnded = true;
        if (this.isTouch && !event.touches[0]) return;
        const clickedPos = this.getMousePosition(event, svg);
        this.selectionEndPosition = clickedPos;
        // Log area positions.
        console.log(`Starting Position: x: ${this.selectionStartPosition.x}, y: ${this.selectionStartPosition.y}`);
        console.log(`Ending Position: x: ${this.selectionEndPosition.x}, y: ${this.selectionEndPosition.y}`);
    }

    getMousePosition(event, svg) {
        // MouseEvent and TouchEvent have different properties, so had to work around that.
        if (this.isTouch) {
            var {clientX, clientY} = event.touches[0];
        } else {
            var {clientX, clientY} = event;
        }
        const svgPos = svg.getBoundingClientRect();
        const x = Math.max(clientX - svgPos.left, 0);
        const y = Math.max(clientY - svgPos.top, 0);
        return {x, y};
    }

    drawSelection(event, svg) {
        if (!this.isSelecting) return;
        let selectionRect = document.getElementById("selection");
        // Create selection element if it doesn't exist yet.
        if (!selectionRect) {
            selectionRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            selectionRect.id = "selection";
            svg.appendChild(selectionRect);
        }
        const svgPos = svg.getBoundingClientRect();

        // Calculate new selection area based on starting position from startSelection function and current cursor position
        const currentPos = this.getMousePosition(event, svg);
        const minY = Math.min(this.selectionStartPosition.y, currentPos.y);
        const minX = Math.min(this.selectionStartPosition.x, currentPos.x);
        const maxY = Math.max(this.selectionStartPosition.y, currentPos.y);
        const maxX = Math.max(this.selectionStartPosition.x, currentPos.x);
        const selectionY = minY / svgPos.height;
        const selectionX = minX / svgPos.width;
        const selectionHeight = (maxY - minY) / svgPos.height;
        const selectionWidth = (maxX - minX) / svgPos.width;
        // Set attributes
        selectionRect.setAttribute("fill", "#ffe6054b");
        selectionRect.setAttribute("x", selectionX);
        selectionRect.setAttribute("y", selectionY);
        selectionRect.setAttribute("height", selectionHeight);
        selectionRect.setAttribute("width", selectionWidth);

        // Add text information about selected area below piano roll
        const selectedAreaText = document.getElementById("selectedAreaText");
        selectedAreaText.innerText = `Selected area: x: ${selectionX.toFixed(2)}, y: ${selectionY.toFixed(2)}, height: ${selectionHeight.toFixed(
            2
        )}, width: ${selectionWidth.toFixed(2)}.`;

        // Restore previous colors to notes
        this.resetNotesColors();

        // Recolor notes that are within selected area
        const notes = Array.from(svg.children).filter((e) => e.classList.contains("note-rectangle"));
        notes.forEach((note) => {
            const x = note.x.baseVal.value;
            const y = note.y.baseVal.value;
            const height = note.height.baseVal.value;
            const width = note.width.baseVal.value;
            if (
                this.checkIfInSelection(
                    x,
                    y,
                    y + height,
                    x + width,
                    selectionX,
                    selectionY,
                    selectionY + selectionHeight,
                    selectionX + selectionWidth
                )
            ) {
                // Keep track of colors of selected notes so we can reset them to original colors later.
                this.previousColorsMap.push(note.getAttribute("fill"));
                note.classList.add("selected");
                note.setAttribute("fill", "red");
            }
        });
    }

    // Method that checks if selected area and note are interesecting
    checkIfInSelection(x, y, height, width, selectionX, selectionY, selectionHeight, selectionWidth) {
        if (x < selectionWidth && width > selectionX && y < selectionHeight && height > selectionY) {
            return true;
        }
    }

    // Reset selection area
    resetSelection() {
        this.selectingEnded = false;
        this.isSelecting = false;
        this.resetNotesColors();
        const selection = document.getElementById("selection");
        if (selection) selection.remove();
        const selectedAreaText = document.getElementById("selectedAreaText");
        selectedAreaText.innerText = "";
        this.selectionEndPosition = null;
        this.selectionStartPosition = null;
    }

    resetNotesColors() {
        const svg = document.querySelector(".main > svg");
        const notes = Array.from(svg.children).filter((e) => e.classList.contains("selected"));
        notes.forEach((note, index) => {
            note.setAttribute("fill", this.previousColorsMap[index]);
        });
        this.previousColorsMap = [];
    }

    preparePianoRollCard(rollId) {
        const cardDiv = document.createElement("div");
        cardDiv.classList.add("piano-roll-card");

        // Create and append other elements to the card container as needed
        const descriptionDiv = document.createElement("div");
        descriptionDiv.classList.add("description");
        descriptionDiv.textContent = `This is a piano roll number ${rollId}`;
        cardDiv.onclick = () => {
            this.openPianoRoll(rollId);
            this.resetSelection();
        };
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
