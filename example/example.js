const grapevine = require('../index')

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

    // returns {name: 'SomeOtherPlayer', game: 'SomeGame'} if the given
    // remote player identifier is currently signed in
    result = grapevine.findPlayer('someotherplayer@somegame')

    // send a tell to a remote user
    result = await grapevine.send('tells/send', {
      from_name: 'SomePlayer',
      to_game: 'SomeGame', // or result.name from above
      to_name: 'SomeOtherPlayer', // or result.game from above
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
