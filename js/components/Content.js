import { h, render, Component } from '../preact/preact.js'
import TaskItem from './TaskItem.js'
import Db from '../Db.js'
import ModalCreate from './components/modals/ModalCreate.js'
import ModalHistory from './components/modals/ModalHistory.js'

export default class Content extends Component {
    constructor(props) {
        super(props);
        this.state = {
            count: 0,
            tasks: [],
            db: new Db()
        };
    }

    componentDidMount() {
        this.state.db.getAllTasks((tasks) => {
            this.setState({ tasks: tasks })
        });
    }

    updateTask(number) {
        
    }

    taskList(props, state) {
        if (state.tasks && state.tasks.length) {
            return h('div', null, 'Задач: ' + state.tasks.length),
            state.tasks.map((task, index) => {
                return h(TaskItem, {index: index, task: task, onUpdate: (e) => updateTask(number, data, e)})
            })
        }
        else return h('span', null, 'Задач нет')
    }

    render(props, state) {
        return h('div', { class: 'content' },
            this.taskList(props, state)
        )
    }
}

//h(ModalCreate, { onClose: this.closeModal, onCreate: this.save })
//h(ModalHistory, { onClose: this.closeModal })