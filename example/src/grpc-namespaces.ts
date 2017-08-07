import { Observable } from 'rxjs';

/**
 * Namespace sample.
 * @exports sample
 * @namespace
 */
export namespace sample {

    /**
     * Contains all the RPC service clients.
     * @exports sample.ClientFactory
     * @interface
     */
     export interface ClientFactory {

        /**
         * Returns the Greeter service client.
         * @returns {sample.Greeter}
         */
        getGreeter(): sample.Greeter;
    }

    /**
     * Builder for an RPC service server.
     * @exports sample.ServerBuilder
     * @interface
     */
     export interface ServerBuilder {

        /**
         * Adds a Greeter service implementation.
         * @param {sample.Greeter} impl Greeter service implementation
         * @returns {sample.ServerBuilder}
         */
        addGreeter(impl: sample.Greeter): sample.ServerBuilder;
    }

    /**
     * Constructs a new Greeter service.
     * @exports sample.Greeter
     * @interface
     */
     export interface Greeter {

        /**
         * Calls SayHello.
         * @param {sample.HelloRequest} request HelloRequest message or plain object
         * @returns {Observable<sample.HelloReply>}
         */
        sayHello(request: sample.HelloRequest): Observable<sample.HelloReply>;
    }

    /**
     * Constructs a new HelloRequest.
     * @exports sample.HelloRequest
     * @interface
     */
     export interface HelloRequest {

        /**
         * HelloRequest name.
         * @type {string|undefined}
         */
        name?: string;
    }

    /**
     * Constructs a new HelloReply.
     * @exports sample.HelloReply
     * @interface
     */
     export interface HelloReply {

        /**
         * HelloReply message.
         * @type {string|undefined}
         */
        message?: string;
    }
}
