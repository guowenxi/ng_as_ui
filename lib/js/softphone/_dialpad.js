// Dialpad page
define(['jquery', 'common', 'stringres', 'global', 'file'], function($, common, stringres, global, file)
{

var chooseenginetouse = '';
var btn_isvoicemail = false; // if true, then dialpad button (in bottom-left corner) is handled as voicemail
var showfulldialpad = true; // if there are recents, then when searching and we have no results, don't show full dialpad

function onCreate (event) // called only once - bind events here
{
    try{
    common.PutToDebugLog(4, "EVENT, _dialpad: onCreate");
    
// navigation done with js, so target URL will not be displayed in browser statusbar
    $("#nav_dp_contacts").on("click", function()
    {
        $.mobile.changePage("#page_contactslist", { transition: "none", role: "page" });
    });
    $("#nav_dp_callhistory").on("click", function()
    {
        $.mobile.changePage("#page_callhistorylist", { transition: "none", role: "page" });
    });
    
    $("#nav_dp_dialpad").attr("title", stringres.get("hint_dialpad"));
    $("#nav_dp_contacts").attr("title", stringres.get("hint_contacts"));
    $("#nav_dp_callhistory").attr("title", stringres.get("hint_callhistory"));
    
    $("#status_dialpad").attr("title", stringres.get("hint_status"));
    $("#curr_user_dialpad").attr("title", stringres.get("hint_curr_user"));
    $(".img_encrypt").attr("title", stringres.get("hint_encicon"));
    $("#dialpad_not_btn").on("click", function()
    {
        common.SaveParameter('notification_count2', 0);
        common.ShowNotifications2(); // repopulate notifications (hide red dot number)
    });
    
    $("#phone_number").attr("title", stringres.get("hint_phone_number"));
    
    $("#phone_number").on('input', function() // input text on change listener
    {
        PhoneInputOnChange();
    });

    $("#btn_showhide_numpad").on("click", function()
    {
        try{
        if (btn_isvoicemail)
        {
            MenuVoicemail();
        }else
        {
            if ($('#dialpad_btn_grid').css('display') === 'none')
            {
                $('#dialpad_btn_grid').show();
            }else
            {
                $('#dialpad_btn_grid').hide();
            }

            MeasureDialPad();
        }
        
        } catch(err2) { common.PutToDebugLogException(2, "_dialpad: btn_showhide_numpad on click", err2); }
    });
    $("#btn_showhide_numpad").attr("title", stringres.get("hint_numpad"));
    
    $('#dialpad_list').on('click', '.ch_anchor', function(event)
    {
        OnListItemClick($(this).attr('id'));
    });

    $('#dialpad_list').on('taphold', '.ch_anchor', function(event) // also show context menu
    {
        var id = $(this).attr('id');
        if (!common.isNull(id))
        {
            id = id.replace('recentitem_', 'recentmenu_');
            OnListItemClick(id);
        }
    });

    $('#dialpad_list').on('click', '.ch_menu', function(event)
    {
        OnListItemClick($(this).attr('id'));
    });

    
    $("#btn_voicemail").on("click", function()
    {
        try{
        if (common.GetParameterInt('voicemail', 2) !== 2)
        {
            QuickCall();
        }else
        {
            var vmNumber = common.GetParameter("voicemailnum");

            if (!common.isNull(vmNumber) && vmNumber.length > 0)
            {
                StartCall(vmNumber);
            }else
            {
                SetVoiceMailNumber(function (vmnr)
                {
                    if (!common.isNull(vmnr) && vmnr.length > 0) { StartCall(vmnr); }
                });
            }
        }
        } catch(err2) { common.PutToDebugLogException(2, "_dialpad: btn_voicemail on click", err2); }
    });
    $("#btn_voicemail").attr("title", stringres.get("hint_voicemail"));
    
    var trigerred = false; // handle multiple clicks
    $("#btn_call").on("click", function()
    {
        common.PutToDebugLog(4, 'EVENT, dialpad call button clicked');
        if (trigerred) { return; }
    
        trigerred = true;
        setTimeout(function ()
        {
            trigerred = false;
        }, 1000);
    
        // tunnel should not allow call without server address set (direct call to sip uri)
        if (common.GetParameter('serverinputisupperserver') === 'true')
        {
            if (common.isNull(common.GetParameter('sipusername')) || common.GetParameter('sipusername').length <= 0
                || common.isNull(common.GetParameter('password')) || common.GetParameter('password').length <= 0 )
//                || common.isNull(common.GetParameter('upperserver')) || common.GetParameter('upperserver').length <= 0)
            {
                return;
            }
        }
 
        var field = document.getElementById('phone_number');
        if ( common.isNull(field) ) { return; }
        
        var phoneNumber = field.value;
        var lastDialed = common.GetParameter("redial");

        if (common.isNull(phoneNumber) || phoneNumber.length < 1)
        {
            if (!common.isNull(lastDialed) && lastDialed.length > 0)
            {
                field.value = lastDialed;
            }else
            {
                common.PutToDebugLog(1, stringres.get('err_msg_3'));
                return;
            }
        }else
        {
            phoneNumber = common.Trim(phoneNumber);
            StartCall(phoneNumber);
            common.SaveParameter("redial", phoneNumber);
            $('#disprate_container').html('&nbsp;');
        }
    });
    
    $("#btn_call").attr("title", stringres.get("hint_btn_call"));

    // listen for enter onclick, and click Call button
    $( "#page_dialpad" ).keypress(function( event )
    {        
        HandleKeyPress(event);
    });

    // listen for control key, so we don't catch ctrl+c, ctrl+v
    $( "#page_dialpad" ).keydown(function(event)
    {
        try{
        var charCode = (event.keyCode) ? event.keyCode : event.which; // workaround for firefox
        
        if (charCode == ctrlKey) { ctrlDown = true; return true; }
        if (charCode == altKey) { altDown = true; return true; }
        if (charCode == shiftKey) { shiftDown = true; return true; }
        if (event.ctrlKey || event.metaKey || event.altKey) { specialKeyDown = true; return true; }

        if ( charCode === 8) // backspace
        {
    //        event.preventDefault();
            if ($('#phone_number').is(':focus') === false)
            {
                BackSpaceClick();
            }
        }
        else if ( charCode === 13)
        {
    //        event.preventDefault();
            $("#btn_call").click();
        }
        } catch(err) { common.PutToDebugLogException(2, "_dialpad: keydown", err); }

    })/*.keyup(function(event)
    {
        try{
        var charCode = (event.keyCode) ? event.keyCode : event.which; // workaround for firefox

        if (charCode == ctrlKey) { ctrlDown = false; }
        if (charCode == altKey) { altDown = false; }
        if (charCode == shiftKey) { shiftDown = false; }
        if (event.ctrlKey || event.metaKey || event.altKey) { specialKeyDown = false; }
        
        return false;
        } catch(err) { common.PutToDebugLogException(2, "_dialpad: keyup", err); }
    });*/

    $("#btn_message").on("click", function()
    {
        if (common.GetConfigInt('brandid', -1) === 60) // 101VOICEDT500
        {
            MenuVoicemail();
        }else
        {
            MsgOnClick();
        }
    });
    $("#btn_message").attr("title", stringres.get("hint_message"));
    
    if (common.GetConfigInt('brandid', -1) === 60) // 101VOICEDT500
    {
        $("#btn_message_img").attr("src", '' + common.GetElementSource() + 'images/btn_voicemail_txt_big.png');
        $("#btn_message").attr("title", stringres.get("hint_voicemail"));
    }
    /* !!! DEPRECATED
    $("#dialpad_notification").on("click", function()
    {
        common.NotificationOnClick();
    });*/    

    $('#dialpad_notification_list').on('click', '.nt_anchor', function(event)
    {
        $("#dialpad_not").panel( "close" );
        common.NotificationOnClick2($(this).attr('id'), false);
    });
    $('#dialpad_notification_list').on('click', '.nt_menu', function(event)
    {
        $("#dialpad_not").panel( "close" );
        common.NotificationOnClick2($(this).attr('id'), true);
    });
    
    $( window ).resize(function() // window resize handling
    {
        if ($.mobile.activePage.attr('id') === 'page_dialpad')
        {
            MeasureDialPad();
        }
    });
    
    $('#dialpad_menu_ul').on('click', 'li', function(event)
    {
        MenuItemSelected($(this).attr('id'));
    });
    $("#btn_dialpad_menu").on("click", function() { CreateOptionsMenu('#dialpad_menu_ul'); });
    $("#btn_dialpad_menu").attr("title", stringres.get("hint_menu"));
    
    setTimeout(function ()
    {
        var displaypopup = false;
        if (common.GetParameterBool('customizedversion', true) !== true && common.GetParameter('displaypopupdirectcalls') === 'true')
        {
        // in this case we have to watch 'upperserver', NOT 'serveraddress_user'
            /*if (common.GetParameter('serverinputisupperserver') === 'true')
            {*/
                if ( common.isNull(common.GetParameter('sipusername')) || common.GetParameter('sipusername').length <= 0
                    || common.isNull(common.GetParameter('password')) || common.GetParameter('password').length <= 0/*
                    || common.isNull(common.GetParameter('upperserver')) || common.GetParameter('upperserver').length <= 0)*/ )
                {
                    displaypopup = true;
                }
            /*}else
            {
                if ((common.isNull(common.GetParameter('sipusername')) || common.GetParameter('sipusername').length <= 0
                    || common.isNull(common.GetParameter('password')) || common.GetParameter('password').length <= 0))
                {
                    if ((common.isNull(common.GetParameter('serveraddress_user')) || common.GetParameter('serveraddress_user').length <= 0)
                            && (common.isNull(common.GetParameter('serveraddress_orig')) || common.GetParameter('serveraddress_orig').length <= 0)
                            && (common.isNull(common.GetParameter('serveraddress')) || common.GetParameter('serveraddress').length <= 0))
                    {
                        displaypopup = true;
                    }
                }
            }*/
        }
        
        if (displaypopup)
        {
            common.SaveParameter('displaypopupdirectcalls', 'false');
            //common.AlertDialog(stringres.get('warning'), stringres.get('warning_msg_1'));
            common.ShowToast(stringres.get('warning_msg_1'), 6000);
        }
    },3000);
    
    $("#btn_dp_1").on("tap", function()
    {
        PutNumber('1');

/*
webphone_api.getsipheader('Expires', function (val) { console.log('getsipheaderresponse 1 : ' + val); });
webphone_api.getsipheader('Contact', function (val) { console.log('getsipheaderresponse 2 : ' + val); });
webphone_api.getsipheader('Expires', function (val) { console.log('getsipheaderresponse 3 : ' + val); });
webphone_api.getsipheader('Contact', function (val) { console.log('getsipheaderresponse 4 : ' + val); });
webphone_api.getsipheader('Expires', function (val) { console.log('getsipheaderresponse 5 : ' + val); });
webphone_api.getsipheader('Contact', function (val) { console.log('getsipheaderresponse 6 : ' + val); });
webphone_api.getsipheader('Expires', function (val) { console.log('getsipheaderresponse 7 : ' + val); });
webphone_api.getsipheader('Contact', function (val) { console.log('getsipheaderresponse 8 : ' + val); });
webphone_api.getsipheader('Expires', function (val) { console.log('getsipheaderresponse 9 : ' + val); });
webphone_api.getsipheader('Contact', function (val) { console.log('getsipheaderresponse 10 : ' + val); });
webphone_api.getsipheader('Expires', function (val) { console.log('getsipheaderresponse 11: ' + val); });
webphone_api.getsipheader('Contact', function (val) { console.log('getsipheaderresponse 12 : ' + val); });
*/
        if (global.isdebugversionakos)
        {
            //common.UriParser(common.GetParameter('creditrequest'), '', '', '', '', 'creditrequest');
            
            //var balanceuri = 'http://88.150.183.87:80/mvapireq/?apientry=balance&authkey=1568108345&authid=9999&authmd5=760e4155f1f1c8e614664e20fff73290&authsalt=123456&now=415';
            //common.UriParser(balanceuri, '', '', '', '', 'creditrequest');
        }
    });
    $("#btn_dp_2").on("tap", function()
    {
        PutNumber('2');
    });
    $("#btn_dp_3").on("tap", function()
    {
        PutNumber('3');
    });
    $("#btn_dp_4").on("tap", function()
    {
        PutNumber('4');
    });
    $("#btn_dp_5").on("tap", function()
    {
        PutNumber('5');
    });
    $("#btn_dp_6").on("tap", function()
    {
        PutNumber('6');
    });
    $("#btn_dp_7").on("tap", function()
    {
        PutNumber('7');
    });
    $("#btn_dp_8").on("tap", function()
    {
        PutNumber('8');
    });
    $("#btn_dp_9").on("tap", function()
    {
        PutNumber('9');
    });
    $("#btn_dp_0").on("tap", function(evt)
    {
        PutNumber('0');
    });
    $("#btn_dp_ast").on("tap", function()
    {
        PutNumber('*');
    });
    $("#btn_dp_diez").on("tap", function()
    {
        PutNumber('#');
    });
    
// long cliks
    $("#btn_dp_0").on("taphold", function(evt)
    {
        PutCharLongpress(['+']);
    });

    
    $("#btn_backspace").on("click", function()
    {
        BackSpaceClick();
    });
    
    $("#btn_backspace").on("taphold", function()
    {
        if (!common.isNull( document.getElementById('phone_number') ))
        {
            document.getElementById('phone_number').value = '';
        }
        
        PhoneInputOnChange();
    });
    if (common.GetColortheme() === 11)
    {
        $("#btn_backspace_img").attr("src","' + common.GetElementSource() + 'images/btn_backspace_txt_grey.png");
    }
    
    
    setTimeout(function ()
    {
        common.GetContacts(function (success)
        {
            if (!success)
            {
                common.PutToDebugLog(2, 'EVENT, _dialpad: LoadContacts failed onCreate');
            }
        });
    }, 500);
    
    setTimeout(function ()
    {
        common.ReadCallhistoryFile(function (success)
        {
            if (!success)
            {
                common.PutToDebugLog(2, 'EVENT, _dialpad: load call history failed onCreate');
            }
        });
    }, 1000);
    
    var advuri = common.GetParameter('advertisement');
    if (!common.isNull(advuri) && advuri.length > 5)
    {
        $('#advert_dialpad_frame').attr('src', advuri);
        $('#advert_dialpad').show();
    }
    
    if (common.UsePresence2() === true)
    {
        $("#dialpad_additional_header_left").on("click", function()
        {
            common.PresenceSelector();
        });
        $("#dialpad_additional_header_left").css("cursor", "pointer");
    }

// showratewhiletype = 0; // show rating on dialpad page, while typing the destination number  // 0=no, 1=yes
    var srateStr = common.GetConfig('showratewhiletype');
    if (common.isNull(srateStr) || srateStr.length < 1 || !common.IsNumber(srateStr)) { srateStr = common.GetParameter2('showratewhiletype'); }
    if (common.isNull(srateStr) || srateStr.length < 1 || !common.IsNumber(srateStr)) { srateStr = '0'; }
    global.showratewhiletype_cache = common.StrToInt(srateStr);
    
    if (global.showratewhiletype_cache > 0 && !common.isNull(document.getElementById("disprate_container")) && common.GetParameter('ratingrequest').length > 0)
    {
        document.getElementById("disprate_container").style.display = 'block';
    }

    
    // in IE8 under WinXP aterisk is not displayed properly
    /*if (common.IsIeVersion(8))
    {
        $("#dialpad_asterisk").html("*");
    }*/
    
    $("#btn_dialpad_engine_close").on("click", function(event)
    {
        common.SaveParameter('ignoreengineselect', 'true');

        $('#settings_engine').hide();
        $('#dialpad_engine').hide();
        
        MeasureDialPad();
    });
    
    $("#btn_dialpad_engine").on("click", function(event)
    {
        common.SaveParameter('ignoreengineselect', 'true');

        $('#settings_engine').hide();
        $('#dialpad_engine').hide();
        
        if (common.isNull(chooseenginetouse) || chooseenginetouse.length < 1) { return; }
        MeasureDialPad();
        
// handle click action based on selected engine
        if (chooseenginetouse === 'java'){ ; }
        else if (chooseenginetouse === 'webrtc') { common.EngineSelect(1); }
        else if (chooseenginetouse === 'ns') { common.NPDownloadAndInstall(); }
        else if (chooseenginetouse === 'flash')
        {
            ; // akos todo: implement for flash
        }
        else if (chooseenginetouse === 'app')
        {
            ;
        }

// save clicked engine
        var engine = common.GetEngine(chooseenginetouse);
        if (!common.isNull(engine))
        {
            engine.clicked = 2;
            common.SetEngine(chooseenginetouse, engine);
            
            common.OpenSettings(true);
            
            // wait for settings to launch
            setTimeout(function ()
            {
                common.ShowToast(common.GetEngineDisplayName(chooseenginetouse) + ' ' + stringres.get('ce_use'), function ()
                {
                    common.ChooseEngineLogic2(chooseenginetouse);
                    chooseenginetouse = '';
                });
            }, 400);
        }
    });
        
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: onCreate", err); }
}

function PutNumber(val)
{
    try{
    var nrfield = document.getElementById('phone_number');
    
    if ($('#phone_number').is(':focus')) // don't write any characters, if input is focused
    {
        return;
    }
    
    if ( common.isNull(nrfield) ) { return; }
    
    if ( common.isNull(nrfield.value) ) { nrfield.value = ''; }
    
    nrfield.value = nrfield.value + val;
    
    var nrval = nrfield.value;
    if (common.isNull(nrval)) { nrval = ''; }
    nrval = common.ReplaceAll(nrval, '+', '');
    nrval = common.ReplaceAll(nrval, '*', '');
    nrval = common.ReplaceAll(nrval, '#', '');
    if (!common.isNull(val) && common.IsNumber(val) && common.IsNumber(nrval))
    {
        common.PlayDtmfSound(val);
    }
    
    issearch = false;
    PhoneInputOnChange();
    
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: PutNumber", err); }
}

function PutCharLongpress(carr) // handle dialpad long press (taphold)
{
    try{
    var nrfield = document.getElementById('phone_number');
    if ( common.isNull(nrfield) ) { return; }
    
    if ( common.isNull(nrfield.value) ) { nrfield.value = ''; }
    if (common.isNull(carr) || carr.length < 1) { return; }
    
    if (carr.length === 1)
    {
        nrfield.value = nrfield.value + carr[0];
        return;
    }
//    !!! NOT IMPLEMENTED YET
// show popup with letter options, just like in android
    //...
    issearch = false;
    PhoneInputOnChange();
    
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: PutCharLongpress", err); }
}

var showratewhiletype_minlenth = -1;
var showratewhiletype_maxlenth = -1;
var issearch = true;
function PhoneInputOnChange()
{
    try{
    var field = document.getElementById('phone_number');
    var nrval = '';
    
    if (common.isNull(field) || common.isNull(field.value))
    {
        return;
    }
    
    nrval = field.value;
    
    if (nrval.length > 0)
    {
        $("#btn_backspace").show();
    }else
    {
        $("#btn_backspace").hide();
        issearch = true;
    }
    
    nrval = common.Trim(nrval);
    
    var dialpadvisible = false;
    if ($('#dialpad_btn_grid').is(':visible'))
    {
        dialpadvisible = true;
    }
    
    if (issearch && nrval.length > 0 && !common.isNull(global.ctlist) && global.ctlist.length > 0)
    {
        PopulateListContacts(nrval);
    }else
    {
        PopulateListRecents();
    }
    
    if (dialpadvisible) // if dialpad was visible, then dn't hide it after PopulateList
    {
        $('#dialpad_btn_grid').show();
        MeasureDialPad();
    }
    
// showratewhiletype = 0; // show rating on dialpad page, while typing the destination number  // 0=no, 1=yes
    if (global.showratewhiletype_cache > 0 && common.GetParameter('ratingrequest').length > 0)
    {
        if (showratewhiletype_minlenth < 0)
        {
            var srmin = common.GetParameter2('showratewhiletype_minlenth');
            if (!common.isNull(srmin) && common.IsNumber(srmin))
            {
                showratewhiletype_minlenth = common.StrToInt(srmin);
            }else
            {
                showratewhiletype_minlenth = 3;
            }
            var srmax = common.GetParameter2('showratewhiletype_maxlenth');
            if (!common.isNull(srmax) && common.IsNumber(srmax))
            {
                showratewhiletype_maxlenth = common.StrToInt(srmax);
            }else
            {
                showratewhiletype_maxlenth = 6;
            }
        }
        
        if (nrval.length >= showratewhiletype_minlenth && nrval.length <= showratewhiletype_maxlenth)
        {
            common.UriParser(common.GetParameter('ratingrequest'), '', nrval, '', '', 'getrating');
//            var datain = '{"data":{"0":{"prefix":"4075","voice_rate":"0.30","description":"ROMANIA - MOBILE ORANGE"},"currency":"USD","currency_sign":"$"},"error":""}';
//            common.HttpResponseHandler(datain, 'getrating');
        }else
        {
            $('#disprate_container').html('&nbsp;');
        }
    }
    
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: PhoneInputOnChange", err); }
}

function BackSpaceClick()
{
    try{
    var field = document.getElementById('phone_number');

    if ( common.isNull(field) || common.isNull(field.value) || field.value.length < 1 ) { return; }

    field.value = (field.value).substring(0, field.value.length - 1);

    PhoneInputOnChange();
    
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: BackSpaceClick", err); }
}

var ctrlDown = false;
var altDown = false;
var shiftDown = false;
var specialKeyDown = false;
var ctrlKey = 17, vKey = 86, cKey = 67, altKey = 18, shiftKey = 16;
function HandleKeyPress(event)
{
    try{
// don't catch input if a popup is open, because popups can have input boxes, and we won't be able to write into them
    if ($(".ui-page-active .ui-popup-active").length > 0)
    {
         return false;
    }
    
    var charCode = (event.keyCode) ? event.keyCode : event.which; // workaround for firefox

    // listen for control key, so we don't catch ctrl+c, ctrl+v
    if (ctrlDown || altDown || shiftDown || specialKeyDown || charCode === 8)
    {
        return false;
    }
    /*
    if ( charCode === 8) // backspace
    {
//        event.preventDefault();
        BackSpaceClick();
    }
    else if ( charCode === 13)
    {
//        event.preventDefault();
        $("#btn_call").click();
    }else
    {*/
//        event.preventDefault();
        PutNumber(String.fromCharCode(charCode));
/*    }*/

    return false;
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: HandleKeyPress", err); }
}
        
function StartCall(number, isvideo)
{
    try{
    if (common.isNull(number) || number.length < 1)
    {
        common.PutToDebugLog(2, "EVENT, _dialpad: StartCall number is NULL");
        return;
    }
    
    number = common.NormalizeNumber(number);
    
    if (isvideo === true)
    {
        common.PutToDebugLog(4, 'EVENT, _dialpad initiate video call to: ' + number);
        webphone_api.videocall(number);
    }else
    {
        common.PutToDebugLog(4, 'EVENT, _dialpad initiate call to: ' + number);
        webphone_api.call(number, -1);
    }

//    $.mobile.changePage("#page_call", { transition: "pop", role: "page" });
        
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: StartCall", err); }
}

function QuickCall()
{
    try{
    var popupWidth = common.GetDeviceWidth();
    if ( !common.isNull(popupWidth) && common.IsNumber(popupWidth) && popupWidth > 100 )
    {
        popupWidth = Math.floor(popupWidth / 1.2);
    }else
    {
        popupWidth = 220;
    }
    
    var template = '' +
'<div id="quickcall_popup" data-role="popup" class="ui-content messagePopup" data-overlay-theme="a" data-theme="a" style="max-width:' + popupWidth + 'px;">' +

    '<div data-role="header" data-theme="b">' +
        '<a href="javascript:;" data-role="button" data-icon="delete" data-iconpos="notext" class="ui-btn-right closePopup">Close</a>' +
        '<h1 class="adialog_title">' + stringres.get('quickcall_title') + '</h1>' +
    '</div>' +
    '<div role="main" class="ui-content adialog_content">' +
        '<span>' + stringres.get('quickcall_msg') + '</span>' +
        '<input type="text" id="quickcall_input" name="setting_item" data-theme="a"/>' +
    '</div>' +
    '<div data-role="footer" data-theme="b" class="adialog_footer">' +
        '<a href="javascript:;" id="adialog_positive" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b adialog_2button" data-rel="back" data-transition="flow">' + stringres.get('btn_quickcall') + '</a>' +
        '<a href="javascript:;" id="adialog_negative" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b adialog_2button" data-rel="back">' + stringres.get('btn_cancel') + '</a>' +
    '</div>' +
'</div>';

    var popupafterclose = function () {};

    $.mobile.activePage.append(template).trigger("create");
    //$.mobile.activePage.append(template).trigger("pagecreate");

    $.mobile.activePage.find(".closePopup").bind("tap", function (e)
    {
        $.mobile.activePage.find(".messagePopup").popup("close");
    });

    $.mobile.activePage.find(".messagePopup").popup().popup("open").bind(
    {
        popupafterclose: function ()
        {
            $(this).unbind("popupafterclose").remove();
            $('#adialog_positive').off('click');
            $('#adialog_negative').off('click');
            popupafterclose();
        }
    });

    var textBox = document.getElementById('quickcall_input');

    if (!common.isNull(textBox)) { textBox.focus(); } // setting cursor to text input

    $('#adialog_positive').on('click', function (event)
    {
        $( '#quickcall_popup' ).on( 'popupafterclose', function( event )
        {
            common.PutToDebugLog(5,"EVENT, _dialpad SetVoiceMailNumber OK click");

            var qnr = '';
            if (!common.isNull(textBox)) { qnr = textBox.value; }

            if (!common.isNull(qnr) && qnr.length > 0)
            {
                qnr = common.Trim(qnr);

                if (qnr.length > 0)
                {
                    StartCall(qnr);
                }
            }
        });
    });
    
    
    
    
    
    /*
    $.mobile.activePage.find(".messagePopup").popup().popup("open").bind(
    {
        popupafterclose: function ()
        {
            $(this).unbind("popupafterclose").remove();
            
            $('#log_window_ul').off('click', 'li');
            
            popupafterclose();
        }
    });
    
    $('#log_window_ul').on('click', 'li', function(event)
    {
        var itemid = $(this).attr('id');

        $( '#quickcall_popup' ).on( 'popupafterclose', function( event )
        {*/
    
    
    
    
    

    $('#adialog_negative').on('click', function (event)
    {
        ;
    });
        
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: QuickCall", err); }
}

function onStart(event)
{
    try{
    common.PutToDebugLog(4, "EVENT, _dialpad: onStart");
    
    if (global.pagewasrefreshed === true)
    {
        common.PutToDebugLog(4, "EVENT, _dialpad: onStart page refresh detected, go back to settings page");
        common.OpenSettings(false);
        return;
    }
    
    if (!common.isNull(document.getElementById('status_dialpad')) && global.dploadingdisplayed === false)
    {
        global.dploadingdisplayed = true;
        document.getElementById('status_dialpad').innerHTML = stringres.get('loading');
    }
    
    global.isDialpadStarted = true;
    
    common.HideModalLoader();
    
//    setTimeout(function );

//!!DEPERECATED 
    //ShowNativePluginOption();
/* THIS TYPE OF HEADER NOTIFICATION IS NOT NEEDED ON DIALPAD -> check push level comments
    common.ShowEngineOptionOnPage(function (msg, enginetouse)
    {
        if (common.isNull(msg) || msg.length < 1 || common.isNull(enginetouse) || enginetouse.length < 1) { return; }
        if (enginetouse !== 'java' && enginetouse !== 'webrtc' && enginetouse !== 'ns' && enginetouse !== 'flash' && enginetouse !== 'app')
        {
            return;
        }
        
        $('#dialpad_engine').show();
        $('#dialpad_engine_title').html(stringres.get('choose_engine_title'));
        $('#dialpad_engine_msg').html(msg);
        
        if (enginetouse === 'java')
        {
            var javainstalled = common.IsJavaInstalled(); // 0=no, 1=installed, but not enabled in browser, 2=installed and enabled

            if (javainstalled === 0)
            {                
                $('#btn_dialpad_engine').attr('href', global.INSTALL_JAVA_URL);
            }
            else if (javainstalled === 1)
            {
                if (common.GetBrowser() === 'MSIE') // can't detect if installed or just not allowed
                {
                    $('#btn_dialpad_engine').attr('href', global.INSTALL_JAVA_URL);
                }else
                {
                    $('#btn_dialpad_engine').attr('href', global.ENABLE_JAVA_URL);
                }
            }
        }
        else if (enginetouse === 'webrtc')
        {
            ;
        }
        else if (enginetouse === 'ns')
        {
            $('#btn_dialpad_engine').attr('href', common.GetNPLocation());
        }
        else if (enginetouse === 'flash')
        {
            ; // akos todo: implement for flash
        }
        else if (enginetouse === 'app')
        {
            ;
        }
        
        chooseenginetouse = enginetouse;
        
        MeasureDialPad();
    });*/

    $("#phone_number").attr("placeholder", stringres.get("phone_nr"));
    if (common.GetConfigInt('brandid', -1) === 50) // favafone
    {
        $("#phone_number").attr("placeholder", stringres.get("phone_nr2"));
    }
    $("#btn_backspace").hide();
    $('#disprate_container').html('&nbsp;');
    
    if (!common.isNull(document.getElementById("app_name_dialpad"))
        && common.GetParameter('devicetype') !== common.DEVICE_WIN_SOFTPHONE())
    {
        document.getElementById("app_name_dialpad").innerHTML = common.GetBrandName();
    }
    
    if (!common.isNull(document.getElementById('dialpad_title')))
    {
        document.getElementById('dialpad_title').innerHTML = stringres.get('dialpad_title');
    }
    $("#dialpad_title").attr("title", stringres.get("hint_page"));
    
    var curruser = common.GetParameter('sipusername');
    if (!common.isNull(curruser) && curruser.length > 0) { $('#curr_user_dialpad').html(curruser); }
// set status width so it's uses all space to curr_user
    var statwidth = common.GetDeviceWidth() - $('#curr_user_dialpad').width() - 25;
    if (!common.isNull(statwidth) && common.IsNumber(statwidth))
    {
        $('#status_dialpad').width(statwidth);
    }
    
//autoprov: if no voicemail - then fast call: text input number to call
    if (common.GetParameterInt('voicemail', 2) !== 2)
    {
        $('#btn_voicemail_img').attr('src', '' + common.GetElementSource() + 'images/btn_call_quick_txt.png');
        $("#btn_voicemail").attr("title", stringres.get("hint_quickcall"));
    }else
    {
        $('#btn_voicemail_img').attr('src', '' + common.GetElementSource() + 'images/btn_voicemail_txt.png');
        $("#btn_voicemail").attr("title", stringres.get("hint_voicemail"));
    }
    
    if ((common.GetParameter('header')).length > 2)
    {
        $('#headertext_settings').show();
        $('#headertext_settings').html(common.GetParameter('header'));
    }else
    {
        $('#headertext_settings').hide();
    }
    if ((common.GetParameter('footer')).length > 2)
    {
        $('#footertext_dialpad').show();
        $('#footertext_dialpad').html(common.GetParameter('footer'));
    }else
    {
        $('#footertext_dialpad').hide();
    }
    
    if (common.GetConfigInt('brandid', -1) === 50) // Favafone
    {
        $("#btn_message_img").attr("src", '' + common.GetElementSource() + 'images/icon_recharge_dollar.png');
    }
    

    setTimeout(function ()
    {
        common.CanShowLicKeyInput();
    }, 3500);
    
    common.CheckInternetConnection();
    common.ShowNotifications2();
    GetCallhistory();
    
// handle hidesettings
    if (common.HideSettings('chat', stringres.get('sett_display_name_' + 'chat'), 'chat', true) === true && common.GetConfigInt('brandid', -1) !== 60) // 101VOICEDT500
    {
        $('#btn_message button').hide();
    }
    if (common.HideSettings('voicemail', stringres.get('sett_display_name_' + 'voicemail'), 'voicemail', true) === true)
    {
        if (btn_isvoicemail === true)
        {
            $('#btn_showhide_numpad button').hide();
        }else
        {
            $('#btn_showhide_numpad button').show();
        }
    }
    
    MeasureDialPad();
    
    setTimeout(function ()
    {
    //    if (!global.isdebugversionakos) { common.StartPresence2(); }
        common.StartPresence2();
    }, 2500);
    
    if (common.IsIeVersion(10)) { $("#dialpad_list").children().css('line-height', 'normal'); }
    if (common.IsIeVersion(10)) { $("#dialpad_notification_list").children().css('line-height', 'normal'); }
    $("#dialpad_notification_list").height(common.GetDeviceHeight() - 55);
    
    common.ShowOfferSaveContact();
    HandleAutoaction();
    
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: onStart", err); }
}

function GetCallhistory()
{
    try{
    if ((common.isNull(global.chlist) || global.chlist.length < 1) && global.readcallhistoryforrecents)
    {
        common.ReadCallhistoryFile(function (success)
        {
            if (!success)
            {
                common.PutToDebugLog(2, 'EVENT, _dialpad: load call history failed (2) GetCallhistory');
            }
            
            PopulateListRecents();
        });

//also read contacts in background
        setTimeout(function ()
        {
            common.GetContacts(function (success)
            {
                if (!success)
                {
                    common.PutToDebugLog(2, 'EVENT, _dialpad: LoadContacts failed GetCallhistory');
                }
            });
        }, 1000);
    }
    
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: GetCallhistory", err); }

    PopulateListRecents();
}

var month = new Array();
month[0] = 'Jan';
month[1] = 'Feb';
month[2] = 'Mar';
month[3] = 'Apr';
month[4] = 'May';
month[5] = 'Jun';
month[6] = 'Jul';
month[7] = 'Aug';
month[8] = 'Sep';
month[9] = 'Oct';
month[10] = 'Nov';
month[11] = 'Dec';

// points for recents list
var LAST_CALLED = 1200;
var IS_ONLINE = 100;
var LAST_HOUR = 70;
var LAST_5HOURS = 50;
var LAST_DAY = 40;
var LAST_WEEK = 30;
var LAST_MONTH = 20;
var LAST_3MONTHS = 10;
var LAST_YEAR = 3;
var OUTGOING_CALL = 10;
var IS_CONTACT = 5; // if can be found in contacts list
var FAVORITE = 1.4; // multiply by
var IS_BLOCKED = 10; // divide by this value

function GetRecents()
{
    var enablepres = false;
    var presencequery = '';
    try{
    if (common.isNull(global.chlist) || global.chlist.length < 1 || (global.refreshrecents === false && global.recentlist.length > 0))
    {
        return;
    }
    
    if (common.UsePresence2() === true)
    {
        enablepres = true;
    }
    
    var chtmp = [];
    var rectmp = [];
    
    if (global.chlist.length > 500)
    {
        chtmp = global.chlist.slice(0, 499);
    }else
    {
        chtmp = global.chlist;
    }
    
    if (common.isNull(chtmp) || chtmp.length < 1)
    {
        common.PutToDebugLog(2, 'ERROR, _dialpad: GetRecents list is NULL');
        return;
    }
    
    var now = common.GetTickCount();
    
    for (var i = 0; i < chtmp.length; i++)
    {
        if (common.isNull(chtmp[i])) { continue; }
        
        var item = chtmp[i];
        if (common.isNull(item[common.CH_NUMBER]) || item[common.CH_NUMBER].length < 1) { continue; }
        
        if (common.IsContactBlocked(item[common.CH_NUMBER], null) === true) { continue; }

// calculating points
        var points = 0;
        var dateint = 0;
        try{
            dateint = common.StrToInt( common.Trim(item[common.CH_DATE]) );
        
        } catch(errin1) { common.PutToDebugLogException(2, "_dialpad: GetRecents convert duration", errin1); }
        
        var diff = now - dateint;
        
        if (diff > 0)
        {
            if (rectmp.length === 0) // means it's the last call
            {
                points = points + LAST_CALLED;
            }
            else if (diff < 3600000) // less then an hour
            {
                points = points + LAST_HOUR;
            }
            else if (diff < 18000000) // less then 5 hours
            {
                points = points + LAST_5HOURS;
            }
            else if (diff < 86400000) // less then 1 day
            {
                points = points + LAST_DAY;
            }
            else if (diff < 604800000) // less then 1 week
            {
                points = points + LAST_WEEK;
            }
            else if (diff < 2592000000) // less then 1 month
            {
                points = points + LAST_MONTH;
            }
            else if (diff < 31104000000) // less then 1 year
            {
                points = points + LAST_YEAR;
            }
        }
        
        if (enablepres)
        {
            var presence = global.presenceHM[item[common.CH_NUMBER]];;

            // -1=not exists(undefined), 0=offline, 1=invisible, 2=idle, 3=pending, 4=DND, 5=online
            if (!common.isNull(presence) && presence === '5') // available
            {
                points = points + IS_ONLINE;
            }

            if (common.isNull(presence) || presence.length < 1)
            {
                if (presencequery.length > 0) { presencequery = presencequery + ','; }
                presencequery = presencequery + item[common.CH_NUMBER];
            }
        }
        
        /* type 0=outgoing call, 1=incomming call, 2=missed call - not viewed, 3=missed call - viwed*/
        if (item[common.CH_TYPE] !== '1')
        {
            points = points + OUTGOING_CALL;
        }
        
        var exists = -1;
        for (var j = 0; j < rectmp.length; j++)
        {
            if (rectmp[j][common.RC_NUMBER] === item[common.CH_NUMBER])
            {
                exists = j;
                break;
            }
        }
        
    // check if contact is blocked
        if (common.IsContactBlocked(item[common.CH_NUMBER]) && points > 5)
        {
            points = Math.floor(points / IS_BLOCKED);
        }
        
    // check if is favorite
        var ctidtmp = common.GetContactIdFromNumber(item[common.CH_NUMBER]);
        if (!common.isNull(ctidtmp) && common.IsNumber(ctidtmp))
        {
            if (common.ContactIsFavorite(ctidtmp) === true)
            {
                points = points * FAVORITE;
            }
        }
        
        if (exists >= 0)
        {
            var pointstmp = 0;
            try{
                var potmp = rectmp[exists][common.RC_RANK];
                if (typeof (potmp) !== 'number')
                {
                    pointstmp = common.StrToInt( common.Trim(rectmp[exists][common.RC_RANK]) );  
                }else
                {
                    pointstmp = potmp;
                }
            } catch(errin2) { common.PutToDebugLogException(2, "_dialpad: GetRecents convert points", errin2); }
            
            pointstmp = pointstmp + points;
            
            rectmp[exists][common.RC_RANK] = pointstmp;
        }else
        {
            var entry = [];
            
            entry[common.RC_TYPE] = item[common.CH_TYPE];
            entry[common.RC_NAME] = item[common.CH_NAME];
            entry[common.RC_NUMBER] = item[common.CH_NUMBER];
            entry[common.RC_DATE] = item[common.CH_DATE];
            entry[common.RC_RANK] = points;

            rectmp.push(entry);
        }
    }
    
    global.recentlist = rectmp;
    global.refreshrecents = false;
    SortRecents();
    
    if (enablepres && presencequery.length > 0)
    {
        presencequery = presencequery.replace('-', '');
        presencequery = presencequery.replace('-', '');
        presencequery = presencequery.replace('-', '');
        presencequery = presencequery.replace('(', '');
        presencequery = presencequery.replace(')', '');
        
        //var retval = webphone_api.checkpresence(presencequery);
        //common.PutToDebugLog(3, "EVENT, _dialpad GetRecents API_CheckPresence: " + retval);
        common.PresenceGet2(presencequery);
    }

    } catch(err) { common.PutToDebugLogException(2, "_dialpad: GetRecents", err); }
}

function SortRecents()
{
    try{
    global.recentlist.sort(function (a,b) // comparator function
    {
        var anr = a[common.RC_RANK];
        var bnr = b[common.RC_RANK];
        
        if ( anr < bnr ) { return 1; }
        if ( anr > bnr ) { return -1; }
        return 0;
    });
    } catch(err) { PutToDebugLogException(2, "_dialpad: SortRecents", err); }
}

function PopulateListRecents() // :no return value
{
    var itemstodisplay = global.nrofrecentstodisplay; // max number of items to display
    var enablepres = false;
    try{
    if ( common.isNull(document.getElementById('dialpad_list')) )
    {
        common.PutToDebugLog(2, "ERROR, _dialpad: PopulateListRecents listelement is null");
        return;
    }
    
    GetRecents();
    
    if ( common.isNull(global.recentlist) || global.recentlist.length < 1 )
    {
        $('#dialpad_btn_grid').show();
        $('#dialpad_list').html('');
        MeasureDialPad();
        common.PutToDebugLog(2, "EVENT, _dialpad: PopulateListRecents no recents");

        if (common.GetConfigInt('brandid', -1) !== 60) // 101VOICEDT500
        {
            btn_isvoicemail = true;
            $("#btn_showhide_numpad_img").attr("src", '' + common.GetElementSource() + 'images/btn_voicemail_txt_big.png');
            $("#btn_showhide_numpad").attr("title", stringres.get("hint_voicemail"));
        }
        return;
    }else
    {
        btn_isvoicemail = false;
        $("#btn_showhide_numpad_img").attr("src", '' + common.GetElementSource() + 'images/btn_numpad_txt.png');
        $("#btn_showhide_numpad").attr("title", stringres.get("hint_numpad"));
        // intructions Moved after populating is done because MeasuerDialpad() checks the content of the list
    }
    
    showfulldialpad = false;
    
    if (global.recentlist.length < itemstodisplay)
    {
        itemstodisplay = global.recentlist.length;
    }
    
// refresh the list of recents, meaning: if any unknown numbers have been saved, then get name from contacts; if contacts have been deleted, then remove name
    for (var i = 0; i < itemstodisplay; i++)
    {
        if (global.recentlist[i][common.RC_NAME] === global.recentlist[i][common.RC_NUMBER])
        {
            global.recentlist[i][common.RC_NAME] = common.GetContactNameFromNumber( global.recentlist[i][common.RC_NUMBER] );
        }else
        {
            var idtemp = common.GetContactIdFromNumber( global.recentlist[i][common.RC_NUMBER] );
            if (idtemp < 0)
            {
                global.recentlist[i][common.RC_NAME] = global.recentlist[i][common.RC_NUMBER];
            }else
            {
                global.recentlist[i][common.RC_NAME] = common.GetContactNameFromNumber( global.recentlist[i][common.RC_NUMBER] );
            }
        }
    }
    
    
    common.PutToDebugLog(2, 'EVENT, _dialpad Starting populate recents list');
    
    var template = '' +
        '<li data-theme="b"><a id="recentitem_[RCID]" class="ch_anchor mlistitem">' +
            '<div class="item_container">' +
                '<div class="ch_type">' +
                    '<img src="' + common.GetElementSource() + 'images/[ICON_CALLTYPE].png" />' +
                '</div>' +
                '<div class="ch_numberonly">[NUMBERONLY]</div>' +
                '<div class="ch_data">' +
                    '<div class="ch_name">[NAME]</div>' +
                    '<div class="ch_number">[NUMBER]</div>' +
                '</div>' +
                '<div class="ch_presence">[PRESENCE]</div>' + // <img src="images/presence_available.png" />
                '<div class="ch_date">[DATE]</div>' + // Aug, 26 2013 10:55
            '</div>' +
        '</a>' +
        '<a id="recentmenu_[RCID]" class="ch_menu mlistitem">' + stringres.get('hint_recents') + '</a>' +
        '</li>';

    var listview = '';
    
    if (common.UsePresence2() === true)
    {
        enablepres = true;
    }
    
    for (var i = 0; i < itemstodisplay; i++)
    {
        var item = global.recentlist[i];
        if ( common.isNull(item) || item.length < 1 ) { continue; }
        
        /* type 0=outgoing call, 1=incomming call, 2=missed call - not viewed, 3=missed call - viwed*/
        
        var icon = 'icon_call_missed';

        if (item[common.RC_TYPE] === '0') { icon = 'icon_call_outgoing'; }
        if (item[common.RC_TYPE] === '1') { icon = 'icon_call_incoming'; }
        
        var datecallint = 0;
        try{
            datecallint = common.StrToInt( common.Trim(item[common.RC_DATE]) );
        
        } catch(errin1) { common.PutToDebugLogException(2, "_dialpad: PopulateListRecents convert duration", errin1); }
        
//Aug, 26 2013 10:55
        var datecall = new Date(datecallint);
        
        var minutes = datecall.getMinutes();
        if (minutes < 10) { minutes = '0' + minutes; }
        
        var day = datecall.getDate(); // getDay returns the day of the week
        if (day < 10) { day = '0' + day; }
        
        //var seconds = datecall.getSeconds();
        //if (seconds < 10) { seconds = '0' + seconds; }
        
        var daetcallstr = month[datecall.getMonth()] + ', ' + day + '&nbsp;&nbsp;' + datecall.getFullYear()+ '&nbsp;&nbsp;'
                + datecall.getHours() + ':' + minutes;// + ':' + seconds;
        
        var lisitem = template.replace('[RCID]', i);
        lisitem = lisitem.replace('[RCID]', i);
        lisitem = lisitem.replace('[ICON_CALLTYPE]', icon);
        
        if (item[common.RC_NAME] === item[common.RC_NUMBER])
        {
            lisitem = lisitem.replace('[NUMBERONLY]', item[common.RC_NUMBER]);
            lisitem = lisitem.replace('[NAME]', '');
            lisitem = lisitem.replace('[NUMBER]', '');
        }else
        {
            lisitem = lisitem.replace('[NUMBERONLY]', '');
            lisitem = lisitem.replace('[NAME]', item[common.RC_NAME]);
            lisitem = lisitem.replace('[NUMBER]', item[common.RC_NUMBER]);
        }
        lisitem = lisitem.replace('[DATE]', daetcallstr);
        
        var presenceimg = ''; //<img src="images/presence_available.png" />
        
        if (enablepres)
        {
            var phonenr = item[common.RC_NUMBER];
            var presence = global.presenceHM[phonenr];

            // -1=not exists(undefined), 0=offline, 1=invisible, 2=idle, 3=pending, 4=DND, 5=online
            if (common.isNull(presence) || presence.length < 1)
            {
                presenceimg = '';
            }
            else if (presence === '0') // offline
            {
                presenceimg = '<img src="' + common.GetElementSource() + 'images/presence_grey.png" />';
            }
            else if (presence === '1') // invisible
            {
                presenceimg = '<img src="' + common.GetElementSource() + 'images/presence_white.png" />';
            }
            else if (presence === '2') // idle
            {
                presenceimg = '<img src="' + common.GetElementSource() + 'images/presence_yellow.png" />';
            }
            else if (presence === '3') // pending
            {
                presenceimg = '<img src="' + common.GetElementSource() + 'images/presence_orange.png" />';
            }
            else if (presence === '4') // DND
            {
                presenceimg = '<img src="' + common.GetElementSource() + 'images/presence_red.png" />';
            }
            else if (presence === '5') // online
            {
                presenceimg = '<img src="' + common.GetElementSource() + 'images/presence_green.png" />';
            }
            else
            {
                presenceimg = '';
            }
        }
        
        lisitem = lisitem.replace('[PRESENCE]', presenceimg);

        listview = listview + lisitem;
    }
    
    $('#dialpad_list').html('');
    $('#dialpad_list').append(listview).listview('refresh');
    
    if ( common.isNull(global.recentlist) || global.recentlist.length < 1 )
    {
        ;
    }else
    {
        // intructions Moved after populating is done because MeasuerDialpad() checks the content of the list
        //$('#dialpad_btn_grid').hide();
        
// if list height greater than available space, the hide dialpad
        var liheight = $("#dialpad_list li").height();

        if (!common.isNull(liheight) && common.IsNumber(liheight) && $('#dialpad_btn_grid').is(':visible'))
        {
            $("#dialpad_btn_grid .ui-btn").height('auto');

            var count = global.nrofrecentstodisplay;
            if (count > global.recentlist.length) { count = global.recentlist.length; }
            var listheight = count * liheight;

            var availablespace = common.GetDeviceHeight() - $("#dialpad_header").height()
                            - $("#phone_number_container").height()
                            - $("#dialpad_footer").height()
                            - common.StrToIntPx($("#dialpad_header").css("border-top-width"))
                            - common.StrToIntPx($("#dialpad_header").css("border-bottom-width"));
                            - 2 * ($(".separator_color_bg").height());

            availablespace = availablespace - $("#dialpad_btn_grid").height();

            if (availablespace < listheight)
            {
                $('#dialpad_btn_grid').hide();
            }
        }
        
        MeasureDialPad();
    }
    
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: PopulateListRecents", err); }
}

function PopulateListContacts(nrval) // :no return value
{
    try{
    if (common.isNull(nrval) || nrval.length < 1)
    {
        PopulateListRecents();
        return;
    }
    
    showfulldialpad = false;
    
    if ( common.isNull(document.getElementById('dialpad_list')) )
    {
        common.PutToDebugLog(2, "ERROR, _dialpad: PopulateListContacts listelement is null");
        return;
    }
    
    SearchContacts(nrval);
    
    common.PutToDebugLog(2, 'EVENT, _dialpad Starting populate searched contact list');
    
    var template = '' +
        '<li data-theme="b"><a id="searcheditem_[CTID]" class="ch_anchor">' +
            '<div class="item_container">' +
                '<div class="ch_ctname">[NAME]</div>' +
                '<div id="ch_ctnumber_[CTID]" class="ch_ctnumber">[NUMBER]</div>' +
            '</div>' +
        '</a>' +
        '<a id="searchedmenu_[CTID]" class="ch_menu">Menu</a>' +
        '</li>';

    var listview = '';
    
    for (var i = 0; i < global.searchctlist.length; i++)
    {
        if ( common.isNull(global.searchctlist[i]) || global.searchctlist[i].length < 1 ) { continue; }
        
        var lisitem = template.replace('[CTID]', i);
        lisitem = lisitem.replace('[CTID]', i);
        lisitem = lisitem.replace('[CTID]', i);
        lisitem = lisitem.replace('[NAME]', global.searchctlist[i][common.CT_NAME]);
        lisitem = lisitem.replace('[NUMBER]', global.searchctlist[i][common.CT_NUMBER]);

        listview = listview + lisitem;
    }
    
    $('#dialpad_list').html('');
    $('#dialpad_list').append(listview).listview('refresh');
    
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: PopulateListContacts", err); }
}

function SearchContacts(searchval)
{
    try{
    if (common.isNull(searchval) || (common.Trim(searchval)).lengh < 1)
    {
        common.PutToDebugLog(2, 'ERROR, _dialpad: SearchContacts value is NULL');
        return;
    }
    
    searchval = searchval.toLowerCase();
    global.searchctlist = [];
    
    // String Name, String[] {numbers/sip uris}, String[] {number types}, int usage, long lastmodified, int delete flag, int isfavorit
    //var ctitem = ['Ambrus Akos', ['40724335358', '0268123456', '13245679'], ['home', 'work', 'other'], '0', '13464346', '0', '0'];

    for (var i = 0; i < global.ctlist.length; i++)
    {
        var add = false;
        var ctTemp = global.ctlist[i].slice(0);
        if (common.isNull(ctTemp))
        {
            continue;
        }
        
        if ( (ctTemp[common.CT_NAME].toLowerCase()).indexOf(searchval) >= 0 )
        {
            add = true;
// add an entry in searchctlist for every phone number
            for (var j = 0; j < ctTemp[common.CT_NUMBER].length; j++)
            {
                var entry = ctTemp.slice(0);
                
                var nr = ctTemp[common.CT_NUMBER][j];
                
                entry[common.CT_NUMBER] = ctTemp[common.CT_NUMBER][j];
                
                global.searchctlist.push(entry);
            }
        }
        
        if (add === false && !common.isNull(ctTemp[common.CT_NUMBER]))
        {
            for (var j = 0; j < ctTemp[common.CT_NUMBER].length; j++)
            {
                if ( ((ctTemp[common.CT_NUMBER][j]).toLowerCase()).indexOf(searchval) >= 0 )
                {
                    var entry = ctTemp;
                
                    entry[common.CT_NUMBER] = ctTemp[common.CT_NUMBER][j];
                
                    global.searchctlist.push(entry);
                }
            }
        }
    }
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: SearchContacts", err); }
}

var trigerredlist = false; // handle multiple clicks
function OnListItemClick (id) // :no return value
{
    try{
    if (trigerredlist) { return; }
    
    trigerredlist = true;
    setTimeout(function ()
    {
        trigerredlist = false;
    }, 1000);
    
    if (common.isNull(id) || id.length < 1)
    {
        common.PutToDebugLog(2, 'ERROR, _dialpad OnListItemClick id is NULL');
        return;
    }
    
    var rcid = '';
    var pos = id.indexOf('_');
    if (pos < 2)
    {
        common.PutToDebugLog(2, 'ERROR, _dialpad OnListItemClick invalid id');
        return;
    }
    
    rcid = common.Trim(id.substring(pos + 1));
    var idint = 0;
    
    try{
        idint = common.StrToInt( common.Trim(rcid) );

    } catch(errin1) { common.PutToDebugLogException(2, "_dialpad: OnListItemClick convert rcid", errin1); }
    
    if (id.indexOf('recentitem') === 0) // means call from recents list
    {
        var to = global.recentlist[idint][common.RC_NUMBER];
        var name = global.recentlist[idint][common.RC_NAME];

        webphone_api.call(to, -1);
    }
    else if (id.indexOf('recentmenu') === 0) // menu from recents list
    {
        RecentMenu(idint, true);
    }
    else if (id.indexOf('searcheditem') === 0) // means call from recents list
    {
        var to = $('#ch_ctnumber_' + idint).html();
        var name = global.searchctlist[idint][common.CT_NAME];

        webphone_api.call(to, -1);
    }
    else if (id.indexOf('searchedmenu') === 0) // menu from recents list
    {
        RecentMenu(idint, false);
    }
    
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: OnListItemClick", err); }
}

function RecentMenu(rcid, isrecent, popupafterclose)
{
    try{
    if (common.isNull(rcid) || rcid.length < 1 || rcid < 0 || rcid > global.recentlist.length)
    {
        common.PutToDebugLog(2, 'ERROR, RecentMenu: invalid id: ' + rcid);
        return;
    }
    
    var rcname = '';
    var rcnumber = '';
    
    if (isrecent)
    {
        rcname = global.recentlist[rcid][common.RC_NAME];
        rcnumber = global.recentlist[rcid][common.RC_NUMBER];
    }else
    {
        rcname = global.searchctlist[rcid][common.CT_NAME];
        rcnumber = $('#ch_ctnumber_' + rcid).html();
    }
    
    if (common.isNull(rcname)) { rcname = ''; }
    if (common.isNull(rcnumber)) { rcnumber = ''; }
    
    var isedit = true; // if name and number are different, means it's an existing cntact => edit ELSE create new contact
    if (rcname === rcnumber && rcnumber.length > 0)
    {
        isedit = false;
    }
    
    if (isedit)
    {
        global.intentctdetails[0] = 'ctid=' + common.GetContactIdFromNumber(rcnumber);
        global.intentctdetails[1] = 'frompage=dialpad';
        $.mobile.changePage("#page_contactdetails", { transition: "none", role: "page" });
        
    }else
    {
        global.intentctdetails[0] = 'ctid=-1';
        global.intentctdetails[1] = 'ctname=' + rcname;
        global.intentctdetails[2] = 'ctnumber=' + rcnumber;
        global.intentctdetails[3] = 'frompage=dialpad';
        $.mobile.changePage("#page_contactdetails", { transition: "none", role: "page" });
    }

    } catch(err) { common.PutToDebugLogException(2, "_dialpad: RecentMenu", err); }
}

function MeasureDialPad() // resolve window height size change
{
    try{
    //var pgh = common.GetDeviceHeight() - $("#dialpad_footer").height() - 1; $('#page_dialpad').css('min-height', pgh + 'px'); // must be set when softphone is skin in div
    $('#page_dialpad').css('min-height', 'auto'); // must be set when softphone is skin in div
    
    $(".separator_line_thick").css( 'background-color', common.HoverCalc(common.getBgColor('#page_dialpad'), -30) );
    
// handle notifiaction      additional_header_right
    var notwidth = common.GetDeviceWidth() - $("#dialpad_additional_header_left").width() - $("#dialpad_additional_header_right").width();
    var margin = common.StrToIntPx( $("#dialpad_additional_header_left").css("margin-left") );
    
    if (common.isNull(margin) || margin === 0) { margin = 10; }
    margin = Math.ceil( margin * 6 );
    notwidth = Math.floor(notwidth - margin) - 20;

    //$("#dialpad_notification").width(notwidth);
    $("#dialpad_notification").height( Math.floor( $("#dialpad_additional_header_left").height() ) );
    
    //dialpad_footer
    
    
    // handle numpad height
    if ( showfulldialpad && ( common.isNull($('#dialpad_list').html()) || ($('#dialpad_list').html()).length < 1 ) ) // if recents are not available, then show dialpad in full screen
    {
        var contentHeightDp = common.GetDeviceHeight() - $("#dialpad_header").height() - common.StrToIntPx($("#dialpad_header").css("border-top-width"))
                - common.StrToIntPx($("#dialpad_header").css("border-bottom-width")) - 2 * ($(".separator_color_bg").height());

        contentHeightDp = contentHeightDp - $("#phone_number_container").height() - $("#dialpad_footer").height();
        
        contentHeightDp = contentHeightDp - 4;

        var rowHeight = Math.floor(contentHeightDp / 4);
        $("#dialpad_btn_grid .ui-btn").height(rowHeight);

    }else
    {
        $("#dialpad_btn_grid .ui-btn").height('auto');
    }
    

// handle recents list height
    var contentHeight = common.GetDeviceHeight() - $("#dialpad_header").height()
                        - $("#phone_number_container").height()
                        - $("#dialpad_footer").height()
                        - common.StrToIntPx($("#dialpad_header").css("border-top-width"))
                        - common.StrToIntPx($("#dialpad_header").css("border-bottom-width"));
                        - 2 * ($(".separator_color_bg").height());
                        //- ($(".separator_color_bg").height());
    
//    if ($('#footertext_dialpad').is(':visible')) { contentHeight = contentHeight - $("#footertext_dialpad").height(); }
    if ($('#dialpad_btn_grid').is(':visible'))
    {
        contentHeight = contentHeight - $("#dialpad_btn_grid").height();
    }
    
    contentHeight = contentHeight - 3;
    
    $("#dialpad_list").height(contentHeight);

    } catch(err) { common.PutToDebugLogException(2, "_dialpad: MeasureDialPad", err); }
}

var aua_handled = false;
function HandleAutoaction() // 0=nothing, 1=call (default), 2=chat, 3=video call
{
    try{
    if (aua_handled === true) { return; }
    aua_handled = true;
    var aua_str = common.GetParameter2('autoaction');
    if (common.isNull(aua_str) || !common.IsNumber(aua_str)) { return; }
    var aua = common.StrToInt(aua_str);
    if (common.isNull(aua) || aua < 1 || aua > 3) { return; }
    var ct = webphone_api.getcallto();
    if (common.isNull(ct) || ct.length < 1) { return; }
    
    if (aua === 1) // call
    {
        StartCall(ct, false);
    }
    else if (aua === 2) // chat
    {
        common.StartMsg(ct, '', '_dialpad');
    }
    else if (aua === 3) // video
    {
        StartCall(ct, true);
    }
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: HandleAutoaction", err); }
}

function MsgOnClick()
{
    try{
    if (common.GetConfigInt('brandid', -1) === 50) // favafone
    {
        CreditRecharge();
        return;
    }
    
    var phoneNumber = common.Trim( document.getElementById('phone_number').value );
    
    if (common.isNull(phoneNumber) || phoneNumber.length < 1)
    {
        common.StartMsg('', '', '_dialpad');	// starts msg inbox list
        //CommonGUI.GetObj().PutToDebugLog(1,getResources().getString(R.string.err_msg_1));
    }else
    {
        common.StartMsg(phoneNumber, '', '_dialpad');
    }
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: MsgOnClick", err); }
}

/*
var maxloop = 0;
function ShowNativePluginOption()
{
    try{
    common.IsServiceInstalled(function (installed)
    {
        if (installed === false)
        {
            if (common.GetParameter('devicetype') === common.DEVICE_WEBPHONE()
            && global.enableservice  && global.useengine !== global.ENGINE_SERVICE
            && global.useengine !== global.ENGINE_WEBPHONE)
            {
                ;
            }else
            {
                return;
            }

        //!!DEPERECATED
            if (global.showdialpadnativeplugin < 0 && maxloop < 4 && global.isDialpadStarted)
            {
                maxloop++;
                setTimeout(function ()
                {
                    ShowNativePluginOption();
                }, 1000);

                return;
            }
            else if (global.showdialpadnativeplugin === 1)
            {
                $("#dialpad_engine").show();
                $("#dialpad_engine_title").html(stringres.get('serviceengine_title'));
                $("#dialpad_engine_msg").html(stringres.get('serviceengine_msg'));

                maxloop = 0;
            }
            else if (global.showdialpadnativeplugin > 1)
            {
                maxloop = 0;
                NativePluginPopup();
            }
        }
    });
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: MsgOnClick", err); }
}
*/
function NativePluginPopup(popupafterclose) // ask user to install service plugin (service engine)
{
    common.PutToDebugLog(5, 'EVENT, _dialpad: NativePluginPopup called')
    
    try{
    var popupWidth = common.GetDeviceWidth();
    if ( !common.isNull(popupWidth) && common.IsNumber(popupWidth) && popupWidth > 100 )
    {
        popupWidth = Math.floor(popupWidth / 1.2);
    }else
    {
        popupWidth = 220;
    }
    
    var template = '' +
'<div id="native_plugin_popup" data-role="popup" class="ui-content messagePopup" data-overlay-theme="a" data-theme="a" style="max-width:' + popupWidth + 'px;">' +

    '<div data-role="header" data-theme="b">' +
        '<a href="javascript:;" data-role="button" data-icon="delete" data-iconpos="notext" class="ui-btn-right closePopup">Close</a>' +
        '<h1 class="adialog_title">' + stringres.get('np_popup_title') + '</h1>' +
    '</div>' +
    '<div role="main" class="ui-content adialog_content adialog_alert">' +
        '<span> ' + stringres.get('np_popup_msg') + ' </span>' +
//        '<a href="javascript:;" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b" data-rel="back">' + stringres.get('btn_close') + '</a>' +
//        '<a href="javascript:;" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b" data-rel="back" data-transition="flow">Delete</a>' +
    '</div>' +
    '<div data-role="footer" data-theme="b" class="adialog_footer">' +
        '<a href="javascript:;" id="btn_adialog_ok" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b adialog_2button" data-rel="back" data-transition="flow">' + stringres.get('btn_ok') + '</a>' +
        '<a href="javascript:;" id="adialog_negative" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b adialog_2button" data-rel="back">' + stringres.get('btn_cancel') + '</a>' +
    '</div>' +
'</div>';
 
    popupafterclose = popupafterclose ? popupafterclose : function () {};

    $.mobile.activePage.append(template).trigger("create");
    //$.mobile.activePage.append(template).trigger("pagecreate");

    $.mobile.activePage.find(".closePopup").bind("tap", function (e)
    {
        $.mobile.activePage.find(".messagePopup").popup("close");
    });
    
    $.mobile.activePage.find(".messagePopup").bind(
    {
        popupbeforeposition: function()
        {
            $(this).unbind("popupbeforeposition");//.remove();
            var maxHeight =  Math.floor( common.GetDeviceHeight() * 0.6 );  // $(window).height() - 120;
            
            if ($(this).height() > maxHeight)
            {
                $('.messagePopup .ui-content').height(maxHeight);
            }
        }
    });
    
    $.mobile.activePage.find(".messagePopup").popup().popup("open").bind(
    {
        popupafterclose: function ()
        {
            $(this).unbind("popupafterclose").remove();
            $('#btn_adialog_ok').off('click');
            popupafterclose();
        }
    });
    
    $('#btn_adialog_ok').on('click', function ()
    {
        $( '#native_plugin_popup' ).on( 'popupafterclose', function( event )
        {
            $( '#native_plugin_popup' ).off( 'popupafterclose' );
            
            common.PutToDebugLog(5, 'EVENT, _dialpad: NativePluginPopup OK onclick');
            
            //common.OpenWebURL(global.nativeplugin_path, stringres.get('np_download'));
            common.OpenWebURL(common.GetNPLocation(), stringres.get('np_download'));
            setTimeout(function ()
            {
                common.NPDownloadAndInstall();
            }, 150);
        });
    });
        
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: NativePluginPopup", err); }
}
    
    
var MENUITEM_DIALPAD_PROVIDER = '#menuitem_dialpad_provider';
var MENUITEM_DIALPAD_MYACCOUNT = '#menuitem_dialpad_myaccount';
var MENUITEM_DIALPAD_P2P = '#menuitem_dialpad_p2p';
var MENUITEM_DIALPAD_CALLBACK = '#menuitem_dialpad_callback';
var MENUITEM_DIALPAD_RECHARGE = '#menuitem_dialpad_recharge';
var MENUITEM_DIALPAD_SETTINGS = '#menuitem_dialpad_settings';
var MENUITEM_HELP = '#menuitem_dialpad_help';
var MENUITEM_EXIT = '#menuitem_dialpad_exit';
var MENUITEM_DIALPAD_EXTRA = '#menuitem_dialpad_extra';
var MENUITEM_DIALPAD_ACCESSNR = '#menuitem_dialpad_accessnr';
var MENUITEM_DIALPAD_VOICEMAIL = '#menuitem_dialpad_voicemail';
var MENUITEM_DIALPAD_PROVERSION = '#menuitem_dialpad_proversion';
var MENUITEM_DIALPAD_FILETRANSFER = '#menuitem_dialpad_filetransfer';
var MENUITEM_DIALPAD_AUDIOSETTING = '#menuitem_dialpad_audiosettings';
var MENUITEM_DIALPAD_RECONNECT = '#menuitem_dialpad_reconnect';
var MENUITEM_DIALPAD_WEBCALLME = '#menuitem_dialpad_webcallme';
var MENUITEM_DIALPAD_CONFERENCEROOMS = '#menuitem_dialpad_conferencerooms';
var MENUITEM_DIALPAD_VIDEOCALL = '#menuitem_dialpad_videocall';
var MENUITEM_DIALPAD_CALLPICKUP_101VOICE = '#menuitem_dialpad_callpickup_101voice';

function CreateOptionsMenu (menuId) // adding items to menu, called from html
{
    try{
// remove data transition for windows softphone, because it's slow
    if (common.IsWindowsSoftphone())
    {
        $( "#btn_dialpad_menu" ).removeAttr('data-transition');
    }
    
    if ( common.isNull(menuId) || menuId.lenght < 1 ) { common.PutToDebugLog(2, "ERROR, _dialpad: CreateOptionsMenu menuid null"); return; }

    if ($(menuId).length <= 0) { common.PutToDebugLog(2, "ERROR, _dialpad: CreateOptionsMenu can't get reference to Menu"); return; }
    
    if (menuId.charAt(0) !== '#') { menuId = '#' + menuId; }
    
    $(menuId).html('');
    
    var featureset = common.GetParameterInt('featureset', 10);
    
    var extramenuurl = common.GetParameter('extramenuurl');
    var extramenutxt = common.GetParameter('extramenutxt');
    if (!common.isNull(extramenuurl) && extramenuurl.length > 5 && !common.isNull(extramenutxt) && extramenutxt.length > 0)
    {
        $(menuId).append( '<li id="' + MENUITEM_DIALPAD_EXTRA + '"><a data-rel="back">' + extramenutxt + '</a></li>' ).listview('refresh');
    }
    
    $(menuId).append( '<li id="' + MENUITEM_DIALPAD_SETTINGS + '"><a data-rel="back">' + stringres.get('settings_title') + '</a></li>' ).listview('refresh');
    
    if ( featureset > 0 && !common.isNull(common.GetParameter('accounturi')) && common.GetParameter('accounturi').length > 3 )
    {
        $(menuId).append( '<li id="' + MENUITEM_DIALPAD_MYACCOUNT + '"><a data-rel="back">' + stringres.get('myaccount') + '</a></li>' ).listview('refresh');
    }
    
    if ( featureset > 0 && !common.isNull(common.GetParameter('p2p')) && common.GetParameter('p2p').length > 3 )
    {
        $(menuId).append( '<li id="' + MENUITEM_DIALPAD_P2P + '"><a data-rel="back">' + stringres.get('p2p') + '</a></li>' ).listview('refresh');
    }
    
    if ( featureset > 0)
    {
        if (common.GetParameter2('callback').length > 3 || common.GetConfig('callbacknumber').length > 3 || common.GetParameter2('callbacknumber').length > 3)
        {
            $(menuId).append( '<li id="' + MENUITEM_DIALPAD_CALLBACK + '"><a data-rel="back">' + stringres.get('callback') + '</a></li>' ).listview('refresh');
        }
    }
    
    if (featureset > 0 && common.GetParameter('accessnumber').length > 1)
    {
        $(menuId).append( '<li id="' + MENUITEM_DIALPAD_ACCESSNR + '"><a data-rel="back">' + stringres.get('menu_call_access') + '</a></li>' ).listview('refresh');
    }
    
    if ( featureset > 0 && !common.isNull(common.GetParameter('recharge')) && common.GetParameter('recharge').length > 3 )
    {
        $(menuId).append( '<li id="' + MENUITEM_DIALPAD_RECHARGE + '"><a data-rel="back">' + stringres.get('recharge') + '</a></li>' ).listview('refresh');
    }
    
//    if (featureset > 0 && common.GetParameterInt('voicemail', 2) === 2 && btn_isvoicemail === false)
//    {
//        $(menuId).append( '<li id="' + MENUITEM_DIALPAD_VOICEMAIL + '"><a data-rel="back">' + stringres.get('voicemail_title') + '</a></li>' ).listview('refresh');
//    }
    
    if (common.GetConfigBool('hasfiletransfer', true) !== false && (common.GetConfigBool('usingmizuserver', false) === true || common.IsMizuWebRTCGateway() === true))
    {
        if (common.Glft() > 0)
        {
            $(menuId).append( '<li id="' + MENUITEM_DIALPAD_FILETRANSFER + '"><a data-rel="back">' + stringres.get('filetransf_title') + '</a></li>' ).listview('refresh');
        }
    }
    /* Moved to HelpWindow
    var vcm = common.GetParameter2('webcallme');
    if (!common.isNull(vcm) && vcm.length === 1 && vcm !== '0')
    {
        $(menuId).append( '<li id="' + MENUITEM_DIALPAD_WEBCALLME + '"><a data-rel="back">' + stringres.get('menu_webcallme') + '</a></li>' ).listview('refresh');
    }*/
    
    if (common.HideSettings('conference', stringres.get('sett_display_name_' + 'conference'), 'conference', true) === false)
    {
        console.log('usingmizuserver: ' + common.GetConfigBool('usingmizuserver', false));
        console.log('common.IsMizuWebRTCEmbeddedServer(): ' + common.IsMizuWebRTCEmbeddedServer());
        console.log('common.IsMizuWebRTCGateway(): ' + common.IsMizuWebRTCGateway());
        console.log('common.getuseengine(): ' + common.getuseengine());
        //if (common.IsMizuServer() === true)
        if (common.GetConfigBool('usingmizuserver', false) === true
                || ((common.IsMizuWebRTCEmbeddedServer() === true || common.IsMizuWebRTCGateway() === true) && common.getuseengine() === global.ENGINE_WEBRTC))

        {
            var cfr = common.GetParameter2('conferencerooms');
            if (!common.isNull(common.GetConfig('conferencerooms')) && common.GetConfig('conferencerooms').length > 0) { cfr = common.GetConfig('conferencerooms'); }
            if (!common.isNull(cfr) && cfr.length === 1 && cfr !== '0')
            {
                if (common.Glcf() > 0)
                {
                    $(menuId).append( '<li id="' + MENUITEM_DIALPAD_CONFERENCEROOMS + '"><a data-rel="back">' + stringres.get('menu_confrooms') + '</a></li>' ).listview('refresh');
                }
            }
        }
    }
    
    if (common.GetConfigInt('brandid', -1) === 60) // 101VOICEDT500
    {
        $(menuId).append( '<li id="' + MENUITEM_DIALPAD_CALLPICKUP_101VOICE + '"><a data-rel="back">' + stringres.get('menu_callpickup') + '</a></li>' ).listview('refresh');
    }
    
// handle hidesettings
    if (common.HideSettings('video', stringres.get('sett_display_name_' + 'video'), 'video', true) === false)
    {
        if (common.GetParameter2('video') === '1' || (common.GetParameter2('video') === '-1' && common.getuseengine() === global.ENGINE_WEBRTC))
        {
            if (common.Glvd() > 0)
            {
                $(menuId).append( '<li id="' + MENUITEM_DIALPAD_VIDEOCALL + '"><a data-rel="back">' + stringres.get('video_call') + '</a></li>' ).listview('refresh');
            }
        }
    }
    
    common.PutToDebugLog(4, 'EVENT, pv_1: ' + common.IsWindowsSoftphone() + '; pv_2: ' + common.GetConfig('needactivation') + '; pv_3: ' + common.CanShowLicKeyInput());
    if (common.IsWindowsSoftphone() && common.GetConfig('needactivation') == 'true' && common.CanShowLicKeyInput())
    {
        common.PutToDebugLog(4, 'EVENT, proversion_4: menu displayed');
        $(menuId).append( '<li id="' + MENUITEM_DIALPAD_PROVERSION + '"><a data-rel="back">' + stringres.get('help_proversion') + '</a></li>' ).listview('refresh');
    }
    
    if ((common.getuseengine() === global.ENGINE_WEBRTC && (common.GetBrowser() === 'Firefox' || common.GetBrowser() === 'Chrome'))
            || global.audio_devices_loaded === true && (common.GetParameter('devicetype') === common.DEVICE_WIN_SOFTPHONE() || common.getuseengine() === global.ENGINE_SERVICE || common.getuseengine() === global.ENGINE_WEBPHONE))
    {
        if (common.GetConfigInt('brandid', -1) !== 50) // favafone
        {
            $(menuId).append( '<li id="' + MENUITEM_DIALPAD_AUDIOSETTING + '"><a data-rel="back">' + stringres.get('audio_title') + '</a></li>' ).listview('refresh');
        }
    }
    
    /* Moved to HelpWindow
    $(menuId).append( '<li id="' + MENUITEM_DIALPAD_RECONNECT + '"><a data-rel="back">' + stringres.get('menu_reconnect') + '</a></li>' ).listview('refresh');
    */
    
    var help_title = stringres.get('menu_help') + '...';
    if (common.GetConfigInt('brandid', -1) === 60) { help_title = stringres.get('help_about'); } // 101VOICEDT500
    $(menuId).append( '<li id="' + MENUITEM_HELP + '"><a data-rel="back">' + help_title + '</a></li>' ).listview('refresh');
    
    /*if ( featureset > 0 && !common.isNull(common.GetParameter('homepage')) && common.GetParameter('homepage').length > 3 )
    {
        $(menuId).append( '<li id="' + MENUITEM_DIALPAD_PROVIDER + '"><a data-rel="back">' + stringres.get('myprovider') + '</a></li>' ).listview('refresh');
    }*/

    if (common.IsWindowsSoftphone())
    {
        $(menuId).append( '<li id="' + MENUITEM_EXIT + '"><a data-rel="back">' + stringres.get('menu_exit') + '</a></li>' ).listview('refresh');
    }

    return true;
    
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: CreateOptionsMenu", err); }
    
    return false;
}

function MenuItemSelected(itemid)
{
    try{
    if (common.isNull(itemid) || itemid.length < 1) { return; }
    
    $( '#dialpad_menu' ).on( 'popupafterclose', function( event )
    {
        $( '#dialpad_menu' ).off( 'popupafterclose' );
        
        switch (itemid)
        {
            case MENUITEM_DIALPAD_EXTRA:
                common.OpenWebURL( common.GetParameter('extramenuurl'), common.GetParameter('extramenutxt') );
                break;
            case MENUITEM_DIALPAD_SETTINGS:
                common.OpenSettings(true);
                break;
            case MENUITEM_DIALPAD_PROVIDER:
                common.OpenWebURL( common.GetParameter('homepage'), stringres.get('myprovider') );
                break;
            case MENUITEM_DIALPAD_MYACCOUNT:
                common.OpenWebURL( common.GetParameter('accounturi'), stringres.get('myaccount') );
                break;
            case MENUITEM_DIALPAD_P2P:
                common.Phone2Phone('', '');
                break;
            case MENUITEM_DIALPAD_CALLBACK:
                Callback();
                break;
            case MENUITEM_DIALPAD_RECHARGE:
                CreditRecharge();
                break;
            case MENUITEM_HELP:
                common.HelpWindow('dialpad');
                break;
            case MENUITEM_EXIT:
                common.Exit();
                break;
            case MENUITEM_DIALPAD_ACCESSNR:
                CallAccessNumber();
                break;
            case MENUITEM_DIALPAD_VOICEMAIL:
                MenuVoicemail();
                break;
            case MENUITEM_DIALPAD_FILETRANSFER:
                common.FileTransfer($('#phone_number').val());
                break;
            case MENUITEM_DIALPAD_PROVERSION:
                common.UpgradeToProVersion();
                break;
            case MENUITEM_DIALPAD_AUDIOSETTING:
                common.AudioDevicePopup();
                break;
            /*case MENUITEM_DIALPAD_RECONNECT:
                ReConnect();
                break;
            case MENUITEM_DIALPAD_WEBCALLME:
                GenerateWebcallmeLink();
                break;*/
            case MENUITEM_DIALPAD_CONFERENCEROOMS:
                CreateConferenceRoom();
                break;
            case MENUITEM_DIALPAD_VIDEOCALL:
                VideoCall('');
                break;
            case MENUITEM_DIALPAD_CALLPICKUP_101VOICE:
                StartCall('**', false);
                break;
        }
    });
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: MenuItemSelected", err); }
}


//akos: (only on mizu server and gateway) conference rooms: create conference menu, call api to get room number: getconfroom
//        	getconfroom: returns: OK: conferenceroom: 1234
//		then display the access number and option to invite others (send via chat message like for file transfer)
//		in webphone show a message and UI
function CreateConferenceRoom()
{
    var uri = '';
    try{
// build api request from config
    //http://domain.com/mvapireq/?apientry=balance&authkey=KEY&authid=USRNAME&authmd5=MD5VALUE
    var allcfg = mwphonecfg.getAll();
    if (!common.isNull(allcfg) && uri.length < 1)
    {
        for (var c in allcfg)
        {
            var val = allcfg[c];
            if (!common.isNull(val) && (val.toString()).indexOf('/mvapireq/?apientry=') > 0)
            {
                // get authkey
                var authkey = val.toString();
                if (authkey.indexOf('authkey=') > 0)
                {
                    authkey = authkey.substring(authkey.indexOf('authkey='));
                    if (authkey.indexOf('&') > 0) { authkey = authkey.substring(0, authkey.indexOf('&')); }
                }
                uri = val.toString();
                uri = uri.substring(0, uri.indexOf('?') + 1);
                
                uri = uri + authkey + '&authid=USERNAME&authmd5=MD5VALUE' + '&apientry=getconfroom';
                
                break;
            }
        }
    }
    
    if (uri.length < 1) // try to guess from server address
    {
        var mainaport = common.GetConfig('mainaport');
        if (!common.isNull(mainaport) && mainaport.length > 0) { mainaport = ':' + mainaport; } else { mainaport = ''; }
        var srv = common.GetParameter('serveraddress');
        if (common.isNull(srv) || srv.length < 1) { srv = common.GetParameter('serveraddress_user'); }
        
        if (!common.isNull(srv) && srv.length > 0)
        {
            var pos = srv.indexOf(':');
            if (pos > 0) { srv = srv.substring(0, pos); }

        // try to find apikey

            var apikey = '';//common.GetConfig('serverapikey');
            if (common.isNull(apikey) || apikey.length < 1/* && global.usuk.length > 0*/)
            {
                apikey = '1568108345';
                if (global.usuk === 'us')
                {
                    apikey = '1552303117';
                }
            // if we don't have apikey, then server should be one of the gateways
                srv = common.GetDomainFromURL(common.GetWsuserUrl(common.GetParameter('sipusername'), common.GetParameter('password')));
            }
                
            var protocol = 'http://';
            if (common.IsHttps() === true) { protocol = 'https://'; }
            
            //uri = protocol + srv + mainaport + '/mvapireq/?authkey=' + apikey + '&authid=USERNAME&authpwd=PASSWORD&apientry=getconfroom';
            uri = protocol + srv + mainaport + '/mvapireq/?authkey=' + apikey + '&authid=USERNAME&authmd5=MD5VALUE&apientry=getconfroom';
        }
    }

    if (uri.length > 0)
    {
        common.UriParser(uri, '', '', '', '', 'getconferenceroom');
    }else
    {
        common.PutToDebugLog(1, 'ERROR, Cannot create conference room');
        common.PutToDebugLog(2, 'ERROR, CreateConferenceRoom invalid uri: ' + uri);
    }
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: CreateConferenceRoom", err); }
}
/*
function ReConnect() // restart the engine
{
    try{
    global.authenticated_displayed = false;
    webphone_api.startInner();
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: ReConnect", err); }
}*/

function CreditRecharge()
{
    try{
    var ruri = common.GetParameter('recharge');
    /*if (common.GetConfigInt('brandid', -1) === 50)
    {
        common_public.OpenLinkInInternalBrowser(ruri);
        return;
    }*/
        
    if ((common.Trim(ruri)).indexOf('*') !== 0) // if starts with * => httpapi ELSE link
    {
        common.OpenWebURL( ruri, stringres.get('recharge') );
        return;
    }

    var popupWidth = common.GetDeviceWidth();
    if ( !common.isNull(popupWidth) && common.IsNumber(popupWidth) && popupWidth > 100 )
    {
        popupWidth = Math.floor(popupWidth / 1.2);
    }else
    {
        popupWidth = 220;
    }
    
    var template = '' +
'<div id="adialog_recharge" data-role="popup" class="ui-content messagePopup" data-overlay-theme="a" data-theme="a" style="max-width:' + popupWidth + 'px;">' +

    '<div data-role="header" data-theme="b">' +
        '<a href="javascript:;" data-role="button" data-icon="delete" data-iconpos="notext" class="ui-btn-right closePopup">Close</a>' +
        '<h1 class="adialog_title">' + stringres.get('recharge') + '</h1>' +
    '</div>' +
    '<div role="main" class="ui-content adialog_content">' +
        '<span>' + stringres.get('recharge_msg') + ':</span>' +
        '<input type="text" id="recharge_input" name="recharge_input" data-theme="a"/>' +
    '</div>' +
    '<div data-role="footer" data-theme="b" class="adialog_footer">' +
        '<a href="javascript:;" id="adialog_positive" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b adialog_2button" data-rel="back" data-transition="flow">' + stringres.get('btn_ok') + '</a>' +
        '<a href="javascript:;" id="adialog_negative" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b adialog_2button" data-rel="back">' + stringres.get('btn_cancel') + '</a>' +
    '</div>' +
'</div>';

    var popupafterclose = function () {};

    $.mobile.activePage.append(template).trigger("create");
    //$.mobile.activePage.append(template).trigger("pagecreate");

    $.mobile.activePage.find(".closePopup").bind("tap", function (e)
    {
        $.mobile.activePage.find(".messagePopup").popup("close");
    });

    $.mobile.activePage.find(".messagePopup").popup().popup("open").bind(
    {
        popupafterclose: function ()
        {
            $(this).unbind("popupafterclose").remove();
            $('#adialog_positive').off('click');
            $('#adialog_negative').off('click');
            popupafterclose();
        }
    });
    
// listen for enter onclick, and click OK button
/* no need for this, because it reloads the page
    $( "#adialog_recharge" ).keypress(function( event )
    {
        if ( event.which === 13 )
        {
//            event.preventDefault();
            $("#adialog_positive").click();
        }else
        {
            return;
        }
    });
*/
    var recharge = document.getElementById('recharge_input');
    if (!common.isNull(recharge)) { recharge.focus(); } // setting cursor to text input
    
    $('#adialog_positive').on('click', function (event)
    {
        common.PutToDebugLog(5,"EVENT, _dialpad CreditRecharge 1 ok");

        var pin = recharge.value;
        
        if (common.isNull(pin) || (common.Trim(pin)).length < 1)
        {
            common.ShowToast(stringres.get('recharge_error'));
            return;
        }else
        {
            pin = common.Trim(pin);
        }
        
        common.UriParser(common.GetParameter('recharge'), pin, '', '', '', 'recharge');
    });

    $('#adialog_negative').on('click', function (event)
    {
        ;
    });
    
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: CreditRecharge", err); }
}

function VideoCall(phoneNr) // initiate video call if a number is entered in phone field, or request a number from the user
{
    try{
    var field = document.getElementById('phone_number');
    if ( common.isNull(field) ) { return; }
    var number = field.value;
    if (!common.isNull(number))
    {
        number = common.Trim(number);
        if (number.length > 0)
        {
            StartCall(number, true);
            return;
        }
    }
    
    var popupWidth = common.GetDeviceWidth();
    if ( !common.isNull(popupWidth) && common.IsNumber(popupWidth) && popupWidth > 100 )
    {
        popupWidth = Math.floor(popupWidth / 1.2);
    }else
    {
        popupWidth = 220;
    }
    var btnimage = 'btn_add_contact_txt.png';
    
    var template = '' +
'<div id="adialog_videocall" data-role="popup" class="ui-content messagePopup" data-overlay-theme="a" data-theme="a" style="max-width:' + popupWidth + 'px;">' +

    '<div data-role="header" data-theme="b">' +
        '<a href="javascript:;" data-role="button" data-icon="delete" data-iconpos="notext" class="ui-btn-right closePopup">Close</a>' +
        '<h1 class="adialog_title">' + stringres.get('video_call') + '</h1>' +
    '</div>' +
    '<div role="main" class="ui-content adialog_content adialog_btn_nexttoinput">' +
        '<span>' + stringres.get('phone_nr') + ':</span>' +
        '<div style="clear: both;"><!--//--></div>' +
        '<input type="text" id="videocall_input" name="videocall_input" data-theme="a"/>' +
        '<button id="btn_pickct" class="btn_nexttoinput ui-btn ui-btn-corner-all ui-btn-b noshadow"><img src="' + common.GetElementSource() + 'images/' + btnimage + '"></button>' +
    '</div>' +
    '<div data-role="footer" data-theme="b" class="adialog_footer">' +
        '<a href="javascript:;" id="adialog_positive" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b adialog_2button" data-rel="back" data-transition="flow">' + stringres.get('btn_videocall') + '</a>' +
        '<a href="javascript:;" id="adialog_negative" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b adialog_2button" data-rel="back">' + stringres.get('btn_cancel') + '</a>' +
    '</div>' +
'</div>';

    var popupafterclose = function () {};

    $.mobile.activePage.append(template).trigger("create");
    //$.mobile.activePage.append(template).trigger("pagecreate");

    $.mobile.activePage.find(".closePopup").bind("tap", function (e)
    {
        $.mobile.activePage.find(".messagePopup").popup("close");
    });

    $.mobile.activePage.find(".messagePopup").popup().popup("open").bind(
    {
        popupafterclose: function ()
        {
            $(this).unbind("popupafterclose").remove();
            $('#adialog_positive').off('click');
            $('#adialog_negative').off('click');
            $('#btn_pickct').off('click');
            popupafterclose();
        }
    });
    
// listen for enter onclick, and click OK button
/* no need for this, because it reloads the page
    $( "#adialog_videocall" ).keypress(function( event )
    {
        if ( event.which === 13 )
        {
            event.preventDefault();
            $("#adialog_positive").click();
        }else
        {
            return;
        }
    });
*/
    var videocall = document.getElementById('videocall_input');
    if (!common.isNull(videocall))
    {
        if (!common.isNull(phoneNr) && phoneNr.length > 0) { videocall.value = phoneNr; }
        videocall.focus();
    } // setting cursor to text input
    
    $('#adialog_positive').on('click', function (event)
    {
        $( '#adialog_videocall' ).on( 'popupafterclose', function( event )
        {
            number = videocall.value;

            common.PutToDebugLog(5,"EVENT, _dialpad VideoCall 1 ok: " + number);

            if (common.isNull(number) || (common.Trim(number)).length < 1)
            {
                return;
            }else
            {
                number = common.Trim(number);
            }

            webphone_api.videocall(number);
        });
    });

    $('#adialog_negative').on('click', function (event)
    {
        ;
    });
    
    $('#btn_pickct').on('click', function (event)
    {
        $.mobile.activePage.find(".messagePopup").popup("close");

        $( '#adialog_videocall' ).on( 'popupafterclose', function( event )
        {
            $( '#adialog_videocall' ).off( 'popupafterclose' );

            common.PickContact(VideoCall);
        });
    });
    
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: VideoCall", err); }
}

function MenuVoicemail()
{
    try{
    var vmNumber = common.GetParameter("voicemailnum");
// if mizu server or mizu upper server (don't check if mizu gateway), then auto set the voicemailnumber to 5001
    if ((common.isNull(vmNumber) || vmNumber.length < 1) && common.IsMizuServer() === true)
    {
        vmNumber = '5001';
        common.SaveParameter('voicemailnum', vmNumber);
    }

    if (!common.isNull(vmNumber) && vmNumber.length > 0)
    {
        StartCall(vmNumber);
    }else
    {
        SetVoiceMailNumber(function (vmnr)
        {
            if (!common.isNull(vmnr) && vmnr.length > 0) { StartCall(vmnr); }
        });
    }
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: MenuVoicemail", err); }
}

function Callback() // Menu -> Callback
{
    try{
    var cburi = common.GetParameter2('callback');
    if (cburi.length < 3) { cburi = common.GetConfig('callback'); }

    var cbnr = common.GetParameter2('callbacknumber');
    if (cbnr.length < 3) { cbnr = common.GetConfig('callbacknumber'); }
    
// callback with http request uri
    if (!common.isNull(cburi) && cburi.length > 2)
    {
        var popupWidth = common.GetDeviceWidth();
        if ( !common.isNull(popupWidth) && common.IsNumber(popupWidth) && popupWidth > 100 )
        {
            popupWidth = Math.floor(popupWidth / 1.2);
        }else
        {
            popupWidth = 220;
        }

        var template = '' +
    '<div id="adialog_callback" data-role="popup" class="ui-content messagePopup" data-overlay-theme="a" data-theme="a" style="max-width:' + popupWidth + 'px;">' +

        '<div data-role="header" data-theme="b">' +
            '<a href="javascript:;" data-role="button" data-icon="delete" data-iconpos="notext" class="ui-btn-right closePopup">Close</a>' +
            '<h1 class="adialog_title">' + stringres.get('callback') + '</h1>' +
        '</div>' +
        '<div role="main" class="ui-content adialog_content">' +
            '<span>' + stringres.get('callback_src') + '</span>' +
            '<input type="text" id="callback_input" name="callback_input" data-theme="a"/>' +
        '</div>' +
        '<div data-role="footer" data-theme="b" class="adialog_footer">' +
            '<a href="javascript:;" id="adialog_positive" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b adialog_2button" data-rel="back" data-transition="flow">' + stringres.get('btn_ok') + '</a>' +
            '<a href="javascript:;" id="adialog_negative" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-b adialog_2button" data-rel="back">' + stringres.get('btn_cancel') + '</a>' +
        '</div>' +
    '</div>';

        var popupafterclose = function () {};

        $.mobile.activePage.append(template).trigger("create");
        //$.mobile.activePage.append(template).trigger("pagecreate");

        $.mobile.activePage.find(".closePopup").bind("tap", function (e)
        {
            $.mobile.activePage.find(".messagePopup").popup("close");
        });

        $.mobile.activePage.find(".messagePopup").popup().popup("open").bind(
        {
            popupafterclose: function ()
            {
                $(this).unbind("popupafterclose").remove();
                $('#adialog_positive').off('click');
                $('#adialog_negative').off('click');
                popupafterclose();
            }
        });

    // listen for enter onclick, and click OK button
/* no need for this, because it reloads the page
        $( "#adialog_callback" ).keypress(function( event )
        {
            if ( event.which === 13 )
            {
                event.preventDefault();
                $("#adialog_positive").click();
            }else
            {
                return;
            }
        });*/

        var callback = document.getElementById('callback_input');
        if (!common.isNull(callback)) { callback.focus(); } // setting cursor to text input

        var lastCallbackNr = common.GetParameter('last_callback_nr');

        if (!common.isNull(lastCallbackNr) && lastCallbackNr.length > 0)
        {
            callback.value = lastCallbackNr;
        }

        $('#adialog_positive').on('click', function (event)
        {
            common.PutToDebugLog(5,"EVENT, _dialpad Phone2Phone 1 ok");

            var callbacknr = callback.value;

            if (common.isNull(callbacknr) || (common.Trim(callbacknr)).length < 1)
            {
                common.ShowToast(stringres.get('callback_src'));
                return;
            }else
            {
                callbacknr = common.Trim(callbacknr);
            }

            common.UriParser(cburi, '', callbacknr, '', '', 'callback');
            common.SaveParameter('last_callback_nr', callbacknr);
        });

        $('#adialog_negative').on('click', function (event)
        {
            ;
        });
    
        }else if (!common.isNull(cbnr) && cbnr.length > 2)
        {
            if (webphone_api.isregistered() === true)
            {
                StartCall(cbnr);
            }else
            {
                // on pc show sip:uri AND tel:uri, on mobile show only tel:uri
                var mob = '<a href="tel:' + cbnr + '">' + cbnr + '</a>';
                var sip = '<a href="sip:' + cbnr + '">' + cbnr + '</a>';
                
                var htmlcont = '';
                var os = common.GetOs(); // Windows, MacOS, Linux
                if (os === 'Windows' || os === 'MacOS' || os === 'Linux')
                {
                    htmlcont = stringres.get('cb_callonnative') + ': ' + sip + '<br /><br />' + stringres.get('cb_callonmobile') + ': ' + mob;
                }else
                {
                    htmlcont = stringres.get('cb_callonmobile') + ': ' + mob;
                }
                
                common.AlertDialog(stringres.get('callback'), htmlcont);
            }
        }else
        {
            common.PutToDebugLog(2, 'ERROR,_dialpad: Callback, cannot find callback method, number: ' + cbnr + '; uri: ' + cburi);
        }
        
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: Callback", err); }
}

function CallAccessNumber()
{
    try{
// akos: accessnumber -> on mobile call with native dialer, on pc call on voip
    var nr = common.GetParameter('accessnumber');
    
    var os = common.GetOs(); // Windows, MacOS, Linux
    if (os === 'Windows' || os === 'MacOS' || os === 'Linux')
    {
        common.CallNumberProtocolHandler('sip', nr);
    }else
    {
        common.CallNumberProtocolHandler('tel', nr);
    }
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: CallAccessNumber", err); }
}

function onStop(event)
{
    try{
    common.PutToDebugLog(4, "EVENT, _dialpad: onStop");
    global.isDialpadStarted = false;
    
    document.getElementById('phone_number').value = '';
    
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: onStop", err); }
}

function onDestroy (event)
{
    try{
    common.PutToDebugLog(4, "EVENT, _dialpad: onDestroy");
    global.isDialpadStarted = false;
    
    } catch(err) { common.PutToDebugLogException(2, "_dialpad: onDestroy", err); }
}

// public members and methods
return {
    onCreate: onCreate,
    onStart: onStart,
    onStop: onStop,
    onDestroy: onDestroy,
    PopulateListRecents: PopulateListRecents
};
});