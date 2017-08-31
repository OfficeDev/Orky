# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT license.
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

    @robot.logger.info "Created instance of Orky Adapter with config: #{JSON.stringify(@config, null, 2)}"

  run: ->
    @robot.logger.info "Run"
 
    @client = SocketIO(@config.OrkyUri)
    @client.on('connect', () =>
      @robot.logger.info("Connected to Orky server at #{@config.OrkyUri}")
      @client.emit('register',
        id: @config.BotId,
        secret: @config.BotSecret)
    )

    @client.on('no_registration', () =>
      @robot.logger.error("Registration details are incorrect.");
      process.exit(1)
    )

    @client.on('registration_data', (data) =>
      @robot.logger.info("Registration successful as #{data.name} (#{data.id})")
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

    @client.on('connect_timeout', (timeout) =>
      @robot.logger.info("Connection to Orky server timed out. timeout=#{timeout}")
    )

    @client.on('connect_error', (error) =>
      @robot.logger.error("Connection to Orky server recieved an error. error=#{JSON.stringify(error)}")
    )

    @client.on('disconnect', () =>
      @robot.logger.info("Connection to Orky server was closed.")
    )

    @client.on('error', (error) =>
      @robot.logger.error("Socket.io received an error. error=#{JSON.stringify(error)}")
    )

    @client.on('ping', () =>
      @robot.logger.debug("Sent a ping to the server")
    )

    @client.on('pong', (latency) =>
      @robot.logger.debug("Received a pong from the server. Latency=#{latency}ms")
    )

    @client.on('reconnect_attempt', (attemptNumber) =>
      @robot.logger.info("Attempting to reconnect to Orky server. attemptNumber=#{attemptNumber}")
    )

    @client.on('reconnect_failed', () =>
      @robot.logger.info("Failed to reconnect to Orky server.")
    )

  close: () ->
    @robot.logger.info "Close"

    if @client?
      @client.disconnect();
      @client = null;

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