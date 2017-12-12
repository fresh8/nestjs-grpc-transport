import { status as GRPCStatus } from 'grpc'

export function makeGRPCError(error: any): { code: number; message: string } {
  return {
    code: GRPCStatus.INTERNAL,
    message: 'Internal Server Error',
    ...error
    //TODO support metadata (for `value.status`, and potential future other properties) once https://github.com/kondi/rxjs-grpc/issues/11 is resolved.
  }
}
