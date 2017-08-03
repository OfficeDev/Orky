SocketIO = require 'socket.io-client'
try
  {Robot,Adapter,TextMessage,User} = require 'hubot'
catch
  prequire = require('parent-require')
  {Robot,Adapter,TextMessage,User} = prequire 'hubot'

class Orky extends Adapter
  constructor: (@robot) ->
    super(@robot)

    @orkyUri = process.env.ORKY_URI || "https://scriptorbot.azurewebsites.net"
    @botId = process.env.BOT_ID
    @botSecret = process.env.BOT_SECRET

    @robot.logger.info "Constructor"

  run: ->
    @robot.logger.info "Run"
    @connect()

  connect: () ->
    if @client?
      @client.destroy()
      @client = null
    
    @client = SocketIO(@orkyUri)
    @client.once('connect', () =>
      @robot.logger.info("Connected to Orky")
      @client.emit('register',
        id: @botId,
        secret: @botSecret)
    )

    @client.once('no_registration', () =>
      @robot.logger.info("Orky could not find our registration.")
      @client.disconnect()
    )

    @client.once('disconnect', () =>
      @robot.logger.info("Orky disconnected us.")
      @connect()
    )

    @client.on('registration_data', (data) =>
      @robot.logger.info("We have a new name! '#{data.name}'")
      @robot.name = data.name
      @emit('connected')
    )

    @client.on('post_message', (message) =>
      if not message?
        @robot.logger.error("Received 'post_message' event with no data.")
        return

      text = "#{@robot.name} #{message.text}"
      user = message.sender
      if not user?
        @robot.logger.error("Received 'post_message' event with no sender data.")
        return

      user.room = message.channelId
      message = new TextMessage(user, text, message.id)
      @robot.receive message
    )

  send: (context, strings...) ->
    @robot.logger.info "Send"
    if not context?.message?.id?
      @robot.logger.error("Context does not have a message id.")
      return
    
    messageId = context.message.id
    response =
      type: 'send'
      messages: strings

    @client.emit("message-#{messageId}", response)

  reply: (context, strings...) ->
    @robot.logger.info "Reply"
    if not context?.message?.id?
      @robot.logger.error("Context does not have a message id.")
      return
    
    messageId = context.message.id
    response =
      type: 'reply'
      messages: strings

    @client.emit("message-#{messageId}", response)

exports.use = (robot) ->
  new Orky robot