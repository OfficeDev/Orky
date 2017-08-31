# Hubot-Orky

## What is Hubot-Orky?

Hubot-Orky is a [Hubot](https://hubot.github.com/) adapter that allows instances of [Hubot](https://hubot.github.com/) to communicate with an [Orky](https://github.com/MattSFT/Orky/tree/master/Orky) instance.

## What is Orky?

[Orky](https://github.com/MattSFT/Orky/tree/master/Orky) is a bot you can deploy on [BotFramework](https://dev.botframework.com/) that makes managing [Hubot](https://hubot.github.com/) instances on [BotFramework](https://dev.botframework.com/) much easier.

If you are interested in deploying an instance of [Orky](https://github.com/MattSFT/Orky/tree/master/Orky) or playing with the demo instance, instructions can be found [here](https://github.com/MattSFT/Orky/tree/master/Orky).

## Hubot-Orky installation guide

This guide can help you create your own [Hubot](https://hubot.github.com/) instance from scratch. You can then take this [Hubot](https://hubot.github.com/) instance and register it with an [Orky](https://github.com/MattSFT/Orky/tree/master/Orky) instance and talk to it in any [BotFramework](https://dev.botframework.com/) supported channel (with some enhancements if you use the [Microsoft Teams](https://products.office.com/en-US/microsoft-teams/group-chat-software) channel).

### Requirements:

* [nodejs](https://nodejs.org)

### Instructions

1. Run this in your node-capable terminal 
```bash
npm install -g yo generator-hubot
yo hubot
npm install coffee-script --save
```

2. Fill in the prompts appropriatly. For Adapter type 'orky'

3. Once this is done you should have a working [Hubot](https://hubot.github.com/) instance capable of talking to an [Orky](https://github.com/MattSFT/Orky/tree/master/Orky) instance. Now you have to add it to your team or chat and configure it with secrets. Go to a team in [Microsoft Teams](https://products.office.com/en-US/microsoft-teams/group-chat-software) or a chat thread with [Orky](https://github.com/MattSFT/Orky/tree/master/Orky) in any other [BotFramework](https://dev.botframework.com/) channel where you want to add the [Hubot](https://hubot.github.com/) instance.
```
@Orky add <botname>
```
4. Take the id and secret that [Orky](https://github.com/MattSFT/Orky/tree/master/Orky) gave you and go back to your node-capable terminal. If you are using the `bash` shell, type:
```bash
export ORKY_URI=<path to your Orky instance>
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
[Fri Aug 25 2017 10:13:09 GMT-0700 (Pacific Daylight Time)] INFO Created instance of Orky Adapter with config: {
  "OrkyUri": "<YOUR ORKY INSTANCE URI",
  "BotId": "<YOUR BOT ID>",
  "BotSecret": "<YOUR BOT SECRET>"
}
[Fri Aug 25 2017 10:13:09 GMT-0700 (Pacific Daylight Time)] INFO Run
[Fri Aug 25 2017 10:13:09 GMT-0700 (Pacific Daylight Time)] INFO Connected to Orky server at <YOUR ORKY INSTANCE URI>
[Fri Aug 25 2017 10:13:09 GMT-0700 (Pacific Daylight Time)] INFO Registration successful as <YOUR BOT NAME> (<YOUR BOT ID>)

```

6. Since the stock [Hubot](https://hubot.github.com/) yeoman generator adds some default scripts you can test your local bot in one of the channels of the team in [Microsoft Teams](https://products.office.com/en-US/microsoft-teams/group-chat-software) or chat thread in any other [BotFramework](https://dev.botframework.com/) channel. Type

```
@Orky tell <botname> time
```

Orky should respond with the local time of the machine running [Hubot](https://hubot.github.com/).

Everything else is the same as regular [Hubot](https://hubot.github.com/).
