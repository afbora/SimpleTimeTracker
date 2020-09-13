import { h, render, Component } from '../../preact/preact.js'

export default class ModalCreate extends Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
    }

    componentWillUnmount() {
    }

    render(props, state) {
        return h('form', { class: 'form', style: 'display: none' },
            h('p', null,
                h('label', { for: 'task-project-name' }, 'Project name'),
                h('input', { type: 'text', name: 'task-project-name', id: 'task-project-name', class: 'text' }),
            ),
        )
    }
}