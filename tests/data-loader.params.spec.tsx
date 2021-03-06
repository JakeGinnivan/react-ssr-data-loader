import { ComponentWithArgsFixture } from './helpers/component-with-args-fixture'
import Adapter from 'enzyme-adapter-react-16'
import { configure } from 'enzyme'
import { processEventLoop } from './helpers/event-loop-helpers'

configure({ adapter: new Adapter() })

describe('data-loader', () => {
    it('can specify arguments for data loader', async () => {
        const args = { bar: 1, id: 'testKey', resourceType: 'testDataType' }
        const sut = new ComponentWithArgsFixture(undefined, 'testKey', args, undefined, false)

        await sut.testDataPromise.resolve({ result: 'Test' })

        expect(sut.passedParams).toEqual(args)
        sut.assertState()
    })

    it('can control which params are used in cache key', async () => {
        const args = { bar: 1, id: 'testKey', resourceType: 'testDataType' }
        const sut = new ComponentWithArgsFixture(undefined, 'testKey', args, ['id'], false)

        await sut.testDataPromise.resolve({ result: 'Test' })

        const state = { ...sut.currentState }
        sut.root.setState({
            bar: 2,
        })
        await processEventLoop()
        expect(state).toEqual(sut.currentState)
    })
})
