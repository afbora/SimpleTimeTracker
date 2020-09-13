import { h, render, Component } from '../../preact/preact.js'
import Db from '../../Db.js'

export default class ModalCreate extends Component {
    constructor(props) {
        super(props)
        this.state = {
            taskName: '',
            projectName: '',
            db: new Db()
        }
    }
    
    onCancel = () => {
        this.props.onClose()
    }

    onSave = () => {
        this.state.db.insertTask(this.state.projectName, this.state.taskName)
        this.props.onClose()
    }

    onInputTaskName = e => {
        this.setState({ taskName: e.target.value })
    }

    onInputProjectName = e => {
        this.setState({ projectName: e.target.value })
    }

    render(props, state) {
        return h('div', { class: 'modal' },
            h('span', null, state.projectName),
            h('div', null,
                h('label', { for: 'task-project-name' }, 'Project name'),
                h('input', { type: 'text', name: 'task-project-name', id: 'task-project-name', class: 'text', onInput: this.onInputProjectName }),
            ),
            h('div', null,
                h('label', { for: 'task-name' }, 'Task name'),
                h('input', { type: 'text', name: 'task-name', id: 'task-name', class: 'text', onInput: this.onInputTaskName }),
            ),
            h('div', { class: 'button' },
                h('button', { type: 'button', onClick: this.onSave }, 'Save'),
                h('button', { class: 'cancel', onClick: this.onCancel }, 'Cancel'),
            ),
            h('p', { style: 'display: none', id: 'create-status' }),
        )
    }
}