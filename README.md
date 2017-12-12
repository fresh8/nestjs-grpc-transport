# Nestjs-grpc-transport

[![CircleCI](https://circleci.com/gh/fresh8/nestjs-grpc-transport.svg?style=svg)](https://circleci.com/gh/fresh8/nestjs-grpc-transport)
[![Coverage Status](https://coveralls.io/repos/github/fresh8/nestjs-grpc-transport/badge.svg?branch=master)](https://coveralls.io/github/fresh8/nestjs-grpc-transport?branch=master)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

[GRPC](https://grpc.io) transport layer for the [NestJS](https://github.com/kamilmysliwiec/nest) framework.

## Requirements
- Typescript 2.x
- Node boron
- Npm 5.x
- NestJS v3.0.1 (there is breaking change in v3.1.1).

## Installation
```npm install @fresh8/nestjs-grpc-transport --save```

## Quickstart

Create your protobuf definition `sample.proto`:

```protobuf
syntax = "proto3";

package sample;

service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply) {}
}

message HelloRequest {
  string name = 1;
}

message HelloReply {
  string message = 1;
}
```

Generate your Typescript interfaces using [rxjs-grpc](https://github.com/kondi/rxjs-grpc/blob/master/README.md#quickstart).
```
./node_modules/.bin/rxjs-grpc -o grpc-namespaces.ts *.proto
```

Create your first controller. The `@rpc` decorator provides some metadata needed by Nest, and takes care of providing an [Observable](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html) for [rxjs-grpc](https://github.com/kondi/rxjs-grpc/blob/master/README.md#quickstart).

```typescript
import { Controller } from '@nestjs/common'
import { rpc } from '@fresh8/nestjs-grpc-transport'

import { sample } from './grpc-namespaces'

@Controller()
export default class TestController {
  /**
   * sayHello RPC method
   */
  @rpc
  async sayHello(request: sample.HelloRequest): Promise<sample.HelloReply> {
    const res = await this.someAsyncThing()
    return { message: `Hello ${request.name}: ${res}` }
  }
  
  /**
   * Some dummy async method. This might be a call to a database in
   * a proper application.
   */
  someAsyncThing() {
    return Promise.resolve(`:)`)
  }
}

```

Create your [GRPC](https://grpc.io) server and provide it to your [NestJS](https://github.com/kamilmysliwiec/nest) application.

```typescript
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { createServer } from '@fresh8/nestjs-grpc-transport'

import { sample } from './grpc-namespaces'
import { TestController } from './test-controller'

/**
 * Example application
 */
@Module({
  controllers: [TestController]
})
export class ApplicationModule {}

/**
 * Create a nest application that runs over GRPC.
 */
const app = NestFactory.createMicroservice(ApplicationModule, {
  strategy: createServer<sample.ServerBuilder>({
    host: '0.0.0.0',
    port: 50051,
    protoPath: `path/to/sample.proto`,
    packageName: 'sample',
    serviceName: 'Greeter'
  })
})

/**
 * Start your app as normal.
 */
app.listen(() => {
  console.log('GRPC server running on 0.0.0.0:50051')
})
```

## Examples
A simple example project is provided [here](example).

## A note on Exceptions handling
Nestjs itself catches and handles exceptions as part of its [Exception Filters](https://docs.nestjs.com/microservices/exception-filters) feature. `nestjs-grpc-transport` only transforms it to the format expected by `rxjs-grpc`.

To the best of our understanding this implies:
 - [Any exception](https://stackoverflow.com/questions/47756819/shared-exceptions-between-http-and-rpc) that is not an instance of `@nestjs/microservices/RpcException` will be reported as `Internal` error (code 13).
 - To send errors other than `Internal` simply throw a new RpcException with the following property:
   - `code : number`:  The [exception code](https://godoc.org/google.golang.org/grpc/codes#Code). Defaults to `13`.
   - `message : string`: An additional message. Defaults to "Internal Server Error"
 - Exceptions [are not logged](https://github.com/nestjs/nest/issues/303).
