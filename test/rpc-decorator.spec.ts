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

    somethingAsynchronous(name?: string) {
      return Promise.resolve(`:)`)
    }
  }

  it('should make an asynchronous method observable', done => {
    const controller: any = new TestController()

    controller.sayHello({ name: 'Tyrion' }).subscribe(
      (x: string) => {
        expect(x).to.deep.equal({ message: 'Hello, Tyrion :)' })
      },
      (err: any) => {
        throw err
      },
      () => {
        done()
      }
    )
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
