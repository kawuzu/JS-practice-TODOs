const Card = {
    props: {
        title: String,
        list: Array,
        column: Number,
        index: Number,
        moveCard: Function,
        completedAt: String,
        updateCard: Function,
        totalCardsInSecondColumn: Number,
        isPriority: Boolean,
        canEdit: Boolean,
    },
    computed: {
        completed() {
            const completedItems = this.list.filter(item => item.done).length;
            return Math.floor((completedItems / this.list.length) * 100);
        },
        cardClass() {
            return this.isPriority ? 'priority-card' : '';
        }
    },
    methods: {
        checkItem(index) {
            if (!this.canEdit && !this.isPriority) return;

            const item = this.list[index];
            item.timestamp = new Date().toLocaleString();

            const completedItems = this.list.filter(item => item.done).length;
            const completed = Math.floor((completedItems / this.list.length) * 100);

            if (completed === 100 && !this.completedAt) {
                const completedTime = new Date().toLocaleString();
                this.updateCard(this.index, this.column, { completedAt: completedTime });
            }

            // Only move to second column if it's not full
            if (this.column === 1 && completed > 50 && this.totalCardsInSecondColumn < 5) {
                this.moveCard({ column: this.column, index: this.index }, 2);
            } else if (this.column === 2 && completed === 100) {
                this.moveCard({ column: this.column, index: this.index }, 3);
            }
        },
    },
    template: `
        <div class="card" :class="cardClass">
            <h3>{{ title }}</h3>
            <ul>
                <li v-for="(item, index) in list" :key="index">
                    <input type="checkbox" v-model="item.done" 
                           @change="checkItem(index)" 
                           :disabled="!canEdit && !isPriority"/> 
                    {{ item.text }}
                    <span v-if="item.timestamp" class="timestamp">
                        ({{ item.timestamp }})
                    </span>
                </li>
            </ul>

            <p v-if="completed === 100" class="completed-timestamp">
                завершено: {{ completedAt }}
            </p>
        </div>
    `
};

const Column = {
    props: {
        columnNumber: Number,
        cards: Array,
        moveCard: Function,
        updateCard: Function,
        totalCardsInSecondColumn: Number,
        isPriorityCardInFirstColumn: Boolean,
    },
    components: { Card },
    computed: {
        sortedCards() {
            return this.cards.sort((a, b) => {
                if (a.isPriority && !b.isPriority) return -1;
                if (!a.isPriority && b.isPriority) return 1;
                return 0;
            });
        },
        canEditCards() {
            // Block editing in first column if second column is full and there's a card with >50% completion
            if (this.columnNumber === 1 && this.totalCardsInSecondColumn >= 5) {
                const hasProgressingCard = this.cards.some(card => {
                    const completedItems = card.list.filter(item => item.done).length;
                    return Math.floor((completedItems / card.list.length) * 100) > 50;
                });
                if (hasProgressingCard) return false;
            }

            const isPriorityCardInFirstColumn = this.columnNumber === 1 && this.cards.some(card => card.isPriority);
            const isPriorityCardInSecondColumn = this.columnNumber === 2 && this.cards.some(card => card.isPriority);
            const isPriorityInAnyOfFirstTwoColumns = this.$root.columns[0].cards.some(card => card.isPriority) ||
                this.$root.columns[1].cards.some(card => card.isPriority);

            return !isPriorityInAnyOfFirstTwoColumns;
        }
    },
    template: `
        <div class="column">
            <h2>столбец {{ columnNumber }}</h2>
            <div v-for="(card, index) in sortedCards" :key="index">
                <Card
                    :title="card.title"
                    :list="card.list"
                    :column="columnNumber"
                    :index="index"
                    :completedAt="card.completedAt"
                    :moveCard="moveCard"
                    :updateCard="updateCard"
                    :totalCardsInSecondColumn="totalCardsInSecondColumn"
                    :isPriority="card.isPriority"
                    :canEdit="canEditCards"
                />
            </div>
        </div>
    `
};

const app = new Vue({
    el: '#app',
    data() {
        return {
            newCard: {
                title: '',
                list: ['', '', ''],
                completedAt: null,
                isPriority: false,
            },
            columns: [
                { cards: JSON.parse(localStorage.getItem('column1')) || [] },
                { cards: JSON.parse(localStorage.getItem('column2')) || [] },
                { cards: JSON.parse(localStorage.getItem('column3')) || [] },
            ],
            blockFirstColumn: false,
        };
    },
    methods: {
        updateCard(index, column, data) {
            Vue.set(this.columns[column - 1].cards[index], 'completedAt', data.completedAt);
            this.saveData();
        },
        moveCard(cardIndex, columnIndex) {
            // Check if trying to move to second column when it's full
            if (columnIndex === 2 && this.columns[1].cards.length >= 5) {
                alert('Второй столбец заполнен (максимум 5 карточек)');
                return;
            }

            const card = this.columns[cardIndex.column - 1].cards.splice(cardIndex.index, 1)[0];
            this.columns[columnIndex - 1].cards.push(card);
            this.saveData();
            this.checkBlockFirstColumn();
        },
        checkBlockFirstColumn() {
            const secondColumnFull = this.columns[1].cards.length >= 5;
            const firstColumnHasProgressingCard = this.columns[0].cards.some(card => {
                const completedItems = card.list.filter(item => item.done).length;
                return Math.floor((completedItems / card.list.length) * 100) > 50;
            });

            this.blockFirstColumn = secondColumnFull && firstColumnHasProgressingCard;
        },
        saveData() {
            localStorage.setItem('column1', JSON.stringify(this.columns[0].cards));
            localStorage.setItem('column2', JSON.stringify(this.columns[1].cards));
            localStorage.setItem('column3', JSON.stringify(this.columns[2].cards));
        },
        addItem() {
            if (this.newCard.list.length < 5) {
                this.newCard.list.push('');
            }
        },
        removeItem(index) {
            if (this.newCard.list.length > 3) {
                this.newCard.list.splice(index, 1);
            }
        },
        addNewCard() {
            if (this.blockFirstColumn) {
                alert('Первый столбец заблокирован, пока во втором не появится свободное место');
                return;
            }
            if (this.newCard.title.trim() && this.newCard.list.every(item => item.trim())) {
                const newCard = {
                    title: this.newCard.title,
                    list: this.newCard.list.map(text => ({ text, done: false })),
                    isPriority: this.newCard.isPriority,
                };
                if (this.columns[0].cards.length < 3) {
                    this.columns[0].cards.push(newCard);
                    this.columns[0].cards.sort((a, b) => a.isPriority ? -1 : 1);
                    console.log('New card added:', newCard);
                } else {
                    alert('В первом храниться не более 3-х карточек!');
                }
                this.saveData();
                this.newCard = { title: '', list: ['', '', ''], isPriority: false };
            } else {
                alert('Введите заголовок и минимум 3 пункта!');
            }
        },
    },
    components: { Column },
    template: `
    <div id="app">
        <div>
            <h2>создать новую записку</h2>
            <form @submit.prevent="addNewCard">
                <div>
                    <label for="title">название:</label>
                    <input v-model="newCard.title" id="title" type="text" required />
                </div>
                <div>
                    <label>пункты (мин. 3, макс. 5):</label>
                    <div v-for="(item, index) in newCard.list" :key="index">
                        <input v-model="newCard.list[index]" type="text" :placeholder="'пункт ' + (index + 1)" required />
                        <button v-if="newCard.list.length > 3" type="button" @click="removeItem(index)">✖</button>
                    </div>
                    <button v-if="newCard.list.length < 5" type="button" @click="addItem">добавить пункт</button>
                </div>
           
                <button type="submit" :disabled="blockFirstColumn">сохранить записку</button>
            </form>
        </div>
        <div class="columns-container">
            <Column
                v-for="(column, index) in columns"
                :key="index"
                :columnNumber="index + 1"
                :cards="column.cards"
                :moveCard="moveCard"
                :updateCard="updateCard"
                :totalCardsInSecondColumn="columns[1].cards.length"
                :isPriorityCardInFirstColumn="columns[0].cards.some(card => card.isPriority)"
            />
        </div>
    </div>
    `,
});