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

    @client.on('post_message', (data) =>
      text = "#{@robot.name} #{data?.text}"
      user = data?.user
      if user?
        user.room = data?.address?.conversation?.id
      address = data?.address
      token = data?.token

      message = new TextMessage(user, text, address?.id)
      message.token = token
      message.address = address

      @robot.receive message
    )
  send: (context, strings...) ->
    @robot.logger.info "Send"
    @responseClient.postMessages(strings..., context, false)

  reply: (context, strings...) ->
    @robot.logger.info "Reply"
    @responseClient.postMessages(strings..., context, true)

exports.use = (robot) ->
  new Orky robot