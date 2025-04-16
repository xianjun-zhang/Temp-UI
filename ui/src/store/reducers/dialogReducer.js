import { SHOW_CONFIRM, HIDE_CONFIRM } from '../actions'

export const initialState = {
    show: false,
    title: '',
    description: '',
    confirmButtonName: 'OK',
    cancelButtonName: 'Cancel',
    customBtnId: ''
}

const alertReducer = (state = initialState, action) => {
    switch (action.type) {
        case SHOW_CONFIRM:
            const newState = {
                ...state,
                show: true,
                title: action.payload.title || '',
                description: action.payload.description || '',
                confirmButtonName: action.payload.confirmButtonName || '',
                cancelButtonName: action.payload.cancelButtonName || '',
                extraButton: action.payload.extraButton || null,
                confirmButtonProps: action.payload.confirmButtonProps || null
            }
            return newState
        case HIDE_CONFIRM:
            return {
                ...state,
                show: false,
                title: '',
                description: '',
                confirmButtonName: '',
                cancelButtonName: '',
                extraButton: null
            }
        default:
            return state
    }
}

export default alertReducer
