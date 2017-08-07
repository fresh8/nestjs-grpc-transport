import 'reflect-metadata'
import { Observable } from 'rxjs'

import {
  PATTERN_METADATA,
  PATTERN_HANDLER_METADATA
} from '@nestjs/microservices/constants'

/**
 * Wrap a RPC method in a observable so it is compatiable with
 * rxjs-grpc (https://github.com/kondi/rxjs-grpc). Pattern metadata
 * is defined so the GRPC Nest server can identify when methods should
 * be bound to the actual GRPC server.
 */
export default (
  target: Object,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => {
  const original = descriptor.value

  descriptor.value = function(...args: Array<any>) {
    return Observable.fromPromise(original.bind(this)(...args))
  }

  Reflect.defineMetadata(
    PATTERN_METADATA,
    { rpc: propertyKey },
    descriptor.value
  )
  Reflect.defineMetadata(PATTERN_HANDLER_METADATA, true, descriptor.value)

  return descriptor
}
