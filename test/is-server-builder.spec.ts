import { expect } from 'chai'
import { serverBuilder } from 'rxjs-grpc'

import isServerBuilder from '../src/is-server-builder'

import { sample } from './grpc-namespaces'

describe('isServerBuilder', () => {
  it('should return true for an instance of ServerBuilder', () => {
    const server = serverBuilder<sample.ServerBuilder>(
      `${__dirname}/sample.proto`,
      'sample'
    )
    expect(isServerBuilder(server)).to.equal(true)
  })

  it('should return false when not an instance of ServerBuilder', () => {
    expect(isServerBuilder({})).to.equal(false)
    expect(isServerBuilder(undefined)).to.equal(false)
    expect(isServerBuilder(null)).to.equal(false)
  })
})
