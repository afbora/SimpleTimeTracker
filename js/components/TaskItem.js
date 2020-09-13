import { h, render, Component } from '../preact/preact.js'
import Db from '../Db.js'

export default class TaskItem extends Component {
    constructor(props) {
        super(props)
        this.state = {
            id: this.props.task.ID,
            name: this.props.task.name,
            projectName: this.props.task.project_name,
            time: this.getFullTime(this.props.task),
            start: this.props.task.start,
            running: Number(this.props.task.running),
            createdAt: this.created(this.props.task.created_at),
            diff: 0,
        };
        this.db = new Db()
        this.interval = null
    }

    componentDidMount() {
        if (this.state.running) this.timerStart()
    }

    componentWillUnmount() {
        clearInterval(this.interval)
    }

    start = () => {
        this.timerStart()

        let date = new Date()

        this.setState({ running: 1 })
        this.setState({ start: date })

        this.db.updateTaskState(this.state.id, 1, date)
    }

    stop = () => {
        this.timerStop();
        this.setState({ running: 0 })
        this.db.updateTaskState(this.state.id, 0, this.state.start)
        this.db.updateTask(this.state.id, this.state.projectName, this.state.name, this.state.time)
    }

    timerStart() {
        // remove timer
        clearInterval(this.interval)
        
        this.interval = setInterval(() => {
            this.setState({ time: this.state.time + 1 })
        }, 1000)
    }

    timerStop() {
        clearInterval(this.interval)
    }

    update = () => {
        alert('update')
    }

    reset = () => {
        alert('reset')
    }

    delete = () => {
        alert('delete')
    }

    getFullTime(task) {
        if (Number(task.running)) {
            let start = new Date(task.start);
            return Number(task.time) + Math.floor((new Date().getTime() - start.getTime()) / 1000)
        }
        else return Number(task.time)
    }

    created(value) {
        let date = new Date(value)
        
        let createdAt = 'Created: '
        createdAt += date.getDate() > 9 ? Number(date.getDate()) : '0' + Number(date.getDate()) + '.'
        createdAt += date.getMonth() > 9 ? Number(date.getMonth()) + 1 : '0' + (Number(date.getMonth()) + 1) + ' '
        createdAt += date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds()

        return createdAt
    }

    hms(seconds) {
		let time = [0, 0, seconds], i
		for (i = 2; i > 0; i--) {
			time[i - 1] = Math.floor(time[i] / 60)
			time[i] = time[i] % 60
			if (time[i] < 10) {
				time[i] = '0' + time[i]
			}
		}
		return time.join(':')
    }


    render(props, state) {
        return h(
            'div', { class: 'item' },
                h('div', { class: 'name' }, state.name),
                h('div', { class: 'project' }, state.projectName),
                h('a', { href: '', class: 'update', onClick: this.update }, 'Edit | '),
                h('a', { href: '', class: 'reset', onClick: this.reset }, 'Reset | '),
                h('a', { href: '', class: 'remove', onClick: this.delete }, 'Delete | '),
                h('span', { class: 'created-at', }, state.createdAt),
                h('span', { class: 'timer' }, this.hms(state.time)),
                state.running ? 
                    h('a', { class: 'power play running', onClick: this.stop }) : 
                    h('a', { class: 'power play', onClick: this.start })
        )
    }
}