class MinesweeperGame { 
    static STATE_STARTED = "started";
    static STATE_LOST = "lost";
    static STATE_WON = "won";

    static FIELD_HIDDEN_MINE = 'x';
    static FIELD_EXPLODED_MINE = 'X';
    static FIELD_EMPTY = '.';

    static NEIGHBOUR_OFFSETS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];

    constructor(width, height, numMines) {
        this.mines = this.generateMines(numMines, width, height);
        this.field = this.buildField(this.mines);
        this.revealed = {}
        this.flagged = {}
        this.status = MinesweeperGame.STATE_STARTED
        this.width = width 
        this.height = height
    }

    randCoord(xMax, yMax) {
        let randInt = hi => Math.floor(Math.random() * hi);
        return [randInt(xMax), randInt(yMax)]
    }

    generateMines(nMines, xMax, yMax) {
        let mines = {};
        for (let i = 0; i < Math.min(nMines, xMax * yMax); i++) {
            do var next = this.randCoord(xMax, yMax); while (mines[next])
            mines[next] = next;
        }
        
        return Object.values(mines);
    }

    buildField(mines) {
        var field = {};
        for (let [x, y] of mines) {
            field[[x, y]] = MinesweeperGame.FIELD_HIDDEN_MINE;
            for (let [dx, dy] of MinesweeperGame.NEIGHBOUR_OFFSETS) {
                let coord = [x + dx, y + dy];
                if (field[coord] != MinesweeperGame.FIELD_HIDDEN_MINE)
                    field[coord] = (field[coord] ?? 0) + 1;  
            }
        }

        return field;
    }

    outOfBounds(x, y) {
        return x < 0 || y < 0 || x >= this.width || y >= this.height;
    }


    floodFill(x, y) {
        let curr = [x, y];
        // if this cell is already revealed or out of bounds, do nothing
        if (this.revealed[curr] || this.outOfBounds(x, y)) {
            return;
        }
        if (this.field[curr] === undefined) {
            // field is empty, need to flood-fill and reveal adjacent empty cells
            this.revealed[curr] = MinesweeperGame.FIELD_EMPTY;
            for (let [dx, dy] of MinesweeperGame.NEIGHBOUR_OFFSETS)
                this.floodFill(x + dx, y + dy)
        } else if (typeof this.field[curr] == "number") {
            // field is a number cell, should reveal
            this.revealed[curr] = this.field[curr];
        }
    }

    click(xy) {
        let clicked = this.field[xy];
        if (this.revealed[xy] || this.status != MinesweeperGame.STATE_STARTED) {
            return;

        } else if (clicked == MinesweeperGame.FIELD_HIDDEN_MINE) {
            this.status = MinesweeperGame.STATE_LOST;
            this.mines.forEach(xy => this.revealed[xy] = MinesweeperGame.FIELD_HIDDEN_MINE);
            this.revealed[xy] = MinesweeperGame.FIELD_EXPLODED_MINE;

        } else if (clicked === undefined || typeof clicked == "number") {
            this.floodFill(xy[0], xy[1]);
        } 
        
        this.updateStatusIfWon();
    }

    updateStatusIfWon() {
        let numRevealed = Object.keys(this.revealed).length;
        let correctlyFlaggedAll = this.mines.every(xy => this.flagged[xy]);
        let revealedAllButMines = numRevealed == this.height * this.width - this.mines.length;
        if (correctlyFlaggedAll && revealedAllButMines) {
            this.status = MinesweeperGame.STATE_WON;
        }
    }

    flag(xy) {
        // game over? no flag
        if (this.status != MinesweeperGame.STATE_STARTED) {
            return;
        }
        // run out of flags? no flag
        if (!this.flagged[xy] && Object.values(this.flagged).length >= this.mines.length) {
            return;
        }
        // already revealed? no flag
        if (this.revealed[xy]) {
            return;
        }

        if (this.flagged[xy]) {
            delete this.flagged[xy];
        } else {
            this.flagged[xy] = true;
        }

        this.updateStatusIfWon();
    }

    get state() {
        return {
            numMines: this.mines.length,
            status: this.status,
            height: this.height,
            width: this.width,
            flagged: this.flagged,
            revealed: this.revealed
        }
    }
}