import { Server, CustomTransportStrategy } from '@nestjs/microservices'
import { serverBuilder } from 'rxjs-grpc'

import rpc from './rpc-decorator'
import { unknownRpcFunction } from './warnings'
import isServerBuilder from './is-server-builder'

export interface createServerOptions extends GRPCServerConfig {
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
 *    new ServerBuilder<nsp.ServerBuilder>('path/to/myproto.proto', 'nsp'),
 *    { host: 'localhost', port: 50051, serviceName: 'MyService' }
 *  )
 * })
 */
export class GRPCServer<T = any> extends Server
  implements CustomTransportStrategy {
  private readonly server: any
  private readonly host: string
  private readonly port: number
  private readonly serviceName: string

  constructor(server: T, { host, port, serviceName }: GRPCServerConfig) {
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
    this.server[`add${this.serviceName}`](this.getGRPCHandlers())
  }

  /**
   * Returns any methods decorated with @MessagePattern({ rpc: 'rpcMethod' })
   * or @rpc.
   */
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
          rpcHandles[pattern.rpc] = handles[serializedPattern]
        }
      }
    })

    return rpcHandles
  }
}

/**
 * creates a GRPC server.
 */
function createGRPCServer<T>(config: createServerOptions): GRPCServer<T>
/**
 * creates a GRPC server.
 */
function createGRPCServer<T>(
  server: T,
  { host, port, serviceName }: GRPCServerConfig
): GRPCServer<T>
function createGRPCServer<T = any>(
  serverOrConfig: any,
  startConfig?: any
): GRPCServer<T> {
  if (isServerBuilder(serverOrConfig)) {
    return new GRPCServer(serverOrConfig, startConfig)
  }

  return new GRPCServer(
    serverBuilder(serverOrConfig.protoPath, serverOrConfig.packageName),
    serverOrConfig
  )
}

export default createGRPCServer
