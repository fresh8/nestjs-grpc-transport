import 'reflect-metadata'
import { expect } from 'chai'
import {
  PATTERN_METADATA,
  PATTERN_HANDLER_METADATA
} from '@nestjs/microservices/constants'

import rpc from '../src/rpc-decorator'
import isServerBuilder from '../src/is-server-builder'

import { sample } from './grpc-namespaces'

describe('@rpc', () => {
  class TestController {
    @rpc
    async sayHello(request: any): Promise<object> {
      const res = await this.somethingAsynchronous()
      return { message: `Hello, ${request.name} ${res}` }
    }

    async somethingAsynchronous(name?: string) {
      return ':)'
    }
  }

  it('should not mutate a method', async () => {
    const controller: any = new TestController()
    const res = await controller.sayHello({ name: 'Tyrion' })

    expect(res).to.deep.equal({ message: 'Hello, Tyrion :)' })
  })

  it('should define metadata, needed by nest', () => {
    const controller: any = new TestController()

    expect(
      Reflect.getMetadata(PATTERN_METADATA, controller.sayHello)
    ).to.deep.equal({ rpc: 'sayHello' })

    expect(
      Reflect.getMetadata(PATTERN_HANDLER_METADATA, controller.sayHello)
    ).to.equal(true)
  })
})
