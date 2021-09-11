# grapevine
Integration for the [Grapevine game protocol](https://grapevine.haus/), a scrappy startup inter-MUD communication protocol.

## Installation
`npm install grapevinejs`

## Debugging
Run with `DEBUG=grapevine` to see debug messages:

`$ DEBUG=grapevine node example.js`

## Example
```javascript
const grapevine = require('grapevinejs')

run()

async function run() {
  try {
    // initialize with a configuration object.  your client_id and
    // client_secret are the minimum required parameters.
    let emitter = grapevine.init({
      client_id: '12345678-1234-1234-1234-123456789abc',
      client_secret: '12345678-1234-1234-1234-123456789abc'
    })

    // catch asynchronous errors
    emitter.on('error', (err) => {
      console.log(err.stack)
    })

    // handle channel broadcasts
    emitter.on('channels/broadcast', (payload) => {
      console.log(payload)
    })

    // handle tells
    emitter.on('tells/receive', (payload) => {
      console.log(payload)
    })

    // connect to grapevine and retrieve current game status
    await grapevine.connect()

    // an array of other games connected to the grapevine network with their
    // currently authenticated players
    console.log(grapevine.games)  

    // notify grapevine of a new player authenticated into your game
    let result = await grapevine.addPlayer('SomePlayer')

    // subscribe your game to the 'secrets' channel
    result = await grapevine.send('channels/subscribe', {
      channel: 'secrets'
    })

    // send a message to the 'secrets' channel
    result = await grapevine.send('channels/send', {
      channel: 'secrets',
      name: 'SomePlayer',
      message: 'shhh'
    })

    // unsubscribe from the 'secrets' channel
    result = await grapevine.send('channels/unsubscribe', {
      channel: 'secrets'
    })

    // returns {name: 'SomeOtherPlayer', game: 'SomeGame'} if that remote
    // player identifier is currently signed in on the remote game
    result = grapevine.findPlayer('someotherplayer@somegame')

    // send a tell to a remote user
    result = await grapevine.send('tells/send', {
      from_name: 'SomePlayer',
      to_game: 'SomeGame',
      to_name: 'SomeOtherPlayer',
      sent_at: new Date(),
      message: 'test'
    })

    // true
    console.log('isAlive: ' + grapevine.isAlive())

    // notify grapevine of a new player logged out of your game
    result = await grapevine.removePlayer('SomePlayer')

    // forcibly close the connection
    grapevine.close()

    // false
    console.log('isAlive: ' + grapevine.isAlive())

  } catch (err) {
    console.log(err.stack)
  }
}
```

## API

### grapevine.init(config)
Initializes grapevine configuration.  Returns an event emitter object that will report asynchronous errors.  You should listen for the `error` event of this emitter object to catch asynchronous errors (ie. socket unexpectedly closed, reconnection failures).

* `config.client_id` {string} Your game's grapevine client_id (**required**)
* `config.client_secret` {string} Your game's grapevine client_secret (**required**)
* `config.statusWait` {Number} How long to wait and collect status messages on connect before resolving (in ms), default: **100**
* `config.url` {string} grapevine websocket url, default: **wss://grapevine.haus/socket**
* `config.supports` {Array.<string>} Supported methods, default: **['channels', 'players', 'tells']**
* `config.channels` {Array.<string>} Channels to subscribe to, default: **['testing', 'grapevine']**
* `config.version` {string} API version number to use, default not set
* `config.user_agent` {string} Game user agent, default not set

### async grapevine.connect()
Connects to grapevine, authenticates, and gets the status of current remotely connected games.  Returns a promise that resolves after `config.statusWait`.  The delay allows remote game status to accumulate and be available when the promise resolves.

### async grapevine.close()
Closes the connection with grapevine.  Sends sign-off messages for each locally connected player grapevine knows about.  Connection can be re-established with `grapevine.connect()`.

### async grapevine.send(event, payload, ref = true)
Sends an event to grapevine.  See [the documentation](https://grapevine.haus/docs) for information on the messages that can be sent.  Returns a promise that resolves with the acknowledgement packet.

* `event` {string} The grapevine event name (**required**)
* `payload` {Object} The grapevine event payload object (**required**)
* `ref` {boolean} If a ref id should be generated with this request, default: **true**

### async grapevine.addPlayer(name)
Adds a player to your local game and informs the grapevine network.  This should be called when a user logs in to your game.  You should use this method instead of calling `send('players/sign-in')` directly so that `heartbeat` responses have an up-to-date player list.

* `name` {string} The player's name (**required**)

### async grapevine.removePlayer(name)
Removes a player from your local game and informs the grapevine network.  This should be called when a user logs out of your game.  You should use this method instead of calling `send('players/sign-out')` directly so that `heartbeat` responses have an up-to-date player list.

* `name` {string} The player's name (**required**)

### grapevine.findPlayer(rpi)
Verifies that a remote player identifier (ie. someplayer@somegame) is logged in.  Case-insensitive
but returns the proper capitalization.  Useful when targeting remote players (ie. a remote tell command).  Returns an object of the form {name: 'SomePlayer', game: 'SomeGame'}.

* `rpi` {string} The remote player identifier, ie. someplayer@somegame (**required**)

### grapevine.isAlive()
Returns `true` if we are connected and authenticated to grapevine and ready to send messages.

### grapevine.games
An array of remote game objects.  This object will be initialized as part of the `connect()` method and will be kept in sync when remote `players/sign-in` and `players/sign-out` messages are received.  The `config.statusWait` parameter controls how long to wait for this object to be populated.
