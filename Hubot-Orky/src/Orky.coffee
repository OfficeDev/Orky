SocketIO = require 'socket.io-client'
try
  {Robot,Adapter,TextMessage,User} = require 'hubot'
catch
  prequire = require('parent-require')
  {Robot,Adapter,TextMessage,User} = prequire 'hubot'

class Orky extends Adapter
  constructor: (@robot) ->
    super(@robot)

    if !process.env.ORKY_URI
      throw new Error("Environment variable 'ORKY_URI' not set.")
    if !process.env.BOT_ID
      throw new Error("Environment variable 'BOT_ID' not set.")
    if !process.env.BOT_SECRET
      throw new Error("Environment variable 'BOT_SECRET' not set.")

    @config =
      OrkyUri: process.env.ORKY_URI
      BotId: process.env.BOT_ID
      BotSecret: process.env.BOT_SECRET

    @robot.logger.info "Created instance of Orky Adapter with config: #{JSON.stringify(this._config, null, 2)}"

  run: ->
    @robot.logger.info "Run"
    @connect()

  connect: () ->
    if @client?
      @client.destroy()
      @client = null
    
    @client = SocketIO(@config.OrkyUri)
    @client.once('connect', () =>
      @robot.logger.info("Connected to Orky")
      @client.emit('register',
        id: @config.BotId,
        secret: @config.BotSecret)
    )

    @client.once('no_registration', () =>
      @robot.logger.error("Orky could not find our registration.")
      process.exit(1)
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