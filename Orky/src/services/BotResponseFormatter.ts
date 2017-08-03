import {Session, Message, IMessage, IChatConnectorAddress, IIdentity} from "botbuilder";
import {ArgumentNullException} from '../Errors';
import {BotResponse} from "../Models";
import {IBotResponseFormatter} from './Interfaces';

export class BotResponseFormatter implements IBotResponseFormatter {
  private static imageRegExp = /^(https?:\/\/.+\/(.+)\.(jpg|png|gif|jpeg$))/;

  // Fixes the response to have the proper information that teams needs
  // 1. Replaces all slack @ mentions with Teams @ mentions
  //  Slack mentions take the form of <@[username or id]|[mention text]>
  //  We have to convert this into a mention object which needs the id.
  prepareOutgoingMessages(session : Session, response: BotResponse) : IMessage[] {
    if (!response) {
      throw new ArgumentNullException('response');
    }
    if (!response.messages) {
      throw new ArgumentNullException('response.messages');
    }
    if (!session) {
      throw new ArgumentNullException('session');
    }

    // Clone the address
    const responseAddress = this.cloneAddress(session.message.address);

    if (responseAddress.conversation && responseAddress.conversation.id && response.type === 'send') {
      responseAddress.conversation.id = responseAddress.conversation.id.split(';')[0];
    }
    
    return response.messages.map((message) => {
      // If the message is already an object, treat it as if someone already crafted a BF message out of it.
      if(typeof message !== 'string') {
        const bfMessage = message as IMessage;
        bfMessage.address = responseAddress;
        return bfMessage;
      }

      // Convert string messages to proper BotFramework message
      const response = new Message(session);
      response.address(responseAddress);

      // If the string message is an image, create the image attachment
      const imageAttachment = this.convertToImageAttachment(message);
      if (imageAttachment) {
        response.addAttachment(imageAttachment);
      }
      else {
        response.text(message);
      }
      
      return response.toMessage();
    });
  }

  private cloneAddress(address: IChatConnectorAddress) : IChatConnectorAddress {
    if (!address) {
      throw new ArgumentNullException('address');
    }

    return <IChatConnectorAddress>{
      id: address.id,
      serviceUrl: address.serviceUrl,
      channelId: address.channelId,
      user: <IIdentity> {
        id: address.user.id,
        name: address.user.name,
        isGroup: address.user.isGroup
      },
      bot: <IIdentity> {
        id: address.bot.id,
        name: address.bot.name,
        isGroup: address.bot.isGroup
      },
      conversation: !address.conversation ? null : <IIdentity> {
        id: address.conversation.id,
        name: address.conversation.name,
        isGroup: address.conversation.isGroup
      }
    };
  }
  
  // Generate an attachment object from the first image URL in the message
  private convertToImageAttachment(message: string) : any {
    if (!message) {
      return null;
    }

    // Basic image detection. If we can get the image without pinging the url, thats great!
    const result = BotResponseFormatter.imageRegExp.exec(message);
    if(result) {
      return {
        contentUrl: result[1],
        name: result[2],
        contentType: "image/#{result[3]}"
      };
    }

    return null;
  }
}
