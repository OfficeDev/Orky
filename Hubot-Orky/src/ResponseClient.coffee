urlJoin = require('url-join')

class ResponseClient
  constructor: (@robot, options) ->
    @batch = []
    @options =
      autoBatchDelay: 250
    if typeof options?.autoBatchDelay != 'number'
      @options.autoBatchDelay = 250
  ###
  # Gets the members of the given conversation.
  # Parameters:
  #      chatConnector: Chat connector instance.
  #      address: Chat connector address. "serviceUrl" property is required.
  #      conversationId: [optional] Conversation whose members are to be retrieved, if not specified, the id is taken from address.conversation.
  # Returns: A list of conversation members.
  getConversationMembers: (token, address, conversationId) ->
    # Build request
    conversationId = conversationId || address.conversation.id
    options =
      method: "GET"
      url: "#{address.serviceUrl}/v3/conversations/#{conversationId}/members"

    return sendRequest(@robot, token, options)

  # Starts a 1:1 chat with the given user.
  # Parameters:
  #      chatConnector: Chat connector instance.
  #      address: Chat connector address. "bot", "user" and "serviceUrl" properties are required.
  #      channelData: Channel data object. "tenant" property is required.
  # Returns: A copy of "address", with the "conversation" property referring to the 1:1 chat with the user.
  startConversation: (token, address, channelData) ->
    # Build request
    options =
      method: "POST"
      url: "#{address.serviceUrl}/v3/conversations"
      body:
        bot: address.bot,
        members: [address.user],
        channelData: channelData,

    return sendRequest(@robot, token, options)
      .then((response) ->
        return createAddressFromResponse(address, response)
      )
  ###

  postMessage: (message, token, reply) ->
    if message?
      envelope =
        message: message
        token: token,
        reply: reply
      @batch.push(envelope)
      @startBatch()

  postMessages: (messages, token, reply) ->
    if not messages?
      return
    
    list = messages
    if (!Array.isArray(messages))
      list = [messages]

    for message in list
      envelope =
        message: message
        token: token,
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
        reply = item.reply
        if message?.address?.serviceUrl?
          return () =>
            send(@robot, message, reply, token, (index == batch.length - 1))
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

  send = (robot, message, reply, token, lastMessage) ->
    if not message?
      return Promise.resolve()

    address = message.address
    return prepOutgoingMessage(message, lastMessage)
      .then((message) ->
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

      request((error, response, body) ->
        if error?
          return reject(error)

        if response.statusCode >= 400
          txt = "Request to '#{options.url}' failed: [#{response.statusCode}] #{response.statusMessage}"
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

  prepOutgoingMessage = (message, lastMessage) ->
    return new Promise((resolve, reject) ->
      if not message?
        reject("Argument 'message' is undefined.")

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

      resolve(message)
    )

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