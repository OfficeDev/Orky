# Orky
## What is Orky?
Orky is an application built for [Microsoft Teams](https://products.office.com/en-US/microsoft-teams/group-chat-software). It consists of a Bot that forwards messages to OrkyBots (script executors that speak the Orky protocol).

## What is a Script Executor/OrkyBot?
A script executor or OrkyBot as I call it is any service that speaks the Orky protocol and can execute some piece of functionality based on chat input.

The most popular script executor for Orky is [Hubot](https://hubot.github.com/) with the [Hubot-Orky](https://github.com/MattSFT/Orky/tree/master/Hubot-Orky) adapter.

## Try Orky before deploying your own instance in [Microsoft Teams](https://products.office.com/en-US/microsoft-teams/group-chat-software)
You can try Orky by sideloading this [package]() into any one of your teams. Then you can talk to Orky in any channel by typing @OrkyDemo. This demo bot has no guaranteed uptime, no guaranteed security, and deletes any bots you register against it every 30 minutes or if the server restarts.

## How to deploy your own Orky instance and install it in [Microsoft Teams](https://products.office.com/en-US/microsoft-teams/group-chat-software)
This guide is written for an Azure oriented audience but should outline the general steps of creating an Orky instance.

Requirements:
* [BotFramework Account](https://dev.botframework.com/)
* [Azure Account](https://azure.microsoft.com/en-us/)

### Create a BotFramework Bot
1. Go [here](https://dev.botframework.com/bots).
2. Click 'Create a bot'
3. Click 'Register'
4. Fill out the form as appropriate. Leave Messaging endpoint blank for now.
5. Save your Microsoft App ID and password so you can look it up for the next steps.
6. Agree to the terms and save your bot configuration.

### Create a new Azure Web App
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

### Deploy your Orky instance to your Azure Web App
1. Fork this repository
2. Go back to [Azure](portal.azure.com/).
3. Go back to your Web App.
4. Go to "Deployment options"
5. Choose "GitHub" as your source.
6. Do what needs to happen to authorize Azure to pull in your github repositories.
7. As the Project choose your forked version of this repository.
8. Choose master branch.
9. Hit "OK".

Azure should now pull down the code from github and run the deployment script to run your orky instance. You can see the progress on the screen under "Deployment Options" in Azure. Deployment seems to usually take 5 - 10 minutes.

### Make sure you can talk to your bot
1. Go to [BotFramework](https://dev.botframework.com/bots)
2. Click your bot name.
3. Click 'Test' in the upper right.
4. Type "help" and you should see your bot respond with the commands it supports. This may take a few tries until Azure wakes up your bot.

### Create an Application Package to sideload into [Microsoft Teams](https://products.office.com/en-US/microsoft-teams/group-chat-software)
1. Copy the files in OrkyDemoManifest
2. Change the coloricon.png to an 96x96 png icon you like.
3. Change the outlineicon.png to a 20x20 png icon you like.
4. Update manifest.json and replace "id" and "botId" with your app id.
5. Take all three files (manifest.json, coloricon.png, outlineicon.png) and zip them into the root level of a zip archive. Make sure that the files are at the root level and not inside of a folder inside the zip archive.
6. Sideload this zip into any team of your choice using this [guide](https://msdn.microsoft.com/en-us/microsoft-teams/sideload).

## How to add your own OrkyBot?
This guide can help you add your own bot using the [Hubot](https://hubot.github.com/) framework.

Requirements:
* [nodejs](https://nodejs.org)

1. Run this in your node-capable terminal 
```bash
npm install -g yo generator-hubot
yo hubot
npm install coffee-script --save
```

2. Fill in the prompts appropriatly. For Adapter type 'orky'

3. Once its done you have a working copy of a [Hubot](https://hubot.github.com/) capable of talking to Orky. Now you have to add it to your team and configure it with secrets. So go to the team in [Microsoft Teams](https://products.office.com/en-US/microsoft-teams/group-chat-software) that you want to add the bot to.
```
@Orky add <botname>
```
4. Take the id and secret that Orky gave you and go back to your node-capable terminal. If you are using the `bash` shell, type:
```bash
export ORKY_URI=<path to your orky instance>
export BOT_ID=<id>
export BOT_SECRET=<secret>
./bin/hubot -a orky
```
If you are using Windows `cmd` shell, type:
```cmd
set ORKY_URI=<path to your orky instance>
set BOT_ID=<id>
set BOT_SECRET=<secret>
./bin/hubot -a orky
```

5. You output should look like this.

```bash
INFO Constructor
INFO Run
INFO Connected to Orky
INFO We have a new name! '<botname>'
```

6. Since the stock [Hubot](https://hubot.github.com/) yeoman generator adds some default scripts you can test your local bot in one of the channels in [Microsoft Teams](https://products.office.com/en-US/microsoft-teams/group-chat-software). Type

```
@Orky tell <botname> time
```

Orky should respond with the local time of the machine running [Hubot](https://hubot.github.com/).

Everything else is the same as regular [Hubot](https://hubot.github.com/).

# Contributing
This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

# Attributions
The logo for Orky was created by artist [Proycontec](http://www.iconarchive.com/artist/proycontec.html). The artist does not endorse this software. The license for the logo can be found [here](http://creativecommons.org/licenses/by-sa/4.0/). The entire icon set by the artist can be found [here](http://www.iconarchive.com/show/robots-icons-by-proycontec.html)
