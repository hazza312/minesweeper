customElements.define(
    'minesweeper-game',
    class extends HTMLElement {
        NUMBER_CLASSES = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
        LEVELS = {
            debug: {height: 1, width: 2, mines: 1},
            beginner: {height: 9, width: 9, mines: 10},
            intermediate: {height: 16, width: 16, mines: 40},
            expert: {height: 16, width: 30, mines: 99}
        }

        constructor() {
            super();

            let root = document.getElementById("gameTemplate").content.cloneNode(true);
            root.getElementById('gameTable').onclick = e => this.onClick(e);
            root.getElementById('gameTable').oncontextmenu = e => this.onRightClick(e);
            root.getElementById('resetButton').onclick = e => this.onReset(e);
            root.getElementById('levelSelect').onchange = e => this.onReset(e);
            this.attachShadow({ mode: "open" }).appendChild(root);
        }

        connectedCallback() {
            this.timer = null;
            this.started = null;
            this.onReset();
        }

        handleTimer() {
            if (this.game.state.status != MinesweeperGame.STATE_STARTED) {
                clearTimeout(this.timer);
                this.timer = null;
                return;
            }

            if (!this.timer) {
                let timer = this.shadowRoot.getElementById('timer');
                let started = this.started = Math.floor(Date.now() / 1000);
                this.timer = setInterval(function() {
                    let now = Math.floor(Date.now() / 1000);
                    timer.innerHTML = now - started;
                }, 1000);
            }
        }

        onClick(e) {
            this.game.click(this.getXY(e.target));
            this.redraw();
            this.handleTimer();
        }

        getXY(el) {
            return el.attributes['data-xy'].value.split(',').map(x => parseInt(x));
        }

        onRightClick(e) {
            e.preventDefault();
            this.game.flag(this.getXY(e.target));
            this.redraw();
            this.handleTimer();
        }


        onReset() {
            let { width, height, mines } = this.LEVELS[this.shadowRoot.getElementById('levelSelect').value];
            this.game = new MinesweeperGame(width, height, mines);
            this.shadowRoot.getElementById('timer').innerHTML = '0';
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
            this.redraw();
        }

        redraw() {
            let state = this.game.state;
            let table = this.shadowRoot.getElementById('gameTable');
            table.innerHTML = "";

            for (let y = 0; y < state.height; y++) {
                let row = document.createElement("tr");
                for (let x = 0; x < state.width; x++) {
                    row.appendChild(this.getCellElement(state, x, y));
                }
                table.appendChild(row);
            }

            var face;
            switch(state.status) {
                case MinesweeperGame.STATE_WON: face = "😎"; break;
                case MinesweeperGame.STATE_LOST: face = "🙁"; break;
                default: face = "🙂"
            }
            this.shadowRoot.getElementById('resetButton').innerHTML = face;

            let flagsRemaining = state.numMines - Object.values(state.flagged).length;
            this.shadowRoot.getElementById('numMines').innerHTML = flagsRemaining;
        }

        getCellElement(state, x, y) {
            let el = document.createElement('td');
            el.setAttribute('data-xy', [x, y])

            var classes, content;
            if (state.revealed[[x, y]] == MinesweeperGame.FIELD_HIDDEN_MINE) {
                [classes, content] = [['revealed'], '💣'];

            } else if (state.revealed[[x, y]] == MinesweeperGame.FIELD_EXPLODED_MINE) {
                [classes, content] = [['pulsing-mine', 'revealed'],  '💣'];

            } else if (state.revealed[[x, y]] == MinesweeperGame.FIELD_EMPTY) {
                [classes, content] = [['revealed'], ''];

            } else if (typeof state.revealed[[x, y]] == "number") {
                [classes, content] = [[this.NUMBER_CLASSES[state.revealed[[x, y]] -1 ], 'revealed'], state.revealed[[x, y]]]

            } else if (state.flagged[[x, y]]) {
                [classes, content] = [['flagged', 'selectable'], "🚩"];

            } else if (state.status == MinesweeperGame.STATE_STARTED) {
                [classes, content] = [['unselected', 'selectable'], ''];

            } else {
                [classes, content] = [['unselected'], ''];
            }

            el.classList.add(...classes);
            el.innerHTML = content;
            return el;
        }
    }
)