# Oracle APEX Region Plugin - apexChat

Oracle APEX Region Plugin that allows users to quickly create chat region interaction.

Your support means a lot.

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.me/isabolic99)

## Install build version
### pre requirements

- [node.js](https://nodejs.org)
- [oracle](https://www.oracle.com/downloads/index.html)
- [apex 5.x.x](http://www.oracle.com/technetwork/developer-tools/apex/overview/index.html)

from **build** directory:
1) compile package AX_PLG_SOCKET_CHAT (pks and pkb) in your apex parsing schema.
2) Import plugin file "region_type_plugin_apex_socket_chat_room.sql" from plugin directory into your application
3) copy/move node.server directory into your prefered directory
4) inside terminal navigate into copied node.server directory and run 
   ```bash
   npm install
   ```
5) go into node.server and edit file package.json, there you set node.js port and server ip address or hostname
   ```javascript
    ...
    "port" : "SERVER_PORT",
    "server" : "SERVER_HOST (OR IP)",
    ...
   ``` 
6) inside terminal navigate into copied node.server directory and run 
   ```bash
   npm run
   ```
## Plugin Settings
### How to
1) Create a Region on your apex page 
- [X] set **Type**: apexChat.io[Plug-in]
- [X] set **socket server**: http or https link to your node.js server
- [X] set **Chat room item**: apex item on page (or application item) in witch is stored chat room id 
- [X] set **Public chat**: "Yes"/"No" - option witch defines how chat region behaves, if public all chat messages are visible to everyone, private when someone enter chatroom auto creates room and then generate link where you can send invitations for chat.


## Demo Application

[Apex chat](https://apex.oracle.com/pls/apex/f?p=101959:16 "Apex chat homepage")


