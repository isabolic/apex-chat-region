/**
 * [created by isabolic sabolic.ivan@gmail.com]
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
        socketServer : null,
        apxRegionId  : null,
        currentUser  : null,
        htmlTemplate    : {
                chatRow :"<div class='row'>" +
                         "</div>",
                loginOverlay  : "<div class='ch ch-login'>"                                            +
                                    "<div class='form'>"                                               +
                                        "<h3 class='title'>chatname?</h3>"                             +
                                        "<input class='username' type='text' />"                       +
                                    "</div>"                                                           +
                                "</div>",
                chatInput : "<div class='row ch-input-cont'>"                                          +
                                "<textarea class='ch-input' placeholder='text something'></textarea>"  +
                            "<div>"
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

    var addMessageElement = function addMessageElement (msg){

    };

    var setEvents = function setEvents(){
        xDebug.call(this, arguments.callee.name, arguments);

        this.container.on("keydown", ".ch-input", function(e){
            var msg;
            if (e.keyCode == 13) {
                msg = $(e.currentTarget).val();
                $(e.currentTarget).val("");
                addMessageElement.call(this, msg);
                this.socket.emit("new message", msg);
            }else if(e.keyCode === 9){
                this.socket.emit("stop typing");
            }else{
                this.socket.emit("typing");
            }
        }.bind(this));
    };

    var setSocketEvents = function() {
        xDebug.call(this, arguments.callee.name, arguments);

        this.socket.on("login", function (data) {

        }.bind(this));

        this.socket.on("new message", function (data) {

        }.bind(this));

        this.socket.on("typing", function (data) {

        }.bind(this));

        this.socket.on("stop typing", function (data) {

        }.bind(this));

        this.socket.on("user joined", function (data){

        }.bind(this));

        this.socket.on("user left", function (data){

        }.bind(this));

        this.socket.on("disconnect", function (data) {

        }.bind(this));
    };

    var setDom = function setDom(){
        xDebug.call(this, arguments.callee.name, arguments);

        this.container.append(this.options.htmlTemplate.chatInput);
        setEvents.call(this);
        setSocketEvents.call(this);

        if (this.options.currentUser === null ||
            anonymous_user.indexOf(this.options.currentUser.toUpperCase()) > -1) {
            this.container.append(this.options.htmlTemplate.loginOverlay);
            this.container.find(".ch-input-cont").hide();
        }
    };

    apex.plugins.apexChat = function(opts) {
        this.apexname = "APEX_CHAT";
        this.jsName = "apex.plugins.apexChat";
        this.container = $("<div>",{"class" :"apx-chat-reg"});
        this.options = {};
        this.init  = function(){

            if (window.io === undefined || $.isFunction(io.Socket) === false){
                throw this.jsName || ": requires socket.io (https://github.com/socketio/socket.io)";
            }

            if (window.Handlebars === undefined){
                throw this.jsName || ": requires handlebars.js (http://handlebarsjs.com/)";
            }

            if ($.type(opts) ===  "string"){
                opts = JSON.parse(opts);
            }

            if ($.isPlainObject(opts)) {
                this.options = $.extend(true, {}, this.options, options, opts);
            } else {
                throw this.jsName || ": Invalid options passed.";
            }

            this.socket = io(this.options.socketServer);
            this.parent = $(this.options.apxRegionId);

            if( this.parent.find(".t-Region-body").length > 0){
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

})(apex.jQuery, apex);
