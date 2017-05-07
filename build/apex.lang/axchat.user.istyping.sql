set define off verify off feedback off
whenever sqlerror exit sql.sqlcode rollback
--------------------------------------------------------------------------------
--
-- ORACLE Application Express (APEX) export file
--
-- You should run the script connected to SQL*Plus as the Oracle user
-- APEX_050000 or as the owner (parsing schema) of the application.
--
-- NOTE: Calls to apex_application_install override the defaults below.
--
--------------------------------------------------------------------------------
begin
wwv_flow_api.import_begin (
 p_version_yyyy_mm_dd=>'2013.01.01'
,p_release=>'5.0.2.00.07'
,p_default_workspace_id=>999999
,p_default_application_id=>100
,p_default_owner=>'PLAYGROUND'
);
end;
/
prompt --application/set_environment
 
prompt APPLICATION 100 - playground
--
-- Application Export:
--   Application:     100
--   Name:            playground
--   Date and Time:   14:49 Sunday May 7, 2017
--   Exported By:     ISABOLIC
--   Flashback:       0
--   Export Type:     Component Export
--   Manifest
--     MESSAGES: AXCHAT.USER.ISTYPING (en)
--   Manifest End
--   Version:         5.0.2.00.07
--   Instance ID:     103888447035966
--

-- C O M P O N E N T    E X P O R T
begin
  wwv_flow_api.g_mode := 'REPLACE';
end;
/
prompt --application/shared_components/globalization/messages/11987940326088420
begin
wwv_flow_api.create_message(
 p_id=>wwv_flow_api.id(11987940326088420)
,p_name=>'AXCHAT.USER.ISTYPING'
,p_message_text=>'is typing..'
,p_is_js_message=>true
);
end;
/
begin
wwv_flow_api.import_end(p_auto_install_sup_obj => nvl(wwv_flow_application_install.get_auto_install_sup_obj, false), p_is_component_import => true);
commit;
end;
/
set verify on feedback on define on
prompt  ...done
