import { expect } from 'chai'
import { MessagePattern } from '@nestjs/microservices'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { serverBuilder } from 'rxjs-grpc'
import { status as GRPCStatus } from 'grpc'
import { Observable } from 'rxjs'

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

  describe('wraprpc', () => {
    const builder = makeMockServer('Greeter')

    const server: any = createServer(builder, {
      host: '0.0.0.0',
      port: 50052,
      serviceName: 'Greeter'
    })

    it('Transforms responses into observable', done => {
      const wrapped = server.wrapRpc(() => {
        return false
      })
      const result = wrapped()
      expect(result).to.be.an.instanceof(Observable)
      result.subscribe({
        next(value: any) {
          expect(value).to.equal(false)
          done()
        }
      })
    })

    it('Can unwrap observables 1 level if required', done => {
      //TODO remove/adapt that test once https://github.com/nestjs/nest/issues/290 is resolved.
      const wrapped = server.wrapRpc(() => {
        return Promise.resolve(
          Observable.throw({
            status: 4,
            message: 'this is an error in disguise'
          })
        )
      })
      wrapped().subscribe({
        complete() {
          done('Should not have succeeded')
        },
        error(e: any) {
          expect(e.code).to.equal(GRPCStatus.INTERNAL)
          expect(e.message).to.equal('this is an error in disguise')
          done()
        }
      })
    })
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
        const delegates = grpcServer.getGRPCDelegates()
        grpcServer.close()
        app.close()
        expect(delegates.some((d: any) => d.name === 'sayHello')).to.equal(true)
        expect(delegates.some((d: any) => d.name === 'sayGoodBye')).to.equal(
          true
        )
        done()
      })
    })
  })
})
