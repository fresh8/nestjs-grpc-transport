import { Server, CustomTransportStrategy } from '@nestjs/microservices'
import { serverBuilder } from 'rxjs-grpc'

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
    const r = this.getGRPCHandlers()
    this.server[`add${this.serviceName}`](r)
  }

  private getGRPCHandlers() {
    const handles = this.getHandlers()
    const rpcHandles: { [index: string]: Function } = {}

    Object.keys(handles).forEach(serializedPattern => {
      // Patterns are undefined for methods decorated with
      // @MessagePattern() with no arguments
      if (serializedPattern !== 'undefined') {
        const pattern = JSON.parse(serializedPattern)

        // guard against the user forgetting to name the rpc method
        // when using @MessagePattern({ rpc })
        if (!pattern.rpc) {
          this.logger.warn(unknownRpcFunction(handles[serializedPattern]))
        } else {
          rpcHandles[pattern.rpc] = (data: any) =>
            this.transformToObservable(handles[serializedPattern](data))
        }
      }
    })

    return rpcHandles
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
