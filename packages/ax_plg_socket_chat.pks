--------------------------------------------------------
--  DDL for Package AX_PLG_SOCKET_CHAT
--------------------------------------------------------

  CREATE OR REPLACE PACKAGE "AX_PLG_SOCKET_CHAT" as

    function chat_region_render (
        p_region              in apex_plugin.t_region,
        p_plugin              in apex_plugin.t_plugin,
        p_is_printer_friendly in boolean )
   return apex_plugin.t_region_render_result;

end ax_plg_socket_chat;

/
