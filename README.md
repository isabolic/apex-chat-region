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
5) inside node.server, copy or rename file config.json.org
   ```bash
   cd node.server
   cp config.json.org config.json
   ```
5) then edit file config.json, there you set node.js port and server ip address or hostname
   ```javascript
    {
      "options": {
        "port": "PORT",
        "server": "IP_ADD_OR_HOST"
      }
    }
   ```
6) inside terminal navigate into copied node.server directory and run
   ```bash
   node chat.js &
   ```

## Plugin Settings
### How to
1) Create a Region on your apex page
- [X] set **Type**: apexChat.io[Plug-in]
- [X] set **socket server**: http or https link to your node.js server (when you run command "node chat.js &" it will output server ip address or hostname with port. For example **"Listening on playground, server_port 8080"** then socket server link is http://playground:8080)
- [X] set **Chat room item**: apex item on page (or application item) in witch is stored chat room id
- [X] set **Public chat**: "Yes"/"No" - option witch defines how chat region behaves, if public all chat messages are visible to everyone, private when someone enter chatroom auto creates room and then generate link where you can send invitations for chat.


## Demo Application

[Apex chat](https://apex.oracle.com/pls/apex/f?p=101959:16 "Apex chat homepage")

## More info
The blog post for more technical detail can be found [here](https://goo.gl/3jcE2R).

