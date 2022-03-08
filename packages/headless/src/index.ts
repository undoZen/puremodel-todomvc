import { adaptReact, addActions, addSelectors, createModels } from '@pure-model-combine/puremodels';
import EditInitializer from './edit';
import TodoFilter from './filter';
import HeaderInitializer from "./header";
import TodosInitializer from "./todos";

export const { toProvider, GlobalModelsProvider } = adaptReact([TodosInitializer, TodoFilter])

export const headerCombine = createModels({
    todos: TodosInitializer,
    header: HeaderInitializer,
})(addSelectors((props) => ({
    headerText: (state) => state.header,
    todos: (state) => state.todos,
    //@ts-ignore
    isAllCompleted: ({ todos }) => todos.every(({ completed }) => completed),
})))(addActions((models) => ({
    //@ts-ignore
    toggleAll: () => models.todos.actions.toggleAll(),
    changeHeaderText: (text: string) => {
        //@ts-ignore
        return models.header.actions.setHeaderText(text)
    },
    addTodo: () => {
        const text = models.header.store.getState()
        //@ts-ignore
        models.todos.actions.addTodo(text)
        //@ts-ignore
        models.header.actions.setHeaderText('')
    }
})))
const HeaderProvider = headerCombine(toProvider())
export { HeaderProvider };
export { TodosProvider };
export { FilterProvider };

const todosCombine = createModels({
    todo: TodosInitializer,
    filter: TodoFilter,
})(addSelectors((props) => ({
    //@ts-ignore
    count: (state) => state.todo.length,
    list: (state) => {
        if (state.filter === 'all') {
            return state.todo
        } else if (state.filter === 'active') {
            //@ts-ignore
            return state.todo.filter(todo => !todo.completed)
        } else if (state.filter === 'completed') {
            //@ts-ignore
            return state.todo.filter(todo => todo.completed)
        }
    },
})))

const TodosProvider = todosCombine(toProvider())

const filterCombine = createModels({
    todos: TodosInitializer,
    filter: TodoFilter,
})(addSelectors((props) => ({
    selectedType: (state) => state.filter,
    //@ts-ignore
    leftCount: (state) => state.todos.filter(todo => !todo.completed).length,
    //@ts-ignore
    allCount: (state) => state.todos.length,
})))(addActions((models) => ({
    //@ts-ignore
    clearCompleted: () => models.todos.actions.clearCompleted(),
    changeFilter: (type: string) => {
        //@ts-ignore
        models.filter.actions.setFilterType(type)
    }
})))
const FilterProvider = filterCombine(toProvider())

//@ts-ignore
const getTodoSelector = (todoId: number | string) => (todos) => todos.find(({ id }) => id === todoId)
export const todoCombine = createModels({
    todos: TodosInitializer,
    edit: EditInitializer,
})(addSelectors((props) => {
    //@ts-ignore
    const todo = (state) => getTodoSelector(props.id)(state.todos)
    //@ts-ignore
    const isEditing = (state) => state.edit.status
    return {
        //@ts-ignore
        editingValue: (state) => isEditing(state) ? state.edit.content : todo(state).content,
        isEditing,
        todo,
    }
//@ts-ignore
}))(addActions((models, props) => {
    const { id } = props
    const todo = getTodoSelector(id)
    const toggle = () => {
        models.todos.actions.toggleTodo(id)
    }
    const remove = () => {
        models.todos.actions.removeTodo(id)
    }
    const update = (content: string) => {
        models.edit.actions.update(content)
    }
    const startEdit = () => {
        const content = todo(models.todos.store.getState()).content
        models.edit.actions.update(content)
        models.edit.actions.enable()
    }
    const endEdit = () => {
        models.edit.actions.disable()
    }
    const submit = () => {
        const content = models.edit.store.getState().content
        models.todos.actions.updateTodo({ id, content })
        endEdit()
    }
    return {
        toggle,
        remove,
        update,
        startEdit,
        endEdit,
        submit,
    }
}))
export const TodoProvider = todoCombine(toProvider())