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
            }
        }
    });
});