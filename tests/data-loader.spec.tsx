import * as React from 'react'
import { mount, render, ReactWrapper } from 'enzyme'
import { createTypedDataLoader } from '../src/data-loader'
import { DataLoaderState } from '../src/data-loader-actions'
import PromiseCompletionSource from './helpers/promise-completion-source'
import ComponentFixture from './helpers/component-fixture'
import PagedComponentFixture from './helpers/paged-component-fixture'
import ComponentWithArgsFixture from './helpers/component-with-args-fixture'
import SharedDataComponentFixture from './helpers/shared-data-component-fixture'
import DifferentKeysDataComponentFixture from './helpers/different-keys-data-component-fixture'

describe('data-loader', () => {
    it('supports multiple loaders using the same key when data loading', async () => {
        const sut = new SharedDataComponentFixture(undefined, "testKey", false)

        sut.assertState()
    })

    it('can resolve data from multiple components', async () => {
        const sut = new SharedDataComponentFixture(undefined, "testKey", false)
        await sut.testDataPromise.resolve({ result: 'Test' })

        sut.assertState()
    })

    it('can load multiple dataloaders with different keys', async () => {
        const sut = new DifferentKeysDataComponentFixture(undefined, "testKey", "testKey2", false)
        await sut.testDataPromise.resolve({ result: 'Test' })

        sut.assertState()
    })

    it('multiple components load data once when props change', async () => {
        const sut = new SharedDataComponentFixture(undefined, "testKey", false)

        await sut.testDataPromise.resolve({ result: 'Success!' })
        sut.resetPromise()
        sut.root.setProps({ resourceId: "newData" })
        await sut.testDataPromise.resolve({ result: 'Success2!' })

        sut.assertState()
    })

    it('ignores completion if unmounted first', async () => {
        const sut = new ComponentFixture(undefined, "testKey", { isServerSideRender: false })
        await sut.unmount()
        await sut.testDataPromise.resolve({ result: 'Test' })

        sut.assertState()
    })

    it('notifies when all work is completed', async () => {
        const sut = new ComponentFixture(undefined, "testKey", { isServerSideRender: false })

        expect(sut.loadAllCompletedCalled).toBe(0)
        await sut.testDataPromise.resolve({ result: 'Test' })
        expect(sut.loadAllCompletedCalled).toBe(1)
    })

    it('can specify arguments for data loader', async () => {
        const foo = { bar: 1 }
        const sut = new ComponentWithArgsFixture(undefined, "testKey", foo, false)

        await sut.testDataPromise.resolve({ result: 'Test' })

        expect(sut.passedParams).toEqual(foo)
        sut.assertState()
    })

    it('supports paged data', async () => {
        const sut = new PagedComponentFixture(undefined, "testKey", false)

        await sut.testDataPromise.resolve(['Test'])
        sut.assertState()
        sut.nextPage()
        sut.assertState()

        await sut.testDataPromise.resolve(['Test2'])
        sut.assertState()
    })

    it('can support preserving data on unmount', async () => {
        let sut = new ComponentFixture(undefined, "testKey", {
            isServerSideRender: false,
            unloadDataOnUnmount: false
        })
        await sut.testDataPromise.resolve({ result: 'Test' })
        await sut.unmount()

        sut.assertState()
        // Check we can re-mount the existing data
        sut = new ComponentFixture(sut.currentState, "testKey", {
            isServerSideRender: false,
            unloadDataOnUnmount: false
        })
        sut.assertState()
    })
})
