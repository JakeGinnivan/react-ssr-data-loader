import { Action } from 'redux'

export interface LoaderDataState {
    loaded: boolean
    loading: boolean
    failed: boolean
    error?: string
    serverSideRender: boolean
    data?: any
}


export interface DataKeyMap {
    [dataKey: string]: LoaderDataState
}

export interface DataTypeMap {
    [dataType: string]: DataKeyMap
}

export interface ReduxStoreState {
    dataLoader: DataTypeMap
}

export interface Meta {
    dataType: string
    dataKey: string
    isServerSideRender: boolean
}

export const LOAD_DATA = 'redux-data-loader/LOAD_DATA'
export interface LOAD_DATA extends Action {
    type: 'redux-data-loader/LOAD_DATA'
    meta: Meta
}
export const LOAD_DATA_COMPLETED = 'redux-data-loader/LOAD_DATA_COMPLETED'
export interface LOAD_DATA_COMPLETED extends Action {
    type: 'redux-data-loader/LOAD_DATA_COMPLETED'
    meta: Meta
    payload: any
}
export const LOAD_DATA_FAILED = 'redux-data-loader/LOAD_DATA_FAILED'
export interface LOAD_DATA_FAILED extends Action {
    type: 'redux-data-loader/LOAD_DATA_FAILED'
    meta: Meta
    payload: string
}

type Actions = LOAD_DATA | LOAD_DATA_COMPLETED | LOAD_DATA_FAILED

export const reducer = (state: DataTypeMap = {}, action: Actions) => {
    switch (action.type) {
        case LOAD_DATA: {
            const dataLookup = {
                ...state,
                [action.meta.dataType]: state[action.meta.dataType] || {}
            }
            return {
                ...state,
                [action.meta.dataType]: <DataKeyMap>{
                    ...dataLookup,
                    [action.meta.dataKey]: {
                        serverSideRender: action.meta.isServerSideRender,
                        loaded: false,
                        loading: true,
                        failed: false,
                    }
                },
            }
        }
        case LOAD_DATA_COMPLETED: {
            const dataLookup = {
                ...state,
                [action.meta.dataType]: state[action.meta.dataType] || {}
            }
            return {
                ...state,
                [action.meta.dataType]: <DataKeyMap>{
                    ...dataLookup,
                    [action.meta.dataKey]: {
                        serverSideRender: action.meta.isServerSideRender,
                        loaded: true,
                        loading: false,
                        failed: false,
                        data: action.payload
                    }
                },
            }
        }
        case LOAD_DATA_FAILED: {
            const dataLookup = {
                ...state,
                [action.meta.dataType]: state[action.meta.dataType] || {}
            }
            return {
                ...state,
                [action.meta.dataType]: <DataKeyMap>{
                    ...dataLookup,
                    [action.meta.dataKey]: {
                        serverSideRender: action.meta.isServerSideRender,
                        loaded: false,
                        loading: false,
                        failed: true,
                        error: action.payload,
                    }
                }
            }
        }
    }

    return state
}
