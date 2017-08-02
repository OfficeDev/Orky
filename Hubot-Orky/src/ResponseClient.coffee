BotBuilder = require 'botbuilder'
urlJoin = require('url-join')

class ResponseClient
  constructor: (@robot, options) ->
    @batch = []
    @options =
      autoBatchDelay: 250
    if typeof options?.autoBatchDelay != 'number'
      @options.autoBatchDelay = 250

  postMessage: (message, context, reply) ->
    if message?
      envelope =
        message: message
        context: context,
        reply: reply
      @batch.push(envelope)
      @startBatch()

  postMessages: (messages, context, reply) ->
    if not messages?
      return
    
    list = messages
    if (!Array.isArray(messages))
      list = [messages]

    for message in list
      envelope =
        message: message
        context: context,
        reply: reply
      @batch.push(envelope)
    @startBatch()

  startBatch: () ->
    @batchStarted = true
    if (!@sendingBatch)
      if (@batchTimer)
        clearTimeout(@batchTimer)
      @batchTimer = setTimeout(() =>
        @sendBatch()
      , @options.autoBatchDelay)

  sendBatch: () ->
    if (@sendingBatch)
      @batchStarted = true
      return
    if (@batchTimer)
      clearTimeout(@batchTimer)
      @batchTimer = null
    @batchTimer = null
    batch = @batch
    @batch = []
    @batchStarted = false
    @sendingBatch = true

    if batch.length > 0
      token = batch[0].token
      sendFuncs = batch.map((item, index) =>
        message = item.message
        context = item.context
        token = item.context.message.token
        reply = item.reply
        if context?.message?.address?.serviceUrl?
          return () =>
            send(@robot, message, context, reply, token, (index == batch.length - 1))
              .catch((error) =>
                @robot.logger.error(error)
              )
        else
          return () =>
            @robot.logger.error('Message is missing address or serviceUrl.')
            return Promise.resolve()
      )

      promiseInSeries(sendFuncs)
        .then(() =>
          @sendingBatch = false
          if (@batchStarted)
            @startBatch()
        )
        .catch((error) =>
          @robot.logger.error(error)
        )

  send = (robot, message, context, reply, token, lastMessage) ->
    if not message?
      return Promise.resolve()

    return prepareOutgoingMessage(robot, context.message.address, message, lastMessage)
      .then((message) ->
        address = context.message.address
        conversationId = address.conversation.id
        if not reply
          conversationId = conversationId.split(';')[0]
        conversationId = encodeURIComponent(conversationId)
        addressId = encodeURIComponent(address.id)
        path = "/v3/conversations/#{conversationId}/activities/#{addressId}"

        options =
          method: 'POST',
          # We use urlJoin to concatenate urls. url.resolve should not be used
          # here, since it resolves urls as hrefs are resolved, which could
          # result in losing the last fragment of the serviceUrl.
          url: urlJoin(address.serviceUrl, path),
          body: message,
          json: true,
          headers:
            'User-Agent': 'Orky/1.0'

        robot.logger.debug("Sending Request=#{JSON.stringify(options, null, 2)}")

        return sendRequest(robot, token, options)
      )

  # Send an authenticated request
  sendRequest = (robot, token, options) ->
    # Execute request
    return new Promise((resolve, reject) ->
      request = robot.http(options.url)
        .header("Authorization", "Bearer #{token}")
        .header('Content-Type', 'application/json')

      switch options.method
        when 'POST'
          request = request.post(JSON.stringify(options.body))
        when 'GET'
          request = request.get()
        else
          return reject("Method '#{options.method}' not supported")

      robot.logger.debug("Sending message=#{JSON.stringify(options, null, 2)}")
      request((error, response, body) ->
        if error?
          return reject(error)

        if response.statusCode >= 400
          txt = "Request to '#{options.url}' failed: [#{response.statusCode}] #{response.statusMessage} message=#{body}"
          return reject(new Error(txt))

        try
          contentType = response?.headers?['content-type']?.toLowerCase()
          contentLength = parseInt(response?.headers?['content-length'], 10) || 0
          if contentLength > 0 && contentType? && contentType.startsWith('application/json')
            body = JSON.parse(body)
          resolve(body)
        catch error
          if not error instanceof Error
            error = new Error(error)
          reject(error)
      ))


  imageRegExp = /^(https?:\/\/.+\/(.+)\.(jpg|png|gif|jpeg$))/
  urlRegExp = /^(ftp:\/\/|www\.|https?:\/\/){1}[a-zA-Z0-9u00a1-\uffff0-]{2,}\.[a-zA-Z0-9u00a1-\uffff0-]{2,}(\S*)$/g
  # Generate an attachment object from the first image URL in the message
  convertToImageAttachment = (robot, message) ->
    if not typeof message is 'string'
      return Promise.resolve(null)

    # Basic image detection. If we can get the image without pinging the url,
    # thats great!
    result = imageRegExp.exec(message)
    if result?
      return Promise.resolve(
        contentUrl: result[1]
        name: result[2]
        contentType: "image/#{result[3]}"
      )

    # We found a url but it wasnt an obvious image. Ping it to get
    # the content type.
    if !urlRegExp.exec(message)
      return Promise.resolve(null)

    return new Promise((resolve, reject) ->
      request = robot.http(message).get()
      request((error, response, body) ->
        if error?
          return resolve(null)
        
        contentType = response?.headers?['content-type']
        if not contentType? || not contentType.startsWith('image')
          return resolve(null)
        
        resolve(
          contentType: contentType,
          contentUrl: message
        )
      )
    )

  slackMentionRegExp = /<@([^\|>]*)\|?([^>]*)>/g

  # Fixes the response to have the proper information that teams needs
  # 1. Replaces all slack @ mentions with Teams @ mentions
  #  Slack mentions take the form of <@[username or id]|[mention text]>
  #  We have to convert this into a mention object which needs the id.
  prepareOutgoingMessage = (robot, address, message, lastMessage) ->
    if not robot?
      return Promise.reject("Argument 'robot' is undefined.")
    if not message?
      return Promise.reject("Argument 'message' is undefined.")
    if not address?
      return Promise.reject("Argument 'address' is undefined.")

    # If the message is already an object, treat it as if someone already crafted a BF message out of it.
    if typeof message != 'string'
      return Promise.resolve(message)

    # Convert string messages to proper BotFramework message
    response = new BotBuilder.Message()
      .address(address)

    # If the string message is an image, create the image attachment
    return convertToImageAttachment(robot, message)
      .then((imageAttachment) ->
        if imageAttachment?
          response.addAttachment(imageAttachment)
          message = null
          
        if message
          message = message.replace(/\n/g, "\n\n")
          mentions = []
          while match = slackMentionRegExp.exec(message)
            foundUser = null
            users = robot.brain.users()
            for userId, user of users
              if userId == match[1] || user.name == match[1]
                foundUser = user

            userId = foundUser?.id || match[1]
            userName = foundUser?.name || match[1]
            userText = "<at>#{match[2] || userName}</at>"
            mentions.push(
              full: match[0]
              mentioned:
                id: userId
                name: userName
              text: userText
              type: "mention")
          
          for mention in mentions
            mentionTextRegExp = new RegExp(escapeRegExp(mention.full), "gi")
            message = message.replace(mentionTextRegExp, mention.text)
            delete mention.full
            response.addEntity(mention)

          response.text(message)
        
        message = response.toMessage()

        # Patch message fields
        message.locale = message.textLocale
        message.channelData = message.sourceEvent
        message.from = message?.address?.bot
        message.recipient = message?.address?.user
        delete message.address
        delete message.textLocale
        delete message.sourceEvent
        delete message.agent
        delete message.source

        # Patch inputHint
        if message.type == 'message' && not message?.inputHint?
          message.inputHint = lastMessage ? 'acceptingInput' : 'ignoringInput'

        # Ensure local timestamp
        if not message.localTimestamp?
          message.localTimestamp = new Date().toISOString()

        return message
      )

  escapeRegExp = (str) ->
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")

  promiseInSeries = (providers) ->
    ret = Promise.resolve(null)
    results = []

    return providers.reduce(
      (result, provider, index) ->
        return result.then(() ->
          return provider().then((val) ->
            results[index] = val
          )
        )
      , ret).then(() ->
        return results
      )

module.exports = ResponseClient