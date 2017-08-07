import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { serverBuilder } from 'rxjs-grpc'
import { createServer } from '@fresh8/nestjs-grpc-transport'

import TestController from './controller'
import { sample } from './grpc-namespaces'

/**
 * the GRPCServer can be used in two ways.
 */
@Module({
  controllers: [TestController]
})
export class ApplicationModule {}

/**
 * Let the server be constructed for you.
 */
const app = NestFactory.createMicroservice(ApplicationModule, {
  strategy: createServer({
    host: '0.0.0.0',
    port: 50051,
    protoPath: `${__dirname}/sample.proto`,
    packageName: 'sample',
    serviceName: 'Greeter'
  })
})

/**
 * Pass a pre-constructed server.
 */
const server = serverBuilder<sample.ServerBuilder>(
  `${__dirname}/sample.proto`,
  'sample'
)

const app2 = NestFactory.createMicroservice(ApplicationModule, {
  strategy: createServer(server, {
    host: '0.0.0.0',
    port: 50052,
    serviceName: 'Greeter'
  })
})

/**
 * Start your app as normal.
 */
app.listen(() => {
  console.log('GRPC server running on 0.0.0.0:50051')
})

app2.listen(() => {
  console.log('GRPC server running on 0.0.0.0:50052')
})
