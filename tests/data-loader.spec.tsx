import * as React from 'react'
import { mount, render, ReactWrapper } from 'enzyme'
import { createStore, combineReducers, applyMiddleware, Store } from 'redux'
import { Provider } from 'react-redux'
import { LoadedState, createTypedDataLoader } from '../src/data-loader'
import { ReduxStoreState, reducer } from '../src/data-loader-actions'
import PromiseCompletionSource from './helpers/promise-completion-source'
import ComponentFixture from './helpers/component-fixture'
import PagedComponentFixture from './helpers/paged-component-fixture'
import ComponentWithArgsFixture from './helpers/component-with-args-fixture'
import SharedDataComponentFixture from './helpers/shared-data-component-fixture'
import DifferentKeysDataComponentFixture from './helpers/different-keys-data-component-fixture'
import Verifier from './helpers/verifier'

let store: Store<ReduxStoreState>

beforeEach(() => {
    const logger = store => next => action => {
        // console.log('dispatching', action)
        try {
            let result = next(action)
            // console.log('next state', JSON.stringify(store.getState()))
            return result
        } catch (err) {
            console.error('REDUX ERROR', err)
            throw err
        }
    }

    // TODO Investigate keys of syntax for combineReducers
    store = createStore(
        combineReducers<ReduxStoreState>({ dataLoader: reducer }),
        applyMiddleware(logger)
    )
})

describe('data-loader', () => {
    it('supports multiple loaders using the same key when data loading', async () => {
        const sut = new SharedDataComponentFixture(store, "testKey", false)

        const verifier = sut.component.find(Verifier)

        expect(verifier.at(1).props()).toMatchSnapshot()
        expect(store.getState()).toMatchSnapshot()
    })

    it('can resolve data from multiple components', async () => {
        const sut = new SharedDataComponentFixture(store, "testKey", false)
        await sut.testDataPromise.resolve({ result: 'Test' })

        const verifier = sut.component.find(Verifier)

        expect(verifier.at(0).props()).toMatchSnapshot()
        expect(store.getState()).toMatchSnapshot()
        expect(sut.loadDataCount).toBe(1)
    })

    it('can load multiple dataloaders with different keys', async () => {
        const sut = new DifferentKeysDataComponentFixture(store, "testKey", "testKey2", false)
        await sut.testDataPromise.resolve({ result: 'Test' })

        expect(sut.loadAllCompletedCalled).toBe(0)
        const verifier = sut.component.find(Verifier)

        expect(verifier.at(0).props()).toMatchSnapshot()
        expect(store.getState()).toMatchSnapshot()
        expect(sut.loadDataCount).toBe(2)
    })

    it('multiple components load data once when props change', async () => {
        const sut = new SharedDataComponentFixture(store, "testKey", false)

        await sut.testDataPromise.resolve({ result: 'Success!' })
        sut.resetPromise()
        sut.root.setProps({ dataKey: "newData" })
        await sut.testDataPromise.resolve({ result: 'Success2!' })

        expect(store.getState()).toMatchSnapshot()
        expect(sut.loadDataCount).toBe(2)
    })

    it('ignores completion if unmounted first', async () => {
        const sut = new ComponentFixture(store, "testKey", { isServerSideRender: false })
        await sut.unmount()
        await sut.testDataPromise.resolve({ result: 'Test' })

        expect(store.getState()).toMatchSnapshot()
    })

    it('notifies when all work is completed', async () => {
        const sut = new ComponentFixture(store, "testKey", { isServerSideRender: false })

        expect(sut.loadAllCompletedCalled).toBe(0)
        await sut.testDataPromise.resolve({ result: 'Test' })
        expect(sut.loadAllCompletedCalled).toBe(1)
    })

    it('can specify arguments for data loader', async () => {
        const foo = { bar: 1 }
        const sut = new ComponentWithArgsFixture(store, "testKey", foo, false)

        await sut.testDataPromise.resolve({ result: 'Test' })

        expect(store.getState()).toMatchSnapshot()
        expect(sut.passedParams).toEqual(foo)
    })

    it('can refresh data', async () => {
        const sut = new ComponentFixture(store, "testKey", { isServerSideRender: false })

        await sut.testDataPromise.resolve({ result: 'Test' })
        sut.refreshData()

        expect(store.getState()).toMatchSnapshot()
        await sut.testDataPromise.resolve({ result: 'Test2' })
        expect(store.getState()).toMatchSnapshot()
    })

    it('supports paged data', async () => {
        const sut = new PagedComponentFixture(store, "testKey", false)

        await sut.testDataPromise.resolve(['Test'])
        expect(store.getState()).toMatchSnapshot()
        sut.nextPage()
        expect(store.getState()).toMatchSnapshot()

        await sut.testDataPromise.resolve(['Test2'])
        expect(store.getState()).toMatchSnapshot()
    })

    it('can support preserving data on unmount', async () => {
        const sut = new ComponentFixture(store, "testKey", {
            isServerSideRender: false,
            unloadDataOnUnmount: false
        })
        await sut.testDataPromise.resolve({ result: 'Test' })
        await sut.unmount()

        expect(store.getState()).toMatchSnapshot()
        // Check we can re-mount the existing data
        new ComponentFixture(store, "testKey", {
            isServerSideRender: false,
            unloadDataOnUnmount: false
        })
        expect(store.getState()).toMatchSnapshot()
    })
})
