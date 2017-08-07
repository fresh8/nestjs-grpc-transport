const getFunctionName = (func: Function) => func.name

const getBoundFunctionName = (func: Function) =>
  getFunctionName(func).replace('bound ', '')

export const unknownRpcFunction = (func: Function) =>
  `function "${getBoundFunctionName(
    func
  )}" was decorated with @MessagePattern but no pattern information was given. ` +
  `Try using @rpc or @MessagePattern({ rpc: 'myRpcMethod' })`
