import { h, render, Component } from '../preact.js'

export default class ModalCreate extends Component {
    constructor(props) {
        super(props);
    }

	state = {
	};

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
            h('p', null,
                h('label', { for: 'task-name' }, 'Task name'),
                h('input', { type: 'text', name: 'task-name', id: 'task-name', class: 'text' }),
            ),
            h('p', { class: 'button' },
                h('input', { type: 'button', id: 'button-create', value: 'Save' }),
                h('input', { type: 'button', id: 'form-create.cancel-button', class: 'cancel', rel: 'form-create', value: 'Cancel' }),
            ),
            h('p', { style: 'display: none', id: 'create-status' }),
        )
    }
}






// <div id="form-create" class="form" style="display: none">
//     <p>
//         <label for="task-project-name">Project name</label>
//         <input type="text" name="task-project-name" id="task-project-name" class="text"/>
//     </p>
//     <p>
//         <label for="task-name">Task name</label>
//         <input type="text" name="task-name" id="task-name" class="text"/>
//     </p>
//     <p class="buttons">
//         <input type="button" id="button-create" value="Save"/>
//         <input type="button" id="form-create.cancel-button" class="cancel" rel="form-create" value="Cancel"/>
//     </p>
//     <p style="display: none" id="create-status"></p>
// </div>