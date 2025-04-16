import { useDispatch } from 'react-redux'
import { SET_DIRTY, REMOVE_DIRTY } from '@/store/actions'

export const useCanvasDirtyState = () => {
    const dispatch = useDispatch()
    
    const setDirty = () => {
        dispatch({ type: SET_DIRTY })
    }
    
    const removeDirty = () => {
        dispatch({ type: REMOVE_DIRTY })
    }
    
    return {
        setDirty,
        removeDirty
    }
}
