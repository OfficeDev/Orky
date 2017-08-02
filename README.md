# Orky
## What is Orky?
Orky is an application built for [Microsoft Teams](https://products.office.com/en-US/microsoft-teams/group-chat-software). It consists of a Bot that forwards messages to OrkyBots (script executors that speak the Orky protocol).

## What is a Script Executor/OrkyBot?
A script executor or OrkyBot as I call it is any service that speaks the Orky protocol and can execute some piece of functionality based on chat input.

The most popular script executor for Orky is [Hubot](https://hubot.github.com/) with the [Hubot-Orky](https://github.com/MattSFT/Orky/tree/master/Hubot-Orky) adapter.

## How to install Orky in Microsoft Teams
1. Download the sideloadable application package from [here](https://github.com/MattSFT/Orky/raw/master/orky.zip).

2. Follow the guide [here](https://msdn.microsoft.com/en-us/microsoft-teams/sideload)

You should now be able to talk to Orky and add your own bots.

## How to add your own bot?
This guide can help you add your own bot using the [Hubot](https://hubot.github.com/) framework.

Requirements:
* [nodejs](https://nodejs.org)

1. Run this in your node-capable terminal 
```bash
npm install -g yo generator-hubot
yo hubot
```

2. Fill in the prompts appropriatly. For Adapter type 'orky'

3. Once its done you have a working copy of a [Hubot](https://hubot.github.com/) capable of talking to Orky. Now you have to add it to your team and configure it with secrets. So go to the team in [Microsoft Teams](https://products.office.com/en-US/microsoft-teams/group-chat-software) that you want to add the bot to.
```
@Orky add <botname>
```
4. Take the id and secret that Orky gave you and go back to your node-capable terminal. Type
```bash
export BOT_ID=<id>
export BOT_SECRET=<secret>
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