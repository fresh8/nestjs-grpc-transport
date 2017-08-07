import { GenericServerBuilder } from 'rxjs-grpc'

/**
 * Type guard for the rxjs-grpc ServerBuilder.
 */
export default function isServerBuilder<T>(
  arg: any
): arg is GenericServerBuilder<T> {
  return !!arg && typeof arg === 'object' && typeof arg.start === 'function'
}
