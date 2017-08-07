import { clientFactory } from 'rxjs-grpc'
import { sample } from './grpc-namespaces'

// Pass the path of proto file and the name of namespace
const Services = clientFactory<sample.ClientFactory>(
  `${__dirname}/sample.proto`,
  'sample'
)
// Create a client connecting to the server
const services = new Services('localhost:50051')
// Get a client for the Greeter service
const greeter = services.getGreeter()

// Call the service by passing a sample.HelloRequest
greeter.sayHello({ name: 'world' }).forEach(response => {
  console.log(`Greeting: ${response.message}`)
})
