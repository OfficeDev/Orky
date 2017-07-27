SocketIO = require 'socket.io-client'
try
  {Robot,Adapter,TextMessage,User} = require 'hubot'
catch
  prequire = require('parent-require')
  {Robot,Adapter,TextMessage,User} = prequire 'hubot'
ResponseClient = require('./ResponseClient')

class Orky extends Adapter
  constructor: (@robot) ->
    super(@robot)

    @responseClient = new ResponseClient(@robot)
    @orkyUri = process.env.ORKY_URI
    @botId = process.env.BOT_ID
    @botSecret = process.env.BOT_SECRET

    @robot.logger.info "Constructor"

  send: (envelope, strings...) ->
    @robot.logger.info "Send"
    message =
      type: "message"
      address: envelope.room
      text: strings.join("<br/>")
    @responseClient
      .startReplyChain(envelope.message.token, message, envelope.room.conversation.id)

  reply: (envelope, strings...) ->
    @robot.logger.info "Reply"
    message =
      type: "message"
      address: envelope.room
      text: strings.join("<br/>")

    @responseClient
      .startReplyChain(envelope.message.token, message, envelope.room.conversation.id)

  run: ->
    @robot.logger.info "Run"

    @authenticated = false
    @client = SocketIO(@orkyUri)
    @client.on('connect', () =>
      @robot.logger.info("Connected to Orky")
    )

    @client.on('hello', (data) =>
      @robot.logger.debug("Received 'hello' from Orky")
      @client.emit("good day", @botId)
    )

    @client.on('goodbye', () =>
      @robot.logger.debug("Received 'goodbye' from Orky")
      process.exit(1)
    )

    @client.on('how are you', (data) =>
      @robot.logger.debug("Received 'how are you' from Orky")
      if data == @botSecret
        @authenticated = true
        @client.emit('great')
        @emit "connected"
      else
        @client.emit('goodbye')
        @robot.logger.error("Orky did not return our secret.")
        process.exit(1)
    )

    @client.on('message', (data) =>
      if @authenticated
        data.user.room = data.address
        message = new TextMessage(data.user, data.text, data.address.id)
        message.token = data.token
        @robot.logger.debug("Received 'message' from Orky")
        @robot.logger.debug("data=#{JSON.stringify(data, null, 2)}")
        @robot.logger.debug("message=#{JSON.stringify(message, null, 2)}")
        @robot.receive message
    )

exports.use = (robot) ->
  new Orky robot