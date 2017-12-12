import { expect } from 'chai'
import { status as GRPCStatus } from 'grpc'
import * as helpers from '../src/helpers'

describe('makeGRPCError', () => {
  it('does not change valid format errors', () => {
    const error = { code: GRPCStatus.NOT_FOUND, message: 'an error' }
    const res = helpers.makeGRPCError(error)
    expect(res.code).equal(error.code)
    expect(res.message).equal(error.message)
  })

  it('Defaults code and message values', () => {
    const error = {}
    const res = helpers.makeGRPCError(error)
    expect(res.code).equal(GRPCStatus.INTERNAL)
    expect(res.message).equal('Internal Server Error')
  })

  it('Ignores the status property (set by Nest but not grpc valid)', () => {
    const error = { status: 'ohnoes' }
    const res = helpers.makeGRPCError(error)
    expect(res.code).equal(GRPCStatus.INTERNAL)
  })
})
