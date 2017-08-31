# Orky

## What is Orky?

[Orky](https://github.com/MattSFT/Orky/tree/master/Orky) is a bot you can deploy on [BotFramework](https://dev.botframework.com/). It provides a protocol for communicating with OrkyBot instances on [BotFramework](https://dev.botframework.com/).

## What is an OrkyBot?

An OrkyBot is any service that speaks the [Orky](https://github.com/MattSFT/Orky/tree/master/Orky) protocol. This means that integrating any service with [Orky](https://github.com/MattSFT/Orky/tree/master/Orky) will allow users to communicate with it through chat.

Here are the currently supported services:
* [Hubot](https://hubot.github.com/) with the [Hubot-Orky](https://github.com/MattSFT/Orky/tree/master/Hubot-Orky) adapter.

## [Orky](https://github.com/MattSFT/Orky/tree/master/Orky) demo instance

There is a deployed demo instance of [Orky](https://github.com/MattSFT/Orky/tree/master/Orky) that anyone can talk to. Instructions for trying it in various [BotFramework](https://dev.botframework.com/) channels are below.

This demo bot has no guaranteed uptime, no guaranteed security, and deletes all registered OrkyBots frequently.

### Try the [Orky](https://github.com/MattSFT/Orky/tree/master/Orky) demo in [Skype](https://www.skype.com)

You can quickly start a chat with the [Orky](https://github.com/MattSFT/Orky/tree/master/Orky) demo instance by clicking [here](https://join.skype.com/bot/64fd7505-1b73-43bf-a26e-08a3a60a1a44).

### Try the [Orky](https://github.com/MattSFT/Orky/tree/master/Orky) demo in [Microsoft Teams](https://products.office.com/en-US/microsoft-teams/group-chat-software)

You can try [Orky](https://github.com/MattSFT/Orky/tree/master/Orky) by [sideloading](https://msdn.microsoft.com/en-us/microsoft-teams/sideload) this [package](https://github.com/MattSFT/Orky/raw/master/OrkyDemoManifest/OrkyDemoManifest.zip) into any one of your teams. Then you can talk to [Orky](https://github.com/MattSFT/Orky/tree/master/Orky) in any channel of that team by typing @OrkyDemo.

## How to deploy your own [Orky](https://github.com/MattSFT/Orky/tree/master/Orky) instance

This guide is written for an [Azure](https://azure.microsoft.com) oriented audience but should outline the general steps of creating an [Orky](https://github.com/MattSFT/Orky/tree/master/Orky) instance.

### Requirements

* [BotFramework Account](https://dev.botframework.com/)
* [Azure Account](https://azure.microsoft.com/en-us/)

### Create a [BotFramework](https://dev.botframework.com/) Bot

1. Go [here](https://dev.botframework.com/bots).
2. Click 'Create a bot'
3. Click 'Register'
4. Fill out the form as appropriate. Leave Messaging endpoint blank for now.
5. Save your Microsoft App ID and password so you can look it up for the next steps.
6. Agree to the terms and save your bot configuration.

### Create a new [Azure](https://azure.microsoft.com) Web App

1. Go [here](portal.azure.com/).
2. Click '+ New' in the upper left.
3. Find and choose 'Web App' from the marketplace. Note it takes a few moments for your web app to be usable.
4. Go to your web app configuration (click the three lines in the upper left, then App Services, then on the name of your web app).
5. Go back to [BotFramework](https://dev.botframework.com/bots) and populate the Messaging endpoint with the URL of your web app + /api/messages. Make sure to use the https protocol. So if Azure says your web app URL is http://orkydemo.azurewebsites.net you would populate the Messaging endpoint field with https://orkydemo.azurewebsites.net/api/messages. Be sure to save your bot configuration.
6. Go back to your web app configuration in [Azure](portal.azure.com/).
7. Click 'Application settings'
8. Enable Web sockets.
9. (Optional) Make your app 'Always On', keeping it on will make the bot respond faster after long period of inactivity. Note, if you are going to just use the memory bot storage, your bots will be cleared everytime the service restarts.
10. Configure the environment variables for your Orky instance. Orky supports these variables:
Required:
```
MICROSOFT_APP_ID=the app id you saved earlier
MICROSOFT_APP_PASSWORD=the app password you saved earlier
```
Optional:
```
MICROSOFT_TENANT_FILTER=comma separated list of tenant ids
PORT=the port to run orky under; do not set for azure deployment
DEFAULT_LOCALE=the default language to respond in; only english is supported at the moment
BOT_KEEP_DURATION=how long in milliseconds to keep bots around. Orky will automatically delete bots after this duration. Do not set if you want your bots to stick around forever. This is useful for demo mode.
BOT_DATA_STORAGE_TYPE="memory" or "file". The default is memory. If you want to persist your bot registrations, you should set this to file.
BOT_DATA_FILE_PATH=relative path to the file you want to store bot registrations under. Only applies if BOT_DATA_STORAGE_TYPE is "file".
LOG_LEVEL="debug","info","warn", or "error" are the valid values in order. Default is "info", which works on every value after it in the list so "warn" and "error" will also be included. Setting this to "debug" will log all messages.
BOT_RESPONSE_TIMEOUT=how long in milliseconds will your bot have to respond to an input message. Orky cuts off responses from bots after this duration. The default is 10000 (10 seconds).
```

### Deploy your [Orky](https://github.com/MattSFT/Orky/tree/master/Orky) instance to your [Azure](https://azure.microsoft.com) Web App

1. Fork this repository
2. Go back to [Azure](portal.azure.com/).
3. Go back to your Web App.
4. Go to "Deployment options"
5. Choose "GitHub" as your source.
6. Do what needs to happen to authorize Azure to pull in your github repositories.
7. As the Project choose your forked version of this repository.
8. Choose master branch.
9. Hit "OK".

Azure should now pull down the code from github and run the deployment script to run your [Orky](https://github.com/MattSFT/Orky/tree/master/Orky) instance. You can see the progress on the screen under "Deployment Options" in Azure. Deployment seems to usually take 5 - 10 minutes.

### Make sure you can talk to your bot

1. Go to [BotFramework](https://dev.botframework.com/bots)
2. Click your bot name.
3. Click 'Test' in the upper right.
4. Type "help" and you should see your bot respond with the commands it supports. This may take a few tries until Azure wakes up your bot.

## Install your [Orky](https://github.com/MattSFT/Orky/tree/master/Orky) instance in [Microsoft Teams](https://products.office.com/en-US/microsoft-teams/group-chat-software)

[Microsoft Teams](https://products.office.com/en-US/microsoft-teams/group-chat-software) is a great product to utilize your [Orky](https://github.com/MattSFT/Orky/tree/master/Orky) instance in because of its Team-centric architecture. Here are instructions on how to get your [Orky](https://github.com/MattSFT/Orky/tree/master/Orky) instance into [Microsoft Teams](https://products.office.com/en-US/microsoft-teams/group-chat-software).

### Create an application package and sideload it

1. Copy the files in the OrkyDemoManifest folder.
2. Change the coloricon.png to an 96x96 png icon you like.
3. Change the outlineicon.png to a 20x20 png icon you like.
4. Update manifest.json and replace "id" and "botId" with your app id.
5. Take all three files (manifest.json, coloricon.png, outlineicon.png) and zip them into the root level of a zip archive. Make sure that the files are at the root level and not inside of a folder inside the zip archive.
6. Sideload this zip into any team of your choice using this [guide](https://msdn.microsoft.com/en-us/microsoft-teams/sideload).
