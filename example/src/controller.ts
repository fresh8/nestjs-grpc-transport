import { Controller } from '@nestjs/common'
import { sample } from './grpc-namespaces'
import { rpc } from '@fresh8/nestjs-grpc-transport'

@Controller()
export default class TestController {
  /**
   * sayHello RPC method
   */
  @rpc
  async sayHello(request: sample.HelloRequest): Promise<sample.HelloReply> {
    const res = await this.somethingAsynchronous()
    return { message: `Hello ${request.name}: ${res}` }
  }

  somethingAsynchronous() {
    return Promise.resolve(`:)`)
  }
}
