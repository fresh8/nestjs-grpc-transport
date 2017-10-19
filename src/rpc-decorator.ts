import 'reflect-metadata'
import { Observable } from 'rxjs'

import {
  PATTERN_METADATA,
  PATTERN_HANDLER_METADATA
} from '@nestjs/microservices/constants'

/**
 * @rpc
 * Marks this method as a method to be used for handling GRPC calls.
 */
export default (
  target: Object,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => {
  const original = descriptor.value

  descriptor.value = function(...args: Array<any>) {
    return original.bind(this)(...args)
  }

  Reflect.defineMetadata(
    PATTERN_METADATA,
    { rpc: propertyKey },
    descriptor.value
  )
  Reflect.defineMetadata(PATTERN_HANDLER_METADATA, true, descriptor.value)

  return descriptor
}
