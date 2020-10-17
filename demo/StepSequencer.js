/* eslint-disable @typescript-eslint/explicit-function-return-type */
const seqCellColor = "rgb(241, 196, 15)";
const seqCellEmptyColor = "rgb(248, 249, 249)";

const seqCellPlayingColor = "rgb(201, 156, 0)";
const seqCellEmptyPlayingColor = "rgb(228, 229, 229)";

export default class StepSequencer {
    constructor(initParams) {
        this.parentElement = initParams.parent;
        this.stepModel = initParams.model;
        this.synthNotes = initParams.synthNotes;
        this.rowNames = initParams.rownames;

        this.rowCount = this.stepModel.length - 1;
        this.stepCount = this.stepModel[0].length - 1;
        this.currentStep = this.stepCount;

        const seqUI = this.createUI();
        this.mountIntoDOM(seqUI);

        this.stepsWithCells = this.getStepCells();
    }

    reset() {
        this.decolorizeColumn(this.currentStep);
        this.currentStep = -2; // must be lower than the 1st step when next() is called
    }

    next() {
        this.decolorizeColumn(this.currentStep);
        this.incrementCurrentStep();
        this.colorizeColumn(this.currentStep);
    }

    incrementCurrentStep() {
        this.currentStep++;
        if (this.currentStep > this.stepCount) {
            this.currentStep = 0;
        }
    }

    colorizeColumn(stepNumber) {
        if (stepNumber >= 0 && stepNumber <= this.stepCount) {
            const column = this.stepsWithCells[stepNumber];
            column.forEach((cell) => {
                if (cell.style.backgroundColor === seqCellColor) {
                    cell.style.backgroundColor = seqCellPlayingColor;
                } else {
                    cell.style.backgroundColor = seqCellEmptyPlayingColor;
                }
            });
        }
    }

    decolorizeColumn(stepNumber) {
        if (stepNumber >= 0 && stepNumber <= this.stepCount) {
            const column = this.stepsWithCells[stepNumber];
            column.forEach((cell) => {
                if (cell.style.backgroundColor === seqCellPlayingColor || cell.style.backgroundColor === seqCellColor) {
                    cell.style.backgroundColor = seqCellColor;
                } else {
                    cell.style.backgroundColor = seqCellEmptyColor;
                }
            });
        }
    }

    getStepCells() {
        const rowCount = this.stepModel.length;
        const stepCount = this.stepModel[0].length;
        const steps = [];

        for (let i = 0; i < stepCount; i++) {
            steps.push([]);
            for (let j = 0; j < rowCount; j++) {
                const id = "seq-row_" + j + "_" + i;
                const cell = document.getElementById(id);
                steps[i].push(cell);
            }
        }
        return steps;
    }

    createUI() {
        const table = document.createElement("table");
        const rowCount = this.stepModel.length;

        table.id = "step-seq";
        table.className = "step-seq";
        table.appendChild(this.createHeaderRow(this.stepModel[0].length));

        for (let i = 0; i < rowCount; i++) {
            const row = this.createSeqRow(this.stepModel[i], i, this.rowNames[i]);
            table.appendChild(row);
        }
        const noteInputs = this.createNoteInputRow(this.stepModel[rowCount - 1]);
        table.appendChild(noteInputs);
        return table;
    }

    mountIntoDOM(seqUI) {
        const container = document.getElementById(this.parentElement);
        container.appendChild(seqUI);
    }

    createHeaderRow(stepCount) {
        const headerRow = document.createElement("tr");
        headerRow.id = "seq-row-header";
        this.populateHeaderRow(headerRow, stepCount);

        return headerRow;
    }

    populateHeaderRow(headerRow, rowCount) {
        for (let i = 0; i <= rowCount; i++) {
            const th = document.createElement("th");
            if (i !== 0) {
                th.className = "seq-header-cell";
                th.innerText = i;
            }
            headerRow.appendChild(th);
        }
    }

    createSeqRow(rowModel, rowNumber, rowName) {
        const seqRow = document.createElement("tr");
        seqRow.id = "seq-row_" + rowNumber;
        seqRow.className = "seq-row";

        this.addSeqRowHeader(seqRow, rowName);
        this.populateSeqRow(seqRow, rowModel);

        return seqRow;
    }

    addSeqRowHeader(seqRow, rowName) {
        const headerCell = document.createElement("th");
        headerCell.className = "seq-row-header";
        headerCell.innerText = rowName;
        seqRow.appendChild(headerCell);
    }

    populateSeqRow(seqRow, rowModel) {
        const rowId = seqRow.id;
        const stepCount = rowModel.length;

        for (let i = 0; i < stepCount; i++) {
            const td = document.createElement("td");
            td.id = rowId + "_" + i;
            td.className = "seq-step";
            td.onclick = this.changeStep.bind(this);

            if (rowModel[i] !== 0) {
                td.style.backgroundColor = seqCellColor;
            } else {
                td.style.backgroundColor = seqCellEmptyColor;
            }

            seqRow.appendChild(td);
        }
    }

    createNoteInputRow(rowModel) {
        const inputRow = document.createElement("tr");
        inputRow.id = "input-row";
        this.populateNoteInputRow(inputRow, rowModel);
        return inputRow;
    }

    populateNoteInputRow(rowElement, rowModel) {
        const stepCount = rowModel.length;

        for (let i = 0; i <= stepCount; i++) {
            const td = document.createElement("td");
            if (i !== 0) {
                const noteValue = this.synthNotes[i - 1];
                td.className = "note-input-cell";
                const input = document.createElement("input");
                input.id = "note-input_" + (i - 1);
                input.className = "note-input";
                input.type = "number";
                input.min = 0;
                input.max = 127;
                input.value = noteValue;
                input.onchange = this.changeNote.bind(this);
                td.appendChild(input);
            }
            rowElement.appendChild(td);
        }
    }

    changeNote(event) {
        const elementID = event.target.id;
        const stepNumber = parseInt(elementID.split("_")[1]);
        const noteNumber = event.target.valueAsNumber;

        this.onNoteChange(stepNumber, noteNumber);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onNoteChange(stepNumber, noteNumber) {
        // can be overridden to inject code
        // that modifies the context
    }

    changeStep(event) {
        const seqCellId = event.target.id;
        const seqCell = document.getElementById(seqCellId);
        let activeStatus = false;

        if (seqCell.style.backgroundColor === seqCellColor || seqCell.style.backgroundColor === seqCellPlayingColor) {
            seqCell.style.backgroundColor = seqCellEmptyColor;
        } else {
            seqCell.style.backgroundColor = seqCellColor;
            activeStatus = true;
        }

        const cellCoords = seqCellId.split("_");
        this.onStepChange(cellCoords[1], cellCoords[2], activeStatus);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onStepChange(rowNumber, stepNumber, cellActive) {
        // can be overridden to inject code
        // that modifies the context
    }
}
