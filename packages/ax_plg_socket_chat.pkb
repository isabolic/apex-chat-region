--------------------------------------------------------
--  DDL for Package Body AX_PLG_SOCKET_CHAT
--------------------------------------------------------

  CREATE OR REPLACE PACKAGE BODY "AX_PLG_SOCKET_CHAT" as
    gv_playground_host varchar2(100) := 'PLAYGROUND';

    function f_is_playground return boolean
    is
    v_ax_workspace varchar2(200);
    begin
        select apex_util.find_workspace((select apex_application.get_security_group_id from dual))
          into v_ax_workspace
          from dual;

        if  gv_playground_host = v_ax_workspace then
            return true;
        else
            return false;
        end if;
    end f_is_playground;

    procedure res_out(p_clob  clob) is
        v_char varchar2(32000);
        v_clob clob := p_clob;
    begin
        while length(v_clob) > 0 loop
        begin
            if length(v_clob) > 32000 then
                v_char := substr(v_clob,1,32000);
                sys.htp.prn(v_char);
                v_clob:= substr(v_clob, length(v_char) +1);
            else
                v_char := v_clob;
                sys.htp.prn(v_char);
                v_char := '';
                v_clob := '';
            end if;
        end;
        end loop;
    end res_out;

    function esc(p_txt varchar2) return varchar2 is
    begin
      return sys.htf.escape_sc(p_txt);
    end esc;

    function chat_region_render (
        p_region              in apex_plugin.t_region,
        p_plugin              in apex_plugin.t_plugin,
        p_is_printer_friendly in boolean )
    return apex_plugin.t_region_render_result as
     v_reg_rend_res  apex_plugin.t_region_render_result;
     v_region_id     p_region.static_id%type;
     v_exe_code      clob;
     v_config        clob;
     v_url           clob;
     v_socket_server p_plugin.attribute_01%type := p_region.attribute_01;
     v_chat_room_itm p_plugin.attribute_02%type := p_region.attribute_02;
    begin
        -- During plug-in development it's very helpful to have some debug information
        if apex_application.g_debug then
              apex_plugin_util.debug_region(
                p_plugin        => p_plugin,
                p_region        => p_region
              );
        end if;

        if p_region.static_id is null then
           v_region_id := '#' ||  p_region.id;
        else
           v_region_id := '#' ||  p_region.static_id;
        end if;

        if f_is_playground = false then
           apex_javascript.add_library(p_name           => 'socket.io',
                                       p_directory      => p_plugin.file_prefix,
                                       p_version        => NULL,
                                       p_skip_extension => FALSE);

           apex_javascript.add_library(p_name           => 'handlebars-v4.0.5',
                                       p_directory      => p_plugin.file_prefix,
                                       p_version        => NULL,
                                       p_skip_extension => FALSE);

           apex_javascript.add_library(p_name           => 'apex.chat.room',
                                       p_directory      => p_plugin.file_prefix,
                                       p_version        => NULL,
                                       p_skip_extension => FALSE);

           apex_css.add_file (
                    p_name      => 'apex.chat.room',
                    p_directory => p_plugin.file_prefix );
        end if;

        v_url := 'f?p=' || v('APP_ID')      || ':' ||
                           v('APP_PAGE_ID') || ':' ||
                           v('APP_SESSION') ||'::' ||
                           V('DEBUG')       ||'::'
                           || v_chat_room_itm||':#roomid#';

        v_url := apex_util.host_url(p_option => 'SCRIPT') ||
                    apex_util.prepare_url(
                      p_url => v_url
                    );

        apex_json.initialize_clob_output;
        apex_json.open_object;

        apex_json.write('socketServer'   , v_socket_server                );
        apex_json.write('apxRegionId'    , v_region_id                    );
        apex_json.write('currentUser'    , apex_custom_auth.get_user      );
        apex_json.write('apxChatRoomUrl' , v_url                          );
        apex_json.write('ajaxIdentifier' , apex_plugin.get_ajax_identifier);

        if v(v_chat_room_itm) is not null then
          apex_json.write('room'           , v(v_chat_room_itm)     );
        end if;

        apex_json.close_object;
        v_config := apex_json.stringify(apex_json.get_clob_output);
        apex_json.free_output;

        v_exe_code := 'new apex.plugins.apexChat('|| v_config || ');';

        apex_javascript.add_onload_code(
           p_code => v_exe_code
        );

        return v_reg_rend_res;

    end chat_region_render;

    function chat_region_ajax (
      p_region              in apex_plugin.t_region,
      p_plugin              in apex_plugin.t_plugin)
    return apex_plugin.t_region_ajax_result
    is
       v_result        apex_plugin.t_region_ajax_result;
       v_chat_room_itm p_plugin.attribute_02%type := p_region.attribute_02;
       v_config        clob;
       v_room          wwv_flow.g_x01%type := wwv_flow.g_x01;
       v_user          wwv_flow.g_x02%type := wwv_flow.g_x02;
    begin

        apex_util.set_session_state(v_chat_room_itm, v_room);

        apex_json.initialize_clob_output;
        apex_json.open_object;

        apex_json.write('succesful'  , 'true');

        apex_json.close_object;
        v_config := apex_json.stringify(apex_json.get_clob_output);
        apex_json.free_output;

        res_out(v_config);

        return v_result;

    end chat_region_ajax;

end ax_plg_socket_chat;

/
