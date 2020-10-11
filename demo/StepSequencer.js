/* eslint-disable @typescript-eslint/explicit-function-return-type */
const seqCellColor = "rgb(241, 196, 15)";
const seqCellEmptyColor = "rgb(248, 249, 249)";

const seqCellPlayingColor = "rgb(201, 156, 0)";
const seqCellEmptyPlayingColor = "rgb(228, 229, 229)";

export default class StepSequencer {
    constructor(initParams) {
        this.parentElement = initParams.parent;
        this.stepModel = initParams.model;
        this.rowNames = initParams.rownames;

        this.rowCount = this.stepModel.length - 1;
        this.stepCount = this.stepModel[0].length - 1;
        this.currentStep = this.stepCount;

        const seqUI = this.createUI();
        this.mountIntoDOM(seqUI);

        this.stepsWithCells = this.getStepCells();
    }

    reset() {
        this.currentStep = this.stepCount; // must be on the last step to render the 1st step when next() is called
        for (let i = 0; i <= this.stepCount; i++) {
            this.decolorizeColumn(i);
        }
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
        const column = this.stepsWithCells[stepNumber];
        column.forEach((cell) => {
            if (cell.style.backgroundColor === seqCellColor) {
                cell.style.backgroundColor = seqCellPlayingColor;
            } else {
                cell.style.backgroundColor = seqCellEmptyPlayingColor;
            }
        });
    }

    decolorizeColumn(stepNumber) {
        const column = this.stepsWithCells[stepNumber];
        column.forEach((cell) => {
            if (cell.style.backgroundColor === seqCellPlayingColor) {
                cell.style.backgroundColor = seqCellColor;
            } else {
                cell.style.backgroundColor = seqCellEmptyColor;
            }
        });
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

        table.className = "step-seq";
        table.appendChild(this.createHeaderRow(this.stepModel[0].length));

        for (let i = 0; i < rowCount; i++) {
            const row = this.createSeqRow(this.stepModel[i], i, this.rowNames[i]);
            table.appendChild(row);
        }
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
            td.onclick = this.changeStep;

            if (rowModel[i] !== 0) {
                td.style.backgroundColor = seqCellColor;
            } else {
                td.style.backgroundColor = seqCellEmptyColor;
            }

            seqRow.appendChild(td);
        }
    }

    changeStep(event) {
        const seqCellId = event.target.id;
        const seqCell = document.getElementById(seqCellId);

        if (seqCell.style.backgroundColor === seqCellColor) {
            seqCell.style.backgroundColor = seqCellEmptyColor;
        } else {
            seqCell.style.backgroundColor = seqCellColor;
        }
    }
}
