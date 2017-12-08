import { Server, CustomTransportStrategy } from '@nestjs/microservices'
import { serverBuilder } from 'rxjs-grpc'
import { Observable, Observer } from 'rxjs/'
import { status as GRPCStatus } from 'grpc'

import rpc from './rpc-decorator'
import { unknownRpcFunction } from './warnings'
import isServerBuilder from './is-server-builder'

export interface CreateServerOptions extends GRPCServerConfig {
  /** Absolute path to the your .proto file. */
  protoPath: string
  /** The package specifier used in your .proto file. */
  packageName: string
}

export interface GRPCServerConfig {
  host: string
  port: number
  /** 
   * The name of your RPC system defined in your .proto file.
   */
  serviceName: string
}

/**
 * A GRPC server compatible with the NestJS framework.
 * 
 * Example:
 * ```typescript
 * import { GRPCServer } from '@fresh8/nestjs-grpc-transport'
 * import { ServerBuilder } from 'rxjs-grpc'
 * import { nsp } from './grpc-namespaces'
 * 
 * NestFactory.createMicroservice(appModule, {
 *  strategy: new GRPCServer(
 *    new ServerBuilder('path/to/myproto.proto', 'nsp'),
 *    { host: 'localhost', port: 50051, serviceName: 'MyService' }
 *  )
 * })
 */
export class GRPCServer extends Server implements CustomTransportStrategy {
  private readonly server: any
  private readonly host: string
  private readonly port: number
  private readonly serviceName: string

  constructor(server: any, { host, port, serviceName }: GRPCServerConfig) {
    super()
    this.server = server
    this.host = host
    this.port = port
    this.serviceName = serviceName
  }

  /**
   * Start the GRPC server
   */
  listen(callback?: () => void) {
    this.init()
    this.server.start(`${this.host}:${this.port}`)
    callback && callback()
  }

  /**
   * Terminate the GRPC server.
   */
  close() {
    this.server && this.server.forceShutdown()
  }

  /**
   * Register RPC handlers
   */
  private init(): void {
    const delegates: any = this.getGRPCDelegates()
      .map(d => {
        return {
          ...d,
          rpc: this.wrapRpc(d.rpc)
        }
      })
      .reduce((acc: { [index: string]: Function }, val: any) => {
        acc[val.name] = val.rpc
        return acc
      }, {})

    this.server[`add${this.serviceName}`](delegates)
  }

  /**
   * Makes the output of some async method observable. This
   * is required by rxjs-grpc.
   * @param delegate the rpc handler to handle a request.
   */
  private wrapRpc(delegate: (...args: Array<any>) => Promise<any>) {
    return (...args: Array<any>) => {
      const response$ = this.transformToObservable(
        delegate(...args)
      ) as Observable<any>

      //TODO this whole block is to work around https://github.com/nestjs/nest/issues/290. Although transforming of the error into the format `rxjs-grpc` expect might need to stay here.
      const workedAround = Observable.create((observer: Observer<any>) => {
        response$.subscribe({
          next(value: any) {
            if (value && value.error && value instanceof Observable) {
              return observer.error({
                ...(value as any).error,
                code: GRPCStatus.INTERNAL
                //TODO support metadata (for `value.status`, and potential future other properties) once https://github.com/kondi/rxjs-grpc/issues/11 is resolved.
              })
            }
            observer.next(value)
          },
          error: observer.error.bind(observer),
          complete: observer.complete.bind(observer)
        })
      })
      return workedAround

      //TODO `return response$` once https://github.com/nestjs/nest/issues/290 is resolved
    }
  }

  /**
   * Returns any methods decorated with @MessagePattern({ rpc: 'rpcMethod' })
   * or @rpc.
   */
  private getGRPCDelegates() {
    const handles = this.getHandlers()
    const ret: Array<{ rpc: any; name: string }> = []

    Object.keys(handles).forEach(serializedPattern => {
      if (serializedPattern !== 'undefined') {
        let pattern: { rpc?: string }

        try {
          pattern = JSON.parse(serializedPattern)
        } catch (error) {
          return
        }

        if (pattern.rpc) {
          ret.push({ rpc: handles[serializedPattern], name: pattern.rpc })
        }
      }
    })

    return ret
  }
}

/**
 * creates a GRPC server.
 */
function createGRPCServer(config: CreateServerOptions): GRPCServer
/**
 * creates a GRPC server.
 */
function createGRPCServer(
  server: any,
  { host, port, serviceName }: GRPCServerConfig
): GRPCServer
function createGRPCServer(serverOrConfig: any, startConfig?: any): GRPCServer {
  if (isServerBuilder(serverOrConfig)) {
    return new GRPCServer(serverOrConfig, startConfig)
  }

  return new GRPCServer(
    serverBuilder(serverOrConfig.protoPath, serverOrConfig.packageName),
    serverOrConfig
  )
}

export default createGRPCServer
