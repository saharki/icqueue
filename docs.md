
> ICQueue@7.0.4-1 docs C:\Users\Sahar\Downloads\Whiten\31.1.21\node-simple-amqplib
> jsdoc2md icqueue.js

<a name="ICQueue"></a>

## ICQueue
Class to contain an instantiated connection/channel to AMQP with a given
config.

**Kind**: global class  

* [ICQueue](#ICQueue)
    * [new ICQueue(config)](#new_ICQueue_new)
    * [.connect()](#ICQueue+connect) ⇒ <code>Promise</code>
    * [.close()](#ICQueue+close) ⇒ <code>Promise</code>
    * [.publish(routingKey, message, options)](#ICQueue+publish) ⇒ <code>Promise</code>
    * [.consume(handleMessage, options)](#ICQueue+consume) ⇒ <code>Promise</code>

<a name="new_ICQueue_new"></a>

### new ICQueue(config)
Instantiate an AMQP wrapper with a given config.


| Param | Type |
| --- | --- |
| config | <code>object</code> | 
| config.url | <code>string</code> | 
| config.exchange | <code>string</code> | 
| config.queue | <code>object</code> | 
| config.queue.name | <code>string</code> | 
| config.queue.routingKey | <code>Array.&lt;string&gt;</code> \| <code>string</code> | 
| config.queue.options | <code>object</code> | 

<a name="ICQueue+connect"></a>

### icqueue.connect() ⇒ <code>Promise</code>
Connects, establishes a channel, sets up exchange/queues/bindings/dead
lettering.

**Kind**: instance method of [<code>ICQueue</code>](#ICQueue)  
<a name="ICQueue+close"></a>

### icqueue.close() ⇒ <code>Promise</code>
Closes connection.

**Kind**: instance method of [<code>ICQueue</code>](#ICQueue)  
<a name="ICQueue+publish"></a>

### icqueue.publish(routingKey, message, options) ⇒ <code>Promise</code>
Publish a message to the given routing key, with given options.

**Kind**: instance method of [<code>ICQueue</code>](#ICQueue)  

| Param | Type |
| --- | --- |
| routingKey | <code>string</code> | 
| message | <code>object</code> \| <code>string</code> | 
| options | <code>object</code> | 

<a name="ICQueue+consume"></a>

### icqueue.consume(handleMessage, options) ⇒ <code>Promise</code>
handleMessage() is expected to be of the form:
handleMessage(parsedMessage, callback).
If callback is called with a non-null error, then the message will be
nacked. You can call it like:
callback(err, requeue) in order
to instruct rabbit whether to requeue the message
(or discard/dead letter).

If not given, requeue is assumed to be false.

cf http://squaremo.github.io/amqp.node/doc/channel_api.html#toc_34

**Kind**: instance method of [<code>ICQueue</code>](#ICQueue)  

| Param | Type |
| --- | --- |
| handleMessage | <code>function</code> | 
| options | <code>object</code> | 

