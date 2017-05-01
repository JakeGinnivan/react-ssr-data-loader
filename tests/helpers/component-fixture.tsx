import * as React from 'react'
import { mount, render, ReactWrapper } from 'enzyme'
import { Props, LoadedState } from '../../src/data-loader'
import DataProvider from '../../src/data-provider'
import DataLoaderResources from '../../src/data-loader-resources'
import { DataLoaderState, reducer } from '../../src/data-loader-actions'
import PromiseCompletionSource from './promise-completion-source'
import { Data, dataType } from './test-data'

interface FixtureOptions {
    isServerSideRender: boolean
    clientLoadOnly?: boolean
    unloadDataOnUnmount?: boolean
}

export default class ComponentFixture {
    loadAllCompletedCalled = 0
    loadDataCount = 0
    renderCount = 0
    testDataPromise: PromiseCompletionSource<Data>
    root: ReactWrapper<{ dataKey: string }, any>
    component: ReactWrapper<Props<Data, {}>, any>
    resources: DataLoaderResources
    currentState: DataLoaderState
    lastRenderProps: LoadedState<Data, {}>

    constructor(initialState: DataLoaderState, dataKey: string, options: FixtureOptions) {
        this.currentState = initialState
        this.testDataPromise = new PromiseCompletionSource<Data>()
        this.resources = new DataLoaderResources()
        const TestDataLoader = this.resources.registerResource(dataType, (dataKey: string) => {
            this.loadDataCount++
            return this.testDataPromise.promise
        })

        const TestComponent: React.SFC<{ dataKey: string }> = ({ dataKey }) => (
            <DataProvider
                initialState={initialState}
                isServerSideRender={options.isServerSideRender}
                resources={this.resources}
                loadAllCompleted={() => this.loadAllCompletedCalled++}
                stateChanged={state => this.currentState = state}
                onError={err => console.error(err)}
            >
                <TestDataLoader
                    dataKey={dataKey}
                    clientLoadOnly={options.clientLoadOnly}
                    unloadDataOnUnmount={options.unloadDataOnUnmount}
                    renderData={(props) => {
                        this.renderCount++
                        this.lastRenderProps = props
                        return null
                    }}
                />
            </DataProvider>
        )

        this.root = mount(<TestComponent dataKey={dataKey} />)

        this.component = this.root.find(TestDataLoader)
    }

    assertState() {
        expect({
            renderCount: this.renderCount,
            loadAllCompletedCalled: this.loadAllCompletedCalled,
            renderProps: this.lastRenderProps,
            loadDataCount: this.loadDataCount
        }).toMatchSnapshot()
    }

    refreshData() {
        if (this.lastRenderProps.isLoaded) {
            this.resetPromise()
            this.lastRenderProps.actions.refresh()
        } else {
            throw new Error('Not in success state, can\'t refresh')
        }
    }

    resetPromise() {
        this.testDataPromise = new PromiseCompletionSource<Data>()
    }

    unmount = async() => {
        this.root.unmount()

        return new Promise((resolve) => setTimeout(resolve))
    }
}