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
    var anonymous_user = ["ANONYMOUS", "NOBODY", "APEX_PUBLIC_USER"];

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
            chatThreadContainer  : "<div class='ch-thread-cont' >"                                                                           +
                                        "</div>",
            chatRow              : "<div class='ch-row'>"                                                                                  +
                                                    "<div class='ch-avatar'>{{avatar}}</div>"                                                 +
                                                    "<div class='ch-username'>{{username}}</div>"                                             +
                                                    "<div class='ch-msg {{current_usr}}'>{{msg}}</div>"                                       +
                                                "</div>",
            typingInfo           : "<div class='ch-ty-row ty-{{usr}}'>"                                                                    +
                                                    "<div class='ch-type'>{{msg}}</div>"                                                      +
                                                "</div>",
            userLeftNot          : "<div class='ch-user-left-row ty-{{usr}}'>"                                                             +
                                                    "<div class='ch-left'>{{msg}}</div>"                                                      +
                                                "</div>",
            userJoinNot          : "<div class='ch-user-join-row ty-{{usr}}'>"                                                             +
                                                    "<div class='ch-join'>{{msg}}</div>"                                                      +
                                                "</div>",
            loginOverlay         : "<div class='ch ch-login'>"                                                                             +
                                                    "<div class='form'>"                                                                      +
                                                        "<h3 class='title'>{{lang.chatname}}</h3>"                                            +
                                                        "<input class='username' type='text' />"                                              +
                                                    "</div>"                                                                                  +
                                                "</div>",
            chatInput            : "<div class='ch-input-cont'>"                                                                           +
                                                    "<textarea class='ch-input' placeholder='{{lang.textareaPlaceholder}}'></textarea>"       +
                                                "<div>",
            buttonTemplate       : "<button class='t-Button t-Button--icon t-Button--iconLeft t-Button--hot btn-invite' type='button'>"       +
                                                    "<span class='t-Icon t-Icon--left fa fa-link' aria-hidden='true'></span>"                 +
                                                    "<span class='t-Button-label'>{{lang.btnLabel}}</span>"                                   +
                                                    "<span class='t-Icon t-Icon--right fa fa-link' aria-hidden='true'></span>"                +
                                                "</button>",
            linkDialog           : "<div class='invite-dialog' style='display:none' title='{{lang.linkDlgtitle}}'>"                           +
                                                    "<input type='text' value='{{link}}'></input>"                                            +
                                                "</div>",
            userList             : "<div class='ch-user-list-wrap'>"                                                                          +
                                        "<h5 class='user-list-title'>{{lang.availableUsers}}</h5>"                                            +
                                        "<nav><ul class='ch-user-list'></ul></nav>"                                                           +
                                       "</div>",
            chatContainer        : "<div class='ch-cont-wrap' style='display:none'>"                                                          +
                                       "</div>",
            userliTemplate       : "<li class='ch-user-avl-{{usr}}'><i class='fa fa-user fa-fw' aria-hidden='true'></i> {{usr}}</li>"
        }
    };

    /**
     * [xDebug PRIVATE function for debug]
     * @param  string   functionName  caller function
     * @param  array    params        caller arguments
     */
    var xDebug = function xDebug(functionName, params){
        x.debug(this.jsName || " - " || functionName, params, this);
    };

    /**
     * [triggerEvent PRIVATE handler fn - trigger apex events]
     * @param String evt - apex event name to trigger
     */
    var triggerEvent = function triggerEvent(evt, evtData) {
        xDebug.call(this, arguments.callee.name, arguments);
        this.options.$itemId.trigger(evt, [evtData]);
        $(this).trigger(evt + "." + this.apexname, [evtData]);
    };

     /**
     * [intervalFlag PRIVATE call passed function repeatedly "fnIntervat", stop only when flagForClear is set to true ]
     * @param  function fnIntervat   function for repeatedly call
     * @param  property flagForClear key prop. on this scope
     * @param  number   timer        timer, def. 200
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

    /**
     * [getMessage PRIVATE get message from apex.lang api, if apex.lang returns text that is the same sa code, return undefined]
     * @param  string code apex.lang.code
     * @return string      translate
     */
    var getMessage = function getMessage(code){
        var ret = apex.lang.getMessage(code);
        if (ret === code) {
            ret = undefined;
        }
        return ret;

    };

    /**
     * [compileTemplate PRIVATE compile template with data/lang]
     * @param  string templateName [template property name options.htmlTemplate ]
     * @param  object data         [object data used for compile]
     * @return object template     [compiled template]
     */
    var compileTemplate = function compileTemplate (templateName, data){
        var template = this.options.htmlTemplate[templateName],
            data;

        if (data.usr !== undefined){
            data.usr = getUserClass.call(this, data.usr);
        }

        template = Handlebars.compile(template);

        data = $.extend({}, data, { "lang": lang });

        template = template(data);
        return template;

    };

    /**
     * [setChatContHeight PRIVATE when ".ch-thread-cont" is visible, set it's heght ]
     */
    var setChatContHeight = function setChatContHeight(){
        var
        el        = this.container
                      .find(".ch-thread-cont"),
        el2       = this.container
                      .find(".ch-user-list-wrap"),
        topParent = this.parent.parent(),
        height;

        xDebug.call(this, arguments.callee.name, arguments);

        if (el.is(":visible") === true) {
            if (topParent.hasClass("t-Body-actionsContent") === true) {
                height = topParent.height() -
                    this.parent.find(".t-Region-header").outerHeight(true) -
                    this.container.find(".ch-input-cont").outerHeight(true);
            } else {
                height = this.parent.find(".t-Region-body").height()
                         - this.container.find(".ch-input-cont").outerHeight(true);
            }
            el2.height(height);
            el.height(height);

            this.isRendered = true;
        }

    };

    /**
     * [addMessageElement PRIVATE add message to .ch-thread-cont]
     * @param string msg  [message]
     * @param string user [username]
     */
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

    /**
     * [rmSimpleLogin PRIVATE remove simple login]
     */
    var rmSimpleLogin = function rmSimpleLogin(){
        this.container.find(".ch-login").remove();
        this.container.find(".ch-cont-wrap").show();
        this.container.find(".ch-input-cont").show();
    };

    /**
     * [getUserClass PRIVATE return username class]
     * @param  {String} usr [username]
     * @return {String}     [classname]
     */
    var getUserClass = function getUserClass(usr){
        var retClass;

        if (jQuery.type(usr) === "string"){
            retClass = usr.replace(new RegExp(" ", 'g'), "_");
        }

        return  retClass;
    }

    /**
     * [typeInfo PRIVATE show type information]
     * @param  string  msg         [message]
     * @param  string  user        [username]
     * @param  string  action      [string "show"/"hide"]
     * @param  integer delayRemove [timer for autoremove]
     */
    var typeInfo = function typeInfo(msg, user, action, delayRemove){
        var userName = user || this.options.currentUser,
            rowtemplate;


        if (action === "show") {

            rowtemplate = compileTemplate.call(
                this,
                "typingInfo", {
                    "msg": userName + " " + msg,
                    "usr": getUserClass.call(this, userName)
                }
            );

            this.container.find(".ch-ty-row.ty-" + getUserClass.call(this, userName)).remove();
            this.container.find(".ch-thread-cont").append(rowtemplate);

        } else {
            this.container.find(".ch-ty-row.ty-" + getUserClass.call(this, userName)).delay(delayRemove).remove();
        }

    };

    /**
     * [userLeftJoin PRIVATE show info. when user "left"/"join" chat room]
     * @param  string  msg         [message]
     * @param  string  user        [username]
     * @param  string  action      [string "LEFT"/"JOIN"]
     */
    var userLeftJoin = function userLeftJoin(msg, user, type){
        var rowTemplate,
            userName = user || this.options.currentUser;

        if (this.options.showLeftNotefication === true && type === "LEFT") {
            rowTemplate = "userLeftNot";
        }
        if (this.options.showJoinNotefication === true && type === "JOIN") {
            rowTemplate = "userJoinNot";
        }

        if (rowTemplate !== undefined) {

            rowTemplate = compileTemplate.call(
                this,
                rowTemplate, {
                    "msg": user + " " + msg,
                    "usr": user
                }
            );

            this.container.find(".ch-thread-cont").append(rowTemplate);
        }
    };

    /**
     * [userLeftJoinList PRIVATE show info. when user "left"/"join" chat room]
     * @param  string  msg         [message]
     * @param  string  user        [username]
     * @param  string  action      [string "LEFT"/"JOIN"]
     * @param  number  timer       [timer value for animation]
     * @param  number  timer       [string "BEFORE"/"AFTER"]
     */
    var userLeftJoinList = function userLeftJoinList(user, type, timer, appendPosition){
        var liTemplate, liEl, tim,
            userName = user || this.options.currentUser, userClass = getUserClass.call(this, user);

        if (type === "LEFT") {
            liEl = this.container.find(".ch-user-list-wrap .ch-user-avl-" + userClass)
            liEl.addClass("prep-rm");

            tim = setTimeout(function(){

                liEl.animate({
                    "margin-left":"10000px"
                }, timer, function(){
                    liEl.remove();
                    clearTimeout(tim);
                }.bind(this));

            }.bind(this), timer + 100);

        } else {
            liTemplate = compileTemplate.call(
                    this,
                    "userliTemplate", {
                        "usr": user
                    }
                );

            if (appendPosition === "BEFORE"){
                liEl = this.container
                         .find(".ch-user-list")
                         .prepend(liTemplate)
                         .find(".ch-user-avl-" + userClass);
            } else {
                liEl = this.container
                         .find(".ch-user-list")
                         .append(liTemplate)
                         .find(".ch-user-avl-" + userClass);
            }
            liEl.addClass("prep-add");

            liEl.animate({
                "margin-left":"-10px"
            }, timer, function(){
                $(this).removeClass("prep-add");
            });

        }

    };

    /**
     * [setEvents PRIVATE DOM event mapping]
     */
    var setEvents = function setEvents(){
        var typingTimer,
            typingInterval = 1000,
            typingTimeOut = function() {
                this.socket.emit("stop.typing");
                typeInfo.call(this, "", null, "hide", 0);
            }.bind(this);

        xDebug.call(this, arguments.callee.name, arguments);

        this.container.on("keydown", ".ch-input", function(e) {
            var msg;
            if (e.keyCode === 13) {
                msg = $(e.currentTarget).val();
                $(e.currentTarget).val("");
                addMessageElement.call(this, msg);
                this.socket.emit("new.message", msg);
                this.socket.emit("stop.typing");
                typeInfo.call(this, "", null, "hide", 0);

                return false;

            } else if (e.keyCode === 9) {
                this.socket.emit("stop.typing");
            } else {
                this.socket.emit("typing");
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
                        this.socket.emit("public", { username: this.options.currentUser });
                    } else {
                        this.socket.emit("set.room", { room: this.options.room, username: this.options.currentUser });
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

    /**
     * [setApxItemVal PRIVATE set apex item value on backend]
     * @param string val [value]
     */
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

    };

    /**
     * [setSocketEvents PRIVATE set socket.io event handling]
     */
    var setSocketEvents = function setSocketEvents() {
        xDebug.call(this, arguments.callee.name, arguments);

        this.socket.on("room.name", function(room) {
            xDebug.call(this, arguments.callee.name, arguments);

            if (this.options.room === null && this.options.public === false) {
                this.options.room = room;
                this.options.apxChatRoomUrl = this.options.apxChatRoomUrl.replace("#roomid#", room);
                setInviteButton.call(this);
                setApxItemVal.call(this, room);
            }

        }.bind(this));

        this.socket.on("new.message", function(data) {
            if (this.options.currentUser !== null) {
                typeInfo.call(this, "", data.username, "hide", 0);
                addMessageElement.call(this, data.message, data.username);
            }
        }.bind(this));

        this.socket.on("typing", function(data) {
            if (this.options.currentUser !== null) {
                typeInfo.call(this, lang.userIsTyping, data.username, "show");
            }
        }.bind(this));

        this.socket.on("stop.typing", function(data) {
            if (this.options.currentUser !== null) {
                typeInfo.call(this, "", data.username, "hide", 0);
            }
        }.bind(this));

        this.socket.on("user.joined", function(data) {
            if (this.options.currentUser !== null) {
                userLeftJoin.call(this, lang.notUserJoin, data.username, "JOIN");
                userLeftJoinList.call(this, data.username, "JOIN", 1900, "BEFORE");
            }
        }.bind(this));

        this.socket.on("user.list", function(data) {
            if (this.options.currentUser !== null) {
                var timer  = 1900;
                $.map(data.users, function (user){
                    userLeftJoinList.call(this, user, "JOIN", timer, "AFTER");
                    timer  = timer + 100;
                }.bind(this));
            }
        }.bind(this));

        this.socket.on("user.left", function(data) {
            if (this.options.currentUser !== null) {
                typeInfo.call(this, "", data.username, "hide", 0);
                userLeftJoin.call(this, lang.notUserLeft, data.username, "LEFT");
                userLeftJoinList.call(this, data.username, "LEFT", 1200);
            }
        }.bind(this));

        if (this.options.room !== null) {
            this.options.apxChatRoomUrl = this.options.apxChatRoomUrl.replace("#roomid#", this.options.room);
            setInviteButton.call(this);
            setApxItemVal.call(this, this.options.room);

            if (this.options.currentUser !== null) {
                this.socket.emit("set.room", { room: this.options.room, username: this.options.currentUser });
            }
        }

        if (this.options.public === true) {
            this.socket.emit("public", { username: this.options.currentUser });
            this.options.room = null;
        }

    };

    /**
     * [setDom PRIVATE set DOM]
     */
    var setDom = function setDom(){
        xDebug.call(this, arguments.callee.name, arguments);


        this.container
            .append(compileTemplate.call(
                this,
                "chatContainer", {}
            ));

        this.container
            .find(".ch-cont-wrap")
            .append(compileTemplate.call(
                this,
                "chatThreadContainer", {}
            ));

        this.container
            .find(".ch-cont-wrap")
            .append(compileTemplate.call(
                this,
                "userList", {}
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

    /**
     * [setInviteButton PRIVATE set invite button]
     */
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
        notUserLeft         : getMessage("AXCHAT.USER.LEFT")             || "has left your channel...",
        userIsTyping        : getMessage("AXCHAT.USER.ISTYPING")         || "is typing..", // TODO add to apex message
        availableUsers      : getMessage("AXCHAT.USER.AVAUSERS")         || "Available users on chat" // TODO add to apex message
    }

})(apex.jQuery, apex);
