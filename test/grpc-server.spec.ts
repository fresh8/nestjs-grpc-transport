import { expect } from 'chai'
import { MessagePattern } from '@nestjs/microservices'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { serverBuilder } from 'rxjs-grpc'

import rpc from '../src/rpc-decorator'
import createServer from '../src/grpc-server'

import { sample } from './grpc-namespaces'

describe('GRPCServer', () => {
  class TestController {
    @rpc
    async sayHello(request: any): Promise<object> {
      return { message: `Hello, ${request.name}` }
    }

    @rpc
    async sayGoodBye(request: any): Promise<object> {
      return { message: `Goodbye, ${request.name}` }
    }

    @MessagePattern()
    async sayBonjour(request: any): Promise<object> {
      return { message: `Goodbye, ${request.name}` }
    }

    @MessagePattern({ rpc: '' })
    async sayAuRevoir(request: any): Promise<object> {
      return { message: `Goodbye, ${request.name}` }
    }
  }

  @Module({
    controllers: [TestController]
  })
  class ApplicationModule {}

  const makeMockServer = (name: string) => ({
    running: false,

    start() {
      this.running = true
    },
    forceShutdown() {
      this.running = false
    },
    [`add${name}`]() {}
  })

  it('should build the server', () => {
    const server = createServer({
      host: '0.0.0.0',
      port: 50051,
      protoPath: `${__dirname}/sample.proto`,
      packageName: 'sample',
      serviceName: 'Greeter'
    })

    expect(server.listen).to.be.a('function')
  })

  it('should start the server', () => {
    const builder = makeMockServer('Greeter')

    const server = createServer(builder, {
      host: '0.0.0.0',
      port: 50052,
      serviceName: 'Greeter'
    })

    server.listen()
    expect(builder.running).to.equal(true)
  })

  it('should stop the server', () => {
    const builder = makeMockServer('Greeter')

    const server = createServer(builder, {
      host: '0.0.0.0',
      port: 50052,
      serviceName: 'Greeter'
    })

    server.listen()
    server.close()
    expect(builder.running).to.equal(false)
  })

  it('should add rpc handlers to a GRPC server', done => {
    const builder = serverBuilder<sample.ServerBuilder>(
      `${__dirname}/sample.proto`,
      'sample'
    )

    const grpcServer: any = createServer(builder, {
      host: 'localhost',
      port: 8080,
      serviceName: 'Greeter'
    })

    grpcServer.listen = (callback: () => void) => {
      grpcServer.init()
      callback()
    }

    NestFactory.createMicroservice(ApplicationModule, {
      strategy: grpcServer
    }).then(app => {
      app.listen(() => {
        const handlers = grpcServer.getGRPCHandlers()
        expect(handlers.sayHello).to.be.a('function')
        expect(handlers.sayGoodBye).to.be.a('function')
        done()
      })
    })
  })
})
