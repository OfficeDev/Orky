SocketIO = require 'socket.io-client'
BotBuilder = require 'botbuilder'
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
    messages = strings.map((string) ->
      message = string
      if typeof string == 'string'
        message =
          type: "message"
          address: envelope.message.address
          text: string.replace(/(?:\r\n|\r|\n)/g, '<br/>')
    )

    @responseClient
      .postMessages(messages, envelope.message.token, false)

  reply: (envelope, strings...) ->
    @robot.logger.info "Reply"

    messages = strings.map((string) ->
      message = string
      if typeof string == 'string'
        message =
          type: "message"
          address: envelope.message.address
          text: string.replace(/(?:\r\n|\r|\n)/g, '<br/>')
    )

    @responseClient
      .postMessages(messages, envelope.message.token, true)

  run: ->
    @robot.logger.info "Run"

    @authenticated = false
    @client = SocketIO(@orkyUri)
    @client.on('connect', () =>
      @robot.logger.info("Connected to Orky")
      @client.emit('register',
        id: @botId,
        secret: @botSecret)
    )

    @client.once('no_registration', () =>
      @robot.logger.info("Orky could not find our registration.")
      process.exit(1)
    )

    @client.once('disconnect', () =>
      @robot.logger.info("Orky disconnected us.")
      process.exit(1)
    )

    @client.on('registration_data', (data) =>
      @robot.logger.info("Orky updated our registration data. We have a new name! '#{data.name}'")
      @robot.name = data.name
      @emit('connected')
    )

    @client.on('post_message', (data) =>
      data.text = "#{@robot.name} #{data.text}"
      data.user.room = data.address.conversation.id
      message = new TextMessage(data.user, data.text, data.address.id)
      message.token = data.token
      message.address = data.address
      @robot.receive message
    )

exports.use = (robot) ->
  new Orky robot