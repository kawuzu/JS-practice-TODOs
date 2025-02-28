document.addEventListener('DOMContentLoaded', function () {
    new Vue({
        el: '#app',
        data: {
            column1: [],
            column2: [],
            column3: [],
            nextCardId: 1
        },
        methods: {
            addCard(columnIndex) {
                const newCard = {
                    id: this.nextCardId++,
                    title: `Карточка ${this.nextCardId}`,
                    items: [
                        { text: 'Пункт 1', completed: false },
                        { text: 'Пункт 2', completed: false },
                        { text: 'Пункт 3', completed: false }
                    ],
                    completedDate: null
                };

                if (columnIndex === 0 && this.column1.length < 3) {
                    this.column1.push(newCard);
                } else if (columnIndex === 1 && this.column2.length < 5) {
                    this.column2.push(newCard);
                }
                this.saveData();
            },
            updateCardStatus(cardIndex, columnIndex) {
                const column = [this.column1, this.column2, this.column3][columnIndex];
                const card = column[cardIndex];
                const completedCount = card.items.filter(item => item.completed).length;
                const totalItems = card.items.length;

                if (columnIndex === 0 && completedCount > totalItems / 2) {
                    this.moveCard(cardIndex, columnIndex, 1);
                } else if (columnIndex === 1 && completedCount === totalItems) {
                    card.completedDate = new Date().toLocaleString();
                    this.moveCard(cardIndex, columnIndex, 2);
                }

                this.saveData();
            },

            moveCard(cardIndex, fromColumnIndex, toColumnIndex) {
                const fromColumn = [this.column1, this.column2, this.column3][fromColumnIndex];
                const toColumn = [this.column1, this.column2, this.column3][toColumnIndex];
                const card = fromColumn.splice(cardIndex, 1)[0];
                toColumn.push(card);

                if (fromColumnIndex === 0 && this.column2.length >= 5) {
                    this.lockColumn(0);
                }
            },
            lockColumn(columnIndex) {
                const column = [this.column1, this.column2, this.column3][columnIndex];
                column.forEach(card => {
                    card.items.forEach(item => {
                        item.completed = true;
                    });
                });
            },
            saveData() {
                localStorage.setItem('notesAppData', JSON.stringify({
                    column1: this.column1,
                    column2: this.column2,
                    column3: this.column3,
                    nextCardId: this.nextCardId
                }));
            },
            loadData() {
                const data = JSON.parse(localStorage.getItem('notesAppData'));
                if (data) {
                    this.column1 = data.column1;
                    this.column2 = data.column2;
                    this.column3 = data.column3;
                    this.nextCardId = data.nextCardId;
                }
            }
        },
        mounted() {
            this.loadData();
        }
    });
});