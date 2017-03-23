/**
 *
 * Plugin : Apex chat
 * Version: 1.0.0
 *
 * Author : isabolic99
 * Mail   : sabolic.ivan@gmail.com
 * Twitter: @isabolic99
 */

// namespace
(function(){
   if(window.apex.plugins === undefined){
      window.apex.plugins = {};
   }
}());


(function($, x) {

    /**
     * [anonymous_user constants]
     * @type {String}
     */
    var anonymous_user = ["ANONYMOUS", "NOBODY"];

    var options = {
        socketServer         : null,
        apxRegionId          : null,
        currentUser          : null,
        room                 : null,
        apxChatRoomUrl       : null,
        apxRoomItemVal       : null,
        ajaxIdentifier       : null,
        public               : false,
        showLeftNotefication : true,
        showJoinNotefication : true,
        htmlTemplate         : {
            chatThreadContainer : "<div class='ch-thread-cont' style='display:none'>"                                                     +
                                            "</div>",
            chatRow             : "<div class='ch-row'>"                                                                                  +
                                                "<div class='ch-avatar'>{{avatar}}</div>"                                                 +
                                                "<div class='ch-username'>{{username}}</div>"                                             +
                                                "<div class='ch-msg {{current_usr}}'>{{msg}}</div>"                                       +
                                            "</div>",
            typingInfo          : "<div class='ch-ty-row ty-{{usr}}'>"                                                                    +
                                                "<div class='ch-type'>{{msg}}</div>"                                                      +
                                            "</div>",
            userLeftNot         : "<div class='ch-user-left-row ty-{{usr}}'>"                                                             +
                                                "<div class='ch-left'>{{msg}}</div>"                                                      +
                                            "</div>",
            userJoinNot         : "<div class='ch-user-join-row ty-{{usr}}'>"                                                             +
                                                "<div class='ch-join'>{{msg}}</div>"                                                      +
                                            "</div>",
            loginOverlay        : "<div class='ch ch-login'>"                                                                             +
                                                "<div class='form'>"                                                                      +
                                                    "<h3 class='title'>{{lang.chatname}}</h3>"                                            +
                                                    "<input class='username' type='text' />"                                              +
                                                "</div>"                                                                                  +
                                            "</div>",
            chatInput           : "<div class='ch-input-cont'>"                                                                           +
                                                "<textarea class='ch-input' placeholder='{{lang.textareaPlaceholder}}'></textarea>"       +
                                            "<div>",
            buttonTemplate      : "<button class='t-Button t-Button--icon t-Button--iconLeft t-Button--hot btn-invite' type='button'>"    +
                                                "<span class='t-Icon t-Icon--left fa fa-link' aria-hidden='true'></span>"                 +
                                                "<span class='t-Button-label'>{{lang.btnLabel}}</span>"                                   +
                                                "<span class='t-Icon t-Icon--right fa fa-link' aria-hidden='true'></span>"                +
                                            "</button>",
            linkDialog          : "<div class='invite-dialog' style='display:none' title='{{lang.linkDlgtitle}}'>"                        +
                                                "<input type='text' value='{{link}}'></input>"                                            +
                                            "</div>"
        }
    };

    /**
     * [xDebug - PRIVATE function for debug]
     * @param  string   functionName  caller function
     * @param  array    params        caller arguments
     */
    var xDebug = function xDebug(functionName, params){
        x.debug(this.jsName || " - " || functionName, params, this);
    };

    /**
     * [triggerEvent     - PRIVATE handler fn - trigger apex events]
     * @param String evt - apex event name to trigger
     */
    var triggerEvent = function triggerEvent(evt, evtData) {
        xDebug.call(this, arguments.callee.name, arguments);
        this.options.$itemId.trigger(evt, [evtData]);
        $(this).trigger(evt + "." + this.apexname, [evtData]);
    };

     /**
     * [intervalFlag call passed function repeatedly "fnIntervat", stop only when flagForClear is set to true ]
     * @param  {[type]} fnIntervat   [function for repeatedly call]
     * @param  {[type]} flagForClear [key prop. on this scope]
     * @param  {[type]} timer        [timer, def. 200]
     */
    var intervalFlag = function  intervalFlag(fnIntervat, flagForClear, timer){
        var interval;

        xDebug.call(this, arguments.callee.name, arguments);

        this[flagForClear] = false;

        interval = setInterval(function() {
            fnIntervat.call(this);

            if (this[flagForClear]) {
                clearInterval(interval);
            }
        }.bind(this), (timer || 200));

    };

    var getMessage = function getMessage(code){
        var ret = apex.lang.getMessage(code);
        if (ret === code) {
            ret = undefined;
        }
        return ret;

    };

    var compileTemplate = function compileTemplate (templateName, data){
        var template = this.options.htmlTemplate[templateName],
            data;

        template = Handlebars.compile(template);

        data = $.extend({}, data, { "lang": lang });

        template = template(data);
        return template;

    }

    var setChatContHeight = function setChatContHeight(){
        var el = this.container
            .find(".ch-thread-cont")
        topParent = this.parent.parent();

        xDebug.call(this, arguments.callee.name, arguments);

        if (el.is(":visible") === true) {
            if (topParent.hasClass("t-Body-actionsContent") === true) {
                height = topParent.height() -
                    this.parent.find(".t-Region-header").outerHeight(true) -
                    this.container.find(".ch-input-cont").outerHeight(true);

                el.height(height);
            } else {
                el.height(this.parent.find(".t-Region-body").height() - this.container.find(".ch-input-cont").outerHeight(true));
            }
            this.isRendered = true;
        }

    };

    var addMessageElement = function addMessageElement (msg, user){
        var userName = user || this.options.currentUser,
            rowtemplate;

        rowtemplate = compileTemplate.call(this,
            "chatRow", {
                "msg"        : msg,
                "avatar"     : userName.substring(0, 2).toUpperCase(),
                "username"   : userName,
                "current_usr": this.options.currentUser === userName ? "current-usr" : ""
            }
        );

        rowtemplate = $(rowtemplate);

        this.container.find(".ch-thread-cont").append(rowtemplate);

        // scroll to bottom
        this.container
            .find(".ch-thread-cont")
            .scrollTop(
                this.container
                .find(".ch-thread-cont")
                .get(0)
                .scrollHeight
            );

    };

    var rmSimpleLogin = function rmSimpleLogin(){
        this.container.find(".ch-login").remove();
        this.container.find(".ch-input-cont").show();
        this.container.find(".ch-thread-cont").show();
    };

    var typeInfo = function typeInfo(msg, user, action, delayRemove){
        var userName = user || this.options.currentUser,
            rowtemplate;

        if (action === "show") {

            rowtemplate = compileTemplate.call(
                this,
                "typingInfo", {
                    "msg": user + " " + msg,
                    "usr": user
                }
            );

            this.container.find(".ch-ty-row.ty-" + user).remove();
            this.container.find(".ch-thread-cont").append(rowtemplate);

        } else {
            this.container.find(".ch-ty-row.ty-" + user).delay(delayRemove).remove();
        }

    };

    var userLeftJoin = function userLeftJoin(msg, user, type){
        var rowtemplate,
            userName = user || this.options.currentUser;

        if (this.options.showLeftNotefication === true && type === "LEFT") {
            rowtemplate = "userLeftNot";
        }
        if (this.options.showJoinNotefication === true && type === "JOIN") {
            rowtemplate = "userJoinNot";
        }

        if (rowtemplate !== undefined) {

            rowtemplate = compileTemplate.call(
                this,
                rowtemplate, {
                    "msg": user + " " + msg,
                    "usr": user
                }
            );

            this.container.find(".ch-thread-cont").append(rowtemplate);
        }

    };

    var setEvents = function setEvents(){
        var typingTimer,
            typingInterval = 500,
            typingTimeOut = function() {
                this.socket.emit("STOP.TYPING");
                typeInfo.call(this, "", null, "hide", 0);
            }.bind(this);

        xDebug.call(this, arguments.callee.name, arguments);

        this.container.on("keydown", ".ch-input", function(e) {
            var msg;
            if (e.keyCode === 13) {
                msg = $(e.currentTarget).val();
                $(e.currentTarget).val("");
                addMessageElement.call(this, msg);
                this.socket.emit("NEW.MESSAGE", msg);
                this.socket.emit("STOP.TYPING");
                typeInfo.call(this, "", null, "hide", 0);

                return false;

            } else if (e.keyCode === 9) {
                this.socket.emit("STOP.TYPING");
            } else {
                this.socket.emit("TYPING");
                clearTimeout(typingTimer);
                typingTimer = setTimeout(typingTimeOut, typingInterval);
            }

        }.bind(this));

        this.container.on("keydown", ".username", function(e) {
            var username = $(e.target).val();
            if (e.keyCode === 13) {
                if (username !== "") {
                    this.options.currentUser = username;
                    if (this.options.public === true) {
                        this.socket.emit("PUBLIC", { username: this.options.currentUser });
                    } else {
                        this.socket.emit("SET.ROOM", { room: this.options.room, username: this.options.currentUser });
                    }

                    rmSimpleLogin.call(this);
                    setApxItemVal.call(this, this.options.room);

                    if (this.parent.hasClass("right-col") === true) {
                        intervalFlag.call(this, setChatContHeight, "isRendered");
                    }
                }

                e.preventDefault();
                return false;
            }
        }.bind(this));

        this.parent.on("click", ".btn-invite", function(e) {
            this.linkDialog.dialog({ width: 500, height: 90 }).show();
            e.preventDefault();
            return false;
        }.bind(this));

        if (this.parent.hasClass("right-col") === true) {
            // reg. resize event
            $(window).resize(function() {
                intervalFlag.call(
                    this, setChatContHeight, "isRendered", 500
                );
            }.bind(this));
        }

    };

    var setApxItemVal = function setApxItemVal(val){
        var params;

        xDebug.call(this, arguments.callee.name, arguments);

        params = {
            p_flow_id      : $('#pFlowId').val(),
            p_flow_step_id : $('#pFlowStepId').val(),
            p_instance     : $('#pInstance').val(),
            p_debug        : $('#pdebug').val(),
            x01            : val,
            p_request      : 'PLUGIN=' + this.options.ajaxIdentifier
        };

        $.ajax({
                type     : 'POST',
                url      : 'wwv_flow.show',
                data     : params,
                dateType : 'application/json',
                async    : true
            }).done(function(data) {
                xDebug.call(this, arguments.callee.name, arguments);
            }.bind(this))
            .fail(function(data) {
                alert("error : " || data);
            }.bind(this));

    }

    var setSocketEvents = function setSocketEvents() {
        xDebug.call(this, arguments.callee.name, arguments);

        this.socket.on("ROOM.NAME", function(room) {
            xDebug.call(this, arguments.callee.name, arguments);

            if (this.options.room === null && this.options.public === false) {
                this.options.room = room;
                this.options.apxChatRoomUrl = this.options.apxChatRoomUrl.replace("#roomid#", room);
                setInviteButton.call(this);
                setApxItemVal.call(this, room);
            }

        }.bind(this));

        this.socket.on("NEW.MESSAGE", function(data) {
            if (this.options.currentUser !== null) {
                typeInfo.call(this, "", data.username, "hide", 0);
                addMessageElement.call(this, data.message, data.username);
            }
        }.bind(this));

        this.socket.on("TYPING", function(data) {
            if (this.options.currentUser !== null) {
                typeInfo.call(this, "is typing..", data.username, "show");
            }
        }.bind(this));

        this.socket.on("STOP.TYPING", function(data) {
            if (this.options.currentUser !== null) {
                typeInfo.call(this, "", data.username, "hide", 0);
            }
        }.bind(this));

        this.socket.on("USER.JOINED", function(data) {
            if (this.options.currentUser !== null) {
                userLeftJoin.call(this, lang.notUserJoin, data.username, "JOIN", 0);
            }
        }.bind(this));

        this.socket.on("USER.LEFT", function(data) {
            if (this.options.currentUser !== null) {
                typeInfo.call(this, "", data.username, "hide", 0);
                userLeftJoin.call(this, lang.notUserLeft, data.username, "LEFT", 0);
            }
        }.bind(this));

        if (this.options.room !== null) {
            this.options.apxChatRoomUrl = this.options.apxChatRoomUrl.replace("#roomid#", this.options.room);
            setInviteButton.call(this);
            setApxItemVal.call(this, this.options.room);

            if (this.options.currentUser !== null) {
                this.socket.emit("SET.ROOM", { room: this.options.room, username: this.options.currentUser });
            }
        }

        if (this.options.public === true) {
            this.socket.emit("PUBLIC", { username: this.options.currentUser });
            this.options.room = null;
        }

    };

    var setDom = function setDom(){
        xDebug.call(this, arguments.callee.name, arguments);

        this.container
            .append(compileTemplate.call(
                this,
                "chatThreadContainer", {}
            ));

        this.container
            .append(compileTemplate.call(
                this,
                "chatInput", {}
            ));

        if (this.options.currentUser === null ||
            anonymous_user.indexOf(this.options.currentUser.toUpperCase()) > -1) {

            this.container
                .append(
                    compileTemplate.call(
                        this,
                        "loginOverlay", {}
                    )
                );

            this.container.find(".ch-input-cont").hide();
            this.options.currentUser = null;

        } else {
            rmSimpleLogin.call(this);
        }

        if (this.parent.hasClass("right-col") === true) {
            intervalFlag.call(this, setChatContHeight, "isRendered");
        }

        setEvents.call(this);
        setSocketEvents.call(this);

    };

    var setInviteButton = function setInviteButton(){
        var buttonTemplate, dlgTemplate;

        dlgTemplate = compileTemplate.call(
            this,
            "linkDialog", { "link": this.options.apxChatRoomUrl }
        );

        buttonTemplate = compileTemplate.call(
            this,
            "buttonTemplate", {}
        );

        if (this.options.room !== null) {
            this.parent.find(".t-Region-headerItems--buttons").prepend(buttonTemplate);
        }

        this.linkDialog = $(dlgTemplate);

        $("body").append(dlgTemplate);

    }

    apex.plugins.apexChat = function(opts) {
        this.apexname = "APEX_CHAT";
        this.jsName = "apex.plugins.apexChat";
        this.container = $("<div>",{"class" :"apx-chat-reg"});
        this.options = {};
        this.parent = null;
        this.linkDialog = null;
        this.isRendered = false;
        this.init  = function(){
            if (window.io === undefined || $.isFunction(io.Socket) === false) {
                throw this.jsName || ": requires socket.io (https://github.com/socketio/socket.io)";
            }

            if (window.Handlebars === undefined) {
                throw this.jsName || ": requires handlebars.js (http://handlebarsjs.com/)";
            }

            if ($.type(opts) === "string") {
                opts = JSON.parse(opts);
            }

            if ($.isPlainObject(opts)) {
                this.options = $.extend(true, {}, this.options, options, opts);
            } else {
                throw this.jsName || ": Invalid options passed.";
            }

            this.socket = io(this.options.socketServer);
            this.parent = $(this.options.apxRegionId);

            if (this.parent.find(".t-Region-body").length > 0) {
                this.parent.find(".t-Region-body").append(this.container);
            } else {
                this.parent.append(this.container);
            }

            setDom.call(this);

            return this;

        };

        return this.init();
    }

    apex.plugins.apexChat.prototype = {};

    var lang = {
        chatname            : getMessage("AXCHAT.LOGIN.CHATNAME.PROMPT") || "chatname?",
        textareaPlaceholder : getMessage("AXCHAT.TEXTAREA.MSG.PHOLDER")  || "Text something",
        btnLabel            : getMessage("AXCHAT.BUTTON.LABEL")          || "Invite link",
        linkDlgtitle        : getMessage("AXCHAT.DIALOG.TITLE")          || "Invite link",
        notUserJoin         : getMessage("AXCHAT.USER.JOIN")             || "has joined your channel...",
        notUserLeft         : getMessage("AXCHAT.USER.LEFT")             || "has left your channel..."
    }

})(apex.jQuery, apex);
