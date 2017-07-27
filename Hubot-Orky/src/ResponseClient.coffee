class ResponseClient
  constructor: (@robot) ->

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


  # Starts a new reply chain by posting a message to a channel.
  # Parameters:
  #      chatConnector: Chat connector instance.
  #      message: The message to post. The address in this message is ignored, and the message is posted to the specified channel.
  #      channelId: Id of the channel to post the message to.
  # Returns: A copy of "message.address", with the "conversation" property referring to the new reply chain.
  startReplyChain: (token, message, channelId) ->
    # Build request
    options =
      method: "POST"
      url: "#{message.address.serviceUrl}v3/conversations"
      body:
        isGroup: true
        activity: message
        channelData:
          teamsChannelId: channelId.split(";")[0]

    return sendRequest(@robot, token, options)
      .then((response) ->
        address = createAddressFromResponse(message.address, response)
        if address.user
          delete address.user
        if address.correlationId
          delete address.correlationId
        return address
      )

  # Send an authenticated request
  sendRequest = (robot, token, options) ->
    # Execute request
    return new Promise((resolve, reject) ->
      request = robot.http(options.url)
        .header("Authorization", "Bearer #{token}")
        .header('Content-Type', 'application/json')

      if options.method == 'POST'
        console.log(JSON.stringify(options.body))
        request = request.post(JSON.stringify(options.body))
      else
        request = request.get()

      request((error, response, body) ->
        if error?
          return reject(error)

        if response.statusCode >= 400
          console.log(body)
          txt = "Request to '#{options.url}' failed: [#{response.statusCode}] #{response.statusMessage}"
          return reject(new Error(txt))

        try
          if typeof body == 'string'
            body = JSON.parse(body)
          resolve(body)
        catch error
          if not error instanceof Error
            error = new Error(error)
          reject(error)
      ))

  # Create a copy of address with the data from the response
  createAddressFromResponse = (address, response) ->
    result = clone(address)
    result.conversation =
      id: response.id
    result.useAuth = true

    if result.id?
      delete result.id
    if response.activityId?
      result.id = response.activityId
    return result

  clone = (obj) ->
    if not obj? or typeof obj isnt 'object'
      return obj

    if obj instanceof Date
      return new Date(obj.getTime())

    if obj instanceof RegExp
      flags = ''
      flags += 'g' if obj.global?
      flags += 'i' if obj.ignoreCase?
      flags += 'm' if obj.multiline?
      flags += 'y' if obj.sticky?
      return new RegExp(obj.source, flags)

    newInstance = new obj.constructor()

    for key of obj
      newInstance[key] = clone obj[key]

    return newInstance

module.exports = ResponseClient